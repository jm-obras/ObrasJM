'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { AlcanceView } from '@/components/alcance/alcance-view'
import { AvanceView } from '@/components/avance/avance-view'
import { AdminView } from '@/components/admin/admin-view'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck,
  Settings,
  LogOut,
  User,
  Building2,
  ChevronDown,
  KeyRound,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, ShieldAlert } from 'lucide-react'

type TabKey = 'dashboard' | 'alcance' | 'avance' | 'admin'

interface TabConfig {
  key: TabKey
  label: string
  icon: React.ElementType
  roles: string[]
}

const TABS: TabConfig[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'contratista', 'inspector', 'ingeniera_residente', 'directivo_hospital', 'ingenieria_hospital'] },
  { key: 'alcance', label: 'Alcance Planificado', icon: ClipboardList, roles: ['administrador', 'inspector', 'contratista', 'ingeniera_residente', 'ingenieria_hospital'] },
  { key: 'avance', label: 'Avance Ejecutado', icon: FileCheck, roles: ['administrador', 'contratista', 'inspector', 'ingeniera_residente', 'directivo_hospital', 'ingenieria_hospital'] },
  { key: 'admin', label: 'Administración', icon: Settings, roles: ['administrador'] },
]

const ROL_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  contratista: 'Contratista',
  inspector: 'Inspector',
  ingeniera_residente: 'Ing. Residente',
  directivo_hospital: 'Directivo Hospital',
  ingenieria_hospital: 'Ing. Hospital',
}

const ROL_COLORS: Record<string, string> = {
  administrador: 'bg-purple-100 text-purple-800 border-purple-200',
  contratista: 'bg-sky-100 text-sky-800 border-sky-200',
  inspector: 'bg-amber-100 text-amber-800 border-amber-200',
  ingeniera_residente: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  directivo_hospital: 'bg-rose-100 text-rose-800 border-rose-200',
  ingenieria_hospital: 'bg-orange-100 text-orange-800 border-orange-200',
}

function AppContent() {
  const { profile, user, signOut, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setPasswordLoading(true)
    const result = await changePassword(currentPassword, newPassword)
    if (result.error) {
      setPasswordError(result.error)
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordSuccess(false)
      }, 2000)
    }
    setPasswordLoading(false)
  }

  const handleCloseChangePassword = () => {
    setShowChangePassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordSuccess(false)
  }

  const availableTabs = TABS.filter(tab => 
    tab.roles.includes(profile?.rol || '')
  )

  const renderContent = () => {
    if (!profile) return null

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />
      case 'alcance':
        return <AlcanceView profile={profile} />
      case 'avance':
        return <AvanceView profile={profile} />
      case 'admin':
        return <AdminView profile={profile} />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <img
                  src="/VSOPS.png"
                  alt="VSOPS"
                  className="h-7 w-auto sm:h-9 object-contain"
                />
                <img
                  src="/logo_hospital.png"
                  alt="Hospital J.M. de los Ríos"
                  className="h-7 w-7 sm:h-9 sm:w-9 object-contain"
                />
              </div>
              <Separator orientation="vertical" className="h-8 hidden sm:block" />
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-sm font-bold leading-tight truncate">
                  ObrasJM
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  Hospital J.M. de los Ríos — Control PAF
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 mx-4">
              {availableTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <Button
                    key={tab.key}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`gap-2 text-sm ${isActive ? '' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant="outline"
                className={`${ROL_COLORS[profile?.rol || 'contratista']} text-[10px] px-2 py-0.5 hidden sm:inline-flex`}
              >
                {ROL_LABELS[profile?.rol || 'contratista']}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                      {profile?.nombre_completo || user?.email}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {profile?.ente_pertenece && (
                      <p className="text-xs text-muted-foreground mt-0.5">{profile.ente_pertenece}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="sm:hidden">
                    <Badge variant="outline" className={`${ROL_COLORS[profile?.rol || 'contratista']} text-[10px]`}>
                      {ROL_LABELS[profile?.rol || 'contratista']}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Cambiar Contraseña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="flex overflow-x-auto px-2 py-1 gap-1 scrollbar-hide">
            {availableTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <Button
                  key={tab.key}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-1.5 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderContent()}
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={(open) => { if (!open) handleCloseChangePassword() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription>
              Actualice su contraseña de acceso al sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="grid gap-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            {passwordSuccess && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>Contraseña actualizada exitosamente.</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="cp-current-password" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Contraseña Actual
              </Label>
              <Input
                id="cp-current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={passwordLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cp-new-password" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Nueva Contraseña
              </Label>
              <Input
                id="cp-new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={passwordLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cp-confirm-password" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id="cp-confirm-password"
                type="password"
                placeholder="Repetir nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={passwordLoading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseChangePassword}
                disabled={passwordLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Cambiar Contraseña
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sticky Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                © 2026 OBRASJM. Todos los derechos reservados.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              IT Development by <a href="https://github.com/libnimaster" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">@libnimaster</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  )
}
