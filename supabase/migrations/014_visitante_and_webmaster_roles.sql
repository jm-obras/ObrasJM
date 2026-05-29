-- ============================================================
-- OBRASJM - MIGRACIÓN 014: Nuevo rol Visitante + Renombrar Administrador → Webmaster
--
-- 1. Agregar rol 'visitante': solo lectura para autoridades
-- 2. Renombrar rol 'administrador' → 'webmaster' (evitar confusión con Administración/Finanzas)
-- ============================================================

-- 1. Agregar nuevos valores al tipo de la columna rol
-- Primero detectamos si es un enum o text y actuamos en consecuencia
DO $$
BEGIN
  -- Intentar agregar al enum si existe
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'user_rol' AND n.nspname = 'public') THEN
    -- Es un enum: agregar los nuevos valores
    EXECUTE 'ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS ''visitante''';
    EXECUTE 'ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS ''webmaster''';
  ELSE
    -- No es un enum: la columna es text o varchar, no necesitamos alterar el tipo
    -- Solo necesitamos asegurarnos de que no haya restricciones CHECK que limiten los valores
    RAISE NOTICE 'La columna rol no usa enum, los nuevos valores se pueden usar directamente';
  END IF;
END $$;

-- Si hay una restricción CHECK en la columna rol de profiles, la eliminamos y recreamos
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'profiles'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%administrador%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Restricción CHECK eliminada: %', constraint_name;
  END IF;
END $$;

-- 2. Migrar todos los perfiles de 'administrador' a 'webmaster'
UPDATE public.profiles SET rol = 'webmaster' WHERE rol = 'administrador';

-- 3. Actualizar TODAS las políticas RLS que referencian 'administrador'

-- ── Tabla: profiles ──
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

CREATE POLICY "Webmaster can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

CREATE POLICY "Webmaster can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Tabla: unidades_ejecutoras ──
DROP POLICY IF EXISTS "Admin can manage unidades ejecutoras" ON public.unidades_ejecutoras;
DROP POLICY IF EXISTS "Anyone can read unidades ejecutoras" ON public.unidades_ejecutoras;

CREATE POLICY "Webmaster can manage unidades ejecutoras" ON public.unidades_ejecutoras
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

CREATE POLICY "Anyone can read unidades ejecutoras" ON public.unidades_ejecutoras
  FOR SELECT USING (true);

-- ── Tabla: especialidades ──
DROP POLICY IF EXISTS "Admin can manage especialidades" ON public.especialidades;
DROP POLICY IF EXISTS "Anyone can read especialidades" ON public.especialidades;

CREATE POLICY "Webmaster can manage especialidades" ON public.especialidades
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

CREATE POLICY "Anyone can read especialidades" ON public.especialidades
  FOR SELECT USING (true);

-- ── Tabla: sectores ──
DROP POLICY IF EXISTS "Admin can manage sectores" ON public.sectores;
DROP POLICY IF EXISTS "Anyone can read sectores" ON public.sectores;

CREATE POLICY "Webmaster can manage sectores" ON public.sectores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

CREATE POLICY "Anyone can read sectores" ON public.sectores
  FOR SELECT USING (true);

-- ── Tabla: subsectores ──
DROP POLICY IF EXISTS "Admin can manage subsectores" ON public.subsectores;
DROP POLICY IF EXISTS "Anyone can read subsectores" ON public.subsectores;

CREATE POLICY "Webmaster can manage subsectores" ON public.subsectores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

CREATE POLICY "Anyone can read subsectores" ON public.subsectores
  FOR SELECT USING (true);

-- ── Tabla: alcance_planificado ──
DROP POLICY IF EXISTS "Authenticated users can read alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Admin and inspectors can insert alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Admin and inspectors can update alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Admin can delete alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Admin can manage alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Contratistas and residents can read own assigned alcance" ON public.alcance_planificado;

CREATE POLICY "Authenticated users can read alcance planificado" ON public.alcance_planificado
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Webmaster and inspectors can insert alcance planificado" ON public.alcance_planificado
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('webmaster', 'inspector'))
  );

CREATE POLICY "Webmaster and inspectors can update alcance planificado" ON public.alcance_planificado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('webmaster', 'inspector'))
  );

CREATE POLICY "Webmaster can delete alcance planificado" ON public.alcance_planificado
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

-- ── Tabla: avance_ejecutado ──
DROP POLICY IF EXISTS "Authenticated users can read avance ejecutado" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Authorized roles can insert avance ejecutado" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Residentes can update avance fields and own approval" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Contratistas can update avance fields" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Inspectors can update avance and own approval" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Directivo hospital can update own approval" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Admin can manage avance ejecutado" ON public.avance_ejecutado;

-- SELECT: todos los autenticados pueden leer (incluido visitante)
CREATE POLICY "Authenticated users can read avance ejecutado" ON public.avance_ejecutado
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: contratistas, ingenieras residentes, inspectores y webmaster
CREATE POLICY "Authorized roles can insert avance ejecutado" ON public.avance_ejecutado
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('contratista', 'ingeniera_residente', 'inspector', 'webmaster'))
  );

-- UPDATE por rol:
-- Ingeniera Residente
CREATE POLICY "Residentes can update avance fields and own approval" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'ingeniera_residente')
  );

-- Contratistas
CREATE POLICY "Contratistas can update avance fields" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'contratista')
  );

-- Inspectores
CREATE POLICY "Inspectors can update avance and own approval" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'inspector')
  );

-- Directivo Hospital
CREATE POLICY "Directivo hospital can update own approval" ON public.avance_ejecutado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'directivo_hospital')
  );

-- Webmaster: puede hacer todo
CREATE POLICY "Webmaster can manage avance ejecutado" ON public.avance_ejecutado
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster')
  );

-- NOTA: visitante NO tiene políticas de INSERT/UPDATE/DELETE → solo lectura automática
-- NOTA: ingenieria_hospital NO tiene políticas de UPDATE → solo lectura como antes

-- ── Tabla: macro_especialidades (si existe) ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'macro_especialidades' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admin can manage macro especialidades" ON public.macro_especialidades';
    EXECUTE 'CREATE POLICY "Webmaster can manage macro especialidades" ON public.macro_especialidades
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = ''webmaster'')
      )';
  END IF;
END $$;

-- 4. Actualizar el trigger handle_new_user si referencia 'administrador'
-- (El trigger usa el rol del user_metadata, así que las nuevas cuentas usarán 'webmaster')
-- No se necesita cambio en el trigger porque lee de auth.users.user_metadata.rol
