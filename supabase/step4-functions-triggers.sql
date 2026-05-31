-- ⚠️ LEGACY: Functions and triggers. Use migrations/ for the complete incremental history.
-- ============================================================
-- OBRASJM - PASO 4: FUNCIONES Y TRIGGERS
-- Ejecutar después del Paso 3
-- NOTA: Cada función debe ejecutarse por separado en el Editor SQL
-- ============================================================

-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_alcance_planificado_updated_at
  BEFORE UPDATE ON public.alcance_planificado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_avance_ejecutado_updated_at
  BEFORE UPDATE ON public.avance_ejecutado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Función para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.user_rol, 'contratista'::public.user_rol)
  );
  RETURN NEW;
END;
$$;

-- Trigger: crear perfil al registrar usuario en auth.users
-- IMPORTANTE: Este trigger requiere permisos de admin en auth.schema
-- Si da error, se puede omitir y crear perfiles manualmente via API
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
