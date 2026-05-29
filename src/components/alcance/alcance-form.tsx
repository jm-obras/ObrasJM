'use client'

import type { AlcanceStatus, Especialidad, Sector, Subsector, UnidadEjecutora } from '@/lib/types'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { AlcanceFormData } from './alcance-types'

interface AlcanceFormProps {
  formData: AlcanceFormData
  setFormData: React.Dispatch<React.SetStateAction<AlcanceFormData>>
  especialidades: Especialidad[]
  sectores: Sector[]
  subsectores: Subsector[]
  unidadesEjecutoras: UnidadEjecutora[]
  formSectorId: string
  setFormSectorId: (value: string) => void
  isEdit: boolean
}

export function AlcanceForm({
  formData,
  setFormData,
  especialidades,
  sectores,
  subsectores,
  unidadesEjecutoras,
  formSectorId,
  setFormSectorId,
  isEdit,
}: AlcanceFormProps) {
  const filteredFormSubsectores = subsectores.filter(
    (s) => !formSectorId || s.sector_id === formSectorId
  )

  const handleFormChange = (field: keyof AlcanceFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="especialidad">Especialidad *</Label>
        <Select
          value={formData.especialidad_id}
          onValueChange={(val) => handleFormChange('especialidad_id', val)}
        >
          <SelectTrigger id="especialidad">
            <SelectValue placeholder="Seleccionar especialidad" />
          </SelectTrigger>
          <SelectContent>
            {especialidades.map((esp) => (
              <SelectItem key={esp.id} value={esp.id}>
                {esp.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sector">Sector *</Label>
          <Select
            value={formSectorId}
            onValueChange={(val) => {
              setFormSectorId(val)
              setFormData((prev) => ({ ...prev, subsector_id: '' }))
            }}
          >
            <SelectTrigger id="sector">
              <SelectValue placeholder="Seleccionar sector" />
            </SelectTrigger>
            <SelectContent>
              {sectores.map((sec) => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subsector">Subsector *</Label>
          <Select
            value={formData.subsector_id}
            onValueChange={(val) => handleFormChange('subsector_id', val)}
            disabled={!formSectorId}
          >
            <SelectTrigger id="subsector">
              <SelectValue placeholder="Seleccionar subsector" />
            </SelectTrigger>
            <SelectContent>
              {filteredFormSubsectores.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleFormChange('descripcion', e.target.value)}
          placeholder="Descripción del alcance planificado"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="peso_relativo">Peso Relativo (%)</Label>
          <Input
            id="peso_relativo"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.peso_relativo}
            onChange={(e) => handleFormChange('peso_relativo', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
          <Input
            id="unidad_medida"
            value={formData.unidad_medida}
            onChange={(e) => handleFormChange('unidad_medida', e.target.value)}
            placeholder="m², ml, uds"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cantidad_planificada">Cant. Planificada</Label>
          <Input
            id="cantidad_planificada"
            type="number"
            step="0.01"
            min="0"
            value={formData.cantidad_planificada}
            onChange={(e) =>
              handleFormChange('cantidad_planificada', parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="unidad_ejecutora">Unidad Ejecutora</Label>
          <Select
            value={formData.unidad_ejecutora_id}
            onValueChange={(val) => handleFormChange('unidad_ejecutora_id', val)}
          >
            <SelectTrigger id="unidad_ejecutora">
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {unidadesEjecutoras.map((uni) => (
                <SelectItem key={uni.id} value={uni.id}>
                  {uni.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEdit && (
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleFormChange('status', val as AlcanceStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
