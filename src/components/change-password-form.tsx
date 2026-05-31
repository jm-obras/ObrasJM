'use client'

import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, KeyRound, ShieldAlert } from 'lucide-react'

export function ChangePasswordForm() {
  const { changePassword, signOut, user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // VULN-007 FIX: Client-side password complexity validation
    const errors: string[] = []
    if (newPassword.length < 8) errors.push('al menos 8 caracteres')
    if (!/[A-Z]/.test(newPassword)) errors.push('una letra mayúscula')
    if (!/[a-z]/.test(newPassword)) errors.push('una letra minúscula')
    if (!/[0-9]/.test(newPassword)) errors.push('un número')
    if (!/[!@#$%^&*()_+\-=\[\]{};'":"\\|,.<>\/?]/.test(newPassword)) errors.push('un carácter especial')
    if (errors.length > 0) {
      setError(`La contraseña debe tener: ${errors.join(', ')}`)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setIsLoading(true)
    const result = await changePassword(currentPassword, newPassword)
    if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-amber-50/30 px-4 py-8">
      <Card className="w-full max-w-md border-amber-200">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Cambio de Contraseña Requerido
          </h1>
          <p className="text-sm text-muted-foreground">
            Por seguridad, debe cambiar su contraseña antes de continuar.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Usuario: <span className="font-medium">{user?.email}</span>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="current-password" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Contraseña Actual
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-password" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Nueva Contraseña
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 8 caracteres, mayús, mín, núm, especial"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repetir nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <KeyRound />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            Cerrar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
