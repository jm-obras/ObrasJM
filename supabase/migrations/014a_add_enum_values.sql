-- ============================================================
-- OBRASJM - MIGRACIÓN 014A: Agregar nuevos valores al enum user_rol
--
-- EJECUTAR PRIMERO - Este script DEBE committearse antes de usar los nuevos valores
-- Solo agrega 'visitante' y 'webmaster' al tipo enum user_rol
-- ============================================================

-- Agregar 'webmaster' al enum (reemplazo de 'administrador')
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'webmaster';

-- Agregar 'visitante' al enum (solo lectura para autoridades)
ALTER TYPE public.user_rol ADD VALUE IF NOT EXISTS 'visitante';
