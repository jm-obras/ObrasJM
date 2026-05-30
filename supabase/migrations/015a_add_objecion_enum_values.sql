-- ============================================================
-- Migration 015a: Add Objetado and Subsanado to aprobacion_status enum
-- ============================================================
-- IMPORTANT: This MUST be run in a SEPARATE transaction from 015b.
-- PostgreSQL does not allow using new enum values in the same
-- transaction where they are added (ERROR 55P04).
-- ============================================================

-- Add new values to aprobacion_status enum
ALTER TYPE aprobacion_status ADD VALUE IF NOT EXISTS 'Objetado';
ALTER TYPE aprobacion_status ADD VALUE IF NOT EXISTS 'Subsanado';
