import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

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
        { error: 'Solo los webmasters pueden actualizar subsectores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre, codigo, sector_id } = body

    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre.trim()
    if (codigo !== undefined) updateData.codigo = codigo ? codigo.trim().toUpperCase() : null
    if (sector_id !== undefined) updateData.sector_id = sector_id

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // If sector_id is changing, verify it exists
    if (sector_id) {
      const { data: sectorExists } = await supabase
        .from('sectores')
        .select('id')
        .eq('id', sector_id)
        .single()

      if (!sectorExists) {
        return NextResponse.json(
          { error: 'El sector seleccionado no existe' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('subsectores')
      .update(updateData)
      .eq('id', id)
      .select('*, sector:sectores(*)')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Subsector no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
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
        { error: 'Solo los webmasters pueden eliminar subsectores' },
        { status: 403 }
      )
    }

    // Check if subsector is used in alcance_planificado
    const { data: alcanceRefs } = await supabase
      .from('alcance_planificado')
      .select('id')
      .eq('subsector_id', id)
      .limit(1)

    if (alcanceRefs && alcanceRefs.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar este subsector porque tiene registros de alcance planificado asociados' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('subsectores')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Subsector eliminado exitosamente' })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
