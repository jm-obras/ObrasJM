# MEMORY.md — Archivo de Contexto del Proyecto ObrasJM

> **POLÍTICA FUNDAMENTAL:** Cero Pérdida de Datos · Control de Versiones de Contexto · Snapshots Anti-Avería
>
> Este documento es la **única fuente de verdad** para cualquier IA que trabaje en el desarrollo del sistema ObrasJM. Antes de modificar CUALQUIER línea de código, la IA DEBE leer este archivo completo. Si el código resultante falla, la directiva inmediata será **ignorar el último prompt y revertir al Snapshot anterior**.

---

## A. Ficha Técnica y Estado de la Arquitectura

### A.1 Identidad del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | ObrasJM — Control de Porcentaje de Avance Físico (PAF) |
| **Ubicación** | Hospital de Niños J.M. de los Ríos, Caracas, Venezuela |
| **Organización** | Plan de Recuperación de Infraestructura Hospitalaria "Dr. José Gregorio Hernández" |
| **URL Producción** | `https://obras.hospitaljmdelosrios.org.ve/` (Vercel + dominio personalizado) |
| **Repositorio** | `github.com/jm-obras/ObrasJM` |
| **Supabase Project ID** | `pmueicotcnsfildkpggp` |

### A.2 Stack Tecnológico Actual

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| **Framework** | Next.js (App Router) | 16.x | SPA monolítica en ruta única `/` |
| **Lenguaje** | TypeScript | 5.x | `ignoreBuildErrors: true` en next.config ⚠️ |
| **Estilos** | Tailwind CSS | 4.x | + tailwindcss-animate |
| **Componentes UI** | shadcn/ui (Radix) | New York style | 48 componentes instalados |
| **Backend/BD** | Supabase (PostgreSQL) | — | RLS habilitado en TODAS las tablas |
| **Auth** | Supabase Auth | — | Registro requiere rol webmaster |
| **Gráficos** | Recharts | 2.x | Dashboard KPIs |
| **Tablas Datos** | TanStack Table | 8.x | Disponible si se necesita |
| **Formularios** | react-hook-form + zod | 7.x / 4.x | Validación cliente |
| **Animaciones** | Framer Motion | — | Transiciones UI |
| **Fechas** | date-fns | 4.x | Formateo de fechas |
| **Deploy** | Vercel | — | Auto-deploy desde GitHub `main` |

### A.3 Arquitectura de la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Cliente)                       │
│                                                              │
│  / (src/app/page.tsx) — RUTA ÚNICA SPA                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AuthGuard                                            │   │
│  │  ├─ No autenticado → LandingPage (con modal login)    │   │
│  │  ├─ debe_cambiar_password → ChangePasswordForm        │   │
│  │  └─ Autenticado → AppContent (Tabs React)             │   │
│  │      ├─ Tab: Dashboard (TODOS los roles)              │   │
│  │      ├─ Tab: Alcance Planificado (admin, inspector,   │   │
│  │      │   contratista, ingeniera_residente,             │   │
│  │      │   ingenieria_hospital)                          │   │
│  │      ├─ Tab: Avance Ejecutado (TODOS los roles)       │   │
│  │      │   → Aprobación 3 niveles: Residente → Inspector│   │
│  │      │     → Directivo Hospital (admin: cualquier lvl)│   │
│  │      └─ Tab: Administración (SOLO admin)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │ fetch()                           │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes (src/app/api/) — 26 endpoints            │   │
│  │  ├─ /api/auth/* (login, register, logout, me,        │   │
│  │  │   change-password)                                 │   │
│  │  ├─ /api/alcance, /api/alcance/[id]                  │   │
│  │  ├─ /api/avance, /api/avance/[id]                    │   │
│  │  ├─ /api/dashboard                                   │   │
│  │  ├─ /api/admin/users, /api/admin/users/[id]          │   │
│  │  ├─ /api/especialidades, /api/sectores,              │   │
│  │  │   /api/subsectores, /api/unidades-ejecutoras      │   │
│  │  ├─ /api/upload, /api/upload-logo                    │   │
│  │  ├─ /api/landing/stats                               │   │
│  │  └─ /api/init                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│            ┌─────────────┼─────────────┐                     │
│            ▼             ▼             ▼                     │
│    Supabase Client   Supabase    Supabase Admin              │
│    (browser/ssr)     Server      (service_role)              │
│    ≡ usuario actual  Client      ≡ bypass RLS                │
│    sujeto a RLS      ≡ usuario                              │
│                      actual                                  │
└─────────────────────────────────────────────────────────────┘
```

### A.4 Regla Arquitectónica Crítica

> ⛔ **NO se deben crear rutas adicionales de Next.js** (`/dashboard`, `/admin`, etc.) para las vistas principales del sistema. Toda la navegación ocurre mediante **estados de React (Tabs)** dentro del componente `AppContent` en `src/app/page.tsx`. La única ruta del frontend es `/`.
>
> Excepción: Se pueden crear rutas API bajo `/api/` libremente.

---

## B. Mapa de Componentes Críticos (Monolitos Actuales)

### B.1 Tamaños de Archivos — Post-Refractorización v2.0

#### Admin (8 archivos, antes 1 monolito de 1625 líneas)
| Archivo | Líneas | Riesgo | Descripción |
|---------|--------|--------|-------------|
| `src/components/admin/admin-view.tsx` | **133** | 🟢 OK | Orchestrador principal + Tabs |
| `src/components/admin/users-tab.tsx` | **532** | 🟡 ALTO | CRUD usuarios + 4 diálogos |
| `src/components/admin/subsectores-tab.tsx` | **330** | 🟡 ALTO | CRUD subsectores |
| `src/components/admin/sectores-tab.tsx` | **284** | 🟢 MEDIO | CRUD sectores |
| `src/components/admin/unidades-tab.tsx` | **280** | 🟢 MEDIO | CRUD unidades ejecutoras |
| `src/components/admin/especialidades-tab.tsx` | **270** | 🟢 MEDIO | CRUD especialidades |
| `src/components/admin/shared-ui.tsx` | **109** | 🟢 OK | TableSkeleton, EmptyState, Pagination |
| `src/components/admin/admin-types.ts` | **103** | 🟢 OK | Tipos, constantes, defaults |

#### Avance (6 archivos, antes 1 monolito de 1373 líneas)
| Archivo | Líneas | Riesgo | Descripción |
|---------|--------|--------|-------------|
| `src/components/avance/avance-view.tsx` | **469** | 🟡 ALTO | Orchestrador + lógica CRUD |
| `src/components/avance/avance-dialogs.tsx` | **473** | 🟡 ALTO | 5 diálogos (Add, Edit, Approval, Gallery, Viewer) |
| `src/components/avance/avance-table.tsx` | **269** | 🟢 MEDIO | Tabla de datos + paginación |
| `src/components/avance/avance-form-fields.tsx` | **268** | 🟢 MEDIO | Campos de formulario compartidos |
| `src/components/avance/avance-filters.tsx` | **94** | 🟢 OK | Barra de filtros |
| `src/components/avance/avance-types.ts` | **38** | 🟢 OK | Tipos, constantes, defaults |

#### Alcance (6 archivos, antes 1 monolito de 804 líneas)
| Archivo | Líneas | Riesgo | Descripción |
|---------|--------|--------|-------------|
| `src/components/alcance/alcance-view.tsx` | **298** | 🟢 MEDIO | Orchestrador + lógica CRUD |
| `src/components/alcance/alcance-dialogs.tsx` | **225** | 🟢 MEDIO | 3 diálogos (Add, Edit, Delete) |
| `src/components/alcance/alcance-table.tsx` | **227** | 🟢 MEDIO | Tabla de datos + paginación |
| `src/components/alcance/alcance-form.tsx` | **203** | 🟢 MEDIO | Campos de formulario compartidos |
| `src/components/alcance/alcance-filters.tsx` | **113** | 🟢 OK | Barra de filtros |
| `src/components/alcance/alcance-types.ts` | **31** | 🟢 OK | Tipos, constantes, defaults |

#### Otros archivos principales
| Archivo | Líneas | Riesgo | Descripción |
|---------|--------|--------|-------------|
| `src/app/page.tsx` | **~411** | 🟡 ALTO | Shell SPA, Tabs, AuthProvider, enrutamiento interno |
| `src/lib/auth-context.tsx` | **~195** | 🟢 MEDIO | Contexto de autenticación React |
| `src/components/dashboard/hospital-heatmap.tsx` | **~238** | 🟢 MEDIO | Mapa de calor del hospital |
| `src/components/dashboard/kpi-cards.tsx` | **~196** | 🟢 MEDIO | Tarjetas KPI del dashboard |

### B.2 Monolitos — Estado de Refactorización

> ✅ Los 3 monolitos principales han sido refactorizados en la v2.0:
> - `admin-view.tsx`: 1625 → 133 líneas (92% reducción, 8 archivos)
> - `avance-view.tsx`: 1373 → 469 líneas (66% reducción, 6 archivos)
> - `alcance-view.tsx`: 804 → 298 líneas (63% reducción, 6 archivos)
>
> El archivo más grande ahora es `users-tab.tsx` (532 líneas). Si crece más, puede dividirse separando los diálogos de reseteo de contraseña y creación/edición.

### B.3 Componentes shadcn/ui Instalados (48)

`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle-group`, `toggle`, `tooltip`

### B.4 Componentes de Negocio (No-UI)

| Componente | Archivo | Función |
|------------|---------|---------|
| `AppContent` | `src/app/page.tsx` | Shell principal con Tabs |
| `AdminView` | `src/components/admin/admin-view.tsx` | Panel de administración |
| `AvanceView` | `src/components/avance/avance-view.tsx` | Vista de avances ejecutados |
| `AlcanceView` | `src/components/alcance/alcance-view.tsx` | Vista de alcance planificado |
| `DashboardView` | `src/components/dashboard/dashboard-view.tsx` | Dashboard con KPIs |
| `HospitalHeatmap` | `src/components/dashboard/hospital-heatmap.tsx` | Mapa de calor por sector |
| `KPICards` | `src/components/dashboard/kpi-cards.tsx` | Tarjetas de indicadores |
| `PAFChart` | `src/components/dashboard/paf-chart.tsx` | Gráfico de PAF |
| `LandingPage` | `src/components/landing/landing-page.tsx` | Landing pública |
| `AuthGuard` | `src/components/auth-guard.tsx` | Protección de rutas por autenticación |
| `LoginForm` | `src/components/login-form.tsx` | Formulario de login |
| `ChangePasswordForm` | `src/components/change-password-form.tsx` | Cambio forzado de contraseña |

---

## C. Base de Datos — Supabase (PostgreSQL + RLS)

### C.1 Enumeraciones

| Enum | Valores |
|------|---------|
| `user_rol` | `administrador` *(obsoleto, migrado a webmaster)*, `webmaster`, `contratista`, `inspector`, `ingeniera_residente`, `directivo_hospital`, `ingenieria_hospital`, `visitante` |
| `trabajo_tipo` | `Planificado`, `Imprevisto` |
| `aprobacion_status` | `Pendiente`, `Aprobado`, `Rechazado`, `Objetado`, `Subsanado` |
| `alcance_status` | `Activo`, `Completado`, `Suspendido` |

### C.2 Tablas (7 + auth.users)

#### `profiles` — Perfiles de usuario (1:1 con auth.users)
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | — |
| `nombre_completo` | TEXT | NOT NULL | — |
| `rol` | user_rol | NOT NULL | `'contratista'` |
| `unidad_ejecutora_id` | UUID | nullable | — |
| `telefono` | TEXT | nullable | — |
| `ente_pertenece` | TEXT | nullable | — |
| `debe_cambiar_password` | BOOLEAN | NOT NULL | `false` |
| `activo` | BOOLEAN | NOT NULL | `true` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` |

#### `unidades_ejecutoras` — Contratistas/Empresas
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `nombre` | TEXT | NOT NULL | — |
| `rif` | TEXT | nullable | — |
| `contacto` | TEXT | nullable | — |
| `activa` | BOOLEAN | NOT NULL | `true` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |

#### `especialidades` — Tipos de trabajo
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `nombre` | TEXT | NOT NULL, UNIQUE | — |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |

#### `sectores` — Torres/Áreas del hospital
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `nombre` | TEXT | NOT NULL | — |
| `codigo` | TEXT | NOT NULL, UNIQUE | — |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |

#### `subsectores` — Pisos/Sub-áreas
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `sector_id` | UUID | NOT NULL, FK → sectores(id) CASCADE | — |
| `nombre` | TEXT | NOT NULL | — |
| `codigo` | TEXT | nullable | — |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |

**Unique:** `(sector_id, nombre)`

#### `alcance_planificado` — Items de trabajo planificado
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `especialidad_id` | UUID | NOT NULL, FK → especialidades(id) CASCADE | — |
| `subsector_id` | UUID | NOT NULL, FK → subsectores(id) CASCADE | — |
| `descripcion` | TEXT | NOT NULL | — |
| `peso_relativo` | NUMERIC(5,2) | NOT NULL, CHECK 0–100 | `0.00` |
| `unidad_medida` | TEXT | NOT NULL | — |
| `cantidad_planificada` | NUMERIC(12,2) | NOT NULL, CHECK ≥0 | `0.00` |
| `unidad_ejecutora_id` | UUID | FK → unidades_ejecutoras(id) SET NULL | — |
| `status` | alcance_status | NOT NULL | `'Activo'` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` |

#### `avance_ejecutado` — Reportes de avance
| Columna | Tipo | Restricciones | Default |
|---------|------|---------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `alcance_id` | UUID | NOT NULL, FK → alcance_planificado(id) CASCADE | — |
| `cantidad_reportada` | NUMERIC(12,2) | NOT NULL, CHECK ≥0 | `0.00` |
| `tipo_trabajo` | trabajo_tipo | NOT NULL | `'Planificado'` |
| `fecha_reporte` | DATE | NOT NULL | `CURRENT_DATE` |
| `fotos_evidencia_urls` | TEXT[] | DEFAULT | `'{}'` |
| `notas` | TEXT | nullable | — |
| `inspector_id` | UUID | FK → profiles(id) SET NULL | — |
| `residente_id` | UUID | FK → profiles(id) SET NULL | — |
| `directivo_id` | UUID | FK → profiles(id) SET NULL | — |
| `status_aprobacion` | aprobacion_status | NOT NULL | `'Pendiente'` |
| `aprobacion_residente` | aprobacion_status | NOT NULL | `'Pendiente'` |
| `aprobacion_inspector` | aprobacion_status | NOT NULL | `'Pendiente'` |
| `aprobacion_directivo` | aprobacion_status | NOT NULL | `'Pendiente'` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` |

> **Aprobación en 3 niveles:** `status_aprobacion` se calcula automáticamente: `Aprobado` solo si los 3 niveles aprueban, `Rechazado` si alguno rechaza, `Pendiente` en caso contrario.

### C.3 Mapa de Relaciones (Foreign Keys)

```
auth.users ◄─────── profiles.id (1:1, CASCADE)
profiles ◄───────── avance_ejecutado.inspector_id (SET NULL)
profiles ◄───────── avance_ejecutado.residente_id (SET NULL)
profiles ◄───────── avance_ejecutado.directivo_id (SET NULL)
unidades_ejecutoras ◄── alcance_planificado.unidad_ejecutora_id (SET NULL)
especialidades ◄─── alcance_planificado.especialidad_id (CASCADE)
sectores ◄───────── subsectores.sector_id (CASCADE)
subsectores ◄────── alcance_planificado.subsector_id (CASCADE)
alcance_planificado ◄── avance_ejecutado.alcance_id (CASCADE)
```

> ⚠️ `profiles.unidad_ejecutora_id` es una referencia lógica sin FK a nivel de BD.

### C.4 RLS Policies — Matriz Completa de Permisos

#### `profiles`
| Operación | Quién |
|-----------|-------|
| SELECT | authenticated |
| INSERT | webmaster |
| UPDATE | webmaster + propio usuario |
| DELETE | — (no hay política) |

#### `unidades_ejecutoras`
| Operación | Quién |
|-----------|-------|
| ALL | webmaster |
| SELECT | authenticated |

#### `especialidades`
| Operación | Quién |
|-----------|-------|
| ALL | webmaster |
| SELECT | público (true) |

#### `sectores`
| Operación | Quién |
|-----------|-------|
| ALL | webmaster |
| SELECT | público (true) |

#### `subsectores`
| Operación | Quién |
|-----------|-------|
| ALL | webmaster |
| SELECT | público (true) |

#### `alcance_planificado`
| Operación | Quién |
|-----------|-------|
| SELECT | authenticated + contratista/ingeniera_residente (su UE) |
| INSERT | webmaster + inspector |
| UPDATE | webmaster + inspector |
| DELETE | webmaster |

#### `avance_ejecutado`
| Operación | Quién |
|-----------|-------|
| SELECT | authenticated |
| INSERT | contratista + ingeniera_residente + inspector + webmaster |
| UPDATE (datos) | contratista + ingeniera_residente + inspector + webmaster |
| UPDATE (aprobación residente) | ingeniera_residente + webmaster |
| UPDATE (aprobación inspector) | inspector + webmaster |
| UPDATE (aprobación directivo) | directivo_hospital + webmaster |
| ALL | webmaster |

> **Aprobación secuencial:** Cada nivel requiere que el anterior esté aprobado. Inspector no puede aprobar si Residente no aprobó. Directivo no puede aprobar si Inspector no aprobó.
>
> **Visitante:** Solo tiene políticas SELECT → acceso de solo lectura automático (sin INSERT/UPDATE/DELETE en ninguna tabla).

#### Storage (`evidencias`) — bucket `public=true`
| Operación | Quién | Notas |
|-----------|-------|-------|
| SELECT | authenticated (RLS) | ⚠️ Bucket es público → URL directa accesible sin auth. RLS solo aplica a acceso vía API |
| INSERT | authenticated | — |
| DELETE | webmaster | — |

> ⚠️ **VULN-005 parcial:** La migración 016 cambió la RLS SELECT de público a autenticado, pero como el bucket sigue siendo `public=true`, las URLs públicas siguen accesibles directamente en el navegador. Para protección completa, el bucket debe ser privado + URLs firmadas.

### C.5 Vistas SQL (PAF Calculation)

| Vista | Propósito |
|-------|-----------|
| `v_paf_subsector` | PAF % por item de alcance (JOINs: especialidad + subsector + sector, SUM solo avances Aprobados) |
| `v_paf_sector` | PAF ponderado por sector: `Σ(peso × avance) / Σ(peso)` |
| `v_paf_global` | PAF global ponderado + conteo de items y items con avance |

> ⚠️ Las vistas SQL existen en la BD pero el endpoint `/api/dashboard` **NO las usa** — reimplementa el cálculo PAF en TypeScript con el admin client.

### C.6 Triggers y Funciones

| Trigger | Tabla | Timing | Función |
|---------|-------|--------|---------|
| `update_profiles_updated_at` | profiles | BEFORE UPDATE | `update_updated_at()` |
| `update_alcance_planificado_updated_at` | alcance_planificado | BEFORE UPDATE | `update_updated_at()` |
| `update_avance_ejecutado_updated_at` | avance_ejecutado | BEFORE UPDATE | `update_updated_at()` |
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` (SECURITY DEFINER) |

> La función `handle_new_user()` crea automáticamente un perfil en `profiles` cuando se inserta un usuario en `auth.users`. Lee de `raw_user_meta_data`: `nombre_completo`, `rol`, `telefono`, `ente_pertenece`, `debe_cambiar_password`. Por esto se usa `upsert` con `onConflict: 'id'` al crear usuarios desde la API.

### C.7 Datos Semilla (Seed Data)

- **16 especialidades**: Electricidad (Luminarias, Generadores, UPS), Obras Civiles, Climatización, Impermeabilización, Transporte Vertical, Desmalezamiento, Limpieza de Escombros, Planta de Cloración, Sistemas de Bombeo, Almacenamiento de Agua, Destapado de Tuberías, Salas de Baños, Achicamiento de Agua, Telecomunicaciones
- **6 sectores**: TH (Torre Hospitalaria), TC (Torre de Consultas), TA (Torre de Ambulatorios), T3 (Torre 3), A-PB (Anexo Planta Baja), A-S (Anexo Sótano)
- **28 subsectores**: Pisos por torre (TH: P1-P8 + Sótano, TC: P1-P4, TA: P1-P3, T3: P1-P2) + áreas Anexo

---

## D. API Routes — Mapa Completo

### D.1 Endpoints de Autenticación

| Endpoint | Método | Auth | Rol | Admin Client | Notas |
|----------|--------|------|-----|--------------|-------|
| `/api/auth/login` | POST | No | — | No | Verifica `activo=true` en profile |
| `/api/auth/register` | POST | Sí | webmaster | **Sí** | Crear usuarios con roles válidos (incluido visitante). VULN-001 CORREGIDO |
| `/api/auth/logout` | POST | No | — | No | — |
| `/api/auth/me` | GET | Sí | — | No | Retorna user + profile |
| `/api/auth/change-password` | POST | Sí | — | No | Establece `debe_cambiar_password = false` |

### D.2 Endpoints de Negocio

| Endpoint | Método | Auth | Roles Permitidos | Admin Client | Notas |
|----------|--------|------|-----------------|--------------|-------|
| `/api/alcance` | GET | No | — | No | Filtros: especialidad_id, subsector_id, sector_id, status |
| `/api/alcance` | POST | Sí | admin, inspector | No | Fuerza status='Activo' |
| `/api/alcance/[id]` | GET | No | — | No | — |
| `/api/alcance/[id]` | PUT | Sí | admin, inspector | No | `updated_at` manual (redundante con trigger) |
| `/api/alcance/[id]` | DELETE | Sí | admin | No | — |
| `/api/avance` | GET | No | — | No | Filtros: alcance_id, status_aprobacion, fecha_desde, fecha_hasta |
| `/api/avance` | POST | Sí | contratista, ingeniera_residente, inspector, admin | No | Todos los niveles Pendiente, status_aprobacion=Pendiente |
| `/api/avance/[id]` | GET | No | — | No | Incluye residente + directivo profiles |
| `/api/avance/[id]` | PUT | Sí | Por campos y nivel (ver nota) | No | Datos: contratista/residente/inspector/admin. Aprobación por nivel: residente/inspector/directivo/admin. Aprobación secuencial. status_aprobacion auto-computado |
| `/api/dashboard` | GET | ⚠️ No | ⚠️ Ninguno | **Sí** | Calcula PAF en TypeScript, bypass RLS |
| `/api/landing/stats` | GET | ⚠️ No | ⚠️ Ninguno | **Sí** | Stats públicas, `metrosCuadrados: 12500` hardcoded |

### D.3 Endpoints de Administración

| Endpoint | Método | Auth | Rol | Admin Client | Notas |
|----------|--------|------|-----|--------------|-------|
| `/api/admin/users` | GET | Sí | admin | **Sí** | Merge auth.users + profiles |
| `/api/admin/users` | POST | Sí | admin | **Sí** | `debe_cambiar_password=true`, cleanup si falla profile |
| `/api/admin/users/[id]` | PUT | Sí | admin | **Sí** | Actualiza email/password en auth + campos profile |
| `/api/admin/users/[id]` | DELETE | Sí | admin | **Sí** | Impide auto-eliminación; borra profile primero |
| `/api/admin/users/[id]/reset-password` | POST | Sí | admin | **Sí** | Password temporal 10 chars, `debe_cambiar_password=true` |

### D.4 Endpoints de Catálogos

| Endpoint | Método | Auth | Roles POST | Notas |
|----------|--------|------|------------|-------|
| `/api/especialidades` | GET/POST | GET: No / POST: Sí | admin | — |
| `/api/especialidades/[id]` | PUT/DELETE | Sí | admin | Verifica refs en alcance antes de eliminar |
| `/api/sectores` | GET/POST | GET: No / POST: Sí | admin | Fuerza `codigo` a uppercase |
| `/api/sectores/[id]` | PUT/DELETE | Sí | admin | Verifica subsectores antes de eliminar |
| `/api/subsectores` | GET/POST | GET: No / POST: Sí | admin | Filtro `?sector_id=`; verifica sector existe |
| `/api/subsectores/[id]` | PUT/DELETE | Sí | admin | Verifica refs en alcance antes de eliminar |
| `/api/unidades-ejecutoras` | GET/POST | GET: No / POST: Sí | admin, inspector | ⚠️ RLS solo permite admin — inspector fallaría en BD |
| `/api/unidades-ejecutoras/[id]` | PUT/DELETE | Sí | admin | — |

### D.5 Endpoints de Sistema

| Endpoint | Método | Auth | Notas |
|----------|--------|------|-------|
| `/api` | GET | No | Health check: `{ message: "Hello, world!" }` |
| `/api/init` | GET/POST | ⚠️ No | Verifica/seed BD. **DEBE deshabilitarse en producción** |

---

## E. Roles y Permisos — Matriz Funcional

### E.1 Visibilidad de Tabs por Rol

| Tab | webmaster | contratista | inspector | ingeniera_residente | directivo_hospital | ingenieria_hospital | visitante |
|-----|:---------:|:-----------:|:---------:|:-------------------:|:------------------:|:-------------------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alcance Planificado | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Avance Ejecutado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Administración | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### E.2 Capacidades por Rol en Avance Ejecutado

| Acción | webmaster | contratista | inspector | ingeniera_residente | directivo_hospital | ingenieria_hospital | visitante |
|--------|:---------:|:-----------:|:---------:|:-------------------:|:------------------:|:-------------------:|:--------:|
| Crear avance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar datos | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Aprobar Nivel 1 (Residente) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Aprobar Nivel 2 (Inspector) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Aprobar Nivel 3 (Directivo) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Rechazar (su nivel) | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Cadena de aprobación secuencial:** Nivel 1 (Ing. Residente declara concluida) → Nivel 2 (Inspector aprueba por MPPOP) → Nivel 3 (Directivo Hospital conformidad). El Webmaster puede aprobar cualquier nivel. Visitante: solo lectura, sin acciones.

### E.3 Capacidades por Rol en Alcance Planificado

| Acción | webmaster | contratista | inspector | ingeniera_residente | directivo_hospital | ingenieria_hospital | visitante |
|--------|:---------:|:-----------:|:---------:|:-------------------:|:------------------:|:-------------------:|:--------:|
| Ver | ✅ | ✅ (su UE) | ✅ | ✅ (su UE) | ❌ | ✅ | ✅ |
| Crear | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## F. Clientes Supabase — Uso y Seguridad

### F.1 Tres Clientes Diferentes

| Cliente | Archivo | Clave | RLS | Uso |
|---------|---------|-------|-----|-----|
| **Browser** | `src/lib/supabase/client.ts` | `ANON_KEY` | ✅ Sujeto | Solo para `onAuthStateChange` en auth-context |
| **Server** | `src/lib/supabase/server.ts` | `ANON_KEY` | ✅ Sujeto | API routes — opera como el usuario autenticado |
| **Admin** | `src/lib/supabase/admin.ts` | `SERVICE_ROLE_KEY` | ❌ Bypass | Solo operaciones admin y agregaciones |

### F.2 Uso del Admin Client (Service Role)

El admin client se usa EXCLUSIVAMENTE en estos endpoints:
- `/api/auth/register` — crear usuarios sin confirmación email
- `/api/admin/users` (GET/POST) — listar/crear usuarios
- `/api/admin/users/[id]` (PUT/DELETE) — modificar/eliminar usuarios
- `/api/admin/users/[id]/reset-password` — resetear contraseñas
- `/api/dashboard` — cálculo PAF global (agregación, bypass RLS)
- `/api/landing/stats` — estadísticas públicas landing
- `/api/init` — verificación/seed de la BD

> ⚠️ El admin client **NUNCA** debe exponerse al navegador. Solo se usa en API routes del servidor.

---

## G. Vulnerabilidades y Deuda Técnica Conocida

### G.1 Vulnerabilidades de Seguridad

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| VULN-001 | 🔴 CRÍTICA | ~~`/api/auth/register` sin autenticación~~ | ✅ CORREGIDO v2.0 |
| VULN-002 | 🟡 ALTA | ~~`/api/dashboard` sin autenticación — expone datos agregados del proyecto~~ | ✅ CORREGIDO v3.2.1 |
| VULN-003 | 🟡 ALTA | ~~`/api/init` sin autenticación — permite verificar y modificar la estructura de la BD~~ | ✅ CORREGIDO v3.2.1 |
| VULN-004 | 🟡 ALTA | ~~GET endpoints de negocio (`/api/alcance`, `/api/avance`) sin verificación de autenticación~~ | ✅ CORREGIDO v3.2.1 |
| VULN-005 | 🟠 MEDIA | ~~Storage `evidencias` con lectura pública~~ | ⚠️ PARCIAL v3.2.1 — RLS corregido pero bucket sigue público, URLs accesibles directamente |
| VULN-006 | 🟠 MEDIA | ~~API permite inspector POST en `/api/unidades-ejecutoras` pero RLS solo permite admin — inserción falla silenciosamente~~ | ✅ CORREGIDO v3.2.1 |
| VULN-007 | 🟢 BAJA | ~~Sin política de complejidad de contraseñas — solo mínimo 6 caracteres~~ | ✅ CORREGIDO v3.2.1 (mín 8, mayús, mín, núm, especial) |

### G.2 Deuda Técnica

| ID | Área | Descripción | Estado |
|----|------|-------------|--------|
| DEBT-001 | Config | ~~`ignoreBuildErrors: true` en next.config.ts — errores TypeScript ignorados~~ | ✅ CORREGIDO v3.2.1 |
| DEBT-002 | Config | ~~`reactStrictMode: false` — modo estricto deshabilitado~~ | ✅ CORREGIDO v3.2.1 |
| DEBT-003 | Deps | ~~`next-auth` instalado pero NO usado~~ | ✅ ELIMINADO v2.0 |
| DEBT-004 | Deps | ~~`zustand` instalado pero NO usado~~ | ✅ ELIMINADO v2.0 |
| DEBT-005 | Deps | ~~`@tanstack/react-query` instalado pero NO usado~~ | ✅ ELIMINADO v2.0 |
| DEBT-006 | Deps | ~~`next-intl` instalado pero NO usado~~ | ✅ ELIMINADO v2.0 |
| DEBT-007 | Deps | ~~`@mdxeditor/editor` instalado pero NO usado~~ | ✅ ELIMINADO v2.0 |
| DEBT-008 | Deps | ~~`prisma`/SQLite configurado pero NO usado en producción (solo Supabase)~~ | ✅ ELIMINADO v3.2.1 |
| DEBT-009 | BD | ~~Vistas SQL `v_paf_*` desincronizadas con TypeScript~~ | ✅ CORREGIDO v2.0 |
| DEBT-010 | Código | ~~`updated_at` se establece manualmente en PUT de alcance/avance — redundante con trigger~~ | ✅ CORREGIDO v3.2.1 |
| DEBT-011 | SQL | ~~`schema.sql` desincronizado con `setup-complete.sql` — drift entre archivos SQL~~ | ✅ CORREGIDO v3.2.1 (archivos legacy marcados con advertencias) |
| DEBT-012 | Refactor | ~~Archivos monolíticos: admin-view (1625), avance-view (1373), alcance-view (804)~~ | ✅ CORREGIDO v2.0 |
| DEBT-013 | Deps | ~~`react-markdown`, `react-syntax-highlighter`, `@reactuses/core` instalados pero NO usados~~ | ✅ ELIMINADO v2.0 |

---

## H. Flujo de Autenticación

### H.1 Ciclo de Vida del Usuario

```
1. Registro (admin crea usuario)
   POST /api/admin/users → adminClient.auth.admin.createUser()
                               ↓
                         Trigger: on_auth_user_created
                               ↓
                         handle_new_user() → INSERT profiles (básico)
                               ↓
                         API: UPSERT profiles (datos completos, onConflict: 'id')
                               ↓
                         debe_cambiar_password = true

2. Primer Login
   POST /api/auth/login → Verifica activo=true → Cookie SSR
                               ↓
                         AuthGuard detecta debe_cambiar_password=true
                               ↓
                         ChangePasswordForm → cambio forzado
                               ↓
                         debe_cambiar_password = false → acceso al sistema

3. Sesión Normal
   middleware.ts → updateSession() → refresh JWT cookie
                               ↓
                         AuthContext → onAuthStateChange (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
                               ↓
                         Tab-based navigation según rol
```

### H.2 Flujo de Aprobación de Avances — 3 Niveles Secuenciales

```
contratista/inspector/residente/webmaster → Crea Avance
    (aprobacion_residente: Pendiente, aprobacion_inspector: Pendiente,
     aprobacion_directivo: Pendiente, status_aprobacion: Pendiente)
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ NIVEL 1: Ingeniera Residente (declara concluida la obra)     │
│   Aprueba → aprobacion_residente: Aprobado, residente_id: user.id │
│   Rechaza → aprobacion_residente: Rechazado                  │
└──────────────────────────────────────────────────────────────┘
                               ↓ (requiere Nivel 1 Aprobado)
┌──────────────────────────────────────────────────────────────┐
│ NIVEL 2: Inspector MPPOP (aprueba por el ministerio)         │
│   Aprueba → aprobacion_inspector: Aprobado, inspector_id: user.id │
│   Rechaza → aprobacion_inspector: Rechazado                  │
└──────────────────────────────────────────────────────────────┘
                               ↓ (requiere Nivel 2 Aprobado)
┌──────────────────────────────────────────────────────────────┐
│ NIVEL 3: Directivo Hospital (conformidad del trabajo)        │
│   Aprueba → aprobacion_directivo: Aprobado, directivo_id: user.id │
│   Rechaza → aprobacion_directivo: Rechazado                  │
└──────────────────────────────────────────────────────────────┘
                               ↓
    status_aprobacion = Auto-computado:
      • Aprobado → si los 3 niveles son Aprobado
      • Rechazado → si algún nivel es Rechazado
      • Pendiente → en cualquier otro caso

    👑 Webmaster: puede aprobar CUALQUIER nivel (no necesita secuencia)
    👁️ Visitante: SOLO LECTURA — sin capacidad de crear, editar, aprobar o eliminar
```

---

## I. Variables de Entorno

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clave pública (anon) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Clave service role (admin) — SOLO servidor |
| `DATABASE_URL` | ⚠️ | Solo para Prisma/SQLite (dev local, NO producción) |

> ⚠️ No existe archivo `.env.example`. Las variables de Supabase se configuran directamente en Vercel.

---

## J. Archivos SQL de Supabase

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `supabase/schema.sql` | Schema completo combinado (steps 1-6) | 448 |
| `supabase/setup-complete.sql` | Teardown-rebuild completo | 296 |
| `supabase/step1-tables.sql` | Creación de enums y tablas | 80 |
| `supabase/step2-seed-data.sql` | Datos semilla | 72 |
| `supabase/step3-rls-policies.sql` | Habilitar RLS + todas las políticas | 152 |
| `supabase/step4-functions-triggers.sql` | Funciones y triggers | 53 |
| `supabase/step5-views.sql` | Vistas de cálculo PAF | 53 |
| `supabase/step6-storage.sql` | Bucket evidencias + políticas | 26 |
| `supabase/migration-new-roles.sql` | Agrega 3 roles + 3 columnas a profiles | 62 |
| `supabase/migration-inspector-alcance-policies.sql` | Inspector INSERT/UPDATE en alcance | 28 |
| `supabase/migration-inspector-avance-policies.sql` | Inspector INSERT en avance | 17 |
| `supabase/migrations/012_dashboard_ejecutoras_especialidades.sql` | Dashboard por Ejecutoras + Macro Especialidades + logo_url + tabla macro_especialidades | ~209 |
| `supabase/migrations/013_three_level_approval.sql` | Aprobación en 3 niveles (residente/inspector/directivo) + nuevas columnas + RLS por rol | ~75 |
| `supabase/migrations/014a_add_enum_values.sql` | Agrega `webmaster` y `visitante` al enum user_rol (DEBE ejecutarse primero, en transacción separada) | ~8 |
| `supabase/migrations/014b_migrate_data_and_policies.sql` | Migra perfiles administrador→webmaster + actualiza TODAS las políticas RLS con nuevos nombres de rol | ~210 |
| `supabase/migrations/015a_add_objecion_enum_values.sql` | Agrega `Objetado` y `Subsanado` al enum aprobacion_status | ~8 |
| `supabase/migrations/015b_add_objecion_fields.sql` | Agrega 6 campos de objeción/subsanación a avance_ejecutado + RLS | ~80 |
| `supabase/migrations/016_storage_and_rls_fixes.sql` | VULN-005: Storage lectura→autenticado + VULN-006: delete policy administrador→webmaster | ~25 |

---

## K. Reglas de Oro para la IA — Restricciones de Código

### K.1 Validación Doble (RLS + API)

> ⛔ **Está PROHIBIDO saltar el Row Level Security (RLS) de Supabase** en operaciones de usuario.
>
> - Las llamadas CRUD de usuarios normales **DEBEN** ir por el **cliente estándar** (server client), que está sujeto a RLS.
> - Solo las métricas globales agregadas del dashboard y las operaciones administrativas usan el **cliente admin** (service role).
> - Toda operación que use el admin client DEBE tener verificación de rol `webmaster` en la API route.
> - Al crear nuevas API routes, siempre verificar que el rol del usuario tenga permisos tanto en la API **como** en las políticas RLS.

### K.2 No Borrar Código Implícito

> ⛔ **Está ESTRICTAMENTE PROHIBIDO:**
>
> 1. Usar comentarios del tipo `// ... resto del código igual ...` o `// ... existing code ...`
> 2. Asumir que el usuario recordará lo que se borró
> 3. Omitir código existente al reescribir una función
> 4. Usar `// ... (código anterior sin cambios) ...`
>
> **Si se pide refactorizar una función, se DEBE reescribir o mantener TODO el código existente.** Cada línea de código funcional debe estar presente en el resultado final.

### K.3 No Crear Rutas Next.js Adicionales

> ⛔ **NO se deben crear rutas de Next.js** (`/dashboard`, `/admin`, etc.) para las vistas principales. Toda la navegación ocurre mediante Tabs de React en `page.tsx`.
>
> **Excepción:** Se pueden crear rutas API bajo `/api/` libremente.

### K.4 Upsert con onConflict para Profiles

> Al crear o actualizar profiles vía API, **SIEMPRE usar `upsert` con `onConflict: 'id'`** porque el trigger `handle_new_user()` puede haber creado ya el perfil básico. Un `insert` simple fallará con error de clave duplicada.

### K.5 Protección de Archivos SQL

> Los archivos SQL en `supabase/` representan el estado de la base de datos. **NO modificarlos sin actualizar también las políticas RLS correspondientes.** Cualquier cambio en tablas DEBE acompañarse de las políticas RLS apropiadas.

### K.6 Dependencias No Utilizadas

> ~~Las siguientes dependencias estaban instaladas pero NO se usaban: `next-auth`, `zustand`, `@tanstack/react-query`, `next-intl`, `@mdxeditor/editor`, `prisma` (en producción).~~ Todas han sido eliminadas en v2.0 y v3.2.1. **NO agregar código que use dependencias no listadas en package.json sin autorización explícita.** Priorizar las herramientas ya en uso.

### K.7 Patrón de Commit para Despliegue

> El sistema se despliega automáticamente en Vercel al hacer `git push` a la rama `main`. **Siempre verificar con `git status` y `git push` después de cambios significativos.** No asumir que los cambios locales se reflejan en producción.

---

## L. Registro de Snapshots y Control de Cambios

### L.1 Mecanismo Anti-Avería

> **ANTES de realizar cualquier cambio drástico en el código**, la IA DEBE:
>
> 1. **Actualizar este log de cambios** con la versión, descripción y estado
> 2. **Crear un Snapshot de Respaldo Mental** — documentar el estado actual de los archivos que se van a modificar
> 3. Si el nuevo código falla, la **directiva inmediata** será: **ignorar el último prompt y revertir el contexto al Snapshot anterior**
> 4. **NUNCA eliminar funcionalidad existente** sin migración explícita

### L.2 Tabla de Historial de Snapshots

| Versión Contexto | Fecha/Hora | Último Cambio Funcional Estable | Commit/Hito de Referencia | Estado del Sistema |
|:---|:---|:---|:---|:---|
| v1.0.0 (Base) | 29-May-2026 | Estructura base post-auditoría. Todos los roles operativos. Inspector con CRUD en alcance y avance. | Inicial | ✅ Operativo en Vercel |
| v1.1.0 | 29-May-2026 | Agregar permisos de inspector para alcance_planificado (RLS + API) | `fix: add detailed error logging` | ✅ Operativo |
| v1.2.0 | 29-May-2026 | Agregar permisos de inspector para avance_ejecutado (RLS + API + UI) | Push a GitHub para deploy | ✅ Operativo |
| v1.3.0 | 29-May-2026 | Fix: upsert profiles con onConflict para handle_new_user trigger | `fix: change profile insert to upsert` | ✅ Operativo |
| v1.4.0 | 29-May-2026 | Fix: reset password admin + Dialog accessibility warnings | `fix: add detailed error logging and fix Dialog accessibility` | ✅ Operativo |
| **v2.0.0** | **29-May-2026** | **Auditoría técnica + corrección hallazgos críticos:** VULN-001 corregido (register requiere admin), 8 deps eliminadas, SQL views sincronizadas, 3 monolitos refactorizados (20 archivos nuevos) | **Audit+Fix+Refactor** | ✅ Operativo |
| v2.1.0 | 04-Jun-2026 | Dashboard con 3 sub-tabs (Vista General, Ejecutoras, Macro Especialidades) + logo_url en unidades_ejecutoras + tabla macro_especialidades | Migración 012 + push | ✅ Operativo |
| **v3.0.0** | **04-Jun-2026** | **Aprobación en 3 niveles:** Nivel 1=Ing. Residente (declara concluida), Nivel 2=Inspector MPPOP (aprueba por ministerio), Nivel 3=Directivo Hospital (conformidad). Admin aprueba cualquier nivel. Aprobación secuencial obligatoria. status_aprobacion auto-computado. UI con indicador visual de cadena de aprobación. | **Migración 013 + push** | ✅ Operativo |
| **v3.1.0** | **04-Jun-2026** | **Rol Visitante + Renombrar Administrador→Webmaster + Dominio personalizado:** (1) Nuevo rol `visitante` solo lectura para autoridades, (2) `administrador` renombrado a `webmaster` (evitar confusión con pestaña Administración/Finanzas), (3) Dominio propio `obras.hospitaljmdelosrios.org.ve` vía CNAME→Vercel, (4) Migración 014 dividida en 014a (enum) + 014b (datos+RLS) por restricción PostgreSQL de enum values en transacción, (5) Fix: `visitante` agregado a VALID_ROLES en API `/api/admin/users` y `/api/admin/users/[id]`, (6) Manual de usuario actualizado a v3.1 con nuevo dominio, rol webmaster, rol visitante, fecha mayo 2026 | **Migraciones 014a+014b + fixes + push** | ✅ Operativo |
| **v3.2.0** | **04-Jun-2026** | **Sistema de Objeción/Subsanación:** (1) Nuevos estados `Objetado` y `Subsanado` en enum `aprobacion_status`, (2) 6 campos nuevos en `avance_ejecutado`: `motivo_objecion_*` y `notas_subsanacion_*` por nivel, (3) Revisor puede objetar con motivo obligatorio (intermedio entre aprobar y rechazar), (4) Creador del avance puede declarar objeción como subsanada, (5) Revisor re-evalúa tras subsanación (puede aprobar, objetar de nuevo o rechazar), (6) `status_aprobacion` auto-computado con nueva prioridad: Rechazado > Objetado > Subsanado > Aprobado > Pendiente, (7) Webmaster puede revertir cualquier nivel a Pendiente, (8) UI: botón Objetar (naranja), sección de subsanación, indicadores visuales en tabla y diálogo, (9) Filtros de estado actualizados con Objetado y Subsanado | **Migraciones 015a+015b + push** | ✅ Operativo |
| **v3.2.1** | **04-Jun-2026** | **Security Hardening + Technical Debt Cleanup:** (1) VULN-002: `/api/dashboard` (3 endpoints) requieren autenticación, (2) VULN-003: `/api/init` requiere rol webmaster, (3) VULN-004: GET `/api/alcance` y `/api/avance` (4 endpoints) requieren autenticación, (4) VULN-005: Storage `evidencias` lectura cambiada de público a autenticado (migración 016), (5) VULN-006: API unidades-ejecutoras alineada con RLS (solo webmaster), (6) VULN-007: Política de complejidad de contraseñas (mín 8, mayús, mín, núm, especial), (7) DEBT-001: `ignoreBuildErrors` deshabilitado, (8) DEBT-002: `reactStrictMode` habilitado, (9) DEBT-008: Prisma/SQLite eliminados del proyecto, (10) DEBT-010: `updated_at` manual redundante eliminado, (11) DEBT-011: Archivos SQL legacy marcados con advertencias de obsolescencia | **Migración 016 + deps cleanup + push** | ✅ Operativo |
| **v3.2.2** | **04-Jun-2026** | **Fix:** Restaurar `/api/upload` eliminado accidentalmente (causaba 404 al subir evidencias). VULN-005 reclasificado como PARCIAL (bucket público, URLs accesibles directamente). | **Push** | ✅ Operativo |

### L.3 Próximo Snapshot (Plantilla)

```markdown
| v_X.X.X | [FECHA] | [DESCRIPCIÓN DEL CAMBIO] | [COMMIT/REFERENCIA] | [ESTADO] |
```

### L.4 Snapshot de Respaldo Mental — Plantilla

Antes de cada cambio significativo, documentar:

```markdown
### Snapshot Pre-Cambio — [FECHA]
**Cambio planificado:** [DESCRIPCIÓN]
**Archivos afectados:**
- [archivo1] — [líneas/código que se modifica]
- [archivo2] — [líneas/código que se modifica]
**Rollback plan:** [Cómo revertir si falla]
**Estado pre-cambio:** [✅/⚠️/❌]
```

---

## M. Apéndices

### M.1 Estructura de Directorios (Resumen)

```
src/
├── app/
│   ├── page.tsx              # SPA shell (~411 líneas)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Estilos globales
│   └── api/                  # 24 route handlers
│       ├── auth/             # login, register (admin-only), logout, me, change-password
│       ├── alcance/          # CRUD alcance planificado
│       ├── avance/           # CRUD avance ejecutado
│       ├── dashboard/        # Dashboard aggregation (usa SQL views)
│       ├── admin/users/      # User management
│       ├── especialidades/   # CRUD especialidades
│       ├── sectores/         # CRUD sectores
│       ├── subsectores/      # CRUD subsectores
│       ├── unidades-ejecutoras/ # CRUD UEs
│       ├── landing/stats/    # Public landing stats (usa SQL views)
│       └── init/             # DB initialization
├── components/
│   ├── admin/                # 8 archivos (admin-view + 5 tabs + types + shared-ui)
│   ├── alcance/              # 6 archivos (alcance-view + filters + table + form + dialogs + types)
│   ├── avance/               # 6 archivos (avance-view + filters + table + form-fields + dialogs + types)
│   ├── dashboard/            # Dashboard + KPIs + Heatmap + Chart
│   ├── landing/              # LandingPage + 5 secciones
│   ├── auth-guard.tsx        # Route protection
│   ├── login-form.tsx        # Login form
│   ├── change-password-form.tsx # Forced password change
│   └── ui/                   # 48 shadcn/ui components
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── lib/
    ├── auth-context.tsx       # Auth React Context
    ├── types.ts               # TypeScript interfaces
    ├── utils.ts               # cn() utility
    ├── db.ts                  # Prisma client (unused in prod)
    └── supabase/
        ├── client.ts          # Browser client (ANON_KEY)
        ├── server.ts          # Server client (ANON_KEY + cookies)
        ├── admin.ts           # Admin client (SERVICE_ROLE_KEY)
        └── middleware.ts      # Session refresh helper
```

### M.2 Interfaces TypeScript Principales (src/lib/types.ts)

```typescript
// Perfil de usuario
interface Profile {
  id: string;
  nombre_completo: string;
  rol: 'webmaster' | 'contratista' | 'inspector' | 'ingeniera_residente' | 'directivo_hospital' | 'ingenieria_hospital' | 'visitante';
  unidad_ejecutora_id: string | null;
  telefono: string | null;
  ente_pertenece: string | null;
  debe_cambiar_password: boolean;
  activo: boolean;
}

// Alcance planificado
interface AlcancePlanificado {
  id: string;
  especialidad_id: string;
  subsector_id: string;
  descripcion: string;
  peso_relativo: number;
  unidad_medida: string;
  cantidad_planificada: number;
  unidad_ejecutora_id: string | null;
  status: 'Activo' | 'Completado' | 'Suspendido';
}

// Avance ejecutado
interface AvanceEjecutado {
  id: string;
  alcance_id: string;
  cantidad_reportada: number;
  tipo_trabajo: 'Planificado' | 'Imprevisto';
  fecha_reporte: string;
  fotos_evidencia_urls: string[];
  notas: string | null;
  inspector_id: string | null;
  residente_id: string | null;
  directivo_id: string | null;
  status_aprobacion: 'Pendiente' | 'Aprobado' | 'Rechazado';
  aprobacion_residente: 'Pendiente' | 'Aprobado' | 'Rechazado';
  aprobacion_inspector: 'Pendiente' | 'Aprobado' | 'Rechazado';
  aprobacion_directivo: 'Pendiente' | 'Aprobado' | 'Rechazado';
  // Joined fields
  alcance?: AlcancePlanificado;
  inspector?: Profile;
  residente?: Profile;
  directivo?: Profile;
}
```

### M.3 Archivos Estáticos (public/)

| Ruta | Descripción |
|------|-------------|
| `/VSOPS.png` | Logo VSOPS (rectangular) |
| `/logo_hospital.png` | Logo del hospital |
| `/logo_ministerio.png` | Logo del ministerio |
| `/logo.svg` | Logo SVG |
| `/instituciones/*.png` | 9 logos de instituciones asociadas |
| `/obras/*.jpeg` | 9 fotos de obras |
| `/Informe_Tecnico_Auditoria_ObrasJM.pdf` | Informe de auditoría técnica |
| `/Manual_Usuario_ObrasJM_v3.1.pdf` | Manual de usuario v3.1 (webmaster, visitante, dominio propio) |
| `/Manual_Usuario_ObrasJM_v3.html` | Fuente HTML del manual v3.1 |
| `/Manual_Usuario_ObrasJM_v2.pdf` | Manual de usuario v2 (obsoleto) |

---

## N. Protocolo de Actualización de este Documento

> Este archivo `MEMORY.md` DEBE actualizarse en los siguientes casos:
>
> 1. ✅ **Antes de cada cambio significativo** — Crear Snapshot Pre-Cambio
> 2. ✅ **Después de cada cambio exitoso** — Actualizar tabla de Snapshots
> 3. ✅ **Al agregar/modificar tablas de BD** — Actualizar sección C
> 4. ✅ **Al agregar/modificar API routes** — Actualizar sección D
> 5. ✅ **Al agregar/modificar roles o permisos** — Actualizar sección E y C.4
> 6. ✅ **Al descubrir nuevas vulnerabilidades o deuda técnica** — Actualizar sección G
> 7. ✅ **Al modificar la estructura de componentes** — Actualizar sección B
>
> ⛔ **NUNCA eliminar secciones de este documento.** Si una sección queda obsoleta, marcarla como `[DEPRECATED]` pero conservarla para referencia histórica.

---

*Documento generado: Mayo 2026 — Versión v2.0.0*
*Última actualización: 04-Jun-2026 — v3.2.1 — Security Hardening + Technical Debt Cleanup*
*Próxima revisión programada: Antes de cualquier cambio significativo al sistema*
