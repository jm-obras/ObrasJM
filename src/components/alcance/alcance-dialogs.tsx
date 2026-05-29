'use client'

import { Loader2 } from 'lucide-react'

import type { AlcancePlanificado, Especialidad, Sector, Subsector, UnidadEjecutora } from '@/lib/types'

import { Button } from '@/components/ui/button'
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

import type { AlcanceFormData } from './alcance-types'
import { AlcanceForm } from './alcance-form'

/* -------------------------------------------------------------------------- */
/*  AddAlcanceDialog                                                          */
/* -------------------------------------------------------------------------- */

interface AddAlcanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: AlcanceFormData
  setFormData: React.Dispatch<React.SetStateAction<AlcanceFormData>>
  especialidades: Especialidad[]
  sectores: Sector[]
  subsectores: Subsector[]
  unidadesEjecutoras: UnidadEjecutora[]
  formSectorId: string
  setFormSectorId: (value: string) => void
  submitting: boolean
  onSubmit: () => void
}

export function AddAlcanceDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  especialidades,
  sectores,
  subsectores,
  unidadesEjecutoras,
  formSectorId,
  setFormSectorId,
  submitting,
  onSubmit,
}: AddAlcanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Alcance Planificado</DialogTitle>
          <DialogDescription>
            Complete el formulario para crear un nuevo alcance planificado.
          </DialogDescription>
        </DialogHeader>
        <AlcanceForm
          formData={formData}
          setFormData={setFormData}
          especialidades={especialidades}
          sectores={sectores}
          subsectores={subsectores}
          unidadesEjecutoras={unidadesEjecutoras}
          formSectorId={formSectorId}
          setFormSectorId={setFormSectorId}
          isEdit={false}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
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
  )
}

/* -------------------------------------------------------------------------- */
/*  EditAlcanceDialog                                                         */
/* -------------------------------------------------------------------------- */

interface EditAlcanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: AlcanceFormData
  setFormData: React.Dispatch<React.SetStateAction<AlcanceFormData>>
  especialidades: Especialidad[]
  sectores: Sector[]
  subsectores: Subsector[]
  unidadesEjecutoras: UnidadEjecutora[]
  formSectorId: string
  setFormSectorId: (value: string) => void
  submitting: boolean
  onSubmit: () => void
}

export function EditAlcanceDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  especialidades,
  sectores,
  subsectores,
  unidadesEjecutoras,
  formSectorId,
  setFormSectorId,
  submitting,
  onSubmit,
}: EditAlcanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Alcance Planificado</DialogTitle>
          <DialogDescription>
            Modifique los campos que desea actualizar.
          </DialogDescription>
        </DialogHeader>
        <AlcanceForm
          formData={formData}
          setFormData={setFormData}
          especialidades={especialidades}
          sectores={sectores}
          subsectores={subsectores}
          unidadesEjecutoras={unidadesEjecutoras}
          formSectorId={formSectorId}
          setFormSectorId={setFormSectorId}
          isEdit={true}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
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
  )
}

/* -------------------------------------------------------------------------- */
/*  DeleteAlcanceDialog                                                       */
/* -------------------------------------------------------------------------- */

interface DeleteAlcanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAlcance: AlcancePlanificado | null
  submitting: boolean
  onDelete: () => void
}

export function DeleteAlcanceDialog({
  open,
  onOpenChange,
  selectedAlcance,
  submitting,
  onDelete,
}: DeleteAlcanceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onDelete}
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
  )
}
