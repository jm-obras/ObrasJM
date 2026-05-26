'use client'

import { useAuth } from '@/lib/auth-context'
import { LandingPage } from '@/components/landing/landing-page'
import { ChangePasswordForm } from '@/components/change-password-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, debe_cambiar_password } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Not logged in: show the landing page (with login modal)
  if (!user) {
    return <LandingPage />
  }

  // Must change password: show the change password form
  if (debe_cambiar_password) {
    return <ChangePasswordForm />
  }

  return <>{children}</>
}
