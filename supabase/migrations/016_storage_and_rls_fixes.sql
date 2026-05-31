-- ============================================================
-- OBRASJM - MIGRACIÓN 016: Security fixes for Storage and RLS
-- VULN-005: Storage evidencias — change read policy from public to authenticated
-- VULN-006: Fix storage delete policy (administrador → webmaster)
-- ============================================================

-- VULN-005 FIX: Replace public read policy with authenticated-only read
-- Drop the old public policy
DROP POLICY IF EXISTS "Anyone can view evidence" ON storage.objects;

-- Create new authenticated-only read policy
CREATE POLICY "Authenticated users can view evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

-- VULN-006 FIX: Update delete policy from 'administrador' to 'webmaster'
DROP POLICY IF EXISTS "Admin can delete evidence" ON storage.objects;

CREATE POLICY "Webmaster can delete evidence"
ON storage.objects FOR DELETE
USING (bucket_id = 'evidencias' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'webmaster'
));
