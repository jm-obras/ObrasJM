import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // 1. Fetch macro_especialidades — the 6 macro areas
    const { data: macroData, error: macroError } = await adminClient
      .from('macro_especialidades')
      .select('*')
      .order('orden')

    if (macroError) {
      // If the table doesn't exist yet (migration not applied), return a helpful error
      if (macroError.message?.includes('does not exist') || macroError.code === '42P01') {
        return NextResponse.json(
          {
            error: 'La tabla macro_especialidades no existe. Asegúrese de aplicar la migración correspondiente.',
            detail: macroError.message,
            code: macroError.code,
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: macroError.message, code: macroError.code },
        { status: 500 }
      )
    }

    // 2. Fetch macro_especialidades_especialidades junction table for mappings
    const { data: junctionData, error: junctionError } = await adminClient
      .from('macro_especialidades_especialidades')
      .select('*')

    if (junctionError) {
      if (junctionError.message?.includes('does not exist') || junctionError.code === '42P01') {
        return NextResponse.json(
          {
            error: 'La tabla macro_especialidades_especialidades no existe. Asegúrese de aplicar la migración correspondiente.',
            detail: junctionError.message,
            code: junctionError.code,
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: junctionError.message, code: junctionError.code },
        { status: 500 }
      )
    }

    // 3. Fetch all active subsector PAF data from v_paf_subsector (same as main dashboard)
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

    // Build a map: especialidad_id → macro_especialidad_id (from junction table)
    const espToMacro: Record<string, string> = {}
    for (const j of junctionData || []) {
      espToMacro[j.especialidad_id] = j.macro_especialidad_id
    }

    // Build macro lookup
    const macroMap: Record<string, {
      id: string
      nombre: string
      slug: string
      imagen_url: string | null
      orden: number
    }> = {}
    for (const m of macroData || []) {
      macroMap[m.id] = {
        id: m.id,
        nombre: m.nombre,
        slug: m.slug,
        imagen_url: m.imagen_url,
        orden: m.orden,
      }
    }

    // 4. Group subsector data by macro especialidad (through the junction table)
    const groupedByMacro: Record<string, {
      items: typeof subsectorData
      subEspecialidades: Record<string, { items: typeof subsectorData }>
    }> = {}

    for (const row of subsectorData || []) {
      const macroId = espToMacro[row.especialidad_id]
      if (!macroId) continue // skip items not mapped to any macro especialidad

      if (!groupedByMacro[macroId]) {
        groupedByMacro[macroId] = { items: [], subEspecialidades: {} }
      }
      groupedByMacro[macroId].items.push(row)

      // Also group by especialidad (sub-especialidad) within each macro
      const espId = row.especialidad_id
      if (!groupedByMacro[macroId].subEspecialidades[espId]) {
        groupedByMacro[macroId].subEspecialidades[espId] = { items: [] }
      }
      groupedByMacro[macroId].subEspecialidades[espId].items.push(row)
    }

    // 5. Calculate weighted PAF per macro especialidad and build response
    // Include all macros even if they have no data (show zeros)
    const data = (macroData || []).map((macro) => {
      const group = groupedByMacro[macro.id]

      if (!group) {
        return {
          id: macro.id,
          nombre: macro.nombre,
          slug: macro.slug,
          imagen_url: macro.imagen_url || null,
          orden: macro.orden,
          paf: 0,
          totalItems: 0,
          itemsConAvance: 0,
          subEspecialidades: [],
        }
      }

      const totalPeso = group.items.reduce((sum, r) => sum + (r.peso_relativo || 0), 0)
      const weightedAvance = group.items.reduce(
        (sum, r) => sum + (r.peso_relativo || 0) * (r.porcentaje_avance || 0),
        0
      )
      const paf = totalPeso > 0 ? weightedAvance / totalPeso : 0
      const totalItems = group.items.length
      const itemsConAvance = group.items.filter((r) => r.cantidad_ejecutada > 0).length

      // Calculate PAF per sub-especialidad within this macro
      const subEspecialidades = Object.entries(group.subEspecialidades).map(([espId, espGroup]) => {
        const espTotalPeso = espGroup.items.reduce((sum, r) => sum + (r.peso_relativo || 0), 0)
        const espWeightedAvance = espGroup.items.reduce(
          (sum, r) => sum + (r.peso_relativo || 0) * (r.porcentaje_avance || 0),
          0
        )
        const espPaf = espTotalPeso > 0 ? espWeightedAvance / espTotalPeso : 0
        const espTotalItems = espGroup.items.length
        const espItemsConAvance = espGroup.items.filter((r) => r.cantidad_ejecutada > 0).length

        return {
          id: espId,
          nombre: espGroup.items[0]?.especialidad_nombre || '',
          paf: Math.round(espPaf * 100) / 100,
          totalItems: espTotalItems,
          itemsConAvance: espItemsConAvance,
        }
      })

      return {
        id: macro.id,
        nombre: macro.nombre,
        slug: macro.slug,
        imagen_url: macro.imagen_url || null,
        orden: macro.orden,
        paf: Math.round(paf * 100) / 100,
        totalItems,
        itemsConAvance,
        subEspecialidades,
      }
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[Dashboard Especialidades API Error]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
