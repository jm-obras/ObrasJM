-- ============================================================
-- OBRASJM - PASO 6: BUCKET DE STORAGE Y POLÍTICAS
-- Ejecutar después del Paso 5
-- NOTA: Ir a Storage en el panel de Supabase y crear el bucket
-- "evidencias" manualmente (public = true), luego ejecutar estas políticas
-- ============================================================

-- Si el bucket no existe, créalo (puede fallar si no tienes permisos directos)
-- En ese caso, créalo manualmente desde el panel: Storage > New Bucket > "evidencias" > Public: ON
INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas del bucket de evidencias
CREATE POLICY "Any authenticated user can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidencias');

CREATE POLICY "Admin can delete evidence"
ON storage.objects FOR DELETE
USING (bucket_id = 'evidencias' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));
