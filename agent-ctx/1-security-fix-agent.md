# Task 1 - Security Fix Agent: VULN-001

## Task
Fix VULN-001 — Add authentication to /api/auth/register

## Summary
The `/api/auth/register` endpoint had NO authentication check, allowing anyone to create accounts with any role including `administrador`. This was a critical security vulnerability.

## Changes Made

### `/home/z/my-project/src/app/api/auth/register/route.ts`
Added authentication & authorization check at the beginning of the POST handler:
1. Verify session via `createClient` from `@/lib/supabase/server` and `supabase.auth.getUser()`
2. Return 401 if no authenticated user
3. Fetch profile and check `rol === 'administrador'`
4. Return 403 if not admin

The pattern matches the one used in `/api/admin/users/route.ts`.

Also renamed the inner `profileError` variable to `upsertProfileError` to avoid shadowing.

### `/home/z/my-project/src/lib/auth-context.tsx`
No changes needed. The `signUp` function remains as-is. Since the backend now requires admin auth, the function will naturally only succeed for admin users — which is the intended behavior.

## Verification
- Lint check passes (`bun run lint` — no errors)
- Dev server compiles without issues related to this change
