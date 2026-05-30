-- ============================================================
-- Migration 015b: Add objection/subsanation fields + update RLS policies
-- ============================================================
-- Run AFTER 015a (enum values must exist first).
--
-- New flow for each approval level:
--   Pendiente → Objetado (reviewer objects, must provide reason)
--   Objetado → Subsanado (creator declares issue resolved)
--   Subsanado → Aprobado/Objetado/Rechazado (reviewer re-evaluates)
--   Pendiente → Aprobado/Rechazado (original flow still valid)
--
-- status_aprobacion auto-computation:
--   Rechazado  → if any level is Rechazado
--   Objetado   → if any level is Objetado
--   Subsanado  → if any level is Subsanado (and none Objetado/Rechazado)
--   Aprobado   → if all 3 levels are Aprobado
--   Pendiente  → otherwise
-- ============================================================

-- Add objection reason fields (nullable, filled when level is Objetado)
ALTER TABLE avance_ejecutado
  ADD COLUMN IF NOT EXISTS motivo_objecion_residente TEXT,
  ADD COLUMN IF NOT EXISTS motivo_objecion_inspector TEXT,
  ADD COLUMN IF NOT EXISTS motivo_objecion_directivo TEXT;

-- Add subsanation notes fields (nullable, filled when creator declares issue resolved)
ALTER TABLE avance_ejecutado
  ADD COLUMN IF NOT EXISTS notas_subsanacion_residente TEXT,
  ADD COLUMN IF NOT EXISTS notas_subsanacion_inspector TEXT,
  ADD COLUMN IF NOT EXISTS notas_subsanacion_directivo TEXT;

-- ============================================================
-- Update RLS policies: Allow creators to declare subsanation
-- ============================================================
-- When a level is "Objetado", the avance creator needs UPDATE access
-- to set it to "Subsanado" and provide notes.
-- Current RLS only allows contratista/ingeniera_residente/inspector/webmaster
-- to update avance data, which already covers the creator role.
-- No RLS changes needed - existing policies are sufficient because:
-- 1. The creator already has UPDATE permission on avance_ejecutado
-- 2. The API enforces which fields each role can modify
-- ============================================================

-- Update the SQL views to handle new statuses
-- v_paf_subsector: Only count avances with status_aprobacion = 'Aprobado'
-- (already filters for Aprobado, so Objetado/Subsanado are excluded automatically)
-- No changes needed to views.

-- Comment documenting the new flow
COMMENT ON COLUMN avance_ejecutado.motivo_objecion_residente IS 'Razón de la objeción por la Ing. Residente. Obligatorio cuando aprobacion_residente = Objetado';
COMMENT ON COLUMN avance_ejecutado.motivo_objecion_inspector IS 'Razón de la objeción por el Inspector. Obligatorio cuando aprobacion_inspector = Objetado';
COMMENT ON COLUMN avance_ejecutado.motivo_objecion_directivo IS 'Razón de la objeción por el Directivo. Obligatorio cuando aprobacion_directivo = Objetado';
COMMENT ON COLUMN avance_ejecutado.notas_subsanacion_residente IS 'Notas de subsanación para objeción de la Ing. Residente. Llenado por el creador del avance';
COMMENT ON COLUMN avance_ejecutado.notas_subsanacion_inspector IS 'Notas de subsanación para objeción del Inspector. Llenado por el creador del avance';
COMMENT ON COLUMN avance_ejecutado.notas_subsanacion_directivo IS 'Notas de subsanación para objeción del Directivo. Llenado por el creador del avance';
