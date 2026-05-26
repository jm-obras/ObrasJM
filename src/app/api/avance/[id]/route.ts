import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
        inspector:profiles!avance_ejecutado_inspector_id_fkey(*)
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

    const updateData: Record<string, unknown> = {}

    // Contratistas, inspectores and admins can update cantidad_reportada, tipo_trabajo, fecha_reporte, fotos, notas
    if (profile.rol === 'contratista' || profile.rol === 'inspector' || profile.rol === 'administrador') {
      if (body.cantidad_reportada !== undefined) updateData.cantidad_reportada = body.cantidad_reportada
      if (body.tipo_trabajo !== undefined) updateData.tipo_trabajo = body.tipo_trabajo
      if (body.fecha_reporte !== undefined) updateData.fecha_reporte = body.fecha_reporte
      if (body.fotos_evidencia_urls !== undefined) updateData.fotos_evidencia_urls = body.fotos_evidencia_urls
      if (body.notas !== undefined) updateData.notas = body.notas
    }

    // Inspectores and admins can also update status_aprobacion
    if (profile.rol === 'inspector' || profile.rol === 'administrador') {
      if (body.status_aprobacion !== undefined) {
        const validStatuses = ['Pendiente', 'Aprobado', 'Rechazado']
        if (!validStatuses.includes(body.status_aprobacion)) {
          return NextResponse.json(
            { error: `status_aprobacion inválido. Debe ser: ${validStatuses.join(', ')}` },
            { status: 400 }
          )
        }
        updateData.status_aprobacion = body.status_aprobacion
        updateData.inspector_id = user.id
      }
    }

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
        inspector:profiles!avance_ejecutado_inspector_id_fkey(*)
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
