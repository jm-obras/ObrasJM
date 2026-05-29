export type UserRol = 'webmaster' | 'contratista' | 'inspector' | 'ingeniera_residente' | 'directivo_hospital' | 'ingenieria_hospital' | 'visitante'
export type TrabajoTipo = 'Planificado' | 'Imprevisto'
export type AprobacionStatus = 'Pendiente' | 'Aprobado' | 'Rechazado'
export type AlcanceStatus = 'Activo' | 'Completado' | 'Suspendido'

export interface Profile {
  id: string
  nombre_completo: string
  rol: UserRol
  unidad_ejecutora_id: string | null
  telefono: string | null
  ente_pertenece: string | null
  debe_cambiar_password: boolean
  activo: boolean
  created_at: string
  updated_at: string
}

export interface UnidadEjecutora {
  id: string
  nombre: string
  rif: string | null
  contacto: string | null
  logo_url: string | null
  activa: boolean
  created_at: string
}

export interface Especialidad {
  id: string
  nombre: string
  created_at: string
}

export interface Sector {
  id: string
  nombre: string
  codigo: string
  created_at: string
}

export interface Subsector {
  id: string
  sector_id: string
  nombre: string
  codigo: string | null
  created_at: string
}

export interface AlcancePlanificado {
  id: string
  especialidad_id: string
  subsector_id: string
  descripcion: string
  peso_relativo: number
  unidad_medida: string
  cantidad_planificada: number
  unidad_ejecutora_id: string | null
  status: AlcanceStatus
  created_at: string
  updated_at: string
  // Joined fields
  especialidad?: Especialidad
  subsector?: Subsector
  sector?: Sector
  unidad_ejecutora?: UnidadEjecutora
}

export interface AvanceEjecutado {
  id: string
  alcance_id: string
  cantidad_reportada: number
  tipo_trabajo: TrabajoTipo
  fecha_reporte: string
  fotos_evidencia_urls: string[]
  notas: string | null
  inspector_id: string | null
  residente_id: string | null
  directivo_id: string | null
  status_aprobacion: AprobacionStatus
  aprobacion_residente: AprobacionStatus
  aprobacion_inspector: AprobacionStatus
  aprobacion_directivo: AprobacionStatus
  created_at: string
  updated_at: string
  // Joined fields
  alcance?: AlcancePlanificado
  inspector?: Profile
  residente?: Profile
  directivo?: Profile
}

export interface PAFSubsector {
  alcance_id: string
  especialidad_id: string
  especialidad_nombre: string
  subsector_id: string
  subsector_nombre: string
  sector_id: string
  sector_nombre: string
  sector_codigo: string
  peso_relativo: number
  cantidad_planificada: number
  unidad_medida: string
  cantidad_ejecutada: number
  porcentaje_avance: number
  alcance_status: AlcanceStatus
}

export interface PAFSector {
  sector_id: string
  sector_nombre: string
  sector_codigo: string
  paf_sector: number
}

export interface PAFGlobal {
  paf_global: number
  total_items: number
  items_con_avance: number
}

export interface KPIData {
  pafGlobal: number
  frentesActivos: number
  alertas: number
  pafBySector: PAFSector[]
  pafBySubsector: PAFSubsector[]
}

export interface EjecutoraEspecialidad {
  id: string
  nombre: string
  paf: number
  frentes: number
}

export interface EjecutoraData {
  id: string
  nombre: string
  logo_url: string | null
  paf: number
  frentesActivos: number
  alertas: number
  totalItems: number
  itemsConAvance: number
  especialidades: EjecutoraEspecialidad[]
}

export interface SubEspecialidadData {
  id: string
  nombre: string
  paf: number
  totalItems: number
  itemsConAvance: number
}

export interface MacroEspecialidadData {
  id: string
  nombre: string
  slug: string
  imagen_url: string | null
  orden: number
  paf: number
  totalItems: number
  itemsConAvance: number
  subEspecialidades: SubEspecialidadData[]
}
