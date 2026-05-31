-- ⚠️ DEPRECATED: This file is OUT OF SYNC with the current database state. Use migrations/ for incremental updates.
-- ============================================================
-- OBRASJM - ESQUEMA COMPLETO
-- Copia TODO este contenido y pégalo en el SQL Editor de Supabase
-- Luego haz clic en "Run" (o presiona Ctrl+Enter)
-- ============================================================

-- Borrar tipos existentes si hay (para poder recrear)
DROP TYPE IF EXISTS public.trabajo_tipo CASCADE;
DROP TYPE IF EXISTS public.aprobacion_status CASCADE;
DROP TYPE IF EXISTS public.alcance_status CASCADE;
DROP TYPE IF EXISTS public.user_rol CASCADE;

-- Crear tipos enum
CREATE TYPE public.trabajo_tipo AS ENUM ('Planificado', 'Imprevisto');
CREATE TYPE public.aprobacion_status AS ENUM ('Pendiente', 'Aprobado', 'Rechazado');
CREATE TYPE public.alcance_status AS ENUM ('Activo', 'Completado', 'Suspendido');
CREATE TYPE public.user_rol AS ENUM ('administrador', 'contratista', 'inspector');

-- Crear tabla: profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  rol public.user_rol NOT NULL DEFAULT 'contratista',
  unidad_ejecutora_id UUID,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla: unidades_ejecutoras
CREATE TABLE public.unidades_ejecutoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rif TEXT,
  contacto TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla: especialidades
CREATE TABLE public.especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla: sectores
CREATE TABLE public.sectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla: subsectores
CREATE TABLE public.subsectores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.sectores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  codigo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sector_id, nombre)
);

-- Crear tabla: alcance_planificado
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

-- Crear tabla: avance_ejecutado
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

-- ============================================================
-- DATOS SEMILLA
-- ============================================================

INSERT INTO public.especialidades (nombre) VALUES
  ('Electricidad - Luminarias'),
  ('Electricidad - Generadores'),
  ('Electricidad - UPS'),
  ('Obras Civiles'),
  ('Climatización'),
  ('Impermeabilización'),
  ('Transporte Vertical'),
  ('Desmalezamiento'),
  ('Limpieza de Escombros'),
  ('Planta de Cloración'),
  ('Sistemas de Bombeo'),
  ('Almacenamiento de Agua'),
  ('Destapado de Tuberías de Aguas Servidas'),
  ('Salas de Baños y Duchas'),
  ('Achicamiento de Agua de Desagües del Sótano'),
  ('Telecomunicaciones');

INSERT INTO public.sectores (nombre, codigo) VALUES
  ('Torre Hospitalaria', 'TH'),
  ('Torre de Consultas', 'TC'),
  ('Torre de Ambulatorios', 'TA'),
  ('Torre 3', 'T3'),
  ('Anexo Planta Baja', 'A-PB'),
  ('Anexo Sótano', 'A-S');

INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'TH-P1' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'TH-P2' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 3', 'TH-P3' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 4', 'TH-P4' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 5', 'TH-P5' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 6', 'TH-P6' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 7', 'TH-P7' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 8', 'TH-P8' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Sótano', 'TH-SO' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'TC-P1' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'TC-P2' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 3', 'TC-P3' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 4', 'TC-P4' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'TA-P1' FROM public.sectores WHERE codigo = 'TA';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'TA-P2' FROM public.sectores WHERE codigo = 'TA';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 3', 'TA-P3' FROM public.sectores WHERE codigo = 'TA';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'T3-P1' FROM public.sectores WHERE codigo = 'T3';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'T3-P2' FROM public.sectores WHERE codigo = 'T3';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Azoteas', 'A-PB-AZ' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Emergencia', 'A-PB-EM' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Triaje', 'A-PB-TR' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'UTIP', 'A-PB-UTIP' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Medicina Nuclear', 'A-PB-MN' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Antiguo Triaje', 'A-PB-AT' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Anatomía Patológica', 'A-S-AP' FROM public.sectores WHERE codigo = 'A-S';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Sala de Calderas', 'A-S-SC' FROM public.sectores WHERE codigo = 'A-S';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Desagües', 'A-S-DG' FROM public.sectores WHERE codigo = 'A-S';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Almacén', 'A-S-AL' FROM public.sectores WHERE codigo = 'A-S';

-- ============================================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_ejecutoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alcance_planificado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avance_ejecutado ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- Profiles
CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));
CREATE POLICY "Admin can update profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Unidades Ejecutoras
CREATE POLICY "Authenticated users can read unidades ejecutoras" ON public.unidades_ejecutoras FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage unidades ejecutoras" ON public.unidades_ejecutoras FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Especialidades
CREATE POLICY "Anyone can read especialidades" ON public.especialidades FOR SELECT USING (true);
CREATE POLICY "Admin can manage especialidades" ON public.especialidades FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Sectores
CREATE POLICY "Anyone can read sectores" ON public.sectores FOR SELECT USING (true);
CREATE POLICY "Admin can manage sectores" ON public.sectores FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Subsectores
CREATE POLICY "Anyone can read subsectores" ON public.subsectores FOR SELECT USING (true);
CREATE POLICY "Admin can manage subsectores" ON public.subsectores FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Alcance Planificado
CREATE POLICY "Authenticated users can read alcance planificado" ON public.alcance_planificado FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Contratistas can read own assigned alcance" ON public.alcance_planificado FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'contratista') AND unidad_ejecutora_id = (SELECT unidad_ejecutora_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin can manage alcance planificado" ON public.alcance_planificado FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Avance Ejecutado
CREATE POLICY "Authenticated users can read avance ejecutado" ON public.avance_ejecutado FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Contratistas can insert avance ejecutado" ON public.avance_ejecutado FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('contratista', 'administrador')));
CREATE POLICY "Inspectors can update approval status" ON public.avance_ejecutado FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('inspector', 'administrador')));
CREATE POLICY "Admin can manage avance ejecutado" ON public.avance_ejecutado FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_alcance_planificado_updated_at BEFORE UPDATE ON public.alcance_planificado FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_avance_ejecutado_updated_at BEFORE UPDATE ON public.avance_ejecutado FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.user_rol, 'contratista'::public.user_rol)
  );
  RETURN NEW;
END;
$func$;

-- Nota: Este trigger puede fallar si no tienes permisos sobre auth.users
-- En ese caso, omítelo y crea los perfiles manualmente
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VISTAS DE CÁLCULO PAF
-- ============================================================

CREATE OR REPLACE VIEW public.v_paf_subsector AS
SELECT 
  ap.id AS alcance_id,
  ap.especialidad_id,
  e.nombre AS especialidad_nombre,
  ap.subsector_id,
  sub.nombre AS subsector_nombre,
  sub.sector_id,
  s.nombre AS sector_nombre,
  s.codigo AS sector_codigo,
  ap.peso_relativo,
  ap.cantidad_planificada,
  ap.unidad_medida,
  COALESCE(SUM(ae.cantidad_reportada), 0) AS cantidad_ejecutada,
  CASE 
    WHEN ap.cantidad_planificada > 0 
    THEN LEAST(COALESCE(SUM(ae.cantidad_reportada), 0) / ap.cantidad_planificada * 100, 100)
    ELSE 0 
  END AS porcentaje_avance,
  ap.status AS alcance_status
FROM public.alcance_planificado ap
JOIN public.especialidades e ON ap.especialidad_id = e.id
JOIN public.subsectores sub ON ap.subsector_id = sub.id
JOIN public.sectores s ON sub.sector_id = s.id
LEFT JOIN public.avance_ejecutado ae ON ap.id = ae.alcance_id AND ae.status_aprobacion = 'Aprobado'
GROUP BY ap.id, e.nombre, sub.nombre, sub.sector_id, s.nombre, s.codigo, ap.peso_relativo, ap.cantidad_planificada, ap.unidad_medida, ap.status;

CREATE OR REPLACE VIEW public.v_paf_sector AS
SELECT 
  sector_id, sector_nombre, sector_codigo,
  SUM(peso_relativo * porcentaje_avance) / NULLIF(SUM(peso_relativo), 0) AS paf_sector
FROM public.v_paf_subsector
WHERE alcance_status = 'Activo'
GROUP BY sector_id, sector_nombre, sector_codigo;

CREATE OR REPLACE VIEW public.v_paf_global AS
SELECT 
  SUM(peso_relativo * porcentaje_avance) / NULLIF(SUM(peso_relativo), 0) AS paf_global,
  COUNT(DISTINCT alcance_id) AS total_items,
  COUNT(DISTINCT CASE WHEN porcentaje_avance > 0 THEN alcance_id END) AS items_con_avance
FROM public.v_paf_subsector
WHERE alcance_status = 'Activo';

-- ============================================================
-- BUCKET DE STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias', 'evidencias', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Any authenticated user can upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidencias' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view evidence" ON storage.objects FOR SELECT USING (bucket_id = 'evidencias');
CREATE POLICY "Admin can delete evidence" ON storage.objects FOR DELETE USING (bucket_id = 'evidencias' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'));
