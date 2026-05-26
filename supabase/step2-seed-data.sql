-- ============================================================
-- OBRASJM - PASO 2: INSERTAR DATOS SEMILLA
-- Ejecutar después del Paso 1
-- ============================================================

-- Especialidades
INSERT INTO public.especialidades (nombre) VALUES
  ('Electricidad - Luminarias'),
  ('Electricidad - Generadores'),
  ('Electricidad - UPS'),
  ('Obras Civiles'),
  ('Climatización'),
  ('Impermeabilización'),
  ('Transporte Vertical'),
  ('Desmalezamiento'),
  ('Limpieza de Escombros'),
  ('Planta de Cloración'),
  ('Sistemas de Bombeo'),
  ('Almacenamiento de Agua'),
  ('Destapado de Tuberías de Aguas Servidas'),
  ('Salas de Baños y Duchas'),
  ('Achicamiento de Agua de Desagües del Sótano'),
  ('Telecomunicaciones');

-- Sectores
INSERT INTO public.sectores (nombre, codigo) VALUES
  ('Torre Hospitalaria', 'TH'),
  ('Torre de Consultas', 'TC'),
  ('Torre de Ambulatorios', 'TA'),
  ('Torre 3', 'T3'),
  ('Anexo Planta Baja', 'A-PB'),
  ('Anexo Sótano', 'A-S');

-- Subsectores - Torre Hospitalaria (TH)
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'TH-P1' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'TH-P2' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 3', 'TH-P3' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 4', 'TH-P4' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 5', 'TH-P5' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 6', 'TH-P6' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 7', 'TH-P7' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 8', 'TH-P8' FROM public.sectores WHERE codigo = 'TH';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Sótano', 'TH-SO' FROM public.sectores WHERE codigo = 'TH';

-- Subsectores - Torre de Consultas (TC)
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'TC-P1' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'TC-P2' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 3', 'TC-P3' FROM public.sectores WHERE codigo = 'TC';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 4', 'TC-P4' FROM public.sectores WHERE codigo = 'TC';

-- Subsectores - Torre de Ambulatorios (TA)
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'TA-P1' FROM public.sectores WHERE codigo = 'TA';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'TA-P2' FROM public.sectores WHERE codigo = 'TA';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 3', 'TA-P3' FROM public.sectores WHERE codigo = 'TA';

-- Subsectores - Torre 3 (T3)
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 1', 'T3-P1' FROM public.sectores WHERE codigo = 'T3';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Piso 2', 'T3-P2' FROM public.sectores WHERE codigo = 'T3';

-- Subsectores - Anexo Planta Baja (A-PB)
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Azoteas', 'A-PB-AZ' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Emergencia', 'A-PB-EM' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Triaje', 'A-PB-TR' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'UTIP', 'A-PB-UTIP' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Medicina Nuclear', 'A-PB-MN' FROM public.sectores WHERE codigo = 'A-PB';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Antiguo Triaje', 'A-PB-AT' FROM public.sectores WHERE codigo = 'A-PB';

-- Subsectores - Anexo Sótano (A-S)
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Anatomía Patológica', 'A-S-AP' FROM public.sectores WHERE codigo = 'A-S';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Sala de Calderas', 'A-S-SC' FROM public.sectores WHERE codigo = 'A-S';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Desagües', 'A-S-DG' FROM public.sectores WHERE codigo = 'A-S';
INSERT INTO public.subsectores (sector_id, nombre, codigo) SELECT id, 'Almacén', 'A-S-AL' FROM public.sectores WHERE codigo = 'A-S';
