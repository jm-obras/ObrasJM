'use client'

import { Plus, CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AvanceFiltersProps {
  filterStatus: string
  setFilterStatus: (value: string) => void
  filterFechaDesde: string
  setFilterFechaDesde: (value: string) => void
  filterFechaHasta: string
  setFilterFechaHasta: (value: string) => void
  canCreate: boolean
  onAddClick: () => void
}

export function AvanceFilters({
  filterStatus,
  setFilterStatus,
  filterFechaDesde,
  setFilterFechaDesde,
  filterFechaHasta,
  setFilterFechaHasta,
  canCreate,
  onAddClick,
}: AvanceFiltersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] space-y-1">
            <Label className="text-xs text-muted-foreground">Status General</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aprobado">Aprobado (3 niveles)</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px] space-y-1">
            <Label className="text-xs text-muted-foreground">Fecha Desde</Label>
            <Input
              type="date"
              className="h-9"
              value={filterFechaDesde}
              onChange={(e) => setFilterFechaDesde(e.target.value)}
            />
          </div>

          <div className="min-w-[140px] space-y-1">
            <Label className="text-xs text-muted-foreground">Fecha Hasta</Label>
            <Input
              type="date"
              className="h-9"
              value={filterFechaHasta}
              onChange={(e) => setFilterFechaHasta(e.target.value)}
            />
          </div>

          {canCreate && (
            <Button onClick={onAddClick} className="ml-auto h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Avance</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
