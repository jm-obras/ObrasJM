import type { AlcanceStatus } from '@/lib/types'

export const ITEMS_PER_PAGE = 10

export const STATUS_COLORS: Record<AlcanceStatus, string> = {
  Activo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Completado: 'bg-sky-100 text-sky-800 border-sky-200',
  Suspendido: 'bg-red-100 text-red-800 border-red-200',
}

export interface AlcanceFormData {
  especialidad_id: string
  subsector_id: string
  descripcion: string
  peso_relativo: number
  unidad_medida: string
  cantidad_planificada: number
  unidad_ejecutora_id: string
  status: AlcanceStatus
}

export const emptyForm: AlcanceFormData = {
  especialidad_id: '',
  subsector_id: '',
  descripcion: '',
  peso_relativo: 0,
  unidad_medida: '',
  cantidad_planificada: 0,
  unidad_ejecutora_id: '',
  status: 'Activo',
}
