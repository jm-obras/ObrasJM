-- ============================================================
-- OBRASJM - MIGRACIÓN 018: Actualizar permisos de alcance planificado
--
-- 1. Inspector: habilitar DELETE (antes solo webmaster)
-- 2. Contratista: habilitar INSERT y UPDATE (antes solo webmaster/inspector)
-- ============================================================

-- ── DROP existing policies for alcance_planificado ──
DROP POLICY IF EXISTS "Webmaster and inspectors can insert alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Webmaster and inspectors can update alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Webmaster can delete alcance planificado" ON public.alcance_planificado;

-- ── Recreate policies with updated roles ──

-- INSERT: webmaster, inspector, contratista
CREATE POLICY "Webmaster, inspectors and contratistas can insert alcance planificado" ON public.alcance_planificado
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('webmaster', 'inspector', 'contratista'))
  );

-- UPDATE: webmaster, inspector, contratista
CREATE POLICY "Webmaster, inspectors and contratistas can update alcance planificado" ON public.alcance_planificado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('webmaster', 'inspector', 'contratista'))
  );

-- DELETE: webmaster, inspector
CREATE POLICY "Webmaster and inspectors can delete alcance planificado" ON public.alcance_planificado
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('webmaster', 'inspector'))
  );
