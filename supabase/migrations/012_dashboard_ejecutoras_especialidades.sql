-- ============================================================
-- MIGRACIÓN 012: Dashboard Ejecutoras & Especialidades
-- - Add logo_url to unidades_ejecutoras
-- - Create macro_especialidades table
-- - Create macro_especialidades_especialidades junction table
-- - Seed 6 macro_especialidades
-- - Map existing especialidades to macro_especialidades via LIKE
-- - Create v_paf_ejecutora view
-- - Create v_paf_macro_especialidad view
-- - Enable RLS on new tables
-- Idempotent: safe to re-run
-- ============================================================

-- ============================================================
-- 1. ADD logo_url COLUMN TO unidades_ejecutoras
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'unidades_ejecutoras'
      AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.unidades_ejecutoras
      ADD COLUMN logo_url TEXT DEFAULT NULL;
  END IF;
END
$$;

-- ============================================================
-- 2. CREATE macro_especialidades TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.macro_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  imagen_url TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CREATE macro_especialidades_especialidades JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.macro_especialidades_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_especialidad_id UUID NOT NULL REFERENCES public.macro_especialidades(id) ON DELETE CASCADE,
  especialidad_id UUID NOT NULL REFERENCES public.especialidades(id) ON DELETE CASCADE,
  UNIQUE(macro_especialidad_id, especialidad_id)
);

-- ============================================================
-- 4. SEED 6 macro_especialidades (idempotent via ON CONFLICT)
-- ============================================================
INSERT INTO public.macro_especialidades (nombre, slug, imagen_url, orden)
VALUES
  ('Sistema Eléctrico', 'sistema-electrico', '/images/macro-especialidades/sistema_electrico.png', 1),
  ('Sistema Hídrico y Sanitario', 'sistema-hidrico-sanitario', '/images/macro-especialidades/sistema_hidrico_y_sanitario.png', 2),
  ('Infraestructura Civil', 'infraestructura-civil', '/images/macro-especialidades/infraestructura_civil.png', 3),
  ('Climatización', 'climatizacion', '/images/macro-especialidades/climatizacion.png', 4),
  ('Transporte Vertical', 'transporte-vertical', '/images/macro-especialidades/transporte_vertical.png', 5),
  ('Sistemas y Servicios', 'sistemas-servicios', '/images/macro-especialidades/sistemas_y_servicios.png', 6)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  imagen_url = EXCLUDED.imagen_url,
  orden = EXCLUDED.orden;

-- ============================================================
-- 5. MAP especialidades → macro_especialidades via LIKE matching
--    Uses INSERT...SELECT with LIKE patterns that match both
--    the renamed names and the original seed names for safety.
--    Idempotent: ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING
-- ============================================================

-- Sistema Eléctrico → Iluminación, Generación Eléctrica, Energía Ininterrumpida (UPS)
INSERT INTO public.macro_especialidades_especialidades (macro_especialidad_id, especialidad_id)
SELECT
  me.id,
  e.id
FROM public.especialidades e
CROSS JOIN public.macro_especialidades me
WHERE me.slug = 'sistema-electrico'
  AND (
    e.nombre LIKE '%Iluminación%'
    OR e.nombre LIKE '%iluminacion%'
    OR e.nombre LIKE '%Luminarias%'
    OR e.nombre LIKE '%Generación%Eléctrica%'
    OR e.nombre LIKE '%generacion%electrica%'
    OR e.nombre LIKE '%Generadores%'
    OR e.nombre LIKE '%Ininterrumpida%'
    OR e.nombre LIKE '%UPS%'
  )
ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING;

-- Sistema Hídrico y Sanitario → Potabilización de Agua, Sistemas de Bombeo,
--   Almacenamiento Hídrico, Drenaje Sanitario, Instalaciones Sanitarias,
--   Control de Infiltraciones
INSERT INTO public.macro_especialidades_especialidades (macro_especialidad_id, especialidad_id)
SELECT
  me.id,
  e.id
FROM public.especialidades e
CROSS JOIN public.macro_especialidades me
WHERE me.slug = 'sistema-hidrico-sanitario'
  AND (
    e.nombre LIKE '%Potabilización%'
    OR e.nombre LIKE '%potabilizacion%'
    OR e.nombre LIKE '%Cloración%'
    OR e.nombre LIKE '%cloracion%'
    OR e.nombre LIKE '%Bombeo%'
    OR e.nombre LIKE '%Almacenamiento%Hídrico%'
    OR e.nombre LIKE '%Almacenamiento%Hidrico%'
    OR e.nombre LIKE '%Almacenamiento%Agua%'
    OR e.nombre LIKE '%Drenaje%Sanitario%'
    OR e.nombre LIKE '%Destapado%'
    OR e.nombre LIKE '%Instalaciones%Sanitarias%'
    OR e.nombre LIKE '%Baños%Duchas%'
    OR e.nombre LIKE '%Infiltraciones%'
    OR e.nombre LIKE '%Achicamiento%'
    OR e.nombre LIKE '%Desagües%Sótano%'
    OR e.nombre LIKE '%Desagues%Sotano%'
  )
ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING;

-- Infraestructura Civil → Obras Civiles, Impermeabilización
INSERT INTO public.macro_especialidades_especialidades (macro_especialidad_id, especialidad_id)
SELECT
  me.id,
  e.id
FROM public.especialidades e
CROSS JOIN public.macro_especialidades me
WHERE me.slug = 'infraestructura-civil'
  AND (
    e.nombre LIKE '%Obras%Civiles%'
    OR e.nombre LIKE '%Impermeabilización%'
    OR e.nombre LIKE '%impermeabilizacion%'
  )
ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING;

-- Climatización → Climatización
INSERT INTO public.macro_especialidades_especialidades (macro_especialidad_id, especialidad_id)
SELECT
  me.id,
  e.id
FROM public.especialidades e
CROSS JOIN public.macro_especialidades me
WHERE me.slug = 'climatizacion'
  AND (
    e.nombre LIKE '%Climatización%'
    OR e.nombre LIKE '%climatizacion%'
  )
ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING;

-- Transporte Vertical → Transporte Vertical
INSERT INTO public.macro_especialidades_especialidades (macro_especialidad_id, especialidad_id)
SELECT
  me.id,
  e.id
FROM public.especialidades e
CROSS JOIN public.macro_especialidades me
WHERE me.slug = 'transporte-vertical'
  AND (
    e.nombre LIKE '%Transporte%Vertical%'
  )
ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING;

-- Sistemas y Servicios → Telecomunicaciones, Control Vegetal,
--   Limpieza y Remoción de Escombros
INSERT INTO public.macro_especialidades_especialidades (macro_especialidad_id, especialidad_id)
SELECT
  me.id,
  e.id
FROM public.especialidades e
CROSS JOIN public.macro_especialidades me
WHERE me.slug = 'sistemas-servicios'
  AND (
    e.nombre LIKE '%Telecomunicaciones%'
    OR e.nombre LIKE '%Control%Vegetal%'
    OR e.nombre LIKE '%Desmalezamiento%'
    OR e.nombre LIKE '%Limpieza%Escombros%'
    OR e.nombre LIKE '%Remoción%Escombros%'
    OR e.nombre LIKE '%Escombros%'
  )
ON CONFLICT (macro_especialidad_id, especialidad_id) DO NOTHING;

-- ============================================================
-- 6. CREATE VIEW v_paf_ejecutora
--    Calculates PAF per unidad ejecutora using v_paf_subsector.
--    Only active alcances with approved avances are considered.
-- ============================================================
CREATE OR REPLACE VIEW public.v_paf_ejecutora AS
SELECT
  ue.id AS unidad_ejecutora_id,
  ue.nombre AS nombre_ejecutora,
  ue.logo_url,
  COALESCE(
    SUM(ps.peso_relativo * ps.porcentaje_avance) / NULLIF(SUM(ps.peso_relativo), 0),
    0
  ) AS paf_ejecutora,
  COUNT(DISTINCT ps.alcance_id) AS total_items,
  COUNT(DISTINCT CASE WHEN ps.porcentaje_avance > 0 THEN ps.alcance_id END) AS items_con_avance,
  COUNT(DISTINCT ps.subsector_id) AS frentes_activos,
  (
    SELECT COUNT(DISTINCT ae.id)
    FROM public.avance_ejecutado ae
    INNER JOIN public.alcance_planificado ap2 ON ap2.id = ae.alcance_id
    WHERE ap2.unidad_ejecutora_id = ue.id
      AND ae.status_aprobacion = 'Pendiente'
  ) AS alertas_pendientes
FROM public.unidades_ejecutoras ue
INNER JOIN public.alcance_planificado ap ON ap.unidad_ejecutora_id = ue.id
INNER JOIN public.v_paf_subsector ps ON ps.alcance_id = ap.id AND ps.alcance_status = 'Activo'
GROUP BY ue.id, ue.nombre, ue.logo_url;

-- ============================================================
-- 7. CREATE VIEW v_paf_macro_especialidad
--    Calculates PAF per macro especialidad, joining through
--    the junction table to group especialidades under their
--    macro category. Uses v_paf_subsector (active items only).
-- ============================================================
CREATE OR REPLACE VIEW public.v_paf_macro_especialidad AS
SELECT
  me.id AS macro_especialidad_id,
  me.nombre AS nombre_macro,
  me.slug,
  me.imagen_url,
  me.orden,
  COALESCE(
    SUM(ps.peso_relativo * ps.porcentaje_avance) / NULLIF(SUM(ps.peso_relativo), 0),
    0
  ) AS paf_macro,
  COUNT(DISTINCT ps.alcance_id) AS total_items,
  COUNT(DISTINCT CASE WHEN ps.porcentaje_avance > 0 THEN ps.alcance_id END) AS items_con_avance
FROM public.macro_especialidades me
INNER JOIN public.macro_especialidades_especialidades mee ON mee.macro_especialidad_id = me.id
INNER JOIN public.v_paf_subsector ps ON ps.especialidad_id = mee.especialidad_id AND ps.alcance_status = 'Activo'
GROUP BY me.id, me.nombre, me.slug, me.imagen_url, me.orden;

-- ============================================================
-- 8. ENABLE RLS ON NEW TABLES
-- ============================================================
ALTER TABLE public.macro_especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_especialidades_especialidades ENABLE ROW LEVEL SECURITY;

-- ========== macro_especialidades RLS ==========
-- SELECT for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades'
      AND policyname = 'Authenticated users can read macro_especialidades'
  ) THEN
    CREATE POLICY "Authenticated users can read macro_especialidades"
    ON public.macro_especialidades FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- INSERT/UPDATE/DELETE for administrador only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades'
      AND policyname = 'Admin can insert macro_especialidades'
  ) THEN
    CREATE POLICY "Admin can insert macro_especialidades"
    ON public.macro_especialidades FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades'
      AND policyname = 'Admin can update macro_especialidades'
  ) THEN
    CREATE POLICY "Admin can update macro_especialidades"
    ON public.macro_especialidades FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades'
      AND policyname = 'Admin can delete macro_especialidades'
  ) THEN
    CREATE POLICY "Admin can delete macro_especialidades"
    ON public.macro_especialidades FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;

-- ========== macro_especialidades_especialidades RLS ==========
-- SELECT for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades_especialidades'
      AND policyname = 'Authenticated users can read macro_especialidades_especialidades'
  ) THEN
    CREATE POLICY "Authenticated users can read macro_especialidades_especialidades"
    ON public.macro_especialidades_especialidades FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- INSERT/UPDATE/DELETE for administrador only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades_especialidades'
      AND policyname = 'Admin can insert macro_especialidades_especialidades'
  ) THEN
    CREATE POLICY "Admin can insert macro_especialidades_especialidades"
    ON public.macro_especialidades_especialidades FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades_especialidades'
      AND policyname = 'Admin can update macro_especialidades_especialidades'
  ) THEN
    CREATE POLICY "Admin can update macro_especialidades_especialidades"
    ON public.macro_especialidades_especialidades FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'macro_especialidades_especialidades'
      AND policyname = 'Admin can delete macro_especialidades_especialidades'
  ) THEN
    CREATE POLICY "Admin can delete macro_especialidades_especialidades"
    ON public.macro_especialidades_especialidades FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;

-- ============================================================
-- END MIGRATION 012
-- ============================================================

-- ============================================================
-- 9. ENSURE STORAGE BUCKET 'evidencias' EXISTS
--    (Used by both /api/upload and /api/upload-logo)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for evidencias bucket (if not already exist)
DO $$
BEGIN
  -- Allow authenticated users to upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'Authenticated users can upload to evidencias'
  ) THEN
    CREATE POLICY "Authenticated users can upload to evidencias"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'evidencias' AND auth.role() = 'authenticated');
  END IF;

  -- Allow anyone to view (public bucket)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'Anyone can view evidencias'
  ) THEN
    CREATE POLICY "Anyone can view evidencias"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'evidencias');
  END IF;

  -- Allow admin to delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'Admin can delete evidencias'
  ) THEN
    CREATE POLICY "Admin can delete evidencias"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'evidencias' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
    ));
  END IF;
END
$$;
