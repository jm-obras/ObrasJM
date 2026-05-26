-- ============================================================
-- OBRASJM - PASO 3: HABILITAR RLS Y CREAR POLÍTICAS
-- Ejecutar después del Paso 2
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_ejecutoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alcance_planificado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avance_ejecutado ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

CREATE POLICY "Admin can update profiles"
ON public.profiles FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ========== UNIDADES_EJECUTORAS ==========
CREATE POLICY "Authenticated users can read unidades ejecutoras"
ON public.unidades_ejecutoras FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage unidades ejecutoras"
ON public.unidades_ejecutoras FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

-- ========== ESPECIALIDADES ==========
CREATE POLICY "Anyone can read especialidades"
ON public.especialidades FOR SELECT
USING (true);

CREATE POLICY "Admin can manage especialidades"
ON public.especialidades FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

-- ========== SECTORES ==========
CREATE POLICY "Anyone can read sectores"
ON public.sectores FOR SELECT
USING (true);

CREATE POLICY "Admin can manage sectores"
ON public.sectores FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

-- ========== SUBSECTORES ==========
CREATE POLICY "Anyone can read subsectores"
ON public.subsectores FOR SELECT
USING (true);

CREATE POLICY "Admin can manage subsectores"
ON public.subsectores FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

-- ========== ALCANCE_PLANIFICADO ==========
CREATE POLICY "Authenticated users can read alcance planificado"
ON public.alcance_planificado FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Contratistas can read own assigned alcance"
ON public.alcance_planificado FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'contratista'
  )
  AND unidad_ejecutora_id = (
    SELECT unidad_ejecutora_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admin can manage alcance planificado"
ON public.alcance_planificado FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));

-- ========== AVANCE_EJECUTADO ==========
CREATE POLICY "Authenticated users can read avance ejecutado"
ON public.avance_ejecutado FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Contratistas can insert avance ejecutado"
ON public.avance_ejecutado FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'contratista'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
  )
);

CREATE POLICY "Inspectors can update approval status"
ON public.avance_ejecutado FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'inspector'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
  )
);

CREATE POLICY "Admin can manage avance ejecutado"
ON public.avance_ejecutado FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador'
));
