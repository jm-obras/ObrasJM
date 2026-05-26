import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PAFSubsector, PAFSector } from '@/lib/types'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Fetch all active alcance with joins
    const { data: alcances, error: alcanceError } = await adminClient
      .from('alcance_planificado')
      .select(`
        id,
        especialidad_id,
        peso_relativo,
        cantidad_planificada,
        unidad_medida,
        status,
        especialidad:especialidades(id, nombre),
        subsector:subsectores(id, nombre, sector:sectores(id, nombre, codigo))
      `)
      .eq('status', 'Activo')

    if (alcanceError) {
      return NextResponse.json(
        { error: alcanceError.message },
        { status: 500 }
      )
    }

    // Fetch all avance records with aprobado status
    const { data: avances, error: avanceError } = await adminClient
      .from('avance_ejecutado')
      .select('alcance_id, cantidad_reportada, status_aprobacion')
      .eq('status_aprobacion', 'Aprobado')

    if (avanceError) {
      return NextResponse.json(
        { error: avanceError.message },
        { status: 500 }
      )
    }

    // Build a map of total ejecutado per alcance_id
    const ejecutadoMap: Record<string, number> = {}
    for (const avance of avances || []) {
      if (!ejecutadoMap[avance.alcance_id]) {
        ejecutadoMap[avance.alcance_id] = 0
      }
      ejecutadoMap[avance.alcance_id] += avance.cantidad_reportada
    }

    // Count alertas (avances with Pendiente status)
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

    // Count frentes activos
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

    // Calculate PAF by subsector
    const pafBySubsector: PAFSubsector[] = (alcances || []).map((alcance: Record<string, unknown>) => {
      const especialidad = alcance.especialidad as Record<string, unknown> | null
      const subsector = alcance.subsector as Record<string, unknown> | null
      const sector = subsector?.sector as Record<string, unknown> | null

      const cantidadEjecutada = ejecutadoMap[alcance.id as string] || 0
      const cantidadPlanificada = alcance.cantidad_planificada as number
      const porcentajeAvance = cantidadPlanificada > 0
        ? Math.min((cantidadEjecutada / cantidadPlanificada) * 100, 100)
        : 0

      return {
        alcance_id: alcance.id as string,
        especialidad_id: alcance.especialidad_id as string,
        especialidad_nombre: (especialidad?.nombre as string) || '',
        subsector_id: (subsector?.id as string) || '',
        subsector_nombre: (subsector?.nombre as string) || '',
        sector_id: (sector?.id as string) || '',
        sector_nombre: (sector?.nombre as string) || '',
        sector_codigo: (sector?.codigo as string) || '',
        peso_relativo: alcance.peso_relativo as number,
        cantidad_planificada: cantidadPlanificada,
        unidad_medida: (alcance.unidad_medida as string) || '',
        cantidad_ejecutada: cantidadEjecutada,
        porcentaje_avance: Math.round(porcentajeAvance * 100) / 100,
        alcance_status: alcance.status as string,
      }
    })

    // Calculate PAF by sector
    const sectorMap: Record<string, { nombre: string; codigo: string; totalPeso: number; totalAvance: number }> = {}
    for (const item of pafBySubsector) {
      if (!sectorMap[item.sector_id]) {
        sectorMap[item.sector_id] = {
          nombre: item.sector_nombre,
          codigo: item.sector_codigo,
          totalPeso: 0,
          totalAvance: 0,
        }
      }
      sectorMap[item.sector_id].totalPeso += item.peso_relativo
      sectorMap[item.sector_id].totalAvance += item.peso_relativo * (item.porcentaje_avance / 100)
    }

    const pafBySector: PAFSector[] = Object.entries(sectorMap).map(([sectorId, info]) => ({
      sector_id: sectorId,
      sector_nombre: info.nombre,
      sector_codigo: info.codigo,
      paf_sector: info.totalPeso > 0
        ? Math.round((info.totalAvance / info.totalPeso) * 100 * 100) / 100
        : 0,
    }))

    // Calculate PAF global (weighted average)
    let totalPesoGlobal = 0
    let totalAvanceGlobal = 0
    for (const item of pafBySubsector) {
      totalPesoGlobal += item.peso_relativo
      totalAvanceGlobal += item.peso_relativo * (item.porcentaje_avance / 100)
    }
    const pafGlobal = totalPesoGlobal > 0
      ? Math.round((totalAvanceGlobal / totalPesoGlobal) * 100 * 100) / 100
      : 0

    const itemsConAvance = pafBySubsector.filter(i => i.cantidad_ejecutada > 0).length

    return NextResponse.json({
      data: {
        pafGlobal,
        frentesActivos: frentesActivos || 0,
        alertas: alertas || 0,
        pafBySector,
        pafBySubsector,
        summary: {
          totalItems: pafBySubsector.length,
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
