'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'

import type { AvanceEjecutado, AprobacionStatus, AlcancePlanificado } from '@/lib/types'
import type { AvanceFormData, FilePreview } from './avance-types'
import { APROBACION_COLORS, TRABAJO_COLORS } from './avance-types'
import { AvanceFormFields } from './avance-form-fields'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/* -------------------------------------------------------------------------- */
/*  AddAvanceDialog                                                           */
/* -------------------------------------------------------------------------- */

interface AddAvanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: AvanceFormData
  setFormData: React.Dispatch<React.SetStateAction<AvanceFormData>>
  alcances: AlcancePlanificado[]
  fechaReporte: Date
  setFechaReporte: (date: Date) => void
  datePickerOpen: boolean
  setDatePickerOpen: (open: boolean) => void
  filePreviews: FilePreview[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  uploadingFiles: boolean
  submitting: boolean
  onSubmit: () => void
}

export function AddAvanceDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  alcances,
  fechaReporte,
  setFechaReporte,
  datePickerOpen,
  setDatePickerOpen,
  filePreviews,
  fileInputRef,
  handleFileSelect,
  removeFile,
  uploadingFiles,
  submitting,
  onSubmit,
}: AddAvanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Nuevo Avance</DialogTitle>
          <DialogDescription>
            Complete el formulario para reportar un avance ejecutado.
          </DialogDescription>
        </DialogHeader>
        <AvanceFormFields
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
          isEdit={false}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting || uploadingFiles}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting || uploadingFiles}>
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
  )
}

/* -------------------------------------------------------------------------- */
/*  EditAvanceDialog                                                          */
/* -------------------------------------------------------------------------- */

interface EditAvanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: AvanceFormData
  setFormData: React.Dispatch<React.SetStateAction<AvanceFormData>>
  alcances: AlcancePlanificado[]
  editFechaReporte: Date
  setEditFechaReporte: (date: Date) => void
  editDatePickerOpen: boolean
  setEditDatePickerOpen: (open: boolean) => void
  filePreviews: FilePreview[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  uploadingFiles: boolean
  submitting: boolean
  onSubmit: () => void
}

export function EditAvanceDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  alcances,
  editFechaReporte,
  setEditFechaReporte,
  editDatePickerOpen,
  setEditDatePickerOpen,
  filePreviews,
  fileInputRef,
  handleFileSelect,
  removeFile,
  uploadingFiles,
  submitting,
  onSubmit,
}: EditAvanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Avance Ejecutado</DialogTitle>
          <DialogDescription>
            Modifique los campos que desea actualizar.
          </DialogDescription>
        </DialogHeader>
        <AvanceFormFields
          formData={formData}
          setFormData={setFormData}
          alcances={alcances}
          fechaReporte={editFechaReporte}
          setFechaReporte={setEditFechaReporte}
          datePickerOpen={editDatePickerOpen}
          setDatePickerOpen={setEditDatePickerOpen}
          filePreviews={filePreviews}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          isEdit={true}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting || uploadingFiles}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting || uploadingFiles}>
            {submitting || uploadingFiles ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingFiles ? 'Subiendo fotos...' : 'Guardando...'}
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
/*  ApprovalDialog                                                            */
/* -------------------------------------------------------------------------- */

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAvance: AvanceEjecutado | null
  canApprove: boolean
  rejectionNotes: string
  setRejectionNotes: (notes: string) => void
  submitting: boolean
  onApproval: (status: AprobacionStatus) => void
  onPhotoViewer: (url: string) => void
}

export function ApprovalDialog({
  open,
  onOpenChange,
  selectedAvance,
  canApprove,
  rejectionNotes,
  setRejectionNotes,
  submitting,
  onApproval,
  onPhotoViewer,
}: ApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                      onClick={() => onPhotoViewer(url)}
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
                    onClick={() => onApproval('Rechazado')}
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
                    onClick={() => onApproval('Aprobado')}
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
  )
}

/* -------------------------------------------------------------------------- */
/*  PhotoGalleryDialog                                                        */
/* -------------------------------------------------------------------------- */

interface PhotoGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  galleryPhotos: string[]
  onPhotoViewer: (url: string) => void
}

export function PhotoGalleryDialog({
  open,
  onOpenChange,
  galleryPhotos,
  onPhotoViewer,
}: PhotoGalleryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => onPhotoViewer(url)}
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
  )
}

/* -------------------------------------------------------------------------- */
/*  PhotoViewerDialog                                                         */
/* -------------------------------------------------------------------------- */

interface PhotoViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewerPhotoUrl: string
}

export function PhotoViewerDialog({
  open,
  onOpenChange,
  viewerPhotoUrl,
}: PhotoViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  )
}
