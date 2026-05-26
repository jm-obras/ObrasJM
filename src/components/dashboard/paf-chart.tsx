'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import type { PAFSector } from '@/lib/types'

const chartConfig = {
  paf_sector: {
    label: 'PAF Sector',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function getBarColor(value: number): string {
  if (value === 0) return '#E5E7EB'
  if (value < 30) return '#EF4444'
  if (value <= 70) return '#EAB308'
  return '#22C55E'
}

export function PAFChart({ data, loading }: { data: PAFSector[] | null; loading: boolean }) {
  if (loading || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort by PAF descending for better visual
  const sortedData = [...data].sort((a, b) => b.paf_sector - a.paf_sector)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">PAF por Sector</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              type="category"
              dataKey="sector_codigo"
              width={50}
              tick={{ fontSize: 12, fontWeight: 600 }}
              stroke="var(--color-muted-foreground)"
            />
            <Bar
              dataKey="paf_sector"
              radius={[0, 6, 6, 0]}
              maxBarSize={32}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.paf_sector)}
                  className="transition-all duration-500"
                />
              ))}
              <LabelList
                dataKey="paf_sector"
                position="right"
                formatter={(value: number) => `${value.toFixed(1)}%`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fill: 'var(--color-foreground)',
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
