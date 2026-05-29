'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MacroEspecialidadData } from '@/lib/types'

function getPafColor(value: number): string {
  if (value > 70) return 'text-green-600 dark:text-green-400'
  if (value >= 30) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getPafStroke(value: number): string {
  if (value > 70) return 'text-green-500'
  if (value >= 30) return 'text-yellow-500'
  return 'text-red-500'
}

function getPafBg(value: number): string {
  if (value > 70) return 'bg-green-500'
  if (value >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getPafRingBorder(value: number): string {
  if (value > 70) return 'border-green-500/30'
  if (value >= 30) return 'border-yellow-500/30'
  return 'border-red-500/30'
}

function CircularProgress({ value, size = 110, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`${getPafStroke(value)} transition-all duration-1000 ease-out`}
      />
    </svg>
  )
}

function SubEspecialidadProgressBar({ sub }: { sub: { nombre: string; paf: number; totalItems: number; itemsConAvance: number } }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium truncate mr-2">{sub.nombre}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
              sub.paf > 70
                ? 'bg-green-50 text-green-700 border-green-200'
                : sub.paf >= 30
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {sub.paf.toFixed(1)}%
          </Badge>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${getPafBg(sub.paf)} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(sub.paf, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {sub.itemsConAvance}/{sub.totalItems} ítems
          </span>
        </div>
      </div>
    </div>
  )
}

function MacroCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function MacroCard({ macro }: { macro: MacroEspecialidadData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${expanded ? 'ring-1 ring-primary/20' : ''}`}>
      <CardContent className="p-5 sm:p-6">
        {/* Main content - centered layout like reference infographic */}
        <div className="flex flex-col items-center text-center">
          {/* Macro image + circular progress overlay */}
          <div className="relative mb-3">
            {/* Background image */}
            <div className="h-[110px] w-[110px] rounded-full overflow-hidden border-2 bg-slate-900 flex items-center justify-center">
              {macro.imagen_url ? (
                <img
                  src={macro.imagen_url}
                  alt={macro.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Layers className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {/* Circular progress ring overlay */}
            <div className="absolute inset-0">
              <CircularProgress value={macro.paf} size={110} strokeWidth={5} />
            </div>
            {/* Percentage overlay */}
            <div className={`absolute inset-0 flex items-center justify-center ${getPafRingBorder(macro.paf)}`}>
              <div className="bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className={`text-sm font-bold ${getPafColor(macro.paf)}`}>
                  {macro.paf.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-sm sm:text-base mb-1">{macro.nombre}</h3>

          {/* Progress bar */}
          <div className="w-full flex items-center gap-2 mb-2">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${getPafBg(macro.paf)} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(macro.paf, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${getPafColor(macro.paf)}`}>
              {macro.paf.toFixed(1)}%
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span>{macro.totalItems} ítems</span>
            <span>•</span>
            <span>{macro.itemsConAvance} con avance</span>
          </div>

          {/* Sub-especialidades toggle */}
          {macro.subEspecialidades.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-center gap-2 text-xs h-8"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Ocultar detalle
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  {macro.subEspecialidades.length} especialidades
                </>
              )}
            </Button>
          )}
        </div>

        {/* Expanded sub-especialidades */}
        {expanded && macro.subEspecialidades.length > 0 && (
          <div className="mt-4 pt-3 border-t space-y-2">
            {macro.subEspecialidades
              .sort((a, b) => b.paf - a.paf)
              .map((sub) => (
                <SubEspecialidadProgressBar key={sub.id} sub={sub} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EspecialidadesView() {
  const [data, setData] = useState<MacroEspecialidadData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true)
    setError(null)

    try {
      const res = await fetch('/api/dashboard/especialidades')
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || `Error ${res.status}`)
      }
      const json = await res.json()
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MacroCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold">Error al cargar</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              {error.includes('no existe') && (
                <p className="text-xs text-muted-foreground mt-2">
                  Es posible que la migración de base de datos aún no se haya aplicado.
                </p>
              )}
            </div>
            <Button onClick={() => fetchData(true)} className="gap-2" variant="outline">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay datos de macro especialidades disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Reporte operativo por especialidad — {data.length} áreas
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          &lt; 30%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          30% - 70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          &gt; 70%
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((macro) => (
          <MacroCard key={macro.id} macro={macro} />
        ))}
      </div>
    </div>
  )
}
