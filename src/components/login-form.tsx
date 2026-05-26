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
import { Loader2, LogIn } from 'lucide-react'

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          {/* Dos logos: VSOPS (izquierda) + Hospital (derecha) */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/VSOPS.png"
              alt="VSOPS"
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
            />
            <img
              src="/logo_hospital.png"
              alt="Hospital J.M. de los Ríos"
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            ObrasJM
          </h1>
          <p className="text-sm text-muted-foreground">
            Hospital J.M. de los Ríos
          </p>
          <p className="text-xs text-muted-foreground/80">
            Sistema de Control de Avance Físico
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
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hospital J.M. de los Ríos
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
