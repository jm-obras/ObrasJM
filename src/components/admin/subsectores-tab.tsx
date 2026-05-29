'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Sector, Subsector } from '@/lib/types'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ITEMS_PER_PAGE, emptySubsectorForm } from './admin-types'
import type { SubsectorFormData } from './admin-types'
import { TableSkeleton, EmptyState, PaginationControls } from './shared-ui'

interface SubsectoresTabProps {
  sectores: Sector[]
  refreshTrigger?: number
}

export function SubsectoresTab({ sectores, refreshTrigger }: SubsectoresTabProps) {
  // ===== Data State =====
  const [subsectores, setSubsectores] = useState<Subsector[]>()
  const [loadingSubsectores, setLoadingSubsectores] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== Pagination =====
  const [subPage, setSubPage] = useState(1)

  // ===== Subsector Dialogs =====
  const [showAddSubDialog, setShowAddSubDialog] = useState(false)
  const [showEditSubDialog, setShowEditSubDialog] = useState(false)
  const [showDeleteSubDialog, setShowDeleteSubDialog] = useState(false)
  const [selectedSub, setSelectedSub] = useState<Subsector | null>(null)
  const [subForm, setSubForm] = useState<SubsectorFormData>(emptySubsectorForm)

  // ===== FETCH =====
  const fetchSubsectores = useCallback(async () => {
    setLoadingSubsectores(true)
    try {
      const res = await fetch('/api/subsectores')
      const data = await res.json()
      if (res.ok && data.data) {
        setSubsectores(data.data)
      } else {
        toast.error(data.error || 'Error cargando subsectores')
      }
    } catch {
      toast.error('Error cargando subsectores')
    } finally {
      setLoadingSubsectores(false)
    }
  }, [])

  useEffect(() => {
    fetchSubsectores()
  }, [fetchSubsectores])

  // Re-fetch when refreshTrigger changes (e.g. when a sector is modified)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchSubsectores()
    }
  }, [refreshTrigger, fetchSubsectores])

  // ===== HELPERS =====
  const getSectorNombre = (id: string) => {
    const sector = sectores.find((s) => s.id === id)
    return sector?.nombre || '—'
  }

  // ===== PAGINATION =====
  const subsectoresList = subsectores || []
  const totalSubPages = Math.max(1, Math.ceil(subsectoresList.length / ITEMS_PER_PAGE))
  const paginatedSub = subsectoresList.slice((subPage - 1) * ITEMS_PER_PAGE, subPage * ITEMS_PER_PAGE)

  // ===== HANDLERS =====
  const handleAddSubOpen = () => { setSubForm(emptySubsectorForm); setShowAddSubDialog(true) }
  const handleEditSubOpen = (sub: Subsector) => {
    setSelectedSub(sub)
    setSubForm({ nombre: sub.nombre, codigo: sub.codigo || '', sector_id: sub.sector_id })
    setShowEditSubDialog(true)
  }
  const handleDeleteSubOpen = (sub: Subsector) => { setSelectedSub(sub); setShowDeleteSubDialog(true) }

  const handleCreateSub = async () => {
    if (!subForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!subForm.sector_id) { toast.error('El sector es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/subsectores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: subForm.nombre, codigo: subForm.codigo || null, sector_id: subForm.sector_id }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Subsector creado exitosamente'); setShowAddSubDialog(false); fetchSubsectores() }
      else { toast.error(data.error || 'Error al crear subsector') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateSub = async () => {
    if (!selectedSub) return
    if (!subForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!subForm.sector_id) { toast.error('El sector es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/subsectores/${selectedSub.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: subForm.nombre, codigo: subForm.codigo || null, sector_id: subForm.sector_id }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Subsector actualizado exitosamente'); setShowEditSubDialog(false); fetchSubsectores() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteSub = async () => {
    if (!selectedSub) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/subsectores/${selectedSub.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Subsector eliminado exitosamente'); setShowDeleteSubDialog(false); fetchSubsectores() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Gestión de Subsectores
              <Badge variant="secondary" className="ml-2">{subsectoresList.length}</Badge>
            </CardTitle>
            <Button onClick={handleAddSubOpen} className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Subsector</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubsectores ? (
                  <TableSkeleton cols={4} />
                ) : paginatedSub.length === 0 ? (
                  <EmptyState icon={Layers} message="No se encontraron subsectores" />
                ) : (
                  paginatedSub.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{sub.codigo || '—'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{sub.nombre}</TableCell>
                      <TableCell>{getSectorNombre(sub.sector_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSubOpen(sub)}>
                            <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSubOpen(sub)}>
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
            currentPage={subPage}
            totalPages={totalSubPages}
            totalItems={subsectoresList.length}
            onPageChange={setSubPage}
          />
        </CardContent>
      </Card>

      {/* Add Subsector Dialog */}
      <Dialog open={showAddSubDialog} onOpenChange={setShowAddSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Subsector</DialogTitle>
            <DialogDescription>Ingrese los datos del nuevo subsector.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sub-sector">Sector *</Label>
              <Select value={subForm.sector_id} onValueChange={(val) => setSubForm((p) => ({ ...p, sector_id: val }))}>
                <SelectTrigger id="sub-sector"><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (<SelectItem key={s.id} value={s.id}>{s.codigo} - {s.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sub-codigo">Código</Label>
                <Input id="sub-codigo" value={subForm.codigo} onChange={(e) => setSubForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ej: TH-P1" className="uppercase" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub-nombre">Nombre *</Label>
                <Input id="sub-nombre" value={subForm.nombre} onChange={(e) => setSubForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Piso 1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateSub} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Subsector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subsector Dialog */}
      <Dialog open={showEditSubDialog} onOpenChange={setShowEditSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Subsector</DialogTitle>
            <DialogDescription>Modifique los datos del subsector.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sub-sector">Sector *</Label>
              <Select value={subForm.sector_id} onValueChange={(val) => setSubForm((p) => ({ ...p, sector_id: val }))}>
                <SelectTrigger id="edit-sub-sector"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (<SelectItem key={s.id} value={s.id}>{s.codigo} - {s.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sub-codigo">Código</Label>
                <Input id="edit-sub-codigo" value={subForm.codigo} onChange={(e) => setSubForm((p) => ({ ...p, codigo: e.target.value }))} className="uppercase" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sub-nombre">Nombre *</Label>
                <Input id="edit-sub-nombre" value={subForm.nombre} onChange={(e) => setSubForm((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSubDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateSub} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subsector Dialog */}
      <AlertDialog open={showDeleteSubDialog} onOpenChange={setShowDeleteSubDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este subsector?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el subsector &ldquo;{selectedSub?.nombre}&rdquo; ({selectedSub?.codigo}).
              Si tiene registros de alcance planificado asociados, no podrá eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSub} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
