-- ⚠️ LEGACY: PAF views. Use migrations/ for the complete incremental history.
-- ============================================================
-- OBRASJM - PASO 5: VISTAS DE CÁLCULO PAF
-- Ejecutar después del Paso 4
-- ============================================================

-- Vista: PAF por subsector
CREATE OR REPLACE VIEW public.v_paf_subsector AS
SELECT 
  ap.id AS alcance_id,
  ap.especialidad_id,
  e.nombre AS especialidad_nombre,
  ap.subsector_id,
  sub.nombre AS subsector_nombre,
  sub.sector_id,
  s.nombre AS sector_nombre,
  s.codigo AS sector_codigo,
  ap.peso_relativo,
  ap.cantidad_planificada,
  ap.unidad_medida,
  COALESCE(SUM(ae.cantidad_reportada), 0) AS cantidad_ejecutada,
  CASE 
    WHEN ap.cantidad_planificada > 0 
    THEN LEAST(COALESCE(SUM(ae.cantidad_reportada), 0) / ap.cantidad_planificada * 100, 100)
    ELSE 0 
  END AS porcentaje_avance,
  ap.status AS alcance_status
FROM public.alcance_planificado ap
JOIN public.especialidades e ON ap.especialidad_id = e.id
JOIN public.subsectores sub ON ap.subsector_id = sub.id
JOIN public.sectores s ON sub.sector_id = s.id
LEFT JOIN public.avance_ejecutado ae ON ap.id = ae.alcance_id AND ae.status_aprobacion = 'Aprobado'
GROUP BY ap.id, e.nombre, sub.nombre, sub.sector_id, s.nombre, s.codigo, ap.peso_relativo, 
         ap.cantidad_planificada, ap.unidad_medida, ap.status;

-- Vista: PAF por sector
CREATE OR REPLACE VIEW public.v_paf_sector AS
SELECT 
  sector_id,
  sector_nombre,
  sector_codigo,
  SUM(peso_relativo * porcentaje_avance) / NULLIF(SUM(peso_relativo), 0) AS paf_sector
FROM public.v_paf_subsector
WHERE alcance_status = 'Activo'
GROUP BY sector_id, sector_nombre, sector_codigo;

-- Vista: PAF global
CREATE OR REPLACE VIEW public.v_paf_global AS
SELECT 
  SUM(peso_relativo * porcentaje_avance) / NULLIF(SUM(peso_relativo), 0) AS paf_global,
  COUNT(DISTINCT alcance_id) AS total_items,
  COUNT(DISTINCT CASE WHEN porcentaje_avance > 0 THEN alcance_id END) AS items_con_avance
FROM public.v_paf_subsector
WHERE alcance_status = 'Activo';
