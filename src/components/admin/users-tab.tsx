'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Shield,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Profile, UserRol, UnidadEjecutora } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ITEMS_PER_PAGE, ROL_COLORS, ROL_LABELS, emptyUserForm } from './admin-types'
import type { UserWithProfile, UserFormData, EditUserFormData } from './admin-types'
import { TableSkeleton, EmptyState, PaginationControls } from './shared-ui'

interface UsersTabProps {
  profile: Profile
  unidadesEjecutoras: UnidadEjecutora[]
}

export function UsersTab({ profile, unidadesEjecutoras }: UsersTabProps) {
  // ===== Data State =====
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== Pagination =====
  const [usersPage, setUsersPage] = useState(1)

  // ===== User Dialogs =====
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; temp_password: string } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null)
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm)
  const [editUserForm, setEditUserForm] = useState<EditUserFormData>({
    nombre_completo: '',
    rol: 'contratista',
    unidad_ejecutora_id: '',
    telefono: '',
    ente_pertenece: '',
    activo: true,
  })

  // ===== FETCH =====
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok && data.data) {
        setUsers(data.data)
      } else {
        toast.error(data.error || 'Error cargando usuarios')
      }
    } catch {
      toast.error('Error cargando usuarios')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ===== HELPERS =====
  const getUnidadNombre = (id: string | null) => {
    if (!id) return '—'
    const unidad = unidadesEjecutoras.find((u) => u.id === id)
    return unidad?.nombre || '—'
  }

  // ===== PAGINATION =====
  const totalUsersPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE))
  const paginatedUsers = users.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)

  // ===== HANDLERS =====
  const handleAddUserOpen = () => { setUserForm(emptyUserForm); setShowAddUserDialog(true) }
  const handleEditUserOpen = (user: UserWithProfile) => {
    setSelectedUser(user)
    setEditUserForm({
      nombre_completo: user.profile?.nombre_completo || '',
      rol: user.profile?.rol || 'contratista',
      unidad_ejecutora_id: user.profile?.unidad_ejecutora_id || '',
      telefono: user.profile?.telefono || '',
      ente_pertenece: user.profile?.ente_pertenece || '',
      activo: user.profile?.activo ?? true,
    })
    setShowEditUserDialog(true)
  }
  const handleDeleteUserOpen = (user: UserWithProfile) => { setSelectedUser(user); setShowDeleteUserDialog(true) }
  const handleResetPasswordOpen = (user: UserWithProfile) => {
    setSelectedUser(user)
    setResetPasswordResult(null)
    setCopiedPassword(false)
    setShowResetPasswordDialog(true)
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResetPasswordResult(data.data)
        setCopiedPassword(false)
      } else {
        toast.error(data.error || 'Error al resetear contraseña')
        setShowResetPasswordDialog(false)
      }
    } catch {
      toast.error('Error de conexión')
      setShowResetPasswordDialog(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyPassword = () => {
    if (resetPasswordResult?.temp_password) {
      navigator.clipboard.writeText(resetPasswordResult.temp_password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.nombre_completo || !userForm.rol) {
      toast.error('Complete todos los campos requeridos'); return
    }
    if (userForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userForm.email, password: userForm.password,
          nombre_completo: userForm.nombre_completo, rol: userForm.rol,
          unidad_ejecutora_id: userForm.unidad_ejecutora_id || null,
          telefono: userForm.telefono || null,
          ente_pertenece: userForm.ente_pertenece || null,
        }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Usuario creado exitosamente'); setShowAddUserDialog(false); fetchUsers() }
      else { toast.error(data.error || 'Error al crear usuario') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        nombre_completo: editUserForm.nombre_completo, rol: editUserForm.rol,
        unidad_ejecutora_id: editUserForm.unidad_ejecutora_id || null,
        telefono: editUserForm.telefono || null,
        ente_pertenece: editUserForm.ente_pertenece || null,
        activo: editUserForm.activo,
      }
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Usuario actualizado exitosamente'); setShowEditUserDialog(false); fetchUsers() }
      else { toast.error(data.error || 'Error al actualizar usuario') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Usuario eliminado exitosamente'); setShowDeleteUserDialog(false); fetchUsers() }
      else { toast.error(data.error || 'Error al eliminar usuario') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Gestión de Usuarios
            </CardTitle>
            <Button onClick={handleAddUserOpen} className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Usuario</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Unidad Ejecutora</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ente</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableSkeleton cols={8} />
                ) : paginatedUsers.length === 0 ? (
                  <EmptyState icon={Users} message="No se encontraron usuarios" />
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.profile?.nombre_completo || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROL_COLORS[user.profile?.rol || 'contratista']}>
                          {ROL_LABELS[user.profile?.rol || 'contratista']}
                        </Badge>
                      </TableCell>
                      <TableCell>{getUnidadNombre(user.profile?.unidad_ejecutora_id || null)}</TableCell>
                      <TableCell>{user.profile?.telefono || '\u2014'}</TableCell>
                      <TableCell>{user.profile?.ente_pertenece || '\u2014'}</TableCell>
                      <TableCell>
                        {user.profile?.activo ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Activo</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResetPasswordOpen(user)} title="Resetear contraseña" disabled={user.id === profile.id}>
                            <KeyRound className="h-4 w-4" /><span className="sr-only">Resetear Contraseña</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUserOpen(user)}>
                            <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteUserOpen(user)} disabled={user.id === profile.id}>
                            <Trash2 className="h-4 w-4" /><span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={usersPage}
            totalPages={totalUsersPages}
            totalItems={users.length}
            onPageChange={setUsersPage}
          />
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Complete el formulario para crear un nuevo usuario del sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input id="user-email" type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="correo@ejemplo.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">Contraseña *</Label>
              <Input id="user-password" type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-nombre">Nombre Completo *</Label>
              <Input id="user-nombre" value={userForm.nombre_completo} onChange={(e) => setUserForm((p) => ({ ...p, nombre_completo: e.target.value }))} placeholder="Nombre y apellido" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="user-rol">Rol *</Label>
                <Select value={userForm.rol} onValueChange={(val) => setUserForm((p) => ({ ...p, rol: val as UserRol }))}>
                  <SelectTrigger id="user-rol"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="contratista">Contratista</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="ingeniera_residente">Ing. Residente</SelectItem>
                    <SelectItem value="directivo_hospital">Directivo Hospital</SelectItem>
                    <SelectItem value="ingenieria_hospital">Ing. Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-unidad">Unidad Ejecutora</Label>
                <Select value={userForm.unidad_ejecutora_id} onValueChange={(val) => setUserForm((p) => ({ ...p, unidad_ejecutora_id: val }))}>
                  <SelectTrigger id="user-unidad"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {unidadesEjecutoras.map((u) => (<SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="user-telefono">Teléfono</Label>
                <Input id="user-telefono" value={userForm.telefono} onChange={(e) => setUserForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-ente">Ente al que pertenece</Label>
                <Input id="user-ente" value={userForm.ente_pertenece} onChange={(e) => setUserForm((p) => ({ ...p, ente_pertenece: e.target.value }))} placeholder="Nombre del ente" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifique los campos que desea actualizar para {selectedUser?.profile?.nombre_completo || selectedUser?.email}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nombre Completo</Label>
              <Input id="edit-nombre" value={editUserForm.nombre_completo} onChange={(e) => setEditUserForm((p) => ({ ...p, nombre_completo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-rol">Rol</Label>
                <Select value={editUserForm.rol} onValueChange={(val) => setEditUserForm((p) => ({ ...p, rol: val as UserRol }))}>
                  <SelectTrigger id="edit-rol"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="contratista">Contratista</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="ingeniera_residente">Ing. Residente</SelectItem>
                    <SelectItem value="directivo_hospital">Directivo Hospital</SelectItem>
                    <SelectItem value="ingenieria_hospital">Ing. Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad">Unidad Ejecutora</Label>
                <Select value={editUserForm.unidad_ejecutora_id} onValueChange={(val) => setEditUserForm((p) => ({ ...p, unidad_ejecutora_id: val }))}>
                  <SelectTrigger id="edit-unidad"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {unidadesEjecutoras.map((u) => (<SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input id="edit-telefono" value={editUserForm.telefono} onChange={(e) => setEditUserForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ente">Ente al que pertenece</Label>
                <Input id="edit-ente" value={editUserForm.ente_pertenece} onChange={(e) => setEditUserForm((p) => ({ ...p, ente_pertenece: e.target.value }))} placeholder="Nombre del ente" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="edit-activo" checked={editUserForm.activo} onCheckedChange={(checked) => setEditUserForm((p) => ({ ...p, activo: checked }))} />
              <Label htmlFor="edit-activo" className="cursor-pointer">Usuario activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateUser} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario &ldquo;{selectedUser?.profile?.nombre_completo || selectedUser?.email}&rdquo; del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={(open) => { if (!open && !submitting) setShowResetPasswordDialog(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Resetear Contraseña
            </DialogTitle>
            <DialogDescription>
              {resetPasswordResult
                ? 'La contraseña ha sido reseteada exitosamente.'
                : `Se generará una nueva contraseña temporal para "${selectedUser?.profile?.nombre_completo || selectedUser?.email}". El usuario deberá cambiarla al iniciar sesión.`}
            </DialogDescription>
          </DialogHeader>

          {resetPasswordResult ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-amber-50 p-4 space-y-3">
                <div className="grid gap-1.5">
                  <p className="text-xs font-medium text-amber-800">Usuario</p>
                  <p className="text-sm font-mono text-amber-900">{resetPasswordResult.email}</p>
                </div>
                <div className="grid gap-1.5">
                  <p className="text-xs font-medium text-amber-800">Nueva Contraseña Temporal</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white px-3 py-2 text-base font-mono font-bold text-amber-900 border border-amber-200 select-all">
                      {resetPasswordResult.temp_password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={handleCopyPassword}
                    >
                      {copiedPassword ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-800">
                  Importante: Comparta esta contraseña al usuario de forma segura. Al iniciar sesión, el sistema le solicitará cambiarla obligatoriamente.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowResetPasswordDialog(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reseteando...</> : <><KeyRound className="mr-2 h-4 w-4" />Resetear Contraseña</>}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
