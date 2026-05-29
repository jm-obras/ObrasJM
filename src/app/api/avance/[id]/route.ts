import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AprobacionStatus = 'Pendiente' | 'Aprobado' | 'Rechazado'

/**
 * Compute the overall status_aprobacion from the 3 individual levels.
 * - If any level is Rechazado → Rechazado
 * - If all 3 levels are Aprobado → Aprobado
 * - Otherwise → Pendiente
 */
function computeOverallStatus(
  residente: AprobacionStatus,
  inspector: AprobacionStatus,
  directivo: AprobacionStatus
): AprobacionStatus {
  if (residente === 'Rechazado' || inspector === 'Rechazado' || directivo === 'Rechazado') {
    return 'Rechazado'
  }
  if (residente === 'Aprobado' && inspector === 'Aprobado' && directivo === 'Aprobado') {
    return 'Aprobado'
  }
  return 'Pendiente'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('avance_ejecutado')
      .select(`
        *,
        alcance:alcance_planificado(
          *,
          especialidad:especialidades(*),
          subsector:subsectores(*, sector:sectores(*)),
          unidad_ejecutora:unidades_ejecutoras(*)
        ),
        inspector:profiles!avance_ejecutado_inspector_id_fkey(*),
        residente:profiles!avance_ejecutado_residente_id_fkey(*),
        directivo:profiles!avance_ejecutado_directivo_id_fkey(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Avance no encontrado' },
        { status: 404 }
      )
    }

    const enrichedData = {
      ...data,
      alcance: data.alcance
        ? {
            ...data.alcance,
            sector: (data.alcance as Record<string, unknown>).subsector
              ? ((data.alcance as Record<string, Record<string, unknown>>).subsector as Record<string, unknown>).sector || null
              : null,
          }
        : null,
    }

    return NextResponse.json({ data: enrichedData })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
    }

    const body = await request.json()

    // First, fetch current avance data to validate sequential approval
    const { data: currentAvance, error: fetchError } = await supabase
      .from('avance_ejecutado')
      .select('aprobacion_residente, aprobacion_inspector, aprobacion_directivo, status_aprobacion')
      .eq('id', id)
      .single()

    if (fetchError || !currentAvance) {
      return NextResponse.json({ error: 'Avance no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // --- Data fields: contratistas, residentes, inspectores and admins can update ---
    if (['contratista', 'ingeniera_residente', 'inspector', 'administrador'].includes(profile.rol)) {
      if (body.cantidad_reportada !== undefined) updateData.cantidad_reportada = body.cantidad_reportada
      if (body.tipo_trabajo !== undefined) updateData.tipo_trabajo = body.tipo_trabajo
      if (body.fecha_reporte !== undefined) updateData.fecha_reporte = body.fecha_reporte
      if (body.fotos_evidencia_urls !== undefined) updateData.fotos_evidencia_urls = body.fotos_evidencia_urls
      if (body.notas !== undefined) updateData.notas = body.notas
    }

    // --- 3-Level Approval Logic ---
    const validStatuses: AprobacionStatus[] = ['Pendiente', 'Aprobado', 'Rechazado']

    // Track the current approval state (will be updated as we process each level)
    let currentResidente = currentAvance.aprobacion_residente as AprobacionStatus
    let currentInspector = currentAvance.aprobacion_inspector as AprobacionStatus
    let currentDirectivo = currentAvance.aprobacion_directivo as AprobacionStatus

    // Level 1: Ingeniera Residente
    if (body.aprobacion_residente !== undefined) {
      if (!validStatuses.includes(body.aprobacion_residente)) {
        return NextResponse.json(
          { error: `aprobacion_residente inválido. Debe ser: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      if (profile.rol === 'ingeniera_residente' || profile.rol === 'administrador') {
        updateData.aprobacion_residente = body.aprobacion_residente
        updateData.residente_id = user.id
        currentResidente = body.aprobacion_residente
      } else {
        return NextResponse.json(
          { error: 'No tiene permisos para aprobar a nivel de Ingeniera Residente' },
          { status: 403 }
        )
      }
    }

    // Level 2: Inspector (sequential - requires Level 1 approved)
    if (body.aprobacion_inspector !== undefined) {
      if (!validStatuses.includes(body.aprobacion_inspector)) {
        return NextResponse.json(
          { error: `aprobacion_inspector inválido. Debe ser: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      if (profile.rol === 'inspector' || profile.rol === 'administrador') {
        // Sequential check: inspector can only approve if residente already approved
        if (body.aprobacion_inspector === 'Aprobado' && currentResidente !== 'Aprobado') {
          return NextResponse.json(
            { error: 'No se puede aprobar a nivel Inspector mientras la Ingeniera Residente no haya aprobado' },
            { status: 400 }
          )
        }
        updateData.aprobacion_inspector = body.aprobacion_inspector
        updateData.inspector_id = user.id
        currentInspector = body.aprobacion_inspector
      } else {
        return NextResponse.json(
          { error: 'No tiene permisos para aprobar a nivel de Inspector' },
          { status: 403 }
        )
      }
    }

    // Level 3: Directivo Hospital (sequential - requires Level 2 approved)
    if (body.aprobacion_directivo !== undefined) {
      if (!validStatuses.includes(body.aprobacion_directivo)) {
        return NextResponse.json(
          { error: `aprobacion_directivo inválido. Debe ser: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      if (profile.rol === 'directivo_hospital' || profile.rol === 'administrador') {
        // Sequential check: directivo can only approve if inspector already approved
        if (body.aprobacion_directivo === 'Aprobado' && currentInspector !== 'Aprobado') {
          return NextResponse.json(
            { error: 'No se puede aprobar a nivel Directivo Hospital mientras el Inspector no haya aprobado' },
            { status: 400 }
          )
        }
        updateData.aprobacion_directivo = body.aprobacion_directivo
        updateData.directivo_id = user.id
        currentDirectivo = body.aprobacion_directivo
      } else {
        return NextResponse.json(
          { error: 'No tiene permisos para aprobar a nivel de Directivo Hospital' },
          { status: 403 }
        )
      }
    }

    // Auto-compute overall status_aprobacion from the 3 levels
    const overallStatus = computeOverallStatus(currentResidente, currentInspector, currentDirectivo)
    updateData.status_aprobacion = overallStatus

    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('avance_ejecutado')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        alcance:alcance_planificado(
          *,
          especialidad:especialidades(*),
          subsector:subsectores(*, sector:sectores(*)),
          unidad_ejecutora:unidades_ejecutoras(*)
        ),
        inspector:profiles!avance_ejecutado_inspector_id_fkey(*),
        residente:profiles!avance_ejecutado_residente_id_fkey(*),
        directivo:profiles!avance_ejecutado_directivo_id_fkey(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const enrichedData = {
      ...data,
      alcance: data.alcance
        ? {
            ...data.alcance,
            sector: (data.alcance as Record<string, unknown>).subsector
              ? ((data.alcance as Record<string, Record<string, unknown>>).subsector as Record<string, unknown>).sector || null
              : null,
          }
        : null,
    }

    return NextResponse.json({ data: enrichedData })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
