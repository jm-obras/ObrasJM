-- Migration 017: Add ing_campo role
-- This role has the same data permissions as ingeniera_residente
-- but WITHOUT participation in the approval flow.

-- ============================================================
-- IMPORTANT: This migration must be run in a SEPARATE transaction
-- from any other DDL, because PostgreSQL requires ALTER TYPE ...
-- ADD VALUE to be executed outside a transaction block.
-- Run this FIRST before 017b.
-- ============================================================

-- Step 1: Add 'ing_campo' to the user_rol enum
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'ing_campo';
