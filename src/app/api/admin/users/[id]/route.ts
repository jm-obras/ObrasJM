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
]

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
        { error: 'Solo los webmasters pueden actualizar usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre_completo, rol, unidad_ejecutora_id, activo, email, password, telefono, ente_pertenece } = body

    const adminClient = createAdminClient()

    // Update auth user email/password if provided
    if (email || password) {
      const authUpdate: { email?: string; password?: string } = {}
      if (email) authUpdate.email = email
      if (password) authUpdate.password = password

      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        id,
        authUpdate
      )

      if (authUpdateError) {
        return NextResponse.json(
          { error: 'Error actualizando auth: ' + authUpdateError.message },
          { status: 400 }
        )
      }
    }

    // Update profile
    const profileUpdate: Record<string, unknown> = {}
    if (nombre_completo !== undefined) profileUpdate.nombre_completo = nombre_completo
    if (rol !== undefined) {
      if (!VALID_ROLES.includes(rol)) {
        return NextResponse.json(
          { error: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(', ')}` },
          { status: 400 }
        )
      }
      profileUpdate.rol = rol
    }
    if (unidad_ejecutora_id !== undefined) profileUpdate.unidad_ejecutora_id = unidad_ejecutora_id
    if (activo !== undefined) profileUpdate.activo = activo
    if (telefono !== undefined) profileUpdate.telefono = telefono || null
    if (ente_pertenece !== undefined) profileUpdate.ente_pertenece = ente_pertenece || null
    profileUpdate.updated_at = new Date().toISOString()

    if (Object.keys(profileUpdate).length > 1) {
      const { data: updatedProfile, error: profileUpdateError } = await adminClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', id)
        .select()
        .single()

      if (profileUpdateError) {
        return NextResponse.json(
          { error: 'Error actualizando perfil: ' + profileUpdateError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: updatedProfile })
    }

    // If only auth was updated, fetch current profile to return
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({ data: currentProfile })
  } catch (err) {
    console.error('[PUT /api/admin/users/[id]] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (err instanceof Error ? err.message : String(err)) },
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
        { error: 'Solo los webmasters pueden eliminar usuarios' },
        { status: 403 }
      )
    }

    if (user.id === id) {
      return NextResponse.json(
        { error: 'No puede eliminar su propia cuenta' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error: profileDeleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileDeleteError) {
      return NextResponse.json(
        { error: 'Error eliminando perfil: ' + profileDeleteError.message },
        { status: 400 }
      )
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(id)

    if (authDeleteError) {
      return NextResponse.json(
        { error: 'Error eliminando usuario de auth: ' + authDeleteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
  } catch (err) {
    console.error('[DELETE /api/admin/users/[id]] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    )
  }
}
