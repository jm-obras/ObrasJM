'use client'

import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
} from 'lucide-react'

import type { AlcancePlanificado } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

import { ITEMS_PER_PAGE, STATUS_COLORS } from './alcance-types'

interface AlcanceTableProps {
  alcances: AlcancePlanificado[]
  loading: boolean
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  canEdit: boolean
  isAdmin: boolean
  onEdit: (alcance: AlcancePlanificado) => void
  onDelete: (alcance: AlcancePlanificado) => void
  onAddClick: () => void
}

export function AlcanceTable({
  alcances,
  loading,
  currentPage,
  setCurrentPage,
  totalPages,
  canEdit,
  isAdmin,
  onEdit,
  onDelete,
  onAddClick,
}: AlcanceTableProps) {
  const paginatedAlcances = alcances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Especialidad</TableHead>
                <TableHead>Sector / Subsector</TableHead>
                <TableHead className="max-w-[200px]">Descripción</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Cant. Planif.</TableHead>
                <TableHead className="text-right">Peso (%)</TableHead>
                <TableHead>Unidad Ejecutora</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    {canEdit && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                  </TableRow>
                ))
              ) : paginatedAlcances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>No se encontraron registros de alcance planificado</p>
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={onAddClick}>
                          <Plus className="mr-1 h-4 w-4" />
                          Crear nuevo alcance
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAlcances.map((alcance) => (
                  <TableRow key={alcance.id}>
                    <TableCell className="font-medium">
                      {alcance.especialidad?.nombre || '—'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{alcance.sector?.nombre || '—'}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span>{alcance.subsector?.nombre || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={alcance.descripcion}>
                      {alcance.descripcion}
                    </TableCell>
                    <TableCell>{alcance.unidad_medida}</TableCell>
                    <TableCell className="text-right">
                      {alcance.cantidad_planificada.toLocaleString('es-VE')}
                    </TableCell>
                    <TableCell className="text-right">{alcance.peso_relativo}%</TableCell>
                    <TableCell>{alcance.unidad_ejecutora?.nombre || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[alcance.status]}
                      >
                        {alcance.status}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(alcance)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => onDelete(alcance)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && alcances.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, alcances.length)} de {alcances.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1]
                  const showEllipsis = prev !== undefined && page - prev > 1
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && <MoreHorizontal className="h-4 w-4 text-muted-foreground mx-1" />}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  )
                })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
