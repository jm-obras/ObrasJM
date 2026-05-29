import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // 1. Fetch all active subsector PAF data from v_paf_subsector
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

    // 2. Fetch all alcance_planificado rows to map alcance → unidad_ejecutora_id
    const { data: alcancesData, error: alcancesError } = await adminClient
      .from('alcance_planificado')
      .select('id, unidad_ejecutora_id, especialidad_id')
      .eq('status', 'Activo')

    if (alcancesError) {
      return NextResponse.json(
        { error: alcancesError.message },
        { status: 500 }
      )
    }

    // 3. Fetch all unidades_ejecutoras (id, nombre, logo_url, activa)
    const { data: ejecutorasData, error: ejecutorasError } = await adminClient
      .from('unidades_ejecutoras')
      .select('id, nombre, logo_url, activa')

    if (ejecutorasError) {
      return NextResponse.json(
        { error: ejecutorasError.message },
        { status: 500 }
      )
    }

    // 4. Fetch count of pending avances per ejecutora
    // Join avance_ejecutado with alcance_planificado to get unidad_ejecutora_id
    const { data: avancesPendientes, error: avancesError } = await adminClient
      .from('avance_ejecutado')
      .select('alcance_id, alcance_planificado(unidad_ejecutora_id)')
      .eq('status_aprobacion', 'Pendiente')

    if (avancesError) {
      return NextResponse.json(
        { error: avancesError.message },
        { status: 500 }
      )
    }

    // Build a map: alcance_id → unidad_ejecutora_id
    const alcanceToUE: Record<string, string | null> = {}
    for (const a of alcancesData || []) {
      alcanceToUE[a.id] = a.unidad_ejecutora_id
    }

    // Build alertas count per ejecutora
    const alertasPerUE: Record<string, number> = {}
    for (const av of avancesPendientes || []) {
      const ueId = (av.alcance_planificado as unknown as { unidad_ejecutora_id: string | null })?.unidad_ejecutora_id
      if (ueId) {
        alertasPerUE[ueId] = (alertasPerUE[ueId] || 0) + 1
      }
    }

    // Build ejecutora lookup
    const ejecutoraMap: Record<string, { nombre: string; logo_url: string | null; activa: boolean }> = {}
    for (const ue of ejecutorasData || []) {
      ejecutoraMap[ue.id] = { nombre: ue.nombre, logo_url: ue.logo_url, activa: ue.activa }
    }

    // 5. Group subsector data by ejecutora
    // Each row in subsectorData has alcance_id; we look up the UE via alcanceToUE
    const groupedByUE: Record<string, {
      items: typeof subsectorData
      especialidades: Record<string, { items: typeof subsectorData }>
    }> = {}

    for (const row of subsectorData || []) {
      const ueId = alcanceToUE[row.alcance_id]
      if (!ueId) continue // skip items without ejecutora

      if (!groupedByUE[ueId]) {
        groupedByUE[ueId] = { items: [], especialidades: {} }
      }
      groupedByUE[ueId].items.push(row)

      // Also group by especialidad within each ejecutora
      const espId = row.especialidad_id
      if (!groupedByUE[ueId].especialidades[espId]) {
        groupedByUE[ueId].especialidades[espId] = { items: [] }
      }
      groupedByUE[ueId].especialidades[espId].items.push(row)
    }

    // 6. Calculate weighted PAF and build response
    const data = Object.entries(groupedByUE)
      .filter(([ueId]) => ejecutoraMap[ueId]?.activa)
      .map(([ueId, group]) => {
        const totalPeso = group.items.reduce((sum, r) => sum + (r.peso_relativo || 0), 0)
        const weightedAvance = group.items.reduce(
          (sum, r) => sum + (r.peso_relativo || 0) * (r.porcentaje_avance || 0),
          0
        )
        const paf = totalPeso > 0 ? weightedAvance / totalPeso : 0
        const totalItems = group.items.length
        const itemsConAvance = group.items.filter((r) => r.cantidad_ejecutada > 0).length

        // Calculate especialidades breakdown
        const especialidades = Object.entries(group.especialidades).map(([espId, espGroup]) => {
          const espTotalPeso = espGroup.items.reduce((sum, r) => sum + (r.peso_relativo || 0), 0)
          const espWeightedAvance = espGroup.items.reduce(
            (sum, r) => sum + (r.peso_relativo || 0) * (r.porcentaje_avance || 0),
            0
          )
          const espPaf = espTotalPeso > 0 ? espWeightedAvance / espTotalPeso : 0

          return {
            id: espId,
            nombre: espGroup.items[0]?.especialidad_nombre || '',
            paf: Math.round(espPaf * 100) / 100,
            frentes: espGroup.items.length,
          }
        })

        return {
          id: ueId,
          nombre: ejecutoraMap[ueId]?.nombre || '',
          logo_url: ejecutoraMap[ueId]?.logo_url || null,
          paf: Math.round(paf * 100) / 100,
          frentesActivos: totalItems,
          alertas: alertasPerUE[ueId] || 0,
          totalItems,
          itemsConAvance,
          especialidades,
        }
      })
      // Sort by nombre
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[Dashboard Ejecutoras API Error]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
