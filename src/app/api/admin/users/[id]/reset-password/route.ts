import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const length = 10
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

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
        { error: 'Solo los administradores pueden resetear contraseñas' },
        { status: 403 }
      )
    }

    // Prevent admin from resetting their own password this way
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'No puede resetear su propia contraseña desde aquí. Use la opción de Cambiar Contraseña en su menú.' },
        { status: 400 }
      )
    }

    const tempPassword = generateTempPassword()

    const adminClient = createAdminClient()

    // Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    )

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al resetear la contraseña: ' + updateError.message },
        { status: 500 }
      )
    }

    // Set debe_cambiar_password = true so user is forced to change on next login
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({ debe_cambiar_password: true })
      .eq('id', userId)

    if (profileUpdateError) {
      return NextResponse.json(
        { error: 'Contraseña actualizada pero error al marcar cambio obligatorio: ' + profileUpdateError.message },
        { status: 500 }
      )
    }

    // Get user email for the response
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)
    if (userError) {
      return NextResponse.json(
        { error: 'Contraseña reseteada pero no se pudo obtener el email del usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Contraseña reseteada exitosamente',
      data: {
        email: userData.user.email,
        temp_password: tempPassword,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
