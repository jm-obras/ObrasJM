-- ============================================================
-- OBRASJM - MIGRACIÓN 014: Nuevo rol Visitante + Renombrar Administrador → Webmaster
--
-- 1. Agregar rol 'visitante': solo lectura para autoridades
-- 2. Renombrar rol 'administrador' → 'webmaster' (evitar confusión con Administración/Finanzas)
-- ============================================================

-- 1. Agregar nuevos valores al enum
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'visitante';
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'webmaster';

-- 2. Migrar todos los perfiles de 'administrador' a 'webmaster'
UPDATE public.profiles SET rol = 'webmaster' WHERE rol = 'administrador';

-- 3. Actualizar TODAS las políticas RLS que referencian 'administrador'

-- ── Tabla: profiles ──
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
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
    -- Drop old admin policies if they exist
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
