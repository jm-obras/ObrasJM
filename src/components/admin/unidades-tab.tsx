'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'

import type { UnidadEjecutora } from '@/lib/types'

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

import { emptyUnidadForm } from './admin-types'
import type { UnidadFormData } from './admin-types'
import { TableSkeleton, EmptyState } from './shared-ui'

export function UnidadesTab() {
  // ===== Data State =====
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutora[]>([])
  const [loadingUnidades, setLoadingUnidades] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== Unidad Dialogs =====
  const [showAddUnidadDialog, setShowAddUnidadDialog] = useState(false)
  const [showEditUnidadDialog, setShowEditUnidadDialog] = useState(false)
  const [showDeleteUnidadDialog, setShowDeleteUnidadDialog] = useState(false)
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadEjecutora | null>(null)
  const [unidadForm, setUnidadForm] = useState<UnidadFormData>(emptyUnidadForm)

  // ===== FETCH =====
  const fetchUnidades = useCallback(async () => {
    setLoadingUnidades(true)
    try {
      const res = await fetch('/api/unidades-ejecutoras')
      const data = await res.json()
      if (res.ok && data.data) {
        setUnidadesEjecutoras(data.data)
      } else {
        toast.error(data.error || 'Error cargando unidades ejecutoras')
      }
    } catch {
      toast.error('Error cargando unidades ejecutoras')
    } finally {
      setLoadingUnidades(false)
    }
  }, [])

  useEffect(() => {
    fetchUnidades()
  }, [fetchUnidades])

  // ===== HANDLERS =====
  const handleAddUnidadOpen = () => { setUnidadForm(emptyUnidadForm); setShowAddUnidadDialog(true) }
  const handleEditUnidadOpen = (unidad: UnidadEjecutora) => {
    setSelectedUnidad(unidad)
    setUnidadForm({ nombre: unidad.nombre, rif: unidad.rif || '', contacto: unidad.contacto || '', logo_url: unidad.logo_url || '' })
    setShowEditUnidadDialog(true)
  }
  const handleDeleteUnidadOpen = (unidad: UnidadEjecutora) => { setSelectedUnidad(unidad); setShowDeleteUnidadDialog(true) }

  const handleCreateUnidad = async () => {
    if (!unidadForm.nombre) { toast.error('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/unidades-ejecutoras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: unidadForm.nombre, rif: unidadForm.rif || null, contacto: unidadForm.contacto || null, logo_url: unidadForm.logo_url || null }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Unidad ejecutora creada exitosamente'); setShowAddUnidadDialog(false); fetchUnidades() }
      else { toast.error(data.error || 'Error al crear unidad ejecutora') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateUnidad = async () => {
    if (!selectedUnidad) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/unidades-ejecutoras/${selectedUnidad.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: unidadForm.nombre, rif: unidadForm.rif || null, contacto: unidadForm.contacto || null, logo_url: unidadForm.logo_url || null }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Unidad ejecutora actualizada exitosamente'); setShowEditUnidadDialog(false); fetchUnidades() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteUnidad = async () => {
    if (!selectedUnidad) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/unidades-ejecutoras/${selectedUnidad.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Unidad ejecutora eliminada exitosamente'); setShowDeleteUnidadDialog(false); fetchUnidades() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Gestión de Unidades Ejecutoras
            </CardTitle>
            <Button onClick={handleAddUnidadOpen} className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Unidad</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUnidades ? (
                  <TableSkeleton cols={5} />
                ) : unidadesEjecutoras.length === 0 ? (
                  <EmptyState icon={Building2} message="No se encontraron unidades ejecutoras" />
                ) : (
                  unidadesEjecutoras.map((unidad) => (
                    <TableRow key={unidad.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {unidad.logo_url ? (
                            <div className="h-8 w-8 rounded-md overflow-hidden bg-muted/30 border flex items-center justify-center flex-shrink-0 p-0.5">
                              <img src={unidad.logo_url} alt="" className="h-full w-full object-contain" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-muted/50 border flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{unidad.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>{unidad.rif || '—'}</TableCell>
                      <TableCell>{unidad.contacto || '—'}</TableCell>
                      <TableCell>
                        {unidad.activa ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Activa</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUnidadOpen(unidad)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteUnidadOpen(unidad)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Unidad Dialog */}
      <Dialog open={showAddUnidadDialog} onOpenChange={setShowAddUnidadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Unidad Ejecutora</DialogTitle>
            <DialogDescription>Complete el formulario para registrar una nueva unidad ejecutora.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="unidad-nombre">Nombre *</Label>
              <Input id="unidad-nombre" value={unidadForm.nombre} onChange={(e) => setUnidadForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la unidad" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unidad-rif">RIF</Label>
                <Input id="unidad-rif" value={unidadForm.rif} onChange={(e) => setUnidadForm((p) => ({ ...p, rif: e.target.value }))} placeholder="J-00000000-0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidad-contacto">Contacto</Label>
                <Input id="unidad-contacto" value={unidadForm.contacto} onChange={(e) => setUnidadForm((p) => ({ ...p, contacto: e.target.value }))} placeholder="Nombre o teléfono" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unidad-logo">URL del Logo</Label>
              <Input id="unidad-logo" value={unidadForm.logo_url} onChange={(e) => setUnidadForm((p) => ({ ...p, logo_url: e.target.value }))} placeholder="/images/logos-ue/mi-empresa.png" />
              <p className="text-[11px] text-muted-foreground">Ruta de la imagen del logotipo (ej: /images/logos-ue/empresa.png)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUnidadDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateUnidad} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Unidad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unidad Dialog */}
      <Dialog open={showEditUnidadDialog} onOpenChange={setShowEditUnidadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Unidad Ejecutora</DialogTitle>
            <DialogDescription>Modifique los campos que desea actualizar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-unidad-nombre">Nombre *</Label>
              <Input id="edit-unidad-nombre" value={unidadForm.nombre} onChange={(e) => setUnidadForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad-rif">RIF</Label>
                <Input id="edit-unidad-rif" value={unidadForm.rif} onChange={(e) => setUnidadForm((p) => ({ ...p, rif: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad-contacto">Contacto</Label>
                <Input id="edit-unidad-contacto" value={unidadForm.contacto} onChange={(e) => setUnidadForm((p) => ({ ...p, contacto: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unidad-logo">URL del Logo</Label>
              <Input id="edit-unidad-logo" value={unidadForm.logo_url} onChange={(e) => setUnidadForm((p) => ({ ...p, logo_url: e.target.value }))} placeholder="/images/logos-ue/mi-empresa.png" />
              <p className="text-[11px] text-muted-foreground">Ruta de la imagen del logotipo (ej: /images/logos-ue/empresa.png)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUnidadDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateUnidad} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unidad Dialog */}
      <AlertDialog open={showDeleteUnidadDialog} onOpenChange={setShowDeleteUnidadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta unidad ejecutora?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la unidad ejecutora &ldquo;{selectedUnidad?.nombre}&rdquo;.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnidad} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
