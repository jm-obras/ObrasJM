-- ⚠️ SUPERSEDED: Inspector alcance policies are now in migrations/014b.
-- ============================================================
-- MIGRACIÓN: Permitir que inspectores creen y editen alcances planificados
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Permitir que inspectores inserten alcances planificados
CREATE POLICY "Inspectors can insert alcance planificado"
ON public.alcance_planificado FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'inspector'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
  )
);

-- 2. Permitir que inspectores actualicen alcances planificados
CREATE POLICY "Inspectors can update alcance planificado"
ON public.alcance_planificado FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'inspector'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
  )
);
