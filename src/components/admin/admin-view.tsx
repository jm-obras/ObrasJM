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
  Wrench,
  MapPin,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Profile, UserRol, UnidadEjecutora, Especialidad, Sector, Subsector } from '@/lib/types'

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

interface EspecialidadFormData {
  nombre: string
}

interface SectorFormData {
  nombre: string
  codigo: string
}

interface SubsectorFormData {
  nombre: string
  codigo: string
  sector_id: string
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

const emptyEspecialidadForm: EspecialidadFormData = {
  nombre: '',
}

const emptySectorForm: SectorFormData = {
  nombre: '',
  codigo: '',
}

const emptySubsectorForm: SubsectorFormData = {
  nombre: '',
  codigo: '',
  sector_id: '',
}

interface AdminViewProps {
  profile: Profile
}

export function AdminView({ profile }: AdminViewProps) {
  // ===== Data State =====
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutora[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [sectores, setSectores] = useState<Sector[]>([])
  const [subsectores, setSubsectores] = useState<Subsector[]>()

  // ===== Loading State =====
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingUnidades, setLoadingUnidades] = useState(true)
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)
  const [loadingSectores, setLoadingSectores] = useState(true)
  const [loadingSubsectores, setLoadingSubsectores] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ===== Pagination =====
  const [usersPage, setUsersPage] = useState(1)
  const [espPage, setEspPage] = useState(1)
  const [secPage, setSecPage] = useState(1)
  const [subPage, setSubPage] = useState(1)

  // ===== User Dialogs =====
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

  // ===== Unidad Dialogs =====
  const [showAddUnidadDialog, setShowAddUnidadDialog] = useState(false)
  const [showEditUnidadDialog, setShowEditUnidadDialog] = useState(false)
  const [showDeleteUnidadDialog, setShowDeleteUnidadDialog] = useState(false)
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadEjecutora | null>(null)
  const [unidadForm, setUnidadForm] = useState<UnidadFormData>(emptyUnidadForm)

  // ===== Especialidad Dialogs =====
  const [showAddEspDialog, setShowAddEspDialog] = useState(false)
  const [showEditEspDialog, setShowEditEspDialog] = useState(false)
  const [showDeleteEspDialog, setShowDeleteEspDialog] = useState(false)
  const [selectedEsp, setSelectedEsp] = useState<Especialidad | null>(null)
  const [espForm, setEspForm] = useState<EspecialidadFormData>(emptyEspecialidadForm)

  // ===== Sector Dialogs =====
  const [showAddSecDialog, setShowAddSecDialog] = useState(false)
  const [showEditSecDialog, setShowEditSecDialog] = useState(false)
  const [showDeleteSecDialog, setShowDeleteSecDialog] = useState(false)
  const [selectedSec, setSelectedSec] = useState<Sector | null>(null)
  const [secForm, setSecForm] = useState<SectorFormData>(emptySectorForm)

  // ===== Subsector Dialogs =====
  const [showAddSubDialog, setShowAddSubDialog] = useState(false)
  const [showEditSubDialog, setShowEditSubDialog] = useState(false)
  const [showDeleteSubDialog, setShowDeleteSubDialog] = useState(false)
  const [selectedSub, setSelectedSub] = useState<Subsector | null>(null)
  const [subForm, setSubForm] = useState<SubsectorFormData>(emptySubsectorForm)

  // ===== FETCH FUNCTIONS =====
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

  const fetchEspecialidades = useCallback(async () => {
    setLoadingEspecialidades(true)
    try {
      const res = await fetch('/api/especialidades')
      const data = await res.json()
      if (res.ok && data.data) {
        setEspecialidades(data.data)
      } else {
        toast.error(data.error || 'Error cargando especialidades')
      }
    } catch {
      toast.error('Error cargando especialidades')
    } finally {
      setLoadingEspecialidades(false)
    }
  }, [])

  const fetchSectores = useCallback(async () => {
    setLoadingSectores(true)
    try {
      const res = await fetch('/api/sectores')
      const data = await res.json()
      if (res.ok && data.data) {
        setSectores(data.data)
      } else {
        toast.error(data.error || 'Error cargando sectores')
      }
    } catch {
      toast.error('Error cargando sectores')
    } finally {
      setLoadingSectores(false)
    }
  }, [])

  const fetchSubsectores = useCallback(async () => {
    setLoadingSubsectores(true)
    try {
      const res = await fetch('/api/subsectores')
      const data = await res.json()
      if (res.ok && data.data) {
        setSubsectores(data.data)
      } else {
        toast.error(data.error || 'Error cargando subsectores')
      }
    } catch {
      toast.error('Error cargando subsectores')
    } finally {
      setLoadingSubsectores(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchUnidades()
    fetchEspecialidades()
    fetchSectores()
    fetchSubsectores()
  }, [fetchUsers, fetchUnidades, fetchEspecialidades, fetchSectores, fetchSubsectores])

  // ===== HELPERS =====
  const getUnidadNombre = (id: string | null) => {
    if (!id) return '—'
    const unidad = unidadesEjecutoras.find((u) => u.id === id)
    return unidad?.nombre || '—'
  }

  const getSectorNombre = (id: string) => {
    const sector = sectores.find((s) => s.id === id)
    return sector?.nombre || '—'
  }

  // ===== PAGINATION =====
  const totalUsersPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE))
  const paginatedUsers = users.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)

  const totalEspPages = Math.max(1, Math.ceil(especialidades.length / ITEMS_PER_PAGE))
  const paginatedEsp = especialidades.slice((espPage - 1) * ITEMS_PER_PAGE, espPage * ITEMS_PER_PAGE)

  const totalSecPages = Math.max(1, Math.ceil(sectores.length / ITEMS_PER_PAGE))
  const paginatedSec = sectores.slice((secPage - 1) * ITEMS_PER_PAGE, secPage * ITEMS_PER_PAGE)

  const subsectoresList = subsectores || []
  const totalSubPages = Math.max(1, Math.ceil(subsectoresList.length / ITEMS_PER_PAGE))
  const paginatedSub = subsectoresList.slice((subPage - 1) * ITEMS_PER_PAGE, subPage * ITEMS_PER_PAGE)

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

  // ===== USER HANDLERS =====
  const handleAddUserOpen = () => { setUserForm(emptyUserForm); setShowAddUserDialog(true) }
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
  const handleDeleteUserOpen = (user: UserWithProfile) => { setSelectedUser(user); setShowDeleteUserDialog(true) }

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
        unidad_ejecutora_id: editUserForm.unidad_ejecutora_id || null, activo: editUserForm.activo,
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

  // ===== UNIDAD HANDLERS =====
  const handleAddUnidadOpen = () => { setUnidadForm(emptyUnidadForm); setShowAddUnidadDialog(true) }
  const handleEditUnidadOpen = (unidad: UnidadEjecutora) => {
    setSelectedUnidad(unidad)
    setUnidadForm({ nombre: unidad.nombre, rif: unidad.rif || '', contacto: unidad.contacto || '' })
    setShowEditUnidadDialog(true)
  }
  const handleDeleteUnidadOpen = (unidad: UnidadEjecutora) => { setSelectedUnidad(unidad); setShowDeleteUnidadDialog(true) }

  const handleCreateUnidad = async () => {
    if (!unidadForm.nombre) { toast.error('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/unidades-ejecutoras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: unidadForm.nombre, rif: unidadForm.rif || null, contacto: unidadForm.contacto || null }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Unidad ejecutora creada exitosamente'); setShowAddUnidadDialog(false); fetchUnidades() }
      else { toast.error(data.error || 'Error al crear unidad ejecutora') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateUnidad = async () => {
    if (!selectedUnidad) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/unidades-ejecutoras/${selectedUnidad.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: unidadForm.nombre, rif: unidadForm.rif || null, contacto: unidadForm.contacto || null }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Unidad ejecutora actualizada exitosamente'); setShowEditUnidadDialog(false); fetchUnidades() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteUnidad = async () => {
    if (!selectedUnidad) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/unidades-ejecutoras/${selectedUnidad.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Unidad ejecutora eliminada exitosamente'); setShowDeleteUnidadDialog(false); fetchUnidades() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  // ===== ESPECIALIDAD HANDLERS =====
  const handleAddEspOpen = () => { setEspForm(emptyEspecialidadForm); setShowAddEspDialog(true) }
  const handleEditEspOpen = (esp: Especialidad) => {
    setSelectedEsp(esp)
    setEspForm({ nombre: esp.nombre })
    setShowEditEspDialog(true)
  }
  const handleDeleteEspOpen = (esp: Especialidad) => { setSelectedEsp(esp); setShowDeleteEspDialog(true) }

  const handleCreateEsp = async () => {
    if (!espForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/especialidades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: espForm.nombre }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Especialidad creada exitosamente'); setShowAddEspDialog(false); fetchEspecialidades() }
      else { toast.error(data.error || 'Error al crear especialidad') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateEsp = async () => {
    if (!selectedEsp) return
    if (!espForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/especialidades/${selectedEsp.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: espForm.nombre }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Especialidad actualizada exitosamente'); setShowEditEspDialog(false); fetchEspecialidades() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteEsp = async () => {
    if (!selectedEsp) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/especialidades/${selectedEsp.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Especialidad eliminada exitosamente'); setShowDeleteEspDialog(false); fetchEspecialidades() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  // ===== SECTOR HANDLERS =====
  const handleAddSecOpen = () => { setSecForm(emptySectorForm); setShowAddSecDialog(true) }
  const handleEditSecOpen = (sec: Sector) => {
    setSelectedSec(sec)
    setSecForm({ nombre: sec.nombre, codigo: sec.codigo })
    setShowEditSecDialog(true)
  }
  const handleDeleteSecOpen = (sec: Sector) => { setSelectedSec(sec); setShowDeleteSecDialog(true) }

  const handleCreateSec = async () => {
    if (!secForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!secForm.codigo.trim()) { toast.error('El código es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sectores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: secForm.nombre, codigo: secForm.codigo }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Sector creado exitosamente'); setShowAddSecDialog(false); fetchSectores(); fetchSubsectores() }
      else { toast.error(data.error || 'Error al crear sector') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateSec = async () => {
    if (!selectedSec) return
    if (!secForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!secForm.codigo.trim()) { toast.error('El código es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sectores/${selectedSec.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: secForm.nombre, codigo: secForm.codigo }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Sector actualizado exitosamente'); setShowEditSecDialog(false); fetchSectores(); fetchSubsectores() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteSec = async () => {
    if (!selectedSec) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sectores/${selectedSec.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Sector eliminado exitosamente'); setShowDeleteSecDialog(false); fetchSectores(); fetchSubsectores() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  // ===== SUBSECTOR HANDLERS =====
  const handleAddSubOpen = () => { setSubForm(emptySubsectorForm); setShowAddSubDialog(true) }
  const handleEditSubOpen = (sub: Subsector) => {
    setSelectedSub(sub)
    setSubForm({ nombre: sub.nombre, codigo: sub.codigo || '', sector_id: sub.sector_id })
    setShowEditSubDialog(true)
  }
  const handleDeleteSubOpen = (sub: Subsector) => { setSelectedSub(sub); setShowDeleteSubDialog(true) }

  const handleCreateSub = async () => {
    if (!subForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!subForm.sector_id) { toast.error('El sector es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/subsectores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: subForm.nombre, codigo: subForm.codigo || null, sector_id: subForm.sector_id }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Subsector creado exitosamente'); setShowAddSubDialog(false); fetchSubsectores() }
      else { toast.error(data.error || 'Error al crear subsector') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleUpdateSub = async () => {
    if (!selectedSub) return
    if (!subForm.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!subForm.sector_id) { toast.error('El sector es requerido'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/subsectores/${selectedSub.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: subForm.nombre, codigo: subForm.codigo || null, sector_id: subForm.sector_id }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Subsector actualizado exitosamente'); setShowEditSubDialog(false); fetchSubsectores() }
      else { toast.error(data.error || 'Error al actualizar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  const handleDeleteSub = async () => {
    if (!selectedSub) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/subsectores/${selectedSub.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Subsector eliminado exitosamente'); setShowDeleteSubDialog(false); fetchSubsectores() }
      else { toast.error(data.error || 'Error al eliminar') }
    } catch { toast.error('Error de conexión') } finally { setSubmitting(false) }
  }

  // ===== TABLE SKELETON =====
  const TableSkeleton = ({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) => (
    Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
        ))}
      </TableRow>
    ))
  )

  const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
    <TableRow>
      <TableCell colSpan={10} className="h-32 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Icon className="h-8 w-8" />
          <p>{message}</p>
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5 max-w-2xl">
        <TabsTrigger value="users" className="gap-1.5">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Usuarios</span>
        </TabsTrigger>
        <TabsTrigger value="unidades" className="gap-1.5">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Unidades</span>
        </TabsTrigger>
        <TabsTrigger value="especialidades" className="gap-1.5">
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Especialidades</span>
        </TabsTrigger>
        <TabsTrigger value="sectores" className="gap-1.5">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Sectores</span>
        </TabsTrigger>
        <TabsTrigger value="subsectores" className="gap-1.5">
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Subsectores</span>
        </TabsTrigger>
      </TabsList>

      {/* ==================== USERS TAB ==================== */}
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
                    <TableSkeleton cols={6} />
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
                        <TableCell>
                          {user.profile?.activo ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Activo</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
            {renderPagination(usersPage, totalUsersPages, setUsersPage, users.length)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ==================== UNIDADES TAB ==================== */}
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
                    <TableSkeleton cols={5} />
                  ) : unidadesEjecutoras.length === 0 ? (
                    <EmptyState icon={Building2} message="No se encontraron unidades ejecutoras" />
                  ) : (
                    unidadesEjecutoras.map((unidad) => (
                      <TableRow key={unidad.id}>
                        <TableCell className="font-medium">{unidad.nombre}</TableCell>
                        <TableCell>{unidad.rif || '—'}</TableCell>
                        <TableCell>{unidad.contacto || '—'}</TableCell>
                        <TableCell>
                          {unidad.activa ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Activa</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Inactiva</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUnidadOpen(unidad)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteUnidadOpen(unidad)}>
                              <Trash2 className="h-4 w-4" />
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

      {/* ==================== ESPECIALIDADES TAB ==================== */}
      <TabsContent value="especialidades">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                Gestión de Especialidades
                <Badge variant="secondary" className="ml-2">{especialidades.length}</Badge>
              </CardTitle>
              <Button onClick={handleAddEspOpen} className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Especialidad</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEspecialidades ? (
                    <TableSkeleton cols={3} />
                  ) : paginatedEsp.length === 0 ? (
                    <EmptyState icon={Wrench} message="No se encontraron especialidades" />
                  ) : (
                    paginatedEsp.map((esp, idx) => (
                      <TableRow key={esp.id}>
                        <TableCell className="text-muted-foreground">
                          {(espPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">{esp.nombre}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditEspOpen(esp)}>
                              <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteEspOpen(esp)}>
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
            {renderPagination(espPage, totalEspPages, setEspPage, especialidades.length)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ==================== SECTORES TAB ==================== */}
      <TabsContent value="sectores">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Gestión de Sectores
                <Badge variant="secondary" className="ml-2">{sectores.length}</Badge>
              </CardTitle>
              <Button onClick={handleAddSecOpen} className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Sector</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSectores ? (
                    <TableSkeleton cols={3} />
                  ) : paginatedSec.length === 0 ? (
                    <EmptyState icon={MapPin} message="No se encontraron sectores" />
                  ) : (
                    paginatedSec.map((sec) => (
                      <TableRow key={sec.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{sec.codigo}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{sec.nombre}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSecOpen(sec)}>
                              <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSecOpen(sec)}>
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
            {renderPagination(secPage, totalSecPages, setSecPage, sectores.length)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ==================== SUBSECTORES TAB ==================== */}
      <TabsContent value="subsectores">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Gestión de Subsectores
                <Badge variant="secondary" className="ml-2">{subsectoresList.length}</Badge>
              </CardTitle>
              <Button onClick={handleAddSubOpen} className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Subsector</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSubsectores ? (
                    <TableSkeleton cols={4} />
                  ) : paginatedSub.length === 0 ? (
                    <EmptyState icon={Layers} message="No se encontraron subsectores" />
                  ) : (
                    paginatedSub.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{sub.codigo || '—'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{sub.nombre}</TableCell>
                        <TableCell>{getSectorNombre(sub.sector_id)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSubOpen(sub)}>
                              <Pencil className="h-4 w-4" /><span className="sr-only">Editar</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSubOpen(sub)}>
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
            {renderPagination(subPage, totalSubPages, setSubPage, subsectoresList.length)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ==================== DIALOGS ==================== */}

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

      {/* Add Unidad Dialog */}
      <Dialog open={showAddUnidadDialog} onOpenChange={setShowAddUnidadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Unidad Ejecutora</DialogTitle>
            <DialogDescription>Complete el formulario para registrar una nueva unidad ejecutora.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="unidad-nombre">Nombre *</Label>
              <Input id="unidad-nombre" value={unidadForm.nombre} onChange={(e) => setUnidadForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la unidad" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unidad-rif">RIF</Label>
                <Input id="unidad-rif" value={unidadForm.rif} onChange={(e) => setUnidadForm((p) => ({ ...p, rif: e.target.value }))} placeholder="J-00000000-0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidad-contacto">Contacto</Label>
                <Input id="unidad-contacto" value={unidadForm.contacto} onChange={(e) => setUnidadForm((p) => ({ ...p, contacto: e.target.value }))} placeholder="Nombre o teléfono" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUnidadDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateUnidad} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Unidad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unidad Dialog */}
      <Dialog open={showEditUnidadDialog} onOpenChange={setShowEditUnidadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Unidad Ejecutora</DialogTitle>
            <DialogDescription>Modifique los campos que desea actualizar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-unidad-nombre">Nombre *</Label>
              <Input id="edit-unidad-nombre" value={unidadForm.nombre} onChange={(e) => setUnidadForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad-rif">RIF</Label>
                <Input id="edit-unidad-rif" value={unidadForm.rif} onChange={(e) => setUnidadForm((p) => ({ ...p, rif: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unidad-contacto">Contacto</Label>
                <Input id="edit-unidad-contacto" value={unidadForm.contacto} onChange={(e) => setUnidadForm((p) => ({ ...p, contacto: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUnidadDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateUnidad} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unidad Dialog */}
      <AlertDialog open={showDeleteUnidadDialog} onOpenChange={setShowDeleteUnidadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta unidad ejecutora?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la unidad ejecutora &ldquo;{selectedUnidad?.nombre}&rdquo;.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnidad} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Especialidad Dialog */}
      <Dialog open={showAddEspDialog} onOpenChange={setShowAddEspDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Especialidad</DialogTitle>
            <DialogDescription>Ingrese el nombre de la nueva especialidad de trabajo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="esp-nombre">Nombre *</Label>
              <Input id="esp-nombre" value={espForm.nombre} onChange={(e) => setEspForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Electricidad - Luminarias" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEspDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateEsp} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Especialidad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Especialidad Dialog */}
      <Dialog open={showEditEspDialog} onOpenChange={setShowEditEspDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Especialidad</DialogTitle>
            <DialogDescription>Modifique el nombre de la especialidad.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-esp-nombre">Nombre *</Label>
              <Input id="edit-esp-nombre" value={espForm.nombre} onChange={(e) => setEspForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEspDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateEsp} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Especialidad Dialog */}
      <AlertDialog open={showDeleteEspDialog} onOpenChange={setShowDeleteEspDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta especialidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la especialidad &ldquo;{selectedEsp?.nombre}&rdquo;.
              Si tiene registros de alcance planificado asociados, no podrá eliminarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEsp} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Sector Dialog */}
      <Dialog open={showAddSecDialog} onOpenChange={setShowAddSecDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Sector</DialogTitle>
            <DialogDescription>Ingrese los datos del nuevo sector del hospital.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sec-codigo">Código *</Label>
              <Input id="sec-codigo" value={secForm.codigo} onChange={(e) => setSecForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ej: TH, TC, TA" className="uppercase" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sec-nombre">Nombre *</Label>
              <Input id="sec-nombre" value={secForm.nombre} onChange={(e) => setSecForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Torre Hospitalaria" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSecDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateSec} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Sector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sector Dialog */}
      <Dialog open={showEditSecDialog} onOpenChange={setShowEditSecDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sector</DialogTitle>
            <DialogDescription>Modifique los datos del sector.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sec-codigo">Código *</Label>
              <Input id="edit-sec-codigo" value={secForm.codigo} onChange={(e) => setSecForm((p) => ({ ...p, codigo: e.target.value }))} className="uppercase" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sec-nombre">Nombre *</Label>
              <Input id="edit-sec-nombre" value={secForm.nombre} onChange={(e) => setSecForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSecDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateSec} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sector Dialog */}
      <AlertDialog open={showDeleteSecDialog} onOpenChange={setShowDeleteSecDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este sector?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el sector &ldquo;{selectedSec?.nombre}&rdquo; ({selectedSec?.codigo}).
              Si tiene subsectores asociados, deberá eliminarlos primero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSec} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Subsector Dialog */}
      <Dialog open={showAddSubDialog} onOpenChange={setShowAddSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Subsector</DialogTitle>
            <DialogDescription>Ingrese los datos del nuevo subsector.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sub-sector">Sector *</Label>
              <Select value={subForm.sector_id} onValueChange={(val) => setSubForm((p) => ({ ...p, sector_id: val }))}>
                <SelectTrigger id="sub-sector"><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (<SelectItem key={s.id} value={s.id}>{s.codigo} - {s.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sub-codigo">Código</Label>
                <Input id="sub-codigo" value={subForm.codigo} onChange={(e) => setSubForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ej: TH-P1" className="uppercase" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub-nombre">Nombre *</Label>
                <Input id="sub-nombre" value={subForm.nombre} onChange={(e) => setSubForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Piso 1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCreateSub} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear Subsector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subsector Dialog */}
      <Dialog open={showEditSubDialog} onOpenChange={setShowEditSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Subsector</DialogTitle>
            <DialogDescription>Modifique los datos del subsector.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sub-sector">Sector *</Label>
              <Select value={subForm.sector_id} onValueChange={(val) => setSubForm((p) => ({ ...p, sector_id: val }))}>
                <SelectTrigger id="edit-sub-sector"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (<SelectItem key={s.id} value={s.id}>{s.codigo} - {s.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sub-codigo">Código</Label>
                <Input id="edit-sub-codigo" value={subForm.codigo} onChange={(e) => setSubForm((p) => ({ ...p, codigo: e.target.value }))} className="uppercase" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sub-nombre">Nombre *</Label>
                <Input id="edit-sub-nombre" value={subForm.nombre} onChange={(e) => setSubForm((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSubDialog(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleUpdateSub} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subsector Dialog */}
      <AlertDialog open={showDeleteSubDialog} onOpenChange={setShowDeleteSubDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este subsector?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el subsector &ldquo;{selectedSub?.nombre}&rdquo; ({selectedSub?.codigo}).
              Si tiene registros de alcance planificado asociados, no podrá eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSub} disabled={submitting} className="bg-destructive text-white hover:bg-destructive/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
