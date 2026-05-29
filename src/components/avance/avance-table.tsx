'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Pencil,
  CheckCircle,
  Eye,
  Camera,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Plus,
} from 'lucide-react'

import type { AvanceEjecutado } from '@/lib/types'
import { APROBACION_COLORS, TRABAJO_COLORS, ITEMS_PER_PAGE } from './avance-types'

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

interface AvanceTableProps {
  avances: AvanceEjecutado[]
  loading: boolean
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  canEdit: boolean
  canApprove: boolean
  canCreate: boolean
  onEdit: (avance: AvanceEjecutado) => void
  onApproval: (avance: AvanceEjecutado) => void
  onPhotoGallery: (photos: string[]) => void
  onAddClick: () => void
}

const truncateText = (text: string | null, maxLen: number) => {
  if (!text) return '—'
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
}

export function AvanceTable({
  avances,
  loading,
  currentPage,
  setCurrentPage,
  totalPages,
  canEdit,
  canApprove,
  canCreate,
  onEdit,
  onApproval,
  onPhotoGallery,
  onAddClick,
}: AvanceTableProps) {
  const paginatedAvances = avances.slice(
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
                <TableHead>Alcance</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Sector / Subsector</TableHead>
                <TableHead className="text-right">Cant. Report.</TableHead>
                <TableHead>Tipo Trabajo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fotos</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedAvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>No se encontraron registros de avance ejecutado</p>
                      {canCreate && (
                        <Button variant="outline" size="sm" onClick={onAddClick}>
                          <Plus className="mr-1 h-4 w-4" />
                          Reportar nuevo avance
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAvances.map((avance) => (
                  <TableRow key={avance.id}>
                    <TableCell className="max-w-[150px] truncate font-medium" title={avance.alcance?.descripcion}>
                      {avance.alcance?.descripcion || '—'}
                    </TableCell>
                    <TableCell>{avance.alcance?.especialidad?.nombre || '—'}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{avance.alcance?.sector?.nombre || '—'}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span>{avance.alcance?.subsector?.nombre || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {avance.cantidad_reportada.toLocaleString('es-VE')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={TRABAJO_COLORS[avance.tipo_trabajo]}>
                        {avance.tipo_trabajo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(avance.fecha_reporte), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={APROBACION_COLORS[avance.status_aprobacion]}
                      >
                        {avance.status_aprobacion}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {avance.fotos_evidencia_urls?.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => onPhotoGallery(avance.fotos_evidencia_urls)}
                        >
                          <Camera className="h-3 w-3" />
                          {avance.fotos_evidencia_urls.length}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">0</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[120px]" title={avance.notas || ''}>
                      {truncateText(avance.notas, 20)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(avance)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        )}
                        {canApprove && avance.status_aprobacion === 'Pendiente' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => onApproval(avance)}
                            title="Aprobar/Rechazar"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Aprobar/Rechazar</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onApproval(avance)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && avances.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, avances.length)} de {avances.length}
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
