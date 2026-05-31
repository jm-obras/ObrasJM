import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // VULN-004 FIX: Verify user is authenticated before exposing avance data
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const alcance_id = searchParams.get('alcance_id')
    const status_aprobacion = searchParams.get('status_aprobacion')
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')

    let query = supabase
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
      .order('fecha_reporte', { ascending: false })

    if (alcance_id) {
      query = query.eq('alcance_id', alcance_id)
    }
    if (status_aprobacion) {
      query = query.eq('status_aprobacion', status_aprobacion)
    }
    if (fecha_desde) {
      query = query.gte('fecha_reporte', fecha_desde)
    }
    if (fecha_hasta) {
      query = query.lte('fecha_reporte', fecha_hasta)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Enrich with sector info from alcance
    const enrichedData = data?.map((item: Record<string, unknown>) => ({
      ...item,
      alcance: item.alcance
        ? {
            ...item.alcance,
            sector: (item.alcance as Record<string, unknown>).subsector
              ? ((item.alcance as Record<string, Record<string, unknown>>).subsector as Record<string, unknown>).sector || null
              : null,
          }
        : null,
    }))

    return NextResponse.json({ data: enrichedData })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Contratistas, ingenieras residentes, inspectores and webmasters can create avances
    const allowedRoles = ['contratista', 'ingeniera_residente', 'inspector', 'webmaster']
    if (!allowedRoles.includes(profile.rol)) {
      return NextResponse.json(
        { error: 'No tiene permisos para reportar avances' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      alcance_id,
      cantidad_reportada,
      tipo_trabajo,
      fecha_reporte,
      fotos_evidencia_urls,
      notas,
    } = body

    if (!alcance_id || cantidad_reportada == null || !tipo_trabajo || !fecha_reporte) {
      return NextResponse.json(
        { error: 'Campos requeridos: alcance_id, cantidad_reportada, tipo_trabajo, fecha_reporte' },
        { status: 400 }
      )
    }

    const validTipos = ['Planificado', 'Imprevisto']
    if (!validTipos.includes(tipo_trabajo)) {
      return NextResponse.json(
        { error: `tipo_trabajo inválido. Debe ser: ${validTipos.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('avance_ejecutado')
      .insert({
        alcance_id,
        cantidad_reportada,
        tipo_trabajo,
        fecha_reporte,
        fotos_evidencia_urls: fotos_evidencia_urls || [],
        notas: notas || null,
        inspector_id: null,
        residente_id: null,
        directivo_id: null,
        status_aprobacion: 'Pendiente',
        aprobacion_residente: 'Pendiente',
        aprobacion_inspector: 'Pendiente',
        aprobacion_directivo: 'Pendiente',
      })
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

    return NextResponse.json({ data: enrichedData }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
