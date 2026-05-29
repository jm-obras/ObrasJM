'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Sector } from '@/lib/types'

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

import { ITEMS_PER_PAGE, emptySectorForm } from './admin-types'
import type { SectorFormData } from './admin-types'
import { TableSkeleton, EmptyState, PaginationControls } from './shared-ui'

interface SectoresTabProps {
  onSectorChange?: () => void
}

export function SectoresTab({ onSectorChange }: SectoresTabProps) {
  // ===== Data State =====
  const [sectores, setSectores] = useState<Sector[]>([])
  const [loadingSectores, setLoadingSectores] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== Pagination =====
  const [secPage, setSecPage] = useState(1)

  // ===== Sector Dialogs =====
  const [showAddSecDialog, setShowAddSecDialog] = useState(false)
  const [showEditSecDialog, setShowEditSecDialog] = useState(false)
  const [showDeleteSecDialog, setShowDeleteSecDialog] = useState(false)
  const [selectedSec, setSelectedSec] = useState<Sector | null>(null)
  const [secForm, setSecForm] = useState<SectorFormData>(emptySectorForm)

  // ===== FETCH =====
  const fetchSectores = useCallback(async () => {
    setLoadingSectores(true)
    try {
      const res = await fetch('/api/sectores')
      const data = await res.json()
      if (res.ok && data.data) {
        setSectores(data.data)
      } else {
        toast.error(data.error || 'Error cargando sectores')
      }
    } catch {
      toast.error('Error cargando sectores')
    } finally {
      setLoadingSectores(false)
    }
  }, [])

  useEffect(() => {
    fetchSectores()
  }, [fetchSectores])

  // ===== PAGINATION =====
  const totalSecPages = Math.max(1, Math.ceil(sectores.length / ITEMS_PER_PAGE))
  const paginatedSec = sectores.slice((secPage - 1) * ITEMS_PER_PAGE, secPage * ITEMS_PER_PAGE)

  // ===== HANDLERS =====
  const handleAddSecOpen = () => { setSecForm(emptySectorForm); setShowAddSecDialog(true) }
  const handleEditSecOpen = (sec: Sector) => {
    setSelectedSec(sec)
    setSecForm({ nombre: sec.nombre, codigo: sec.codigo })
    setShowEditSecDialog(true)
  }
  const handleDeleteSecOpen = (sec: Sector) => { setSelectedSec(sec); setShowDeleteSecDialog(true) }

  const handleCreateSec = async () => {
    if (!secForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!secForm.codigo.trim()) { toast.error('El código es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sectores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: secForm.nombre, codigo: secForm.codigo }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Sector creado exitosamente'); setShowAddSecDialog(false); fetchSectores(); onSectorChange?.() }
      else { toast.error(data.error || 'Error al crear sector') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateSec = async () => {
    if (!selectedSec) return
    if (!secForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!secForm.codigo.trim()) { toast.error('El código es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sectores/${selectedSec.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: secForm.nombre, codigo: secForm.codigo }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Sector actualizado exitosamente'); setShowEditSecDialog(false); fetchSectores(); onSectorChange?.() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteSec = async () => {
    if (!selectedSec) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sectores/${selectedSec.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Sector eliminado exitosamente'); setShowDeleteSecDialog(false); fetchSectores(); onSectorChange?.() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Gestión de Sectores
              <Badge variant="secondary" className="ml-2">{sectores.length}</Badge>
            </CardTitle>
            <Button onClick={handleAddSecOpen} className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Sector</span>
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSectores ? (
                  <TableSkeleton cols={3} />
                ) : paginatedSec.length === 0 ? (
                  <EmptyState icon={MapPin} message="No se encontraron sectores" />
                ) : (
                  paginatedSec.map((sec) => (
                    <TableRow key={sec.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{sec.codigo}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{sec.nombre}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSecOpen(sec)}>
                            <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSecOpen(sec)}>
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
            currentPage={secPage}
            totalPages={totalSecPages}
            totalItems={sectores.length}
            onPageChange={setSecPage}
          />
        </CardContent>
      </Card>

      {/* Add Sector Dialog */}
      <Dialog open={showAddSecDialog} onOpenChange={setShowAddSecDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Sector</DialogTitle>
            <DialogDescription>Ingrese los datos del nuevo sector del hospital.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sec-codigo">Código *</Label>
              <Input id="sec-codigo" value={secForm.codigo} onChange={(e) => setSecForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ej: TH, TC, TA" className="uppercase" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sec-nombre">Nombre *</Label>
              <Input id="sec-nombre" value={secForm.nombre} onChange={(e) => setSecForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Torre Hospitalaria" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSecDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateSec} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Sector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sector Dialog */}
      <Dialog open={showEditSecDialog} onOpenChange={setShowEditSecDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sector</DialogTitle>
            <DialogDescription>Modifique los datos del sector.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sec-codigo">Código *</Label>
              <Input id="edit-sec-codigo" value={secForm.codigo} onChange={(e) => setSecForm((p) => ({ ...p, codigo: e.target.value }))} className="uppercase" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sec-nombre">Nombre *</Label>
              <Input id="edit-sec-nombre" value={secForm.nombre} onChange={(e) => setSecForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSecDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateSec} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sector Dialog */}
      <AlertDialog open={showDeleteSecDialog} onOpenChange={setShowDeleteSecDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este sector?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el sector &ldquo;{selectedSec?.nombre}&rdquo; ({selectedSec?.codigo}).
              Si tiene subsectores asociados, deberá eliminarlos primero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSec} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
