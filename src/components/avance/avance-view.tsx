'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

import type {
  AvanceEjecutado,
  AlcancePlanificado,
  AprobacionStatus,
  UserRol,
  Especialidad,
  Sector,
  Subsector,
  UnidadEjecutora,
  Profile,
} from '@/lib/types'
import { emptyForm, ITEMS_PER_PAGE, type AvanceFormData, type FilePreview } from './avance-types'
import { AvanceFilters } from './avance-filters'
import { AvanceTable } from './avance-table'
import {
  AddAvanceDialog,
  EditAvanceDialog,
  ApprovalDialog,
  PhotoGalleryDialog,
  PhotoViewerDialog,
} from './avance-dialogs'

/** Which approval level each role can approve (admin can approve all) */
const APPROVAL_LEVEL_BY_ROLE: Record<UserRol, 'residente' | 'inspector' | 'directivo' | null> = {
  webmaster: null, // null = can approve any level
  ingeniera_residente: 'residente',
  inspector: 'inspector',
  directivo_hospital: 'directivo',
  contratista: null,
  ingenieria_hospital: null,
  visitante: null,
}

interface AvanceViewProps {
  profile: Profile
}

export function AvanceView({ profile }: AvanceViewProps) {
  const isAdmin = profile.rol === 'webmaster'
  const isInspector = profile.rol === 'inspector'
  const isContratista = profile.rol === 'contratista'
  const isResidente = profile.rol === 'ingeniera_residente'
  const isDirectivo = profile.rol === 'directivo_hospital'
  const isVisitante = profile.rol === 'visitante'

  const canCreate = !isVisitante && (isAdmin || isContratista || isInspector || isResidente)
  const canEdit = !isVisitante && (isAdmin || isInspector || isContratista || isResidente)
  const canApprove = !isVisitante && (isAdmin || isResidente || isInspector || isDirectivo)

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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [selectedAvance, setSelectedAvance] = useState<AvanceEjecutado | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const [viewerPhotoUrl, setViewerPhotoUrl] = useState<string>('')
  const [formData, setFormData] = useState<AvanceFormData>(emptyForm)
  const [rejectionNotes, setRejectionNotes] = useState('')

  // Add dialog date picker state
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [fechaReporte, setFechaReporte] = useState<Date>(new Date())

  // Edit dialog date picker state
  const [editDatePickerOpen, setEditDatePickerOpen] = useState(false)
  const [editFechaReporte, setEditFechaReporte] = useState<Date>(new Date())

  // File upload
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // File upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: FilePreview[] = []
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

  const handleEditOpen = (avance: AvanceEjecutado) => {
    setSelectedAvance(avance)
    setFormData({
      alcance_id: avance.alcance_id,
      cantidad_reportada: avance.cantidad_reportada,
      tipo_trabajo: avance.tipo_trabajo,
      fecha_reporte: avance.fecha_reporte,
      fotos_evidencia_urls: avance.fotos_evidencia_urls || [],
      notas: avance.notas || '',
    })
    setFilePreviews([])
    setEditFechaReporte(new Date(avance.fecha_reporte))
    setShowEditDialog(true)
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

  /**
   * 3-level approval handler.
   * Determines which approval field to set based on the user's role.
   */
  const handleApproval = async (status: AprobacionStatus, level?: 'residente' | 'inspector' | 'directivo') => {
    if (!selectedAvance) return

    // Determine the approval level
    let approvalLevel = level
    if (!approvalLevel) {
      const roleLevel = APPROVAL_LEVEL_BY_ROLE[profile.rol]
      if (roleLevel) {
        approvalLevel = roleLevel
      } else if (isAdmin) {
        // Webmaster approving without specifying level - find the next pending level
        if (selectedAvance.aprobacion_residente === 'Pendiente') {
          approvalLevel = 'residente'
        } else if (selectedAvance.aprobacion_inspector === 'Pendiente') {
          approvalLevel = 'inspector'
        } else if (selectedAvance.aprobacion_directivo === 'Pendiente') {
          approvalLevel = 'directivo'
        }
      }
    }

    if (!approvalLevel) {
      toast.error('No tiene permisos para aprobar este avance')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {}

      if (approvalLevel === 'residente') {
        body.aprobacion_residente = status
      } else if (approvalLevel === 'inspector') {
        body.aprobacion_inspector = status
      } else if (approvalLevel === 'directivo') {
        body.aprobacion_directivo = status
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
        const levelNames = { residente: 'Ing. Residente', inspector: 'Inspector MPPOP', directivo: 'Directivo Hospital' }
        const levelName = levelNames[approvalLevel]
        toast.success(
          status === 'Aprobado'
            ? `Aprobado por ${levelName} exitosamente`
            : `Rechazado por ${levelName}`
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

  const handleEditSubmit = async () => {
    if (!selectedAvance) return
    if (!formData.alcance_id || formData.cantidad_reportada <= 0 || !formData.fecha_reporte) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const photoUrls = await uploadFiles()

      const body = {
        alcance_id: formData.alcance_id,
        cantidad_reportada: formData.cantidad_reportada,
        tipo_trabajo: formData.tipo_trabajo,
        fecha_reporte: formData.fecha_reporte,
        fotos_evidencia_urls: [...formData.fotos_evidencia_urls, ...photoUrls],
        notas: formData.notas || null,
      }

      const res = await fetch(`/api/avance/${selectedAvance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Avance actualizado exitosamente')
        setShowEditDialog(false)
        setFilePreviews([])
        fetchAvances()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <AvanceFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterFechaDesde={filterFechaDesde}
        setFilterFechaDesde={setFilterFechaDesde}
        filterFechaHasta={filterFechaHasta}
        setFilterFechaHasta={setFilterFechaHasta}
        canCreate={canCreate}
        onAddClick={handleAddOpen}
      />

      <AvanceTable
        avances={avances}
        loading={loading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        canEdit={canEdit}
        canApprove={canApprove}
        canCreate={canCreate}
        userRole={profile.rol}
        onEdit={handleEditOpen}
        onApproval={handleApprovalOpen}
        onPhotoGallery={handlePhotoGallery}
        onAddClick={handleAddOpen}
      />

      <AddAvanceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={formData}
        setFormData={setFormData}
        alcances={alcances}
        fechaReporte={fechaReporte}
        setFechaReporte={setFechaReporte}
        datePickerOpen={datePickerOpen}
        setDatePickerOpen={setDatePickerOpen}
        filePreviews={filePreviews}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        removeFile={removeFile}
        uploadingFiles={uploadingFiles}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <EditAvanceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        formData={formData}
        setFormData={setFormData}
        alcances={alcances}
        editFechaReporte={editFechaReporte}
        setEditFechaReporte={setEditFechaReporte}
        editDatePickerOpen={editDatePickerOpen}
        setEditDatePickerOpen={setEditDatePickerOpen}
        filePreviews={filePreviews}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        removeFile={removeFile}
        uploadingFiles={uploadingFiles}
        submitting={submitting}
        onSubmit={handleEditSubmit}
      />

      <ApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        selectedAvance={selectedAvance}
        canApprove={canApprove}
        userRole={profile.rol}
        rejectionNotes={rejectionNotes}
        setRejectionNotes={setRejectionNotes}
        submitting={submitting}
        onApproval={handleApproval}
        onPhotoViewer={handlePhotoViewer}
      />

      <PhotoGalleryDialog
        open={showPhotoGallery}
        onOpenChange={setShowPhotoGallery}
        galleryPhotos={galleryPhotos}
        onPhotoViewer={handlePhotoViewer}
      />

      <PhotoViewerDialog
        open={showPhotoViewer}
        onOpenChange={setShowPhotoViewer}
        viewerPhotoUrl={viewerPhotoUrl}
      />
    </div>
  )
}
