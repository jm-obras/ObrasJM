'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Building2,
  Wrench,
  MapPin,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Profile, UnidadEjecutora, Sector } from '@/lib/types'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { UsersTab } from './users-tab'
import { UnidadesTab } from './unidades-tab'
import { EspecialidadesTab } from './especialidades-tab'
import { SectoresTab } from './sectores-tab'
import { SubsectoresTab } from './subsectores-tab'

interface AdminViewProps {
  profile: Profile
}

export function AdminView({ profile }: AdminViewProps) {
  // ===== Shared Data (needed by multiple tabs) =====
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutora[]>([])
  const [sectores, setSectores] = useState<Sector[]>([])
  const [loadingUnidades, setLoadingUnidades] = useState(true)
  const [loadingSectores, setLoadingSectores] = useState(true)

  // Trigger for subsectores tab to refresh when sectors change
  const [subsectoresRefreshTrigger, setSubsectoresRefreshTrigger] = useState(0)

  // ===== Fetch shared data =====
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

  useEffect(() => {
    fetchUnidades()
    fetchSectores()
  }, [fetchUnidades, fetchSectores])

  // Callback when sector CRUD happens — refresh shared sectores data and trigger subsectores refresh
  const handleSectorChange = () => {
    fetchSectores()
    setSubsectoresRefreshTrigger((prev) => prev + 1)
  }

  // Don't render tabs content until shared data is loaded (individual tabs handle their own loading)
  // but we need unidades and sectores available for the forms
  const sharedDataReady = !loadingUnidades && !loadingSectores

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

      <TabsContent value="users">
        {sharedDataReady && <UsersTab profile={profile} unidadesEjecutoras={unidadesEjecutoras} />}
      </TabsContent>

      <TabsContent value="unidades">
        <UnidadesTab />
      </TabsContent>

      <TabsContent value="especialidades">
        <EspecialidadesTab />
      </TabsContent>

      <TabsContent value="sectores">
        <SectoresTab onSectorChange={handleSectorChange} />
      </TabsContent>

      <TabsContent value="subsectores">
        {sharedDataReady && <SubsectoresTab sectores={sectores} refreshTrigger={subsectoresRefreshTrigger} />}
      </TabsContent>
    </Tabs>
  )
}
