# Worklog - ObrasJM Project

## Task 4 - API Routes (Completed by API Agent)

### Summary
Created all 16 API route files for the ObrasJM hospital construction tracking system.

### Files Created

#### Auth Routes (4 files)
- `src/app/api/auth/login/route.ts` - POST: Sign in with email/password, returns user + profile, checks if user is active
- `src/app/api/auth/register/route.ts` - POST: Register new user via admin client (bypasses email confirmation), creates profile entry, cleans up auth user on profile creation failure
- `src/app/api/auth/logout/route.ts` - POST: Sign out via Supabase Auth
- `src/app/api/auth/me/route.ts` - GET: Returns current authenticated user + profile data

#### Catalog Routes (4 files)
- `src/app/api/especialidades/route.ts` - GET: List all especialidades ordered by nombre
- `src/app/api/sectores/route.ts` - GET: List all sectores with nested subsectores, ordered by codigo
- `src/app/api/subsectores/route.ts` - GET: List subsectores with sector join, optional ?sector_id filter
- `src/app/api/unidades-ejecutoras/route.ts` - GET: List active unidades ejecutoras; POST: Create (admin/inspector only)

#### Alcance Routes (2 files)
- `src/app/api/alcance/route.ts` - GET: List with filters (especialidad_id, subsector_id, sector_id, status), joined data; POST: Create (admin/inspector only)
- `src/app/api/alcance/[id]/route.ts` - GET: Single with joins; PUT: Update (admin/inspector); DELETE: Delete (admin only)

#### Avance Routes (2 files)
- `src/app/api/avance/route.ts` - GET: List with filters (alcance_id, status_aprobacion, fecha range), joined data; POST: Create (contratista/admin only)
- `src/app/api/avance/[id]/route.ts` - GET: Single with joins; PUT: Update (contratistas can update fields, inspectors can approve/reject)

#### Dashboard Route (1 file)
- `src/app/api/dashboard/route.ts` - GET: KPI data using admin client (PAF global, frentes activos, alertas, PAF by sector, PAF by subsector)

#### Upload Route (1 file)
- `src/app/api/upload/route.ts` - POST: Upload evidence photos to Supabase Storage 'evidencias' bucket, validates type/size, returns public URL

#### Admin Routes (2 files)
- `src/app/api/admin/users/route.ts` - GET: List all users with profiles (admin only); POST: Create user (admin only)
- `src/app/api/admin/users/[id]/route.ts` - PUT: Update user auth + profile (admin only); DELETE: Delete user (admin only, no self-deletion)

### Key Implementation Details
- All routes use `createClient()` from `@/lib/supabase/server` (awaited) for standard operations
- Admin operations use `createAdminClient()` from `@/lib/supabase/admin` (no await needed)
- Role-based access control implemented on all mutation endpoints
- Proper HTTP status codes: 200, 201, 400, 401, 403, 404, 500
- Consistent error response format: `{ error: string }`
- Consistent success format: `{ data: T }`
- Next.js 16 dynamic route params use `Promise<{ id: string }>` pattern (awaited)
- Lint: All files pass with zero errors
