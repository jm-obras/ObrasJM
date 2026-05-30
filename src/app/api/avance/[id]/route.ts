import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AprobacionStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Objetado' | 'Subsanado'

type ApprovalLevel = 'residente' | 'inspector' | 'directivo'

/**
 * Compute the overall status_aprobacion from the 3 individual levels.
 * Priority order (highest to lowest):
 *   1. Rechazado  → if any level is Rechazado
 *   2. Objetado   → if any level is Objetado
 *   3. Subsanado  → if any level is Subsanado (and none Rechazado/Objetado)
 *   4. Aprobado   → if all 3 levels are Aprobado
 *   5. Pendiente  → otherwise
 */
function computeOverallStatus(
  residente: AprobacionStatus,
  inspector: AprobacionStatus,
  directivo: AprobacionStatus
): AprobacionStatus {
  if (residente === 'Rechazado' || inspector === 'Rechazado' || directivo === 'Rechazado') {
    return 'Rechazado'
  }
  if (residente === 'Objetado' || inspector === 'Objetado' || directivo === 'Objetado') {
    return 'Objetado'
  }
  if (residente === 'Subsanado' || inspector === 'Subsanado' || directivo === 'Subsanado') {
    return 'Subsanado'
  }
  if (residente === 'Aprobado' && inspector === 'Aprobado' && directivo === 'Aprobado') {
    return 'Aprobado'
  }
  return 'Pendiente'
}

/** Roles that can create/edit avance data */
const DATA_EDIT_ROLES = ['contratista', 'ingeniera_residente', 'inspector', 'webmaster']

/** Roles that can object/approve at each level */
const LEVEL_ROLES: Record<ApprovalLevel, string[]> = {
  residente: ['ingeniera_residente', 'webmaster'],
  inspector: ['inspector', 'webmaster'],
  directivo: ['directivo_hospital', 'webmaster'],
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

    // Fetch current avance data to validate state transitions
    const { data: currentAvance, error: fetchError } = await supabase
      .from('avance_ejecutado')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentAvance) {
      return NextResponse.json({ error: 'Avance no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // --- Data fields: contratistas, residentes, inspectores and admins can update ---
    if (DATA_EDIT_ROLES.includes(profile.rol)) {
      if (body.cantidad_reportada !== undefined) updateData.cantidad_reportada = body.cantidad_reportada
      if (body.tipo_trabajo !== undefined) updateData.tipo_trabajo = body.tipo_trabajo
      if (body.fecha_reporte !== undefined) updateData.fecha_reporte = body.fecha_reporte
      if (body.fotos_evidencia_urls !== undefined) updateData.fotos_evidencia_urls = body.fotos_evidencia_urls
      if (body.notas !== undefined) updateData.notas = body.notas
    }

    // --- 3-Level Approval + Objection/Subsanation Logic ---
    const validStatuses: AprobacionStatus[] = ['Pendiente', 'Aprobado', 'Rechazado', 'Objetado', 'Subsanado']

    // Track the current approval state (will be updated as we process each level)
    let currentResidente = currentAvance.aprobacion_residente as AprobacionStatus
    let currentInspector = currentAvance.aprobacion_inspector as AprobacionStatus
    let currentDirectivo = currentAvance.aprobacion_directivo as AprobacionStatus

    // --- Process each approval level ---
    const levels: ApprovalLevel[] = ['residente', 'inspector', 'directivo']

    for (const level of levels) {
      const bodyStatus = body[`aprobacion_${level}`] as AprobacionStatus | undefined
      if (bodyStatus === undefined) continue

      if (!validStatuses.includes(bodyStatus)) {
        return NextResponse.json(
          { error: `aprobacion_${level} inválido. Debe ser: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      const levelRoles = LEVEL_ROLES[level]
      const motivoField = `motivo_objecion_${level}`
      const notasSubsanacionField = `notas_subsanacion_${level}`
      const idField = `${level}_id`

      // ---- CASE 1: Objetado (reviewer objects) ----
      if (bodyStatus === 'Objetado') {
        // Only the reviewer for this level can object
        if (!levelRoles.includes(profile.rol)) {
          return NextResponse.json(
            { error: `No tiene permisos para objetar a nivel de ${level === 'residente' ? 'Ing. Residente' : level === 'inspector' ? 'Inspector' : 'Directivo Hospital'}` },
            { status: 403 }
          )
        }

        // Can only object if current status allows it (Pendiente or Subsanado)
        const currentLevelStatus = level === 'residente' ? currentResidente
          : level === 'inspector' ? currentInspector
          : currentDirectivo

        if (currentLevelStatus !== 'Pendiente' && currentLevelStatus !== 'Subsanado') {
          return NextResponse.json(
            { error: `No se puede objetar a nivel ${level} cuando su estado actual es "${currentLevelStatus}"` },
            { status: 400 }
          )
        }

        // Motivo de objeción is REQUIRED
        const motivo = body[motivoField] as string | undefined
        if (!motivo || motivo.trim().length === 0) {
          return NextResponse.json(
            { error: `El motivo de objeción es obligatorio para objetar a nivel ${level}` },
            { status: 400 }
          )
        }

        updateData[`aprobacion_${level}`] = 'Objetado'
        updateData[motivoField] = motivo.trim()
        updateData[notasSubsanacionField] = null // Clear previous subsanation notes
        updateData[idField] = user.id

        if (level === 'residente') currentResidente = 'Objetado'
        else if (level === 'inspector') currentInspector = 'Objetado'
        else currentDirectivo = 'Objetado'
      }

      // ---- CASE 2: Subsanado (creator declares issue resolved) ----
      else if (bodyStatus === 'Subsanado') {
        // Only the avance creator (or webmaster) can declare subsanación
        const currentLevelStatus = level === 'residente' ? currentResidente
          : level === 'inspector' ? currentInspector
          : currentDirectivo

        if (currentLevelStatus !== 'Objetado') {
          return NextResponse.json(
            { error: `Solo se puede declarar subsanado un nivel que esté objetado. Estado actual: "${currentLevelStatus}"` },
            { status: 400 }
          )
        }

        // Only the avance creator roles can subsanate (contratista, ingeniera_residente, inspector, webmaster)
        if (!DATA_EDIT_ROLES.includes(profile.rol)) {
          return NextResponse.json(
            { error: 'Solo el creador del avance o el webmaster pueden declarar una objeción como subsanada' },
            { status: 403 }
          )
        }

        // Notas de subsanación are optional but recommended
        const notasSub = body[notasSubsanacionField] as string | undefined
        updateData[`aprobacion_${level}`] = 'Subsanado'
        updateData[notasSubsanacionField] = notasSub?.trim() || null

        if (level === 'residente') currentResidente = 'Subsanado'
        else if (level === 'inspector') currentInspector = 'Subsanado'
        else currentDirectivo = 'Subsanado'
      }

      // ---- CASE 3: Aprobado (reviewer approves) ----
      else if (bodyStatus === 'Aprobado') {
        if (!levelRoles.includes(profile.rol)) {
          return NextResponse.json(
            { error: `No tiene permisos para aprobar a nivel de ${level === 'residente' ? 'Ing. Residente' : level === 'inspector' ? 'Inspector' : 'Directivo Hospital'}` },
            { status: 403 }
          )
        }

        // Sequential check: can only approve if previous levels are approved
        if (level === 'inspector' && currentResidente !== 'Aprobado') {
          return NextResponse.json(
            { error: 'No se puede aprobar a nivel Inspector mientras la Ingeniera Residente no haya aprobado' },
            { status: 400 }
          )
        }
        if (level === 'directivo' && currentInspector !== 'Aprobado') {
          return NextResponse.json(
            { error: 'No se puede aprobar a nivel Directivo Hospital mientras el Inspector no haya aprobado' },
            { status: 400 }
          )
        }

        // Can approve from Pendiente or Subsanado (re-review after subsanation)
        const currentLevelStatus = level === 'residente' ? currentResidente
          : level === 'inspector' ? currentInspector
          : currentDirectivo

        if (currentLevelStatus !== 'Pendiente' && currentLevelStatus !== 'Subsanado') {
          return NextResponse.json(
            { error: `No se puede aprobar a nivel ${level} cuando su estado actual es "${currentLevelStatus}". Solo se puede aprobar desde Pendiente o Subsanado.` },
            { status: 400 }
          )
        }

        updateData[`aprobacion_${level}`] = 'Aprobado'
        updateData[idField] = user.id
        // Clear objection data when approving
        updateData[motivoField] = null
        updateData[notasSubsanacionField] = null

        if (level === 'residente') currentResidente = 'Aprobado'
        else if (level === 'inspector') currentInspector = 'Aprobado'
        else currentDirectivo = 'Aprobado'
      }

      // ---- CASE 4: Rechazado (reviewer rejects - definitive) ----
      else if (bodyStatus === 'Rechazado') {
        if (!levelRoles.includes(profile.rol)) {
          return NextResponse.json(
            { error: `No tiene permisos para rechazar a nivel de ${level === 'residente' ? 'Ing. Residente' : level === 'inspector' ? 'Inspector' : 'Directivo Hospital'}` },
            { status: 403 }
          )
        }

        const currentLevelStatus = level === 'residente' ? currentResidente
          : level === 'inspector' ? currentInspector
          : currentDirectivo

        // Can reject from any non-terminal state
        if (currentLevelStatus === 'Aprobado' || currentLevelStatus === 'Rechazado') {
          return NextResponse.json(
            { error: `No se puede rechazar a nivel ${level} cuando su estado actual es "${currentLevelStatus}"` },
            { status: 400 }
          )
        }

        updateData[`aprobacion_${level}`] = 'Rechazado'
        updateData[idField] = user.id

        if (level === 'residente') currentResidente = 'Rechazado'
        else if (level === 'inspector') currentInspector = 'Rechazado'
        else currentDirectivo = 'Rechazado'
      }

      // ---- CASE 5: Pendiente (reset - only webmaster can do this) ----
      else if (bodyStatus === 'Pendiente') {
        if (profile.rol !== 'webmaster') {
          return NextResponse.json(
            { error: 'Solo el webmaster puede revertir un estado a Pendiente' },
            { status: 403 }
          )
        }

        updateData[`aprobacion_${level}`] = 'Pendiente'
        updateData[motivoField] = null
        updateData[notasSubsanacionField] = null
        // Don't reset the approver ID - keep the audit trail

        if (level === 'residente') currentResidente = 'Pendiente'
        else if (level === 'inspector') currentInspector = 'Pendiente'
        else currentDirectivo = 'Pendiente'
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
