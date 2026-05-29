import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // ── Authentication & Authorization ──────────────────────────────
    // Only authenticated users with the 'webmaster' role may register
    // new accounts. This prevents unauthenticated users from creating
    // accounts with arbitrary roles (VULN-001).
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
        { error: 'Solo los webmasters pueden registrar usuarios' },
        { status: 403 }
      )
    }
    // ────────────────────────────────────────────────────────────────

    const { email, password, nombre_completo, rol } = await request.json()

    if (!email || !password || !nombre_completo || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos: email, password, nombre_completo, rol' },
        { status: 400 }
      )
    }

    const validRoles = ['webmaster', 'contratista', 'inspector', 'ingeniera_residente', 'directivo_hospital', 'ingenieria_hospital', 'visitante']
    if (!validRoles.includes(rol)) {
      return NextResponse.json(
        { error: `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Use admin client to create user (bypasses email confirmation)
    const adminClient = createAdminClient()

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        rol,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Upsert profile - use upsert because the handle_new_user trigger
    // may have already created a basic profile when the auth user was created
    const { error: upsertProfileError } = await adminClient
      .from('profiles')
      .upsert({
        id: data.user.id,
        nombre_completo,
        rol,
        activo: true,
      }, { onConflict: 'id' })

    if (upsertProfileError) {
      // Try to clean up the created auth user
      await adminClient.auth.admin.deleteUser(data.user.id)
      return NextResponse.json(
        { error: 'Error creando perfil: ' + upsertProfileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: data.user,
      message: 'Usuario registrado exitosamente',
    }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
