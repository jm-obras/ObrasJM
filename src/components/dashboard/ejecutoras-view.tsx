'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, HardHat, ChevronDown, ChevronUp, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { EjecutoraData } from '@/lib/types'

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

function CircularProgress({ value, size = 100, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
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
        className="text-muted/30"
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

function EjecutoraCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function EjecutoraCard({ ejecutora }: { ejecutora: EjecutoraData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${expanded ? 'ring-1 ring-primary/20' : ''}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {ejecutora.logo_url ? (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-muted/30 border flex items-center justify-center p-1">
                <img
                  src={ejecutora.logo_url}
                  alt={ejecutora.nombre}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-muted/50 border flex items-center justify-center">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="font-semibold text-sm sm:text-base truncate">{ejecutora.nombre}</h3>
            
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${getPafBg(ejecutora.paf)} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(ejecutora.paf, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${getPafColor(ejecutora.paf)}`}>
                {ejecutora.paf.toFixed(1)}%
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardHat className="h-3.5 w-3.5" />
                {ejecutora.frentesActivos} frentes
              </span>
              {ejecutora.alertas > 0 && (
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {ejecutora.alertas} alertas
                </span>
              )}
              <span>
                {ejecutora.itemsConAvance}/{ejecutora.totalItems} con avance
              </span>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="flex-shrink-0 relative">
            <CircularProgress value={ejecutora.paf} size={72} strokeWidth={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${getPafColor(ejecutora.paf)}`}>
                {ejecutora.paf.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Expand button */}
        {ejecutora.especialidades.length > 0 && (
          <>
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-center gap-2 text-xs h-8"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Ocultar especialidades
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Ver {ejecutora.especialidades.length} especialidades
                  </>
                )}
              </Button>
            </div>

            {/* Expanded especialidades */}
            {expanded && (
              <div className="mt-3 space-y-2">
                {ejecutora.especialidades
                  .sort((a, b) => b.paf - a.paf)
                  .map((esp) => (
                    <div
                      key={esp.id}
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <span className="text-xs font-medium truncate flex-1 min-w-0 mr-3">
                        {esp.nombre}
                      </span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {esp.frentes} frentes
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            esp.paf > 70
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : esp.paf >= 30
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {esp.paf.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function EjecutorasView() {
  const [data, setData] = useState<EjecutoraData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true)
    setError(null)

    try {
      const res = await fetch('/api/dashboard/ejecutoras')
      if (!res.ok) throw new Error(`Error ${res.status}`)
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <EjecutoraCardSkeleton key={i} />
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
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay unidades ejecutoras con datos de avance</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Avance físico por unidad ejecutora — {data.length} ejecutoras
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((ejecutora) => (
          <EjecutoraCard key={ejecutora.id} ejecutora={ejecutora} />
        ))}
      </div>
    </div>
  )
}
