'use client'

import { Plus, Filter } from 'lucide-react'

import type { Especialidad, Sector } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AlcanceFiltersProps {
  filterSector: string
  setFilterSector: (value: string) => void
  filterEspecialidad: string
  setFilterEspecialidad: (value: string) => void
  filterStatus: string
  setFilterStatus: (value: string) => void
  sectores: Sector[]
  especialidades: Especialidad[]
  canEdit: boolean
  onAddClick: () => void
}

export function AlcanceFilters({
  filterSector,
  setFilterSector,
  filterEspecialidad,
  setFilterEspecialidad,
  filterStatus,
  setFilterStatus,
  sectores,
  especialidades,
  canEdit,
  onAddClick,
}: AlcanceFiltersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] space-y-1">
            <Label className="text-xs text-muted-foreground">Sector</Label>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sectores</SelectItem>
                {sectores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px] space-y-1">
            <Label className="text-xs text-muted-foreground">Especialidad</Label>
            <Select value={filterEspecialidad} onValueChange={setFilterEspecialidad}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {especialidades.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px] space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los status</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canEdit && (
            <Button onClick={onAddClick} className="ml-auto h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Alcance</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
