-- Migration 017b: Add RLS policies for ing_campo role
-- Run AFTER 017 (which adds the enum value).

-- ============================================================
-- ing_campo permissions:
--   - Same data access as ingeniera_residente (view alcance for their UE, create/edit avance)
--   - NO approval permissions at any level
--   - Can declare subsanations (like other data editors)
-- ============================================================

-- ===== alcance_planificado =====
-- ing_campo can SELECT alcance (same as ingeniera_residente: filtered by their UE)
CREATE POLICY "ing_campo_select_alcance"
  ON public.alcance_planificado FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'ing_campo'
      AND alcance_planificado.unidad_ejecutora_id = profiles.unidad_ejecutora_id
    )
  );

-- ===== avance_ejecutado =====
-- ing_campo can INSERT avance (same as ingeniera_residente)
CREATE POLICY "ing_campo_insert_avance"
  ON public.avance_ejecutado FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'ing_campo'
    )
  );

-- ing_campo can UPDATE avance data fields (NOT approval fields)
CREATE POLICY "ing_campo_update_avance_data"
  ON public.avance_ejecutado FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'ing_campo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'ing_campo'
    )
  );

-- ===== profiles =====
-- ing_campo can SELECT profiles (same as other authenticated users - already covered by existing policy)
-- No additional policy needed - the existing "authenticated users can select profiles" covers it.

-- ===== unidades_ejecutoras, especialidades, sectores, subsectores =====
-- These already have SELECT policies for authenticated/public users.
-- No additional policies needed.
