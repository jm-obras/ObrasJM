-- ============================================================
-- OBRASJM - MIGRACIÓN 019: Extender permisos de ing_campo en alcance_planificado
--
-- Antes (mig 017b + 018):
--   ing_campo solo tenía SELECT en alcance_planificado (filtrado por su UE).
--   CREATE/UPDATE/DELETE estaban reservados a webmaster/inspector/contratista.
--
-- Ahora:
--   INSERT: webmaster, inspector, contratista, ing_campo
--   UPDATE: webmaster, inspector, contratista, ing_campo
--   DELETE: webmaster, inspector, ing_campo
--
-- Esto alinea a ing_campo con inspector para el módulo de Alcance Planificado.
-- La política SELECT de ing_campo (filtrada por unidad_ejecutora) se mantiene intacta.
-- ============================================================

-- ── DROP existing INSERT/UPDATE/DELETE policies (creadas en mig 018) ──
DROP POLICY IF EXISTS "Webmaster, inspectors and contratistas can insert alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Webmaster, inspectors and contratistas can update alcance planificado" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Webmaster and inspectors can delete alcance planificado" ON public.alcance_planificado;

-- ── Recreate policies with ing_campo included ──

-- INSERT: webmaster, inspector, contratista, ing_campo
CREATE POLICY "Webmaster, inspectors, contratistas and ing_campo can insert alcance planificado" ON public.alcance_planificado
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol IN ('webmaster', 'inspector', 'contratista', 'ing_campo')
    )
  );

-- UPDATE: webmaster, inspector, contratista, ing_campo
CREATE POLICY "Webmaster, inspectors, contratistas and ing_campo can update alcance planificado" ON public.alcance_planificado
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol IN ('webmaster', 'inspector', 'contratista', 'ing_campo')
    )
  );

-- DELETE: webmaster, inspector, ing_campo
CREATE POLICY "Webmaster, inspectors and ing_campo can delete alcance planificado" ON public.alcance_planificado
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol IN ('webmaster', 'inspector', 'ing_campo')
    )
  );

-- ── Verificación (no-op, solo documentación) ──
-- La política SELECT "ing_campo_select_alcance" creada en mig 017b sigue activa
-- y sigue filtrando por unidad_ejecutora_id del usuario.
