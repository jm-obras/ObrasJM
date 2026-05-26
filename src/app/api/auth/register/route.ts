import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre_completo, rol } = await request.json()

    if (!email || !password || !nombre_completo || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos: email, password, nombre_completo, rol' },
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

    // Create profile entry
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: data.user.id,
        nombre_completo,
        rol,
        activo: true,
      })

    if (profileError) {
      // Try to clean up the created auth user
      await adminClient.auth.admin.deleteUser(data.user.id)
      return NextResponse.json(
        { error: 'Error creando perfil: ' + profileError.message },
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
