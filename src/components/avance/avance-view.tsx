'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Camera,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Upload,
  X,
  Image as ImageIcon,
  CalendarIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  AvanceEjecutado,
  AlcancePlanificado,
  AprobacionStatus,
  TrabajoTipo,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const ITEMS_PER_PAGE = 10

const APROBACION_COLORS: Record<AprobacionStatus, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  Aprobado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rechazado: 'bg-red-100 text-red-800 border-red-200',
}

const TRABAJO_COLORS: Record<TrabajoTipo, string> = {
  Planificado: 'bg-sky-100 text-sky-800 border-sky-200',
  Imprevisto: 'bg-orange-100 text-orange-800 border-orange-200',
}

interface AvanceFormData {
  alcance_id: string
  cantidad_reportada: number
  tipo_trabajo: TrabajoTipo
  fecha_reporte: string
  fotos_evidencia_urls: string[]
  notas: string
}

const emptyForm: AvanceFormData = {
  alcance_id: '',
  cantidad_reportada: 0,
  tipo_trabajo: 'Planificado',
  fecha_reporte: format(new Date(), 'yyyy-MM-dd'),
  fotos_evidencia_urls: [],
  notas: '',
}

interface AvanceViewProps {
  profile: Profile
}

export function AvanceView({ profile }: AvanceViewProps) {
  const isAdmin = profile.rol === 'administrador'
  const isInspector = profile.rol === 'inspector'
  const isContratista = profile.rol === 'contratista'
  const canCreate = isAdmin || isContratista
  const canApprove = isAdmin || isInspector

  // Data
  const [avances, setAvances] = useState<AvanceEjecutado[]>([])
  const [alcances, setAlcances] = useState<AlcancePlanificado[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [sectores, setSectores] = useState<Sector[]>([])
  const [subsectores, setSubsectores] = useState<Subsector[]>([])
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutora[]>([])

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>('')
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Loading
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [selectedAvance, setSelectedAvance] = useState<AvanceEjecutado | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const [viewerPhotoUrl, setViewerPhotoUrl] = useState<string>('')
  const [formData, setFormData] = useState<AvanceFormData>(emptyForm)
  const [rejectionNotes, setRejectionNotes] = useState('')

  // File upload
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Date picker state
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [fechaReporte, setFechaReporte] = useState<Date>(new Date())

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const [espRes, secRes, uniRes, alcRes] = await Promise.all([
        fetch('/api/especialidades'),
        fetch('/api/sectores'),
        fetch('/api/unidades-ejecutoras'),
        fetch('/api/alcance'),
      ])

      const espData = await espRes.json()
      const secData = await secRes.json()
      const uniData = await uniRes.json()
      const alcData = await alcRes.json()

      if (espData.data) setEspecialidades(espData.data)
      if (secData.data) {
        setSectores(secData.data)
        const allSubs: Subsector[] = []
        secData.data.forEach((s: Sector & { subsectores?: Subsector[] }) => {
          if (s.subsectores) allSubs.push(...s.subsectores)
        })
        setSubsectores(allSubs)
      }
      if (uniData.data) setUnidadesEjecutoras(uniData.data)
      if (alcData.data) setAlcances(alcData.data)
    } catch {
      toast.error('Error cargando datos de referencia')
    }
  }, [])

  // Fetch avances with filters
  const fetchAvances = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status_aprobacion', filterStatus)
      if (filterFechaDesde) params.set('fecha_desde', filterFechaDesde)
      if (filterFechaHasta) params.set('fecha_hasta', filterFechaHasta)

      const res = await fetch(`/api/avance?${params.toString()}`)
      const data = await res.json()

      if (data.data) {
        setAvances(data.data)
      } else {
        toast.error(data.error || 'Error cargando avances')
      }
    } catch {
      toast.error('Error cargando avances')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterFechaDesde, filterFechaHasta])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])

  useEffect(() => {
    fetchAvances()
  }, [fetchAvances])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, filterFechaDesde, filterFechaHasta])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(avances.length / ITEMS_PER_PAGE))
  const paginatedAvances = avances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // File upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: { file: File; preview: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede el tamaño máximo de 10MB`)
        continue
      }
      const preview = URL.createObjectURL(file)
      newPreviews.push({ file, preview })
    }

    setFilePreviews((prev) => [...prev, ...newPreviews])
    // Reset the input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFilePreviews((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const uploadFiles = async (): Promise<string[]> => {
    const urls: string[] = [...formData.fotos_evidencia_urls]
    setUploadingFiles(true)

    for (const { file } of filePreviews) {
      try {
        const formDataObj = new FormData()
        formDataObj.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataObj,
        })

        const data = await res.json()
        if (res.ok && data.url) {
          urls.push(data.url)
        } else {
          toast.error(`Error subiendo ${file.name}: ${data.error}`)
        }
      } catch {
        toast.error(`Error subiendo ${file.name}`)
      }
    }

    setUploadingFiles(false)
    return urls
  }

  // Form handlers
  const handleAddOpen = () => {
    setFormData(emptyForm)
    setFilePreviews([])
    setFechaReporte(new Date())
    setShowAddDialog(true)
  }

  const handleApprovalOpen = (avance: AvanceEjecutado) => {
    setSelectedAvance(avance)
    setRejectionNotes('')
    setShowApprovalDialog(true)
  }

  const handlePhotoGallery = (photos: string[]) => {
    setGalleryPhotos(photos)
    setShowPhotoGallery(true)
  }

  const handlePhotoViewer = (url: string) => {
    setViewerPhotoUrl(url)
    setShowPhotoViewer(true)
  }

  const handleSubmit = async () => {
    if (!formData.alcance_id || formData.cantidad_reportada <= 0 || !formData.fecha_reporte) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      // Upload files first
      const photoUrls = await uploadFiles()

      const body = {
        alcance_id: formData.alcance_id,
        cantidad_reportada: formData.cantidad_reportada,
        tipo_trabajo: formData.tipo_trabajo,
        fecha_reporte: formData.fecha_reporte,
        fotos_evidencia_urls: photoUrls,
        notas: formData.notas || null,
      }

      const res = await fetch('/api/avance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Avance reportado exitosamente')
        setShowAddDialog(false)
        setFilePreviews([])
        fetchAvances()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproval = async (status: AprobacionStatus) => {
    if (!selectedAvance) return

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        status_aprobacion: status,
      }

      if (status === 'Rechazado' && rejectionNotes) {
        body.notas = rejectionNotes
      }

      const res = await fetch(`/api/avance/${selectedAvance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          status === 'Aprobado' ? 'Avance aprobado exitosamente' : 'Avance rechazado'
        )
        setShowApprovalDialog(false)
        fetchAvances()
      } else {
        toast.error(data.error || 'Error al procesar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const truncateText = (text: string | null, maxLen: number) => {
    if (!text) return '—'
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
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
              <Label className="text-xs text-muted-foreground">Status Aprobación</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
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
              <Button onClick={handleAddOpen} className="ml-auto h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Avance</span>
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
                          <Button variant="outline" size="sm" onClick={handleAddOpen}>
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
                            onClick={() => handlePhotoGallery(avance.fotos_evidencia_urls)}
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
                          {canApprove && avance.status_aprobacion === 'Pendiente' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleApprovalOpen(avance)}
                                title="Aprobar/Rechazar"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Aprobar/Rechazar</span>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleApprovalOpen(avance)}
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

      {/* Add Avance Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reportar Nuevo Avance</DialogTitle>
            <DialogDescription>
              Complete el formulario para reportar un avance ejecutado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Alcance select */}
            <div className="grid gap-2">
              <Label>Alcance Planificado *</Label>
              <Select
                value={formData.alcance_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, alcance_id: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar alcance" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {alcances
                    .filter((a) => a.status === 'Activo')
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="text-xs">
                          {a.especialidad?.nombre} – {a.sector?.nombre}/{a.subsector?.nombre} –{' '}
                          {a.descripcion.length > 40
                            ? a.descripcion.substring(0, 40) + '...'
                            : a.descripcion}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Cantidad reportada */}
              <div className="grid gap-2">
                <Label htmlFor="cantidad_reportada">Cantidad Reportada *</Label>
                <Input
                  id="cantidad_reportada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cantidad_reportada}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cantidad_reportada: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              {/* Tipo trabajo */}
              <div className="grid gap-2">
                <Label>Tipo de Trabajo *</Label>
                <RadioGroup
                  value={formData.tipo_trabajo}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      tipo_trabajo: val as TrabajoTipo,
                    }))
                  }
                  className="flex items-center gap-4 pt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Planificado" id="planificado" />
                    <Label htmlFor="planificado" className="cursor-pointer">
                      Planificado
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Imprevisto" id="imprevisto" />
                    <Label htmlFor="imprevisto" className="cursor-pointer">
                      Imprevisto
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Fecha reporte */}
            <div className="grid gap-2">
              <Label>Fecha de Reporte *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaReporte
                      ? format(fechaReporte, "dd/MM/yyyy", { locale: es })
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaReporte}
                    onSelect={(date) => {
                      if (date) {
                        setFechaReporte(date)
                        setFormData((prev) => ({
                          ...prev,
                          fecha_reporte: format(date, 'yyyy-MM-dd'),
                        }))
                        setDatePickerOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* File upload */}
            <div className="grid gap-2">
              <Label>Fotos de Evidencia</Label>
              <div className="space-y-3">
                <div
                  className="flex items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">Haga clic para subir fotos</p>
                    <p className="text-xs">JPEG, PNG, WebP, GIF (máx. 10MB c/u)</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Preview thumbnails */}
                {filePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filePreviews.map((fp, idx) => (
                      <div
                        key={idx}
                        className="relative group w-20 h-20 rounded-md overflow-hidden border"
                      >
                        <img
                          src={fp.preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(idx)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="grid gap-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notas: e.target.value }))
                }
                placeholder="Observaciones o notas adicionales"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={submitting || uploadingFiles}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || uploadingFiles}>
              {submitting || uploadingFiles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingFiles ? 'Subiendo fotos...' : 'Guardando...'}
                </>
              ) : (
                'Reportar Avance'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval / Detail Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Avance</DialogTitle>
            <DialogDescription>
              {selectedAvance?.status_aprobacion === 'Pendiente' && canApprove
                ? 'Revise y apruebe o rechace este avance.'
                : 'Detalle del avance ejecutado.'}
            </DialogDescription>
          </DialogHeader>

          {selectedAvance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Alcance:</span>
                  <p className="font-medium">{selectedAvance.alcance?.descripcion || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Especialidad:</span>
                  <p className="font-medium">
                    {selectedAvance.alcance?.especialidad?.nombre || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sector / Subsector:</span>
                  <p className="font-medium">
                    {selectedAvance.alcance?.sector?.nombre || '—'} /{' '}
                    {selectedAvance.alcance?.subsector?.nombre || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cantidad Reportada:</span>
                  <p className="font-medium">
                    {selectedAvance.cantidad_reportada.toLocaleString('es-VE')}{' '}
                    {selectedAvance.alcance?.unidad_medida || ''}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo Trabajo:</span>
                  <p>
                    <Badge
                      variant="outline"
                      className={TRABAJO_COLORS[selectedAvance.tipo_trabajo]}
                    >
                      {selectedAvance.tipo_trabajo}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Reporte:</span>
                  <p className="font-medium">
                    {format(new Date(selectedAvance.fecha_reporte), 'dd/MM/yyyy', {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>
                    <Badge
                      variant="outline"
                      className={APROBACION_COLORS[selectedAvance.status_aprobacion]}
                    >
                      {selectedAvance.status_aprobacion}
                    </Badge>
                  </p>
                </div>
                {selectedAvance.inspector && (
                  <div>
                    <span className="text-muted-foreground">Inspector:</span>
                    <p className="font-medium">{selectedAvance.inspector.nombre_completo}</p>
                  </div>
                )}
              </div>

              {selectedAvance.notas && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="mt-1 p-2 bg-muted rounded-md">{selectedAvance.notas}</p>
                </div>
              )}

              {/* Evidence photos */}
              {selectedAvance.fotos_evidencia_urls?.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Fotos de Evidencia:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAvance.fotos_evidencia_urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group w-24 h-24 rounded-md overflow-hidden border cursor-pointer"
                        onClick={() => handlePhotoViewer(url)}
                      >
                        <img
                          src={url}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval actions */}
              {canApprove && selectedAvance.status_aprobacion === 'Pendiente' && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rejection_notes">Notas de Rechazo (opcional)</Label>
                    <Textarea
                      id="rejection_notes"
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Razón del rechazo (si aplica)"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval('Rechazado')}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Rechazar
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleApproval('Aprobado')}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Aprobar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Dialog */}
      <Dialog open={showPhotoGallery} onOpenChange={setShowPhotoGallery}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Galería de Evidencias</DialogTitle>
            <DialogDescription>
              {galleryPhotos.length} foto{galleryPhotos.length !== 1 ? 's' : ''} de evidencia
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryPhotos.map((url, idx) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-md overflow-hidden border cursor-pointer"
                onClick={() => handlePhotoViewer(url)}
              >
                <img
                  src={url}
                  alt={`Evidencia ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size Photo Viewer Dialog */}
      <Dialog open={showPhotoViewer} onOpenChange={setShowPhotoViewer}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Visor de Foto</DialogTitle>
            <DialogDescription>Vista ampliada de la foto de evidencia.</DialogDescription>
          </DialogHeader>
          {viewerPhotoUrl && (
            <div className="flex items-center justify-center">
              <img
                src={viewerPhotoUrl}
                alt="Evidencia ampliada"
                className="max-h-[80vh] w-auto rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
