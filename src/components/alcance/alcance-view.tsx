'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  AlcancePlanificado,
  AlcanceStatus,
  Especialidad,
  Sector,
  Subsector,
  UnidadEjecutora,
  Profile,
} from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ITEMS_PER_PAGE = 10

const STATUS_COLORS: Record<AlcanceStatus, string> = {
  Activo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Completado: 'bg-sky-100 text-sky-800 border-sky-200',
  Suspendido: 'bg-red-100 text-red-800 border-red-200',
}

interface AlcanceFormData {
  especialidad_id: string
  subsector_id: string
  descripcion: string
  peso_relativo: number
  unidad_medida: string
  cantidad_planificada: number
  unidad_ejecutora_id: string
  status: AlcanceStatus
}

const emptyForm: AlcanceFormData = {
  especialidad_id: '',
  subsector_id: '',
  descripcion: '',
  peso_relativo: 0,
  unidad_medida: '',
  cantidad_planificada: 0,
  unidad_ejecutora_id: '',
  status: 'Activo',
}

interface AlcanceViewProps {
  profile: Profile
}

export function AlcanceView({ profile }: AlcanceViewProps) {
  const isAdmin = profile.rol === 'administrador'
  const isInspector = profile.rol === 'inspector'
  const canEdit = isAdmin || isInspector

  // Data
  const [alcances, setAlcances] = useState<AlcancePlanificado[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [sectores, setSectores] = useState<Sector[]>([])
  const [subsectores, setSubsectores] = useState<Subsector[]>([])
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutora[]>([])

  // Filters
  const [filterSector, setFilterSector] = useState<string>('all')
  const [filterEspecialidad, setFilterEspecialidad] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Loading
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAlcance, setSelectedAlcance] = useState<AlcancePlanificado | null>(null)
  const [formData, setFormData] = useState<AlcanceFormData>(emptyForm)

  // Filtered subsectores based on selected sector in form
  const [formSectorId, setFormSectorId] = useState<string>('')
  const filteredFormSubsectores = subsectores.filter(
    (s) => !formSectorId || s.sector_id === formSectorId
  )

  // Fetch all reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const [espRes, secRes, uniRes] = await Promise.all([
        fetch('/api/especialidades'),
        fetch('/api/sectores'),
        fetch('/api/unidades-ejecutoras'),
      ])

      const espData = await espRes.json()
      const secData = await secRes.json()
      const uniData = await uniRes.json()

      if (espData.data) setEspecialidades(espData.data)
      if (secData.data) {
        setSectores(secData.data)
        // Extract all subsectores from sectors
        const allSubs: Subsector[] = []
        secData.data.forEach((s: Sector & { subsectores?: Subsector[] }) => {
          if (s.subsectores) {
            allSubs.push(...s.subsectores)
          }
        })
        setSubsectores(allSubs)
      }
      if (uniData.data) setUnidadesEjecutoras(uniData.data)
    } catch {
      toast.error('Error cargando datos de referencia')
    }
  }, [])

  // Fetch alcances with filters
  const fetchAlcances = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterSector !== 'all') params.set('sector_id', filterSector)
      if (filterEspecialidad !== 'all') params.set('especialidad_id', filterEspecialidad)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/alcance?${params.toString()}`)
      const data = await res.json()

      if (data.data) {
        setAlcances(data.data)
      } else {
        toast.error(data.error || 'Error cargando alcances')
      }
    } catch {
      toast.error('Error cargando alcances')
    } finally {
      setLoading(false)
    }
  }, [filterSector, filterEspecialidad, filterStatus])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])

  useEffect(() => {
    fetchAlcances()
  }, [fetchAlcances])

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterSector, filterEspecialidad, filterStatus])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(alcances.length / ITEMS_PER_PAGE))
  const paginatedAlcances = alcances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Form handlers
  const handleFormChange = (field: keyof AlcanceFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddOpen = () => {
    setFormData(emptyForm)
    setFormSectorId('')
    setShowAddDialog(true)
  }

  const handleEditOpen = (alcance: AlcancePlanificado) => {
    setSelectedAlcance(alcance)
    setFormSectorId(alcance.sector?.id || '')
    setFormData({
      especialidad_id: alcance.especialidad_id,
      subsector_id: alcance.subsector_id,
      descripcion: alcance.descripcion,
      peso_relativo: alcance.peso_relativo,
      unidad_medida: alcance.unidad_medida,
      cantidad_planificada: alcance.cantidad_planificada,
      unidad_ejecutora_id: alcance.unidad_ejecutora_id || '',
      status: alcance.status,
    })
    setShowEditDialog(true)
  }

  const handleDeleteOpen = (alcance: AlcancePlanificado) => {
    setSelectedAlcance(alcance)
    setShowDeleteDialog(true)
  }

  const handleSubmit = async (isEdit: boolean) => {
    if (!formData.especialidad_id || !formData.subsector_id || !formData.descripcion || !formData.unidad_medida) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const url = isEdit ? `/api/alcance/${selectedAlcance?.id}` : '/api/alcance'
      const method = isEdit ? 'PUT' : 'POST'

      const body: Record<string, unknown> = {
        especialidad_id: formData.especialidad_id,
        subsector_id: formData.subsector_id,
        descripcion: formData.descripcion,
        peso_relativo: formData.peso_relativo,
        unidad_medida: formData.unidad_medida,
        cantidad_planificada: formData.cantidad_planificada,
        unidad_ejecutora_id: formData.unidad_ejecutora_id || null,
      }

      if (isEdit) {
        body.status = formData.status
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isEdit ? 'Alcance actualizado exitosamente' : 'Alcance creado exitosamente')
        if (isEdit) {
          setShowEditDialog(false)
        } else {
          setShowAddDialog(false)
        }
        fetchAlcances()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAlcance) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/alcance/${selectedAlcance.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        toast.success('Alcance eliminado exitosamente')
        setShowDeleteDialog(false)
        fetchAlcances()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  // Form Dialog Content (shared between Add and Edit)
  const renderForm = (isEdit: boolean) => (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="especialidad">Especialidad *</Label>
        <Select
          value={formData.especialidad_id}
          onValueChange={(val) => handleFormChange('especialidad_id', val)}
        >
          <SelectTrigger id="especialidad">
            <SelectValue placeholder="Seleccionar especialidad" />
          </SelectTrigger>
          <SelectContent>
            {especialidades.map((esp) => (
              <SelectItem key={esp.id} value={esp.id}>
                {esp.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sector">Sector *</Label>
          <Select
            value={formSectorId}
            onValueChange={(val) => {
              setFormSectorId(val)
              setFormData((prev) => ({ ...prev, subsector_id: '' }))
            }}
          >
            <SelectTrigger id="sector">
              <SelectValue placeholder="Seleccionar sector" />
            </SelectTrigger>
            <SelectContent>
              {sectores.map((sec) => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subsector">Subsector *</Label>
          <Select
            value={formData.subsector_id}
            onValueChange={(val) => handleFormChange('subsector_id', val)}
            disabled={!formSectorId}
          >
            <SelectTrigger id="subsector">
              <SelectValue placeholder="Seleccionar subsector" />
            </SelectTrigger>
            <SelectContent>
              {filteredFormSubsectores.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleFormChange('descripcion', e.target.value)}
          placeholder="Descripción del alcance planificado"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="peso_relativo">Peso Relativo (%)</Label>
          <Input
            id="peso_relativo"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.peso_relativo}
            onChange={(e) => handleFormChange('peso_relativo', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
          <Input
            id="unidad_medida"
            value={formData.unidad_medida}
            onChange={(e) => handleFormChange('unidad_medida', e.target.value)}
            placeholder="m², ml, uds"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cantidad_planificada">Cant. Planificada</Label>
          <Input
            id="cantidad_planificada"
            type="number"
            step="0.01"
            min="0"
            value={formData.cantidad_planificada}
            onChange={(e) =>
              handleFormChange('cantidad_planificada', parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="unidad_ejecutora">Unidad Ejecutora</Label>
          <Select
            value={formData.unidad_ejecutora_id}
            onValueChange={(val) => handleFormChange('unidad_ejecutora_id', val)}
          >
            <SelectTrigger id="unidad_ejecutora">
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {unidadesEjecutoras.map((uni) => (
                <SelectItem key={uni.id} value={uni.id}>
                  {uni.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEdit && (
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleFormChange('status', val as AlcanceStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
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
              <Button onClick={handleAddOpen} className="ml-auto h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Alcance</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
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
                          <Button variant="outline" size="sm" onClick={handleAddOpen}>
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
                              onClick={() => handleEditOpen(alcance)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteOpen(alcance)}
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Alcance Planificado</DialogTitle>
            <DialogDescription>
              Complete el formulario para crear un nuevo alcance planificado.
            </DialogDescription>
          </DialogHeader>
          {renderForm(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear Alcance'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Alcance Planificado</DialogTitle>
            <DialogDescription>
              Modifique los campos que desea actualizar.
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este alcance?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el alcance
              planificado &ldquo;{selectedAlcance?.descripcion}&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
