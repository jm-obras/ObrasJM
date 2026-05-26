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

    if (profile.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden actualizar especialidades' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre } = body

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('especialidades')
      .update({ nombre: nombre.trim() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Especialidad no encontrada' },
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

    if (profile.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar especialidades' },
        { status: 403 }
      )
    }

    // Check if especialidad is used in alcance_planificado
    const { data: alcanceRefs } = await supabase
      .from('alcance_planificado')
      .select('id')
      .eq('especialidad_id', id)
      .limit(1)

    if (alcanceRefs && alcanceRefs.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar esta especialidad porque tiene registros de alcance planificado asociados' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('especialidades')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Especialidad eliminada exitosamente' })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
