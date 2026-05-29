import type { Profile, UserRol } from '@/lib/types'

// ===== CONSTANTS =====
export const ITEMS_PER_PAGE = 10

export const ROL_COLORS: Record<UserRol, string> = {
  administrador: 'bg-purple-100 text-purple-800 border-purple-200',
  contratista: 'bg-sky-100 text-sky-800 border-sky-200',
  inspector: 'bg-amber-100 text-amber-800 border-amber-200',
  ingeniera_residente: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  directivo_hospital: 'bg-rose-100 text-rose-800 border-rose-200',
  ingenieria_hospital: 'bg-orange-100 text-orange-800 border-orange-200',
}

export const ROL_LABELS: Record<UserRol, string> = {
  administrador: 'Administrador',
  contratista: 'Contratista',
  inspector: 'Inspector',
  ingeniera_residente: 'Ing. Residente',
  directivo_hospital: 'Directivo Hospital',
  ingenieria_hospital: 'Ing. Hospital',
}

// ===== INTERFACES =====
export interface UserWithProfile {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  profile: Profile | null
}

export interface UserFormData {
  email: string
  password: string
  nombre_completo: string
  rol: UserRol
  unidad_ejecutora_id: string
  telefono: string
  ente_pertenece: string
}

export interface EditUserFormData {
  nombre_completo: string
  rol: UserRol
  unidad_ejecutora_id: string
  telefono: string
  ente_pertenece: string
  activo: boolean
}

export interface UnidadFormData {
  nombre: string
  rif: string
  contacto: string
}

export interface EspecialidadFormData {
  nombre: string
}

export interface SectorFormData {
  nombre: string
  codigo: string
}

export interface SubsectorFormData {
  nombre: string
  codigo: string
  sector_id: string
}

// ===== FORM DEFAULTS =====
export const emptyUserForm: UserFormData = {
  email: '',
  password: '',
  nombre_completo: '',
  rol: 'contratista',
  unidad_ejecutora_id: '',
  telefono: '',
  ente_pertenece: '',
}

export const emptyUnidadForm: UnidadFormData = {
  nombre: '',
  rif: '',
  contacto: '',
}

export const emptyEspecialidadForm: EspecialidadFormData = {
  nombre: '',
}

export const emptySectorForm: SectorFormData = {
  nombre: '',
  codigo: '',
}

export const emptySubsectorForm: SubsectorFormData = {
  nombre: '',
  codigo: '',
  sector_id: '',
}
