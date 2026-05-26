-- ============================================================
-- MIGRACIÓN: Permitir que inspectores creen y modifiquen avances ejecutados
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Agregar política INSERT para inspectores en avance_ejecutado
-- Primero eliminar la política existente de contratistas
DROP POLICY IF EXISTS "Contratistas and residents can insert avance ejecutado" ON public.avance_ejecutado;

-- Crear nueva política que incluye inspectores
CREATE POLICY "Contratistas, residents and inspectors can insert avance ejecutado"
ON public.avance_ejecutado FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('contratista', 'ingeniera_residente', 'inspector', 'administrador')
  )
);
