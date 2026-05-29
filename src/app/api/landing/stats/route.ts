import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Use v_paf_global view for PAF calculation
    const { data: globalData, error: globalError } = await adminClient
      .from('v_paf_global')
      .select('*')
      .single()

    if (globalError) {
      return NextResponse.json(
        { error: globalError.message },
        { status: 500 }
      )
    }

    const pafGlobal = globalData?.paf_global
      ? Math.round(globalData.paf_global * 100) / 100
      : 0

    // Count frentes de obra activos
    const { count: frentesActivos } = await adminClient
      .from('alcance_planificado')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Activo')

    // Count especialidades
    const { count: especialidades } = await adminClient
      .from('especialidades')
      .select('*', { count: 'exact', head: true })

    // Count subsectores (frentes de trabajo)
    const { count: subsectores } = await adminClient
      .from('subsectores')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: {
        frentesActivos: frentesActivos || 0,
        metrosCuadrados: 12500,
        especialidades: especialidades || 0,
        subsectores: subsectores || 0,
        pafGlobal,
      },
    })
  } catch (err) {
    console.error('[Landing Stats API Error]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
