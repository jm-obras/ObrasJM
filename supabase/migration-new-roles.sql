-- ⚠️ SUPERSEDED: This migration has been replaced by migrations/014a and 014b.
-- ============================================================
-- MIGRACIÓN: Nuevos roles, teléfono, ente_pertenece y debe_cambiar_password
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Agregar nuevos valores al enum user_rol
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'ingeniera_residente';
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'directivo_hospital';
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'ingenieria_hospital';

-- 2. Agregar nuevas columnas a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ente_pertenece TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT false;

-- 3. Actualizar el trigger handle_new_user para incluir los nuevos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol, telefono, ente_pertenece, debe_cambiar_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.user_rol, 'contratista'::public.user_rol),
    NEW.raw_user_meta_data->>'telefono',
    NEW.raw_user_meta_data->>'ente_pertenece',
    COALESCE((NEW.raw_user_meta_data->>'debe_cambiar_password')::boolean, false)
  );
  RETURN NEW;
END;
$func$;

-- 4. Actualizar políticas RLS para los nuevos roles
-- Primero eliminar las políticas existentes que restringen por rol específico
DROP POLICY IF EXISTS "Contratistas can read own assigned alcance" ON public.alcance_planificado;
DROP POLICY IF EXISTS "Contratistas can insert avance ejecutado" ON public.avance_ejecutado;
DROP POLICY IF EXISTS "Inspectors can update approval status" ON public.avance_ejecutado;

-- Nuevas políticas que incluyen los nuevos roles
CREATE POLICY "Contratistas and residents can read own assigned alcance" ON public.alcance_planificado 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('contratista', 'ingeniera_residente')) 
    AND unidad_ejecutora_id = (SELECT unidad_ejecutora_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Contratistas and residents can insert avance ejecutado" ON public.avance_ejecutado 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('contratista', 'ingeniera_residente', 'administrador'))
  );

CREATE POLICY "Inspectors and directors can update approval status" ON public.avance_ejecutado 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('inspector', 'directivo_hospital', 'ingenieria_hospital', 'administrador'))
  );

-- 5. Permitir que usuarios actualicen su propio perfil para cambiar contraseña
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);
