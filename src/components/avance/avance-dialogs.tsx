'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Circle,
  ShieldCheck,
  UserCheck,
  Building2,
} from 'lucide-react'

import type { AvanceEjecutado, AprobacionStatus, AlcancePlanificado, UserRol } from '@/lib/types'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/* -------------------------------------------------------------------------- */
/*  Step Indicator for 3-level approval                                       */
/* -------------------------------------------------------------------------- */

interface ApprovalStep {
  level: 'residente' | 'inspector' | 'directivo'
  label: string
  status: AprobacionStatus
  approvedBy: string | null
  canApproveThisLevel: boolean
}

function ApprovalStepIndicator({ steps }: { steps: ApprovalStep[] }) {
  const statusIcon = (status: AprobacionStatus) => {
    switch (status) {
      case 'Aprobado':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case 'Rechazado':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const levelIcon = (level: 'residente' | 'inspector' | 'directivo') => {
    switch (level) {
      case 'residente':
        return <UserCheck className="h-4 w-4" />
      case 'inspector':
        return <ShieldCheck className="h-4 w-4" />
      case 'directivo':
        return <Building2 className="h-4 w-4" />
    }
  }

  const statusColor = (status: AprobacionStatus) => {
    switch (status) {
      case 'Aprobado':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'Rechazado':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-muted-foreground bg-muted/50 border-muted'
    }
  }

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={step.level} className="relative">
          {/* Connector line */}
          {idx > 0 && (
            <div className="absolute left-[11px] -top-3 w-0.5 h-3 bg-muted-foreground/20" />
          )}
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${statusColor(step.status)} ${step.canApproveThisLevel && step.status === 'Pendiente' ? 'ring-2 ring-primary/30' : ''}`}>
            <div className="mt-0.5">
              {statusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {levelIcon(step.level)}
                <span className="font-medium text-sm">{step.label}</span>
              </div>
              {step.approvedBy && (
                <p className="text-xs mt-0.5 opacity-80">
                  {step.status === 'Rechazado' ? 'Rechazado' : 'Aprobado'} por: {step.approvedBy}
                </p>
              )}
              {step.canApproveThisLevel && step.status === 'Pendiente' && (
                <p className="text-xs mt-0.5 font-medium text-primary">
                  Pendiente su aprobación
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {step.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

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
/*  ApprovalDialog - 3-level approval with step indicator                     */
/* -------------------------------------------------------------------------- */

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAvance: AvanceEjecutado | null
  canApprove: boolean
  userRole: UserRol
  rejectionNotes: string
  setRejectionNotes: (notes: string) => void
  submitting: boolean
  onApproval: (status: AprobacionStatus, level?: 'residente' | 'inspector' | 'directivo') => void
  onPhotoViewer: (url: string) => void
}

export function ApprovalDialog({
  open,
  onOpenChange,
  selectedAvance,
  canApprove,
  userRole,
  rejectionNotes,
  setRejectionNotes,
  submitting,
  onApproval,
  onPhotoViewer,
}: ApprovalDialogProps) {
  const isAdmin = userRole === 'administrador'

  // Determine which level this user can approve
  const getUserApprovalLevel = (): 'residente' | 'inspector' | 'directivo' | null => {
    switch (userRole) {
      case 'ingeniera_residente': return 'residente'
      case 'inspector': return 'inspector'
      case 'directivo_hospital': return 'directivo'
      case 'administrador': return null // admin can approve any
      default: return null
    }
  }

  const userLevel = getUserApprovalLevel()

  // Build the 3-step data
  const getApprovalSteps = (): ApprovalStep[] => {
    if (!selectedAvance) return []
    return [
      {
        level: 'residente',
        label: 'Ing. Residente',
        status: selectedAvance.aprobacion_residente,
        approvedBy: selectedAvance.residente?.nombre_completo || null,
        canApproveThisLevel: canApprove && (userLevel === 'residente' || isAdmin) && selectedAvance.aprobacion_residente === 'Pendiente',
      },
      {
        level: 'inspector',
        label: 'Inspector MPPOP',
        status: selectedAvance.aprobacion_inspector,
        approvedBy: selectedAvance.inspector?.nombre_completo || null,
        canApproveThisLevel: canApprove && (userLevel === 'inspector' || isAdmin) && selectedAvance.aprobacion_inspector === 'Pendiente' && selectedAvance.aprobacion_residente === 'Aprobado',
      },
      {
        level: 'directivo',
        label: 'Directivo Hospital',
        status: selectedAvance.aprobacion_directivo,
        approvedBy: selectedAvance.directivo?.nombre_completo || null,
        canApproveThisLevel: canApprove && (userLevel === 'directivo' || isAdmin) && selectedAvance.aprobacion_directivo === 'Pendiente' && selectedAvance.aprobacion_inspector === 'Aprobado',
      },
    ]
  }

  const steps = getApprovalSteps()

  // Can the current user approve at any level?
  const canApproveAnyLevel = steps.some(s => s.canApproveThisLevel)

  // Determine the approval level for the current user
  const getActiveApprovalLevel = (): 'residente' | 'inspector' | 'directivo' | null => {
    // For non-admin, their assigned level
    if (userLevel) return userLevel
    // For admin, find the first pending level
    const pendingStep = steps.find(s => s.status === 'Pendiente')
    return pendingStep?.level || null
  }

  const activeLevel = getActiveApprovalLevel()

  // Level names for display
  const levelNames: Record<string, string> = {
    residente: 'Ing. Residente',
    inspector: 'Inspector MPPOP',
    directivo: 'Directivo Hospital',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Avance</DialogTitle>
          <DialogDescription>
            {canApproveAnyLevel
              ? 'Revise y apruebe o rechace este avance.'
              : 'Detalle del avance ejecutado.'}
          </DialogDescription>
        </DialogHeader>

        {selectedAvance && (
          <div className="space-y-5">
            {/* Detail info */}
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
                <span className="text-muted-foreground">Status General:</span>
                <p>
                  <Badge
                    variant="outline"
                    className={APROBACION_COLORS[selectedAvance.status_aprobacion]}
                  >
                    {selectedAvance.status_aprobacion}
                  </Badge>
                </p>
              </div>
            </div>

            {selectedAvance.notas && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notas:</span>
                <p className="mt-1 p-2 bg-muted rounded-md">{selectedAvance.notas}</p>
              </div>
            )}

            {/* 3-Level Approval Step Indicator */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Cadena de Aprobación
              </h4>
              <ApprovalStepIndicator steps={steps} />
            </div>

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

            {/* Approval actions - only show if user can approve at some level */}
            {canApproveAnyLevel && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">
                    Su aprobación como {activeLevel ? levelNames[activeLevel] : 'Administrador'}
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rejection_notes" className="text-xs text-muted-foreground">
                    Notas de Rechazo (opcional)
                  </Label>
                  <Textarea
                    id="rejection_notes"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Razón del rechazo (si aplica)"
                    rows={2}
                  />
                </div>

                {/* Admin multi-level approval buttons */}
                {isAdmin && selectedAvance.status_aprobacion !== 'Aprobado' && selectedAvance.status_aprobacion !== 'Rechazado' && (
                  <div className="space-y-2">
                    {/* If admin, show approval buttons for each pending level */}
                    {steps.filter(s => s.status === 'Pendiente').map((step) => (
                      <div key={step.level} className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-muted-foreground">{step.label}:</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onApproval('Rechazado', step.level)}
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="mr-1 h-3 w-3" />
                                )}
                                Rechazar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rechazar a nivel {step.label}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => onApproval('Aprobado', step.level)}
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                )}
                                Aprobar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Aprobar a nivel {step.label}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                )}

                {/* Non-admin: single level approval */}
                {!isAdmin && activeLevel && (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => onApproval('Rechazado', activeLevel)}
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
                      onClick={() => onApproval('Aprobado', activeLevel)}
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
                )}
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
