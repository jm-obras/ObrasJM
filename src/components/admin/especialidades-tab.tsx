'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Especialidad } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ITEMS_PER_PAGE, emptyEspecialidadForm } from './admin-types'
import type { EspecialidadFormData } from './admin-types'
import { TableSkeleton, EmptyState, PaginationControls } from './shared-ui'

export function EspecialidadesTab() {
  // ===== Data State =====
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== Pagination =====
  const [espPage, setEspPage] = useState(1)

  // ===== Especialidad Dialogs =====
  const [showAddEspDialog, setShowAddEspDialog] = useState(false)
  const [showEditEspDialog, setShowEditEspDialog] = useState(false)
  const [showDeleteEspDialog, setShowDeleteEspDialog] = useState(false)
  const [selectedEsp, setSelectedEsp] = useState<Especialidad | null>(null)
  const [espForm, setEspForm] = useState<EspecialidadFormData>(emptyEspecialidadForm)

  // ===== FETCH =====
  const fetchEspecialidades = useCallback(async () => {
    setLoadingEspecialidades(true)
    try {
      const res = await fetch('/api/especialidades')
      const data = await res.json()
      if (res.ok && data.data) {
        setEspecialidades(data.data)
      } else {
        toast.error(data.error || 'Error cargando especialidades')
      }
    } catch {
      toast.error('Error cargando especialidades')
    } finally {
      setLoadingEspecialidades(false)
    }
  }, [])

  useEffect(() => {
    fetchEspecialidades()
  }, [fetchEspecialidades])

  // ===== PAGINATION =====
  const totalEspPages = Math.max(1, Math.ceil(especialidades.length / ITEMS_PER_PAGE))
  const paginatedEsp = especialidades.slice((espPage - 1) * ITEMS_PER_PAGE, espPage * ITEMS_PER_PAGE)

  // ===== HANDLERS =====
  const handleAddEspOpen = () => { setEspForm(emptyEspecialidadForm); setShowAddEspDialog(true) }
  const handleEditEspOpen = (esp: Especialidad) => {
    setSelectedEsp(esp)
    setEspForm({ nombre: esp.nombre })
    setShowEditEspDialog(true)
  }
  const handleDeleteEspOpen = (esp: Especialidad) => { setSelectedEsp(esp); setShowDeleteEspDialog(true) }

  const handleCreateEsp = async () => {
    if (!espForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/especialidades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: espForm.nombre }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Especialidad creada exitosamente'); setShowAddEspDialog(false); fetchEspecialidades() }
      else { toast.error(data.error || 'Error al crear especialidad') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateEsp = async () => {
    if (!selectedEsp) return
    if (!espForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/especialidades/${selectedEsp.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: espForm.nombre }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Especialidad actualizada exitosamente'); setShowEditEspDialog(false); fetchEspecialidades() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteEsp = async () => {
    if (!selectedEsp) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/especialidades/${selectedEsp.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Especialidad eliminada exitosamente'); setShowDeleteEspDialog(false); fetchEspecialidades() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4" />
              Gestión de Especialidades
              <Badge variant="secondary" className="ml-2">{especialidades.length}</Badge>
            </CardTitle>
            <Button onClick={handleAddEspOpen} className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Especialidad</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEspecialidades ? (
                  <TableSkeleton cols={3} />
                ) : paginatedEsp.length === 0 ? (
                  <EmptyState icon={Wrench} message="No se encontraron especialidades" />
                ) : (
                  paginatedEsp.map((esp, idx) => (
                    <TableRow key={esp.id}>
                      <TableCell className="text-muted-foreground">
                        {(espPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{esp.nombre}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditEspOpen(esp)}>
                            <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteEspOpen(esp)}>
                            <Trash2 className="h-4 w-4" /><span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={espPage}
            totalPages={totalEspPages}
            totalItems={especialidades.length}
            onPageChange={setEspPage}
          />
        </CardContent>
      </Card>

      {/* Add Especialidad Dialog */}
      <Dialog open={showAddEspDialog} onOpenChange={setShowAddEspDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Especialidad</DialogTitle>
            <DialogDescription>Ingrese el nombre de la nueva especialidad de trabajo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="esp-nombre">Nombre *</Label>
              <Input id="esp-nombre" value={espForm.nombre} onChange={(e) => setEspForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Electricidad - Luminarias" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEspDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateEsp} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Especialidad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Especialidad Dialog */}
      <Dialog open={showEditEspDialog} onOpenChange={setShowEditEspDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Especialidad</DialogTitle>
            <DialogDescription>Modifique el nombre de la especialidad.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-esp-nombre">Nombre *</Label>
              <Input id="edit-esp-nombre" value={espForm.nombre} onChange={(e) => setEspForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEspDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateEsp} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Especialidad Dialog */}
      <AlertDialog open={showDeleteEspDialog} onOpenChange={setShowDeleteEspDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta especialidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la especialidad &ldquo;{selectedEsp?.nombre}&rdquo;.
              Si tiene registros de alcance planificado asociados, no podrá eliminarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEsp} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
