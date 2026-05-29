import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = [
  'webmaster',
  'contratista',
  'inspector',
  'ingeniera_residente',
  'directivo_hospital',
  'ingenieria_hospital',
  'visitante',
]

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[GET /api/admin/users] Auth error:', authError?.message)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[GET /api/admin/users] Profile error:', profileError?.message)
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
    }

    if (profile.rol !== 'webmaster') {
      return NextResponse.json(
        { error: 'Solo los webmasters pueden listar usuarios' },
        { status: 403 }
      )
    }

    // Check admin client config
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[GET /api/admin/users] SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Error de configuración: falta la clave de servicio de Supabase' },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient()
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError) {
      console.error('[GET /api/admin/users] List users error:', usersError.message)
      return NextResponse.json(
        { error: 'Error listando usuarios: ' + usersError.message },
        { status: 500 }
      )
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('[GET /api/admin/users] Profiles error:', profilesError.message)
      return NextResponse.json(
        { error: 'Error obteniendo perfiles: ' + profilesError.message },
        { status: 500 }
      )
    }

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
  } catch (err) {
    console.error('[GET /api/admin/users] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (err instanceof Error ? err.message : String(err)) },
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

    if (profile.rol !== 'webmaster') {
      return NextResponse.json(
        { error: 'Solo los webmasters pueden crear usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, nombre_completo, rol, unidad_ejecutora_id, telefono, ente_pertenece } = body

    if (!email || !password || !nombre_completo || !rol) {
      return NextResponse.json(
        { error: 'Campos requeridos: email, password, nombre_completo, rol' },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(rol)) {
      return NextResponse.json(
        { error: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check admin client config
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[POST /api/admin/users] SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Error de configuración: falta la clave de servicio de Supabase' },
        { status: 500 }
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
        telefono: telefono || null,
        ente_pertenece: ente_pertenece || null,
        debe_cambiar_password: true,
      },
    })

    if (createError) {
      console.error('[POST /api/admin/users] Create user error:', createError.message)
      return NextResponse.json(
        { error: 'Error creando usuario en auth: ' + createError.message },
        { status: 400 }
      )
    }

    // Upsert profile - use upsert because the handle_new_user trigger
    // may have already created a basic profile when the auth user was created
    const { error: profileUpsertError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUserData.user.id,
        nombre_completo,
        rol,
        unidad_ejecutora_id: unidad_ejecutora_id || null,
        telefono: telefono || null,
        ente_pertenece: ente_pertenece || null,
        debe_cambiar_password: true,
        activo: true,
      }, { onConflict: 'id' })

    if (profileUpsertError) {
      console.error('[POST /api/admin/users] Profile upsert error:', profileUpsertError.message)
      await adminClient.auth.admin.deleteUser(newUserData.user.id)
      return NextResponse.json(
        { error: 'Error creando perfil: ' + profileUpsertError.message },
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
          telefono: telefono || null,
          ente_pertenece: ente_pertenece || null,
          debe_cambiar_password: true,
          activo: true,
        },
      },
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/users] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    )
  }
}
