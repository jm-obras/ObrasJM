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
  Circle,
  XCircle,
  ShieldCheck,
} from 'lucide-react'

import type { AvanceEjecutado, UserRol } from '@/lib/types'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AvanceTableProps {
  avances: AvanceEjecutado[]
  loading: boolean
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  canEdit: boolean
  canApprove: boolean
  canCreate: boolean
  userRole: UserRol
  onEdit: (avance: AvanceEjecutado) => void
  onApproval: (avance: AvanceEjecutado) => void
  onPhotoGallery: (photos: string[]) => void
  onAddClick: () => void
}

const truncateText = (text: string | null, maxLen: number) => {
  if (!text) return '—'
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
}

/** Mini 3-step indicator for the table */
function MiniApprovalIndicator({ avance }: { avance: AvanceEjecutado }) {
  const levels = [
    { status: avance.aprobacion_residente, label: 'Residente' },
    { status: avance.aprobacion_inspector, label: 'Inspector' },
    { status: avance.aprobacion_directivo, label: 'Directivo' },
  ]

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {levels.map((level, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                {idx > 0 && <div className="w-2 h-0.5 bg-muted-foreground/20" />}
                <span
                  className={
                    level.status === 'Aprobado'
                      ? 'text-emerald-600'
                      : level.status === 'Rechazado'
                        ? 'text-red-500'
                        : 'text-muted-foreground/40'
                  }
                >
                  {level.status === 'Aprobado' ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : level.status === 'Rechazado' ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {level.label}: {level.status}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

/** Can the user approve at their level for this avance? */
function canUserApproveAvance(avance: AvanceEjecutado, userRole: UserRol): boolean {
  switch (userRole) {
    case 'ingeniera_residente':
      return avance.aprobacion_residente === 'Pendiente'
    case 'inspector':
      return avance.aprobacion_inspector === 'Pendiente' && avance.aprobacion_residente === 'Aprobado'
    case 'directivo_hospital':
      return avance.aprobacion_directivo === 'Pendiente' && avance.aprobacion_inspector === 'Aprobado'
    case 'administrador':
      return avance.status_aprobacion === 'Pendiente'
    default:
      return false
  }
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
  userRole,
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
                <TableHead>Aprobación</TableHead>
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
                paginatedAvances.map((avance) => {
                  const showApproveBtn = canApprove && canUserApproveAvance(avance, userRole)

                  return (
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
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={APROBACION_COLORS[avance.status_aprobacion]}
                          >
                            {avance.status_aprobacion}
                          </Badge>
                          <MiniApprovalIndicator avance={avance} />
                        </div>
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
                          {canEdit && avance.status_aprobacion === 'Pendiente' && (
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
                          {showApproveBtn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => onApproval(avance)}
                              title="Aprobar/Rechazar"
                            >
                              <ShieldCheck className="h-4 w-4" />
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
                  )
                })
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
