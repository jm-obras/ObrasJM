'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import type {
  AlcancePlanificado,
  Especialidad,
  Sector,
  Subsector,
  UnidadEjecutora,
  Profile,
} from '@/lib/types'

import { AlcanceFilters } from './alcance-filters'
import { AlcanceTable } from './alcance-table'
import { AddAlcanceDialog, EditAlcanceDialog, DeleteAlcanceDialog } from './alcance-dialogs'
import { emptyForm, ITEMS_PER_PAGE } from './alcance-types'
import type { AlcanceFormData } from './alcance-types'

interface AlcanceViewProps {
  profile: Profile
}

export function AlcanceView({ profile }: AlcanceViewProps) {
  const isAdmin = profile.rol === 'webmaster'
  const isInspector = profile.rol === 'inspector'
  const isVisitante = profile.rol === 'visitante'
  const canEdit = !isVisitante && (isAdmin || isInspector)

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

  // Form sector selector
  const [formSectorId, setFormSectorId] = useState<string>('')

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

  // Dialog handlers
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

  // CRUD operations
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

  return (
    <div className="space-y-4">
      <AlcanceFilters
        filterSector={filterSector}
        setFilterSector={setFilterSector}
        filterEspecialidad={filterEspecialidad}
        setFilterEspecialidad={setFilterEspecialidad}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        sectores={sectores}
        especialidades={especialidades}
        canEdit={canEdit}
        onAddClick={handleAddOpen}
      />

      <AlcanceTable
        alcances={alcances}
        loading={loading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        canEdit={canEdit}
        isAdmin={isAdmin}
        onEdit={handleEditOpen}
        onDelete={handleDeleteOpen}
        onAddClick={handleAddOpen}
      />

      <AddAlcanceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={formData}
        setFormData={setFormData}
        especialidades={especialidades}
        sectores={sectores}
        subsectores={subsectores}
        unidadesEjecutoras={unidadesEjecutoras}
        formSectorId={formSectorId}
        setFormSectorId={setFormSectorId}
        submitting={submitting}
        onSubmit={() => handleSubmit(false)}
      />

      <EditAlcanceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        formData={formData}
        setFormData={setFormData}
        especialidades={especialidades}
        sectores={sectores}
        subsectores={subsectores}
        unidadesEjecutoras={unidadesEjecutoras}
        formSectorId={formSectorId}
        setFormSectorId={setFormSectorId}
        submitting={submitting}
        onSubmit={() => handleSubmit(true)}
      />

      <DeleteAlcanceDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedAlcance={selectedAlcance}
        submitting={submitting}
        onDelete={handleDelete}
      />
    </div>
  )
}
