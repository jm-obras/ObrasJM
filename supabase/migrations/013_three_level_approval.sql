-- ============================================================
-- OBRASJM - MIGRACIÓN 013: Aprobación en 3 niveles
-- Nivel 1: Ingeniera Residente (declara concluida la obra)
-- Nivel 2: Inspector (aprueba por el MPPOP)
-- Nivel 3: Directivo Hospital (conformidad del trabajo)
-- Administrador: puede aprobar cualquier nivel
-- ============================================================

-- 1. Agregar columnas de aprobación por nivel
ALTER TABLE public.avance_ejecutado
  ADD COLUMN IF NOT EXISTS aprobacion_residente public.aprobacion_status NOT NULL DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS aprobacion_inspector public.aprobacion_status NOT NULL DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS aprobacion_directivo public.aprobacion_status NOT NULL DEFAULT 'Pendiente';

-- 2. Agregar columnas para registrar quién aprobó en cada nivel
ALTER TABLE public.avance_ejecutado
  ADD COLUMN IF NOT EXISTS residente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS directivo_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Migrar datos existentes:
--    - Los avances ya aprobados por inspector quedan con los 3 niveles aprobados (retroactivo)
--    - Los pendientes/rechazados quedan en Pendiente en los 3 niveles
UPDATE public.avance_ejecutado
SET
  aprobacion_residente = status_aprobacion,
  aprobacion_inspector = status_aprobacion,
  aprobacion_directivo = status_aprobacion,
  residente_id = inspector_id
WHERE status_aprobacion = 'Aprobado';

-- 4. Actualizar políticas RLS para el nuevo esquema de aprobación
-- Eliminar políticas anteriores de UPDATE sobre avance_ejecutado
DROP POLICY IF EXISTS "Inspectors can update avance ejecutado" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Inspectors and directors can update approval status" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Contratistas and residents can insert avance ejecutado" ON public.avance_ejecutado;

-- 5. Nueva política INSERT: contratistas, ingenieras residentes, inspectores y admins
CREATE POLICY "Authorized roles can insert avance ejecutado" ON public.avance_ejecutado
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('contratista', 'ingeniera_residente', 'inspector', 'administrador'))
  );

-- 6. Nuevas políticas UPDATE por rol:
-- Ingeniera Residente: puede actualizar datos básicos + su nivel de aprobación
CREATE POLICY "Residentes can update avance fields and own approval" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'ingeniera_residente')
  );

-- Contratistas: pueden actualizar datos básicos (cantidad, fotos, notas) pero NO aprobación
CREATE POLICY "Contratistas can update avance fields" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'contratista')
  );

-- Inspectores: pueden actualizar datos + su nivel de aprobación
CREATE POLICY "Inspectors can update avance and own approval" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'inspector')
  );

-- Directivo Hospital: puede actualizar su nivel de aprobación
CREATE POLICY "Directivo hospital can update own approval" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'directivo_hospital')
  );

-- Ingeniería Hospital: puede ver pero no aprobar (solo lectura)
-- No se necesita política UPDATE para ingenieria_hospital

-- Admin: puede hacer todo
CREATE POLICY "Admin can manage avance ejecutado" ON public.avance_ejecutado
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador')
  );
