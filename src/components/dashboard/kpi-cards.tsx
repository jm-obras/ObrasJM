'use client'

import { HardHat, AlertTriangle, Wrench, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { KPIData } from '@/lib/types'

function getPafColor(value: number): string {
  if (value > 70) return 'text-green-600 dark:text-green-400'
  if (value >= 30) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getPafBg(value: number): string {
  if (value > 70) return 'bg-green-500'
  if (value >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getPafBorder(value: number): string {
  if (value > 70) return 'border-l-green-500'
  if (value >= 30) return 'border-l-yellow-500'
  return 'border-l-red-500'
}

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
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
        className="text-muted/50"
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
        className={`${value > 70 ? 'text-green-500' : value >= 30 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
      />
    </svg>
  )
}

function KPICardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-2 w-full max-w-[120px]" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export function KPICards({ data, loading }: { data: KPIData | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    )
  }

  const especialidadesCount = new Set(data.pafBySubsector.map(s => s.especialidad_id)).size

  const cards = [
    {
      label: 'PAF Global',
      value: data.pafGlobal,
      suffix: '%',
      icon: TrendingUp,
      accent: getPafBorder(data.pafGlobal),
      iconBg: getPafColor(data.pafGlobal),
      progress: data.pafGlobal,
      progressColor: getPafBg(data.pafGlobal),
      isPaf: true,
    },
    {
      label: 'Frentes Activos',
      value: data.frentesActivos,
      suffix: '',
      icon: HardHat,
      accent: 'border-l-sky-500',
      iconBg: 'text-sky-600 dark:text-sky-400',
      progress: null,
      progressColor: 'bg-sky-500',
      isPaf: false,
    },
    {
      label: 'Alertas',
      value: data.alertas,
      suffix: '',
      icon: AlertTriangle,
      accent: 'border-l-orange-500',
      iconBg: 'text-orange-600 dark:text-orange-400',
      progress: null,
      progressColor: 'bg-orange-500',
      isPaf: false,
    },
    {
      label: 'Especialidades',
      value: especialidadesCount,
      suffix: '',
      icon: Wrench,
      accent: 'border-l-teal-500',
      iconBg: 'text-teal-600 dark:text-teal-400',
      progress: null,
      progressColor: 'bg-teal-500',
      isPaf: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`border-l-4 ${card.accent} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold tabular-nums ${card.isPaf ? getPafColor(card.value) : ''}`}>
                    {typeof card.value === 'number'
                      ? card.value % 1 !== 0
                        ? card.value.toFixed(1)
                        : card.value
                      : card.value}
                  </span>
                  {card.suffix && (
                    <span className={`text-lg font-semibold ${card.isPaf ? getPafColor(card.value) : 'text-muted-foreground'}`}>
                      {card.suffix}
                    </span>
                  )}
                </div>
                {card.isPaf && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${card.progressColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(card.progress!, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="relative flex-shrink-0 ml-3">
                {card.isPaf ? (
                  <div className="relative">
                    <CircularProgress value={card.value} size={52} strokeWidth={4} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[10px] font-bold ${getPafColor(card.value)}`}>
                        {card.value.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-lg bg-muted/50 p-2.5 ${card.iconBg}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
