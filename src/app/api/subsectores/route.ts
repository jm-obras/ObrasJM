import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sector_id = searchParams.get('sector_id')

    let query = supabase
      .from('subsectores')
      .select('*, sector:sectores(*)')
      .order('codigo')

    if (sector_id) {
      query = query.eq('sector_id', sector_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
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

export async function POST(request: NextRequest) {
  try {
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
        { error: 'Solo los administradores pueden crear subsectores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre, codigo, sector_id } = body

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (!sector_id) {
      return NextResponse.json(
        { error: 'El sector es requerido' },
        { status: 400 }
      )
    }

    // Verify sector exists
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

    const insertData: { nombre: string; codigo: string | null; sector_id: string } = {
      nombre: nombre.trim(),
      codigo: codigo ? codigo.trim().toUpperCase() : null,
      sector_id,
    }

    const { data, error } = await supabase
      .from('subsectores')
      .insert(insertData)
      .select('*, sector:sectores(*)')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
