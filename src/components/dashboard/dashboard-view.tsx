'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { HospitalHeatmap } from '@/components/dashboard/hospital-heatmap'
import { PAFChart } from '@/components/dashboard/paf-chart'
import type { KPIData } from '@/lib/types'

export function DashboardView() {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo cargar el dashboard`)
      }
      const json = await res.json()
      setData(json.data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchData])

  if (error && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold">Error al cargar</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => fetchData(true)}
              className="gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard PAF</h2>
          <p className="text-sm text-muted-foreground">
            Seguimiento de Avance Físico — Hospital J.M. de los Ríos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Actualizado: {lastRefresh.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section>
        <KPICards data={data} loading={loading} />
      </section>

      {/* Heatmap */}
      <section>
        <HospitalHeatmap data={data} loading={loading} />
      </section>

      {/* PAF Chart */}
      <section>
        <PAFChart data={data?.pafBySector ?? null} loading={loading} />
      </section>
    </div>
  )
}
