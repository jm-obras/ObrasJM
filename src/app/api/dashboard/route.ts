import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PAFSubsector, PAFSector } from '@/lib/types'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Query v_paf_subsector view for subsector-level PAF data (active only)
    const { data: subsectorData, error: subsectorError } = await adminClient
      .from('v_paf_subsector')
      .select('*')
      .eq('alcance_status', 'Activo')

    if (subsectorError) {
      return NextResponse.json(
        { error: subsectorError.message },
        { status: 500 }
      )
    }

    // Query v_paf_sector view for sector-level PAF data
    const { data: sectorData, error: sectorError } = await adminClient
      .from('v_paf_sector')
      .select('*')

    if (sectorError) {
      return NextResponse.json(
        { error: sectorError.message },
        { status: 500 }
      )
    }

    // Query v_paf_global view for global PAF
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

    // Count alertas (avances with Pendiente status) — not in views
    const { count: alertas, error: alertasError } = await adminClient
      .from('avance_ejecutado')
      .select('*', { count: 'exact', head: true })
      .eq('status_aprobacion', 'Pendiente')

    if (alertasError) {
      return NextResponse.json(
        { error: alertasError.message },
        { status: 500 }
      )
    }

    // Count frentes activos (Active alcances) — not in views
    const { count: frentesActivos, error: frentesError } = await adminClient
      .from('alcance_planificado')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Activo')

    if (frentesError) {
      return NextResponse.json(
        { error: frentesError.message },
        { status: 500 }
      )
    }

    // Map subsector view rows to PAFSubsector type
    const pafBySubsector: PAFSubsector[] = (subsectorData || []).map((row) => ({
      alcance_id: row.alcance_id,
      especialidad_id: row.especialidad_id,
      especialidad_nombre: row.especialidad_nombre,
      subsector_id: row.subsector_id,
      subsector_nombre: row.subsector_nombre,
      sector_id: row.sector_id,
      sector_nombre: row.sector_nombre,
      sector_codigo: row.sector_codigo,
      peso_relativo: row.peso_relativo,
      cantidad_planificada: row.cantidad_planificada,
      unidad_medida: row.unidad_medida,
      cantidad_ejecutada: row.cantidad_ejecutada,
      porcentaje_avance: Math.round(row.porcentaje_avance * 100) / 100,
      alcance_status: row.alcance_status,
    }))

    // Map sector view rows to PAFSector type
    const pafBySector: PAFSector[] = (sectorData || []).map((row) => ({
      sector_id: row.sector_id,
      sector_nombre: row.sector_nombre,
      sector_codigo: row.sector_codigo,
      paf_sector: Math.round(row.paf_sector * 100) / 100,
    }))

    // Global PAF from view
    const pafGlobal = globalData
      ? Math.round(globalData.paf_global * 100) / 100
      : 0

    // Summary from global view
    const totalItems = globalData?.total_items || 0
    const itemsConAvance = globalData?.items_con_avance || 0

    return NextResponse.json({
      data: {
        pafGlobal,
        frentesActivos: frentesActivos || 0,
        alertas: alertas || 0,
        pafBySector,
        pafBySubsector,
        summary: {
          totalItems,
          itemsConAvance,
        },
      },
    })
  } catch (err) {
    console.error('[Dashboard API Error]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
