import { format } from 'date-fns'
import type { AprobacionStatus, TrabajoTipo } from '@/lib/types'

export const ITEMS_PER_PAGE = 10

export const APROBACION_COLORS: Record<AprobacionStatus, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  Aprobado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rechazado: 'bg-red-100 text-red-800 border-red-200',
}

export const TRABAJO_COLORS: Record<TrabajoTipo, string> = {
  Planificado: 'bg-sky-100 text-sky-800 border-sky-200',
  Imprevisto: 'bg-orange-100 text-orange-800 border-orange-200',
}

export interface AvanceFormData {
  alcance_id: string
  cantidad_reportada: number
  tipo_trabajo: TrabajoTipo
  fecha_reporte: string
  fotos_evidencia_urls: string[]
  notas: string
}

export const emptyForm: AvanceFormData = {
  alcance_id: '',
  cantidad_reportada: 0,
  tipo_trabajo: 'Planificado',
  fecha_reporte: format(new Date(), 'yyyy-MM-dd'),
  fotos_evidencia_urls: [],
  notas: '',
}

export interface FilePreview {
  file: File
  preview: string
}
