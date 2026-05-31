import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePassword, formatPasswordError } from '@/lib/password-validation'

export async function POST(request: NextRequest) {
  try {
    const { current_password, new_password } = await request.json()

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'Contraseña actual y nueva contraseña son requeridas' },
        { status: 400 }
      )
    }

    // VULN-007 FIX: Enforce password complexity policy
    const validation = validatePassword(new_password)
    if (!validation.valid) {
      return NextResponse.json(
        { error: formatPasswordError(validation.errors) },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    })

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al cambiar la contraseña: ' + updateError.message },
        { status: 400 }
      )
    }

    // Mark debe_cambiar_password as false
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ debe_cambiar_password: false })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating debe_cambiar_password:', profileError.message)
      // Don't fail the request - password was already changed
    }

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
      debe_cambiar_password: false,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
