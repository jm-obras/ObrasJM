'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  Building2,
  Shield,
  FileText,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ITEMS_PER_PAGE = 10

const ROL_COLORS: Record<UserRol, string> = {
  administrador: 'bg-purple-100 text-purple-800 border-purple-200',
  contratista: 'bg-sky-100 text-sky-800 border-sky-200',
  inspector: 'bg-amber-100 text-amber-800 border-amber-200',
}

const ROL_LABELS: Record<UserRol, string> = {
  administrador: 'Administrador',
  contratista: 'Contratista',
  inspector: 'Inspector',
}

interface UserWithProfile {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  profile: Profile | null
}

interface UserFormData {
  email: string
  password: string
  nombre_completo: string
  rol: UserRol
  unidad_ejecutora_id: string
}

interface EditUserFormData {
  nombre_completo: string
  rol: UserRol
  unidad_ejecutora_id: string
  activo: boolean
}

interface UnidadFormData {
  nombre: string
  rif: string
  contacto: string
}

const emptyUserForm: UserFormData = {
  email: '',
  password: '',
  nombre_completo: '',
  rol: 'contratista',
  unidad_ejecutora_id: '',
}

const emptyUnidadForm: UnidadFormData = {
  nombre: '',
  rif: '',
  contacto: '',
}

interface AdminViewProps {
  profile: Profile
}

export function AdminView({ profile }: AdminViewProps) {
  // Users
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutora[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingUnidades, setLoadingUnidades] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Users pagination
  const [usersPage, setUsersPage] = useState(1)

  // User dialogs
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null)
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm)
  const [editUserForm, setEditUserForm] = useState<EditUserFormData>({
    nombre_completo: '',
    rol: 'contratista',
    unidad_ejecutora_id: '',
    activo: true,
  })

  // Unidad dialogs
  const [showAddUnidadDialog, setShowAddUnidadDialog] = useState(false)
  const [showEditUnidadDialog, setShowEditUnidadDialog] = useState(false)
  const [showDeleteUnidadDialog, setShowDeleteUnidadDialog] = useState(false)
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadEjecutora | null>(null)
  const [unidadForm, setUnidadForm] = useState<UnidadFormData>(emptyUnidadForm)

  // Fetch users
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

  // Fetch unidades ejecutoras
  const fetchUnidades = useCallback(async () => {
    setLoadingUnidades(true)
    try {
      const res = await fetch('/api/unidades-ejecutoras')
      const data = await res.json()

      if (res.ok && data.data) {
        setUnidadesEjecutoras(data.data)
      } else {
        toast.error(data.error || 'Error cargando unidades ejecutoras')
      }
    } catch {
      toast.error('Error cargando unidades ejecutoras')
    } finally {
      setLoadingUnidades(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchUnidades()
  }, [fetchUsers, fetchUnidades])

  // Users pagination
  const totalUsersPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE))
  const paginatedUsers = users.slice(
    (usersPage - 1) * ITEMS_PER_PAGE,
    usersPage * ITEMS_PER_PAGE
  )

  // User handlers
  const handleAddUserOpen = () => {
    setUserForm(emptyUserForm)
    setShowAddUserDialog(true)
  }

  const handleEditUserOpen = (user: UserWithProfile) => {
    setSelectedUser(user)
    setEditUserForm({
      nombre_completo: user.profile?.nombre_completo || '',
      rol: user.profile?.rol || 'contratista',
      unidad_ejecutora_id: user.profile?.unidad_ejecutora_id || '',
      activo: user.profile?.activo ?? true,
    })
    setShowEditUserDialog(true)
  }

  const handleDeleteUserOpen = (user: UserWithProfile) => {
    setSelectedUser(user)
    setShowDeleteUserDialog(true)
  }

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.nombre_completo || !userForm.rol) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    if (userForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password,
          nombre_completo: userForm.nombre_completo,
          rol: userForm.rol,
          unidad_ejecutora_id: userForm.unidad_ejecutora_id || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Usuario creado exitosamente')
        setShowAddUserDialog(false)
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al crear usuario')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        nombre_completo: editUserForm.nombre_completo,
        rol: editUserForm.rol,
        unidad_ejecutora_id: editUserForm.unidad_ejecutora_id || null,
        activo: editUserForm.activo,
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Usuario actualizado exitosamente')
        setShowEditUserDialog(false)
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al actualizar usuario')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Usuario eliminado exitosamente')
        setShowDeleteUserDialog(false)
        fetchUsers()
      } else {
        toast.error(data.error || 'Error al eliminar usuario')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  // Unidad handlers
  const handleAddUnidadOpen = () => {
    setUnidadForm(emptyUnidadForm)
    setShowAddUnidadDialog(true)
  }

  const handleEditUnidadOpen = (unidad: UnidadEjecutora) => {
    setSelectedUnidad(unidad)
    setUnidadForm({
      nombre: unidad.nombre,
      rif: unidad.rif || '',
      contacto: unidad.contacto || '',
    })
    setShowEditUnidadDialog(true)
  }

  const handleDeleteUnidadOpen = (unidad: UnidadEjecutora) => {
    setSelectedUnidad(unidad)
    setShowDeleteUnidadDialog(true)
  }

  const handleCreateUnidad = async () => {
    if (!unidadForm.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/unidades-ejecutoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: unidadForm.nombre,
          rif: unidadForm.rif || null,
          contacto: unidadForm.contacto || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Unidad ejecutora creada exitosamente')
        setShowAddUnidadDialog(false)
        fetchUnidades()
      } else {
        toast.error(data.error || 'Error al crear unidad ejecutora')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUnidad = async () => {
    if (!selectedUnidad) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/unidades-ejecutoras/${selectedUnidad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: unidadForm.nombre,
          rif: unidadForm.rif || null,
          contacto: unidadForm.contacto || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Unidad ejecutora actualizada exitosamente')
        setShowEditUnidadDialog(false)
        fetchUnidades()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUnidad = async () => {
    if (!selectedUnidad) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/unidades-ejecutoras/${selectedUnidad.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Unidad ejecutora eliminada exitosamente')
        setShowDeleteUnidadDialog(false)
        fetchUnidades()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const getUnidadNombre = (id: string | null) => {
    if (!id) return '—'
    const unidad = unidadesEjecutoras.find((u) => u.id === id)
    return unidad?.nombre || '—'
  }

  // Pagination component
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    setPage: (p: number) => void,
    totalItems: number
  ) => {
    if (totalItems <= ITEMS_PER_PAGE) return null

    return (
      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true
              if (page === 1 || page === totalPages) return true
              if (Math.abs(page - currentPage) <= 1) return true
              return false
            })
            .map((page, idx, arr) => {
              const prev = arr[idx - 1]
              const showEllipsis = prev !== undefined && page - prev > 1
              return (
                <span key={page} className="flex items-center">
                  {showEllipsis && (
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground mx-1" />
                  )}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(page)}
                  >
                    {page}
                  </Button>
                </span>
              )
            })}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="users" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Usuarios</span>
        </TabsTrigger>
        <TabsTrigger value="unidades" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Unidades Ejecutoras</span>
        </TabsTrigger>
      </TabsList>

      {/* Users Tab */}
      <TabsContent value="users">
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
                    <TableHead>Activo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="h-8 w-8" />
                          <p>No se encontraron usuarios</p>
                        </div>
                      </TableCell>
                    </TableRow>
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
                          <Badge
                            variant="outline"
                            className={ROL_COLORS[user.profile?.rol || 'contratista']}
                          >
                            {ROL_LABELS[user.profile?.rol || 'contratista']}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getUnidadNombre(user.profile?.unidad_ejecutora_id || null)}
                        </TableCell>
                        <TableCell>
                          {user.profile?.activo ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditUserOpen(user)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUserOpen(user)}
                              disabled={user.id === profile.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {renderPagination(usersPage, totalUsersPages, setUsersPage, users.length)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Unidades Ejecutoras Tab */}
      <TabsContent value="unidades">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Gestión de Unidades Ejecutoras
              </CardTitle>
              <Button onClick={handleAddUnidadOpen} className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Unidad</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RIF</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUnidades ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : unidadesEjecutoras.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Building2 className="h-8 w-8" />
                          <p>No se encontraron unidades ejecutoras</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    unidadesEjecutoras.map((unidad) => (
                      <TableRow key={unidad.id}>
                        <TableCell className="font-medium">{unidad.nombre}</TableCell>
                        <TableCell>{unidad.rif || '—'}</TableCell>
                        <TableCell>{unidad.contacto || '—'}</TableCell>
                        <TableCell>
                          {unidad.activa ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              Inactiva
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditUnidadOpen(unidad)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUnidadOpen(unidad)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Complete el formulario para crear un nuevo usuario del sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">Contraseña *</Label>
              <Input
                id="user-password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-nombre">Nombre Completo *</Label>
              <Input
                id="user-nombre"
                value={userForm.nombre_completo}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, nombre_completo: e.target.value }))
                }
                placeholder="Nombre y apellido"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="user-rol">Rol *</Label>
                <Select
                  value={userForm.rol}
                  onValueChange={(val) =>
                    setUserForm((prev) => ({ ...prev, rol: val as UserRol }))
                  }
                >
                  <SelectTrigger id="user-rol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="contratista">Contratista</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-unidad">Unidad Ejecutora</Label>
                <Select
                  value={userForm.unidad_ejecutora_id}
                  onValueChange={(val) =>
                    setUserForm((prev) => ({ ...prev, unidad_ejecutora_id: val }))
                  }
                >
                  <SelectTrigger id="user-unidad">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesEjecutoras.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddUserDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los campos que desea actualizar para{' '}
              {selectedUser?.profile?.nombre_completo || selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nombre Completo</Label>
              <Input
                id="edit-nombre"
                value={editUserForm.nombre_completo}
                onChange={(e) =>
                  setEditUserForm((prev) => ({ ...prev, nombre_completo: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-rol">Rol</Label>
                <Select
                  value={editUserForm.rol}
                  onValueChange={(val) =>
                    setEditUserForm((prev) => ({ ...prev, rol: val as UserRol }))
                  }
                >
                  <SelectTrigger id="edit-rol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="contratista">Contratista</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad">Unidad Ejecutora</Label>
                <Select
                  value={editUserForm.unidad_ejecutora_id}
                  onValueChange={(val) =>
                    setEditUserForm((prev) => ({ ...prev, unidad_ejecutora_id: val }))
                  }
                >
                  <SelectTrigger id="edit-unidad">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesEjecutoras.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-activo"
                checked={editUserForm.activo}
                onCheckedChange={(checked) =>
                  setEditUserForm((prev) => ({ ...prev, activo: checked }))
                }
              />
              <Label htmlFor="edit-activo" className="cursor-pointer">
                Usuario activo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditUserDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{' '}
              &ldquo;{selectedUser?.profile?.nombre_completo || selectedUser?.email}&rdquo; del
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Unidad Dialog */}
      <Dialog open={showAddUnidadDialog} onOpenChange={setShowAddUnidadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Unidad Ejecutora</DialogTitle>
            <DialogDescription>
              Complete el formulario para registrar una nueva unidad ejecutora.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="unidad-nombre">Nombre *</Label>
              <Input
                id="unidad-nombre"
                value={unidadForm.nombre}
                onChange={(e) =>
                  setUnidadForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Nombre de la unidad"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unidad-rif">RIF</Label>
                <Input
                  id="unidad-rif"
                  value={unidadForm.rif}
                  onChange={(e) =>
                    setUnidadForm((prev) => ({ ...prev, rif: e.target.value }))
                  }
                  placeholder="J-00000000-0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidad-contacto">Contacto</Label>
                <Input
                  id="unidad-contacto"
                  value={unidadForm.contacto}
                  onChange={(e) =>
                    setUnidadForm((prev) => ({ ...prev, contacto: e.target.value }))
                  }
                  placeholder="Nombre o teléfono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddUnidadDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUnidad} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Unidad'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unidad Dialog */}
      <Dialog open={showEditUnidadDialog} onOpenChange={setShowEditUnidadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Unidad Ejecutora</DialogTitle>
            <DialogDescription>
              Modifique los campos que desea actualizar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-unidad-nombre">Nombre *</Label>
              <Input
                id="edit-unidad-nombre"
                value={unidadForm.nombre}
                onChange={(e) =>
                  setUnidadForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad-rif">RIF</Label>
                <Input
                  id="edit-unidad-rif"
                  value={unidadForm.rif}
                  onChange={(e) =>
                    setUnidadForm((prev) => ({ ...prev, rif: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad-contacto">Contacto</Label>
                <Input
                  id="edit-unidad-contacto"
                  value={unidadForm.contacto}
                  onChange={(e) =>
                    setUnidadForm((prev) => ({ ...prev, contacto: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditUnidadDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateUnidad} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unidad Dialog */}
      <AlertDialog open={showDeleteUnidadDialog} onOpenChange={setShowDeleteUnidadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta unidad ejecutora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la unidad ejecutora
              &ldquo;{selectedUnidad?.nombre}&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnidad}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
