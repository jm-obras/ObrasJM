import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

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

    // Calculate PAF global (weighted average)
    const { data: alcances } = await adminClient
      .from('alcance_planificado')
      .select('id, peso_relativo, cantidad_planificada, status')
      .eq('status', 'Activo')

    const { data: avances } = await adminClient
      .from('avance_ejecutado')
      .select('alcance_id, cantidad_reportada')
      .eq('status_aprobacion', 'Aprobado')

    // Build ejecutado map
    const ejecutadoMap: Record<string, number> = {}
    for (const avance of avances || []) {
      if (!ejecutadoMap[avance.alcance_id]) {
        ejecutadoMap[avance.alcance_id] = 0
      }
      ejecutadoMap[avance.alcance_id] += avance.cantidad_reportada
    }

    // Calculate weighted PAF
    let totalPeso = 0
    let totalAvance = 0
    for (const alcance of alcances || []) {
      const ejecutado = ejecutadoMap[alcance.id] || 0
      const porcentaje = alcance.cantidad_planificada > 0
        ? Math.min((ejecutado / alcance.cantidad_planificada) * 100, 100)
        : 0
      totalPeso += alcance.peso_relativo
      totalAvance += alcance.peso_relativo * (porcentaje / 100)
    }

    const pafGlobal = totalPeso > 0
      ? Math.round((totalAvance / totalPeso) * 100 * 100) / 100
      : 0

    return NextResponse.json({
      data: {
        frentesActivos: frentesActivos || 0,
        metrosCuadrados: 12500,
        especialidades: especialidades || 0,
        subsectores: subsectores || 0,
        pafGlobal,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
