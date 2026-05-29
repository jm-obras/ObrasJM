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
      .from('alcance_planificado')
      .select(`
        *,
        especialidad:especialidades(*),
        subsector:subsectores(*, sector:sectores(*)),
        unidad_ejecutora:unidades_ejecutoras(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Alcance no encontrado' },
        { status: 404 }
      )
    }

    const enrichedData = {
      ...data,
      sector: data.subsector?.sector || null,
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

    if (profile.rol !== 'webmaster' && profile.rol !== 'inspector') {
      return NextResponse.json(
        { error: 'No tiene permisos para actualizar alcance planificado' },
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
      status,
    } = body

    const updateData: Record<string, unknown> = {}
    if (especialidad_id !== undefined) updateData.especialidad_id = especialidad_id
    if (subsector_id !== undefined) updateData.subsector_id = subsector_id
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (peso_relativo !== undefined) updateData.peso_relativo = peso_relativo
    if (unidad_medida !== undefined) updateData.unidad_medida = unidad_medida
    if (cantidad_planificada !== undefined) updateData.cantidad_planificada = cantidad_planificada
    if (unidad_ejecutora_id !== undefined) updateData.unidad_ejecutora_id = unidad_ejecutora_id
    if (status !== undefined) updateData.status = status
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('alcance_planificado')
      .update(updateData)
      .eq('id', id)
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

    return NextResponse.json({ data: enrichedData })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify user is authenticated and is admin
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

    if (profile.rol !== 'webmaster') {
      return NextResponse.json(
        { error: 'Solo los webmasters pueden eliminar alcance planificado' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('alcance_planificado')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Alcance eliminado exitosamente' })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
