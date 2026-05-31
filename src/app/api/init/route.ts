import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  // VULN-003 FIX: Verify user is authenticated and has webmaster role
  // This endpoint can modify database structure/seed data — must be protected
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
      { error: 'Solo el rol webmaster puede ejecutar la inicialización' },
      { status: 403 }
    )
  }

  const results: { step: string; status: string; error?: string }[] = []
  const admin = createAdminClient()

  try {
    // ===== STEP 1: Create Tables via SQL =====
    // Use Supabase RPC-like approach with raw SQL via the REST API
    // Since we can't execute raw SQL directly, we'll use the admin client
    // to verify existing tables and create missing ones via upsert operations

    // Check if tables exist by querying especialidades (publicly readable)
    const { data: espData, error: espCheck } = await admin
      .from('especialidades')
      .select('id')
      .limit(1)

    if (espCheck && (espCheck.code === '42P01' || espCheck.message?.includes('schema cache') || espCheck.message?.includes('does not exist'))) {
      // Tables don't exist - need to run SQL manually
      return NextResponse.json({
        success: false,
        needsSetup: true,
        message: 'Las tablas aún no existen en Supabase. Debes ejecutar el SQL.',
        instructions: [
          '1. Abre el SQL Editor en tu proyecto de Supabase:',
          '   https://supabase.com/dashboard/project/pmueicotcnsfildkpggp/sql',
          '2. Copia TODO el contenido del archivo supabase/setup-complete.sql',
          '3. Pégalo en el editor y haz clic en "Run"',
          '4. Espera a que se ejecute completamente (puede tomar unos segundos)',
          '5. Luego vuelve a ejecutar este endpoint para verificar',
        ],
        sqlFile: 'supabase/setup-complete.sql',
      })
    }

    // ===== Tables exist - Verify and seed data =====
    results.push({ step: '1. Tablas verificadas', status: 'ok' })

    // ===== STEP 2: Verify/Seed Especialidades =====
    const { data: existingEsp } = await admin.from('especialidades').select('nombre')
    const existingEspNames = new Set((existingEsp || []).map(e => e.nombre))

    const especialidades = [
      'Electricidad - Luminarias', 'Electricidad - Generadores', 'Electricidad - UPS',
      'Obras Civiles', 'Climatización', 'Impermeabilización', 'Transporte Vertical',
      'Desmalezamiento', 'Limpieza de Escombros', 'Planta de Cloración',
      'Sistemas de Bombeo', 'Almacenamiento de Agua',
      'Destapado de Tuberías de Aguas Servidas', 'Salas de Baños y Duchas',
      'Achicamiento de Agua de Desagües del Sótano', 'Telecomunicaciones'
    ]

    const missingEsp = especialidades.filter(n => !existingEspNames.has(n))
    if (missingEsp.length > 0) {
      const { error: espError } = await admin
        .from('especialidades')
        .insert(missingEsp.map(nombre => ({ nombre })))
      if (espError) {
        results.push({ step: '2. Especialidades', status: 'error', error: espError.message })
      } else {
        results.push({ step: `2. ${missingEsp.length} especialidades insertadas`, status: 'ok' })
      }
    } else {
      results.push({ step: '2. Especialidades ya existen (16)', status: 'ok' })
    }

    // ===== STEP 3: Verify/Seed Sectores =====
    const { data: existingSec } = await admin.from('sectores').select('codigo')
    const existingSecCodes = new Set((existingSec || []).map(s => s.codigo))

    const sectores = [
      { nombre: 'Torre Hospitalaria', codigo: 'TH' },
      { nombre: 'Torre de Consultas', codigo: 'TC' },
      { nombre: 'Torre de Ambulatorios', codigo: 'TA' },
      { nombre: 'Torre 3', codigo: 'T3' },
      { nombre: 'Anexo Planta Baja', codigo: 'A-PB' },
      { nombre: 'Anexo Sótano', codigo: 'A-S' },
    ]

    const missingSec = sectores.filter(s => !existingSecCodes.has(s.codigo))
    if (missingSec.length > 0) {
      const { error: secError } = await admin.from('sectores').insert(missingSec)
      if (secError) {
        results.push({ step: '3. Sectores', status: 'error', error: secError.message })
      } else {
        results.push({ step: `3. ${missingSec.length} sectores insertados`, status: 'ok' })
      }
    } else {
      results.push({ step: '3. Sectores ya existen (6)', status: 'ok' })
    }

    // ===== STEP 4: Verify/Seed Subsectores =====
    const { data: existingSub } = await admin.from('subsectores').select('codigo')
    const existingSubCodes = new Set((existingSub || []).map(s => s.codigo))

    const { data: secData } = await admin.from('sectores').select('id, codigo')
    const secMap = new Map((secData || []).map(s => [s.codigo, s.id]))

    const subsectoresData = [
      ['TH', 'Piso 1', 'TH-P1'], ['TH', 'Piso 2', 'TH-P2'], ['TH', 'Piso 3', 'TH-P3'],
      ['TH', 'Piso 4', 'TH-P4'], ['TH', 'Piso 5', 'TH-P5'], ['TH', 'Piso 6', 'TH-P6'],
      ['TH', 'Piso 7', 'TH-P7'], ['TH', 'Piso 8', 'TH-P8'], ['TH', 'Sótano', 'TH-SO'],
      ['TC', 'Piso 1', 'TC-P1'], ['TC', 'Piso 2', 'TC-P2'], ['TC', 'Piso 3', 'TC-P3'], ['TC', 'Piso 4', 'TC-P4'],
      ['TA', 'Piso 1', 'TA-P1'], ['TA', 'Piso 2', 'TA-P2'], ['TA', 'Piso 3', 'TA-P3'],
      ['T3', 'Piso 1', 'T3-P1'], ['T3', 'Piso 2', 'T3-P2'],
      ['A-PB', 'Azoteas', 'A-PB-AZ'], ['A-PB', 'Emergencia', 'A-PB-EM'],
      ['A-PB', 'Triaje', 'A-PB-TR'], ['A-PB', 'UTIP', 'A-PB-UTIP'],
      ['A-PB', 'Medicina Nuclear', 'A-PB-MN'], ['A-PB', 'Antiguo Triaje', 'A-PB-AT'],
      ['A-S', 'Anatomía Patológica', 'A-S-AP'], ['A-S', 'Sala de Calderas', 'A-S-SC'],
      ['A-S', 'Desagües', 'A-S-DG'], ['A-S', 'Almacén', 'A-S-AL'],
    ]

    const missingSub = subsectoresData
      .filter(([_, __, codigo]) => !existingSubCodes.has(codigo))
      .map(([secCodigo, nombre, codigo]) => ({
        sector_id: secMap.get(secCodigo),
        nombre,
        codigo,
      }))
      .filter(s => s.sector_id)

    if (missingSub.length > 0) {
      const { error: subError } = await admin.from('subsectores').insert(missingSub)
      if (subError) {
        results.push({ step: '4. Subsectores', status: 'error', error: subError.message })
      } else {
        results.push({ step: `4. ${missingSub.length} subsectores insertados`, status: 'ok' })
      }
    } else {
      results.push({ step: '4. Subsectores ya existen', status: 'ok' })
    }

    // ===== STEP 5: Verify Storage Bucket =====
    try {
      const { data: buckets } = await admin.storage.listBuckets()
      const evidenciasBucket = (buckets || []).find(b => b.id === 'evidencias')
      if (!evidenciasBucket) {
        const { error: bucketError } = await admin.storage.createBucket('evidencias', { public: true })
        if (bucketError) {
          results.push({ step: '5. Bucket storage', status: 'error', error: bucketError.message })
        } else {
          results.push({ step: '5. Bucket "evidencias" creado', status: 'ok' })
        }
      } else {
        results.push({ step: '5. Bucket "evidencias" ya existe', status: 'ok' })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ step: '5. Bucket storage', status: 'parcial', error: msg })
    }

    // ===== STEP 6: Create admin user =====
    results.push({ step: '6. Crear usuario webmaster', status: 'info', error: 'Usa el panel de Auth en Supabase para crear un usuario, luego asígnale rol de webmaster en la tabla profiles' })

    return NextResponse.json({
      success: true,
      message: 'Verificación e inicialización completada',
      results,
      nextSteps: [
        '1. Si las tablas no existen, ejecuta los archivos SQL en el Editor SQL de Supabase',
        '2. Crea un usuario admin en Authentication > Users',
        '3. Actualiza su perfil en la tabla profiles con rol = webmaster',
        '4. Inicia sesión en la aplicación con ese usuario',
      ],
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      success: false,
      message: 'Error verificando la base de datos',
      error: msg,
      results,
    }, { status: 500 })
  }
}

export async function GET() {
  // VULN-003 FIX: Even the GET info endpoint requires authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'Usa POST para inicializar/verificar la base de datos',
    endpoint: '/api/init',
    method: 'POST',
  })
}
