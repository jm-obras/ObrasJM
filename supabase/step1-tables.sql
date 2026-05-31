-- ⚠️ LEGACY: Base tables setup. Use migrations/ for the complete incremental history.
-- ============================================================
-- OBRASJM - PASO 1: CREAR ENUMS Y TABLAS
-- Ejecutar este bloque completo en el SQL Editor de Supabase
-- ============================================================

-- 1. ENUMS
CREATE TYPE public.trabajo_tipo AS ENUM ('Planificado', 'Imprevisto');
CREATE TYPE public.aprobacion_status AS ENUM ('Pendiente', 'Aprobado', 'Rechazado');
CREATE TYPE public.alcance_status AS ENUM ('Activo', 'Completado', 'Suspendido');
CREATE TYPE public.user_rol AS ENUM ('administrador', 'contratista', 'inspector');

-- 2. TABLAS
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  rol public.user_rol NOT NULL DEFAULT 'contratista',
  unidad_ejecutora_id UUID,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.unidades_ejecutoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rif TEXT,
  contacto TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subsectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.sectores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  codigo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sector_id, nombre)
);

CREATE TABLE public.alcance_planificado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidad_id UUID NOT NULL REFERENCES public.especialidades(id) ON DELETE CASCADE,
  subsector_id UUID NOT NULL REFERENCES public.subsectores(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  peso_relativo NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (peso_relativo >= 0 AND peso_relativo <= 100),
  unidad_medida TEXT NOT NULL,
  cantidad_planificada NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (cantidad_planificada >= 0),
  unidad_ejecutora_id UUID REFERENCES public.unidades_ejecutoras(id) ON DELETE SET NULL,
  status public.alcance_status NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.avance_ejecutado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alcance_id UUID NOT NULL REFERENCES public.alcance_planificado(id) ON DELETE CASCADE,
  cantidad_reportada NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (cantidad_reportada >= 0),
  tipo_trabajo public.trabajo_tipo NOT NULL DEFAULT 'Planificado',
  fecha_reporte DATE NOT NULL DEFAULT CURRENT_DATE,
  fotos_evidencia_urls TEXT[] DEFAULT '{}',
  notas TEXT,
  inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status_aprobacion public.aprobacion_status NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
