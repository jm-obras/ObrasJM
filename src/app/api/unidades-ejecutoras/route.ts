import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('unidades_ejecutoras')
      .select('*')
      .eq('activa', true)
      .order('nombre')

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

    // VULN-006 FIX: Aligned with RLS — only webmaster can create unidades ejecutoras
    // (RLS policy only allows webmaster for INSERT; inspector would fail silently)
    if (profile.rol !== 'webmaster') {
      return NextResponse.json(
        { error: 'No tiene permisos para crear unidades ejecutoras' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre, rif, contacto, logo_url } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('unidades_ejecutoras')
      .insert({ nombre, rif, contacto, logo_url: logo_url || null, activa: true })
      .select()
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
