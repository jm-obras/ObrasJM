'use client'

import { useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import type { KPIData, PAFSubsector, PAFSector } from '@/lib/types'

function getHeatmapColor(value: number): string {
  if (value === 0) return 'bg-gray-200 dark:bg-gray-700'
  if (value < 30) return 'bg-red-500'
  if (value <= 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getHeatmapTextColor(value: number): string {
  if (value === 0) return 'text-gray-700 dark:text-gray-300'
  if (value < 30) return 'text-white'
  if (value <= 70) return 'text-gray-900'
  return 'text-white'
}

function SectorColumnSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-md" />
      <Skeleton className="h-14 w-full rounded-md" />
      <Skeleton className="h-14 w-full rounded-md" />
    </div>
  )
}

function HeatmapCell({ item, sectorName }: { item: PAFSubsector; sectorName: string }) {
  const color = getHeatmapColor(item.porcentaje_avance)
  const textColor = getHeatmapTextColor(item.porcentaje_avance)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`${color} ${textColor} rounded-md p-2.5 cursor-default transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-md min-h-[3.5rem] flex flex-col justify-center`}
        >
          <span className="text-xs font-medium leading-tight truncate" title={item.subsector_nombre}>
            {item.subsector_nombre}
          </span>
          <span className="text-sm font-bold tabular-nums mt-0.5">
            {item.porcentaje_avance.toFixed(1)}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-popover text-popover-foreground border shadow-lg rounded-lg p-3 max-w-[260px]"
        sideOffset={4}
      >
        <div className="space-y-1.5 text-xs">
          <p className="font-semibold text-sm">{item.subsector_nombre}</p>
          <div className="h-px bg-border" />
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <span className="text-muted-foreground">Sector:</span>
            <span className="font-medium">{sectorName}</span>
            <span className="text-muted-foreground">Especialidad:</span>
            <span className="font-medium">{item.especialidad_nombre}</span>
            <span className="text-muted-foreground">PAF:</span>
            <span className="font-bold">{item.porcentaje_avance.toFixed(1)}%</span>
            <span className="text-muted-foreground">Planificado:</span>
            <span className="font-medium">{item.cantidad_planificada} {item.unidad_medida}</span>
            <span className="text-muted-foreground">Ejecutado:</span>
            <span className="font-medium">{item.cantidad_ejecutada} {item.unidad_medida}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function SectorColumn({
  sector,
  subsectores,
}: {
  sector: PAFSector
  subsectores: PAFSubsector[]
}) {
  const pafColor = getHeatmapColor(sector.paf_sector)
  const pafTextColor = getHeatmapTextColor(sector.paf_sector)

  return (
    <div className="space-y-2">
      {/* Sector header */}
      <div className={`${pafColor} ${pafTextColor} rounded-lg p-3 text-center transition-all duration-500`}>
        <p className="text-xs font-bold uppercase tracking-wide opacity-80">
          {sector.sector_codigo}
        </p>
        <p className="text-[11px] leading-tight mt-0.5 truncate" title={sector.sector_nombre}>
          {sector.sector_nombre}
        </p>
        <p className="text-lg font-bold tabular-nums mt-1">
          {sector.paf_sector.toFixed(1)}%
        </p>
      </div>
      {/* Subsector cells */}
      <div className="space-y-1.5">
        {subsectores.map((item) => (
          <HeatmapCell key={item.alcance_id} item={item} sectorName={sector.sector_nombre} />
        ))}
      </div>
    </div>
  )
}

function MobileHeatmapRow({
  sector,
  subsectores,
}: {
  sector: PAFSector
  subsectores: PAFSubsector[]
}) {
  const pafColor = getHeatmapColor(sector.paf_sector)
  const pafTextColor = getHeatmapTextColor(sector.paf_sector)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Sector header row */}
      <div className={`${pafColor} ${pafTextColor} px-3 py-2 flex items-center justify-between`}>
        <div>
          <span className="text-xs font-bold uppercase tracking-wide opacity-80">
            {sector.sector_codigo}
          </span>
          <span className="text-xs ml-2">{sector.sector_nombre}</span>
        </div>
        <span className="text-base font-bold tabular-nums">{sector.paf_sector.toFixed(1)}%</span>
      </div>
      {/* Subsector items */}
      <div className="divide-y">
        {subsectores.map((item) => (
          <HeatmapCell key={item.alcance_id} item={item} sectorName={sector.sector_nombre} />
        ))}
      </div>
    </div>
  )
}

export function HospitalHeatmap({ data, loading }: { data: KPIData | null; loading: boolean }) {
  const sectorGroups = useMemo(() => {
    if (!data) return []

    const groupMap = new Map<string, { sector: PAFSector; subsectores: PAFSubsector[] }>()

    // Initialize with sector data
    for (const sector of data.pafBySector) {
      groupMap.set(sector.sector_id, { sector, subsectores: [] })
    }

    // Group subsectores by sector
    for (const sub of data.pafBySubsector) {
      const group = groupMap.get(sub.sector_id)
      if (group) {
        group.subsectores.push(sub)
      } else {
        // Subsector belongs to a sector not in pafBySector, create it
        groupMap.set(sub.sector_id, {
          sector: {
            sector_id: sub.sector_id,
            sector_nombre: sub.sector_nombre,
            sector_codigo: sub.sector_codigo,
            paf_sector: 0,
          },
          subsectores: [sub],
        })
      }
    }

    return Array.from(groupMap.values())
  }, [data])

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <SectorColumnSkeleton />
          <SectorColumnSkeleton />
          <SectorColumnSkeleton />
          <SectorColumnSkeleton />
          <SectorColumnSkeleton />
          <SectorColumnSkeleton />
        </div>
      </div>
    )
  }

  if (sectorGroups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay datos de sectores disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Leyenda PAF:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span>&lt;30%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-yellow-500" />
          <span>30-70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span>&gt;70%</span>
        </div>
      </div>

      {/* Desktop grid view */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        {sectorGroups.map(({ sector, subsectores }) => (
          <SectorColumn key={sector.sector_id} sector={sector} subsectores={subsectores} />
        ))}
      </div>

      {/* Mobile / tablet vertical list view */}
      <div className="md:hidden space-y-3">
        {sectorGroups.map(({ sector, subsectores }) => (
          <MobileHeatmapRow key={sector.sector_id} sector={sector} subsectores={subsectores} />
        ))}
      </div>
    </div>
  )
}
