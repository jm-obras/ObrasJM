import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
    }

    if (profile.rol !== 'administrador' && profile.rol !== 'inspector') {
      return NextResponse.json({ error: 'No tiene permisos para subir archivos' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    // Validate file size (5MB max for logos)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 5MB' }, { status: 400 })
    }

    // Generate unique path: avances/{userId}/{timestamp}_{filename}
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `avances/${user.id}/${timestamp}_${sanitizedName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage bucket 'evidencias'
    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Upload Error]', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('evidencias')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('[Upload API Error]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
