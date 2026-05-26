import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
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

    if (profile.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden listar usuarios' },
        { status: 403 }
      )
    }

    // Use admin client to list all users
    const adminClient = createAdminClient()
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      )
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    // Combine auth users with profiles
    const profileMap: Record<string, Record<string, unknown>> = {}
    for (const p of profiles || []) {
      profileMap[p.id] = p
    }

    const users = usersData.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      profile: profileMap[u.id] || null,
    }))

    return NextResponse.json({ data: users })
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

    if (profile.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, nombre_completo, rol, unidad_ejecutora_id } = body

    if (!email || !password || !nombre_completo || !rol) {
      return NextResponse.json(
        { error: 'Campos requeridos: email, password, nombre_completo, rol' },
        { status: 400 }
      )
    }

    const validRoles = ['administrador', 'contratista', 'inspector']
    if (!validRoles.includes(rol)) {
      return NextResponse.json(
        { error: `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        rol,
      },
    })

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    // Create profile
    const { error: profileInsertError } = await adminClient
      .from('profiles')
      .insert({
        id: newUserData.user.id,
        nombre_completo,
        rol,
        unidad_ejecutora_id: unidad_ejecutora_id || null,
        activo: true,
      })

    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(newUserData.user.id)
      return NextResponse.json(
        { error: 'Error creando perfil: ' + profileInsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        id: newUserData.user.id,
        email: newUserData.user.email,
        created_at: newUserData.user.created_at,
        profile: {
          nombre_completo,
          rol,
          unidad_ejecutora_id: unidad_ejecutora_id || null,
          activo: true,
        },
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
