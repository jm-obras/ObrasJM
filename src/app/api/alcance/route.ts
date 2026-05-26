import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const especialidad_id = searchParams.get('especialidad_id')
    const subsector_id = searchParams.get('subsector_id')
    const sector_id = searchParams.get('sector_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('alcance_planificado')
      .select(`
        *,
        especialidad:especialidades(*),
        subsector:subsectores(*, sector:sectores(*)),
        unidad_ejecutora:unidades_ejecutoras(*)
      `)
      .order('created_at', { ascending: false })

    if (especialidad_id) {
      query = query.eq('especialidad_id', especialidad_id)
    }
    if (subsector_id) {
      query = query.eq('subsector_id', subsector_id)
    }
    if (sector_id) {
      // Filter by sector through subsector join
      query = query.eq('subsector.sector_id', sector_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Flatten the sector info for convenience
    const enrichedData = data?.map((item: Record<string, unknown>) => ({
      ...item,
      sector: item.subsector?.sector || null,
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

    // Verify user is authenticated and has admin/inspector role
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

    if (profile.rol !== 'administrador' && profile.rol !== 'inspector') {
      return NextResponse.json(
        { error: 'No tiene permisos para crear alcance planificado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      especialidad_id,
      subsector_id,
      descripcion,
      peso_relativo,
      unidad_medida,
      cantidad_planificada,
      unidad_ejecutora_id,
    } = body

    if (!especialidad_id || !subsector_id || !descripcion || peso_relativo == null || !unidad_medida || cantidad_planificada == null) {
      return NextResponse.json(
        { error: 'Campos requeridos: especialidad_id, subsector_id, descripcion, peso_relativo, unidad_medida, cantidad_planificada' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('alcance_planificado')
      .insert({
        especialidad_id,
        subsector_id,
        descripcion,
        peso_relativo,
        unidad_medida,
        cantidad_planificada,
        unidad_ejecutora_id: unidad_ejecutora_id || null,
        status: 'Activo',
      })
      .select(`
        *,
        especialidad:especialidades(*),
        subsector:subsectores(*, sector:sectores(*)),
        unidad_ejecutora:unidades_ejecutoras(*)
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
      sector: data.subsector?.sector || null,
    }

    return NextResponse.json({ data: enrichedData }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
