'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Upload, X, CalendarIcon } from 'lucide-react'

import type { AlcancePlanificado, TrabajoTipo } from '@/lib/types'
import type { AvanceFormData, FilePreview } from './avance-types'

import { Button } from '@/components/ui/button'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface AvanceFormFieldsProps {
  formData: AvanceFormData
  setFormData: React.Dispatch<React.SetStateAction<AvanceFormData>>
  alcances: AlcancePlanificado[]
  fechaReporte: Date
  setFechaReporte: (date: Date) => void
  datePickerOpen: boolean
  setDatePickerOpen: (open: boolean) => void
  filePreviews: FilePreview[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  isEdit: boolean
}

export function AvanceFormFields({
  formData,
  setFormData,
  alcances,
  fechaReporte,
  setFechaReporte,
  datePickerOpen,
  setDatePickerOpen,
  filePreviews,
  fileInputRef,
  handleFileSelect,
  removeFile,
  isEdit,
}: AvanceFormFieldsProps) {
  const idPrefix = isEdit ? 'edit_' : ''

  return (
    <div className="grid gap-4 py-2">
      {/* Alcance select */}
      <div className="grid gap-2">
        <Label>Alcance Planificado *</Label>
        <Select
          value={formData.alcance_id}
          onValueChange={(val) =>
            setFormData((prev) => ({ ...prev, alcance_id: val }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar alcance" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {alcances
              .filter((a) => a.status === 'Activo')
              .map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="text-xs">
                    {a.especialidad?.nombre} – {a.sector?.nombre}/{a.subsector?.nombre} –{' '}
                    {a.descripcion.length > 40
                      ? a.descripcion.substring(0, 40) + '...'
                      : a.descripcion}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cantidad reportada */}
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}cantidad_reportada`}>Cantidad Reportada *</Label>
          <Input
            id={`${idPrefix}cantidad_reportada`}
            type="number"
            step="0.01"
            min="0"
            value={formData.cantidad_reportada}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cantidad_reportada: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>

        {/* Tipo trabajo */}
        <div className="grid gap-2">
          <Label>Tipo de Trabajo *</Label>
          <RadioGroup
            value={formData.tipo_trabajo}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                tipo_trabajo: val as TrabajoTipo,
              }))
            }
            className="flex items-center gap-4 pt-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="Planificado" id={`${idPrefix}planificado`} />
              <Label htmlFor={`${idPrefix}planificado`} className="cursor-pointer">
                Planificado
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="Imprevisto" id={`${idPrefix}imprevisto`} />
              <Label htmlFor={`${idPrefix}imprevisto`} className="cursor-pointer">
                Imprevisto
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Fecha reporte */}
      <div className="grid gap-2">
        <Label>Fecha de Reporte *</Label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaReporte
                ? format(fechaReporte, "dd/MM/yyyy", { locale: es })
                : 'Seleccionar fecha'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaReporte}
              onSelect={(date) => {
                if (date) {
                  setFechaReporte(date)
                  setFormData((prev) => ({
                    ...prev,
                    fecha_reporte: format(date, 'yyyy-MM-dd'),
                  }))
                  setDatePickerOpen(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Existing photos (edit mode only) */}
      {isEdit && formData.fotos_evidencia_urls.length > 0 && (
        <div className="grid gap-2">
          <Label>Fotos Actuales</Label>
          <div className="flex flex-wrap gap-2">
            {formData.fotos_evidencia_urls.map((url, idx) => (
              <div
                key={idx}
                className="relative group w-20 h-20 rounded-md overflow-hidden border"
              >
                <img
                  src={url}
                  alt={`Evidencia ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      fotos_evidencia_urls: prev.fotos_evidencia_urls.filter((_, i) => i !== idx),
                    }))
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File upload */}
      <div className="grid gap-2">
        <Label>{isEdit ? 'Agregar Nuevas Fotos' : 'Fotos de Evidencia'}</Label>
        <div className="space-y-3">
          <div
            className="flex items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p className="text-sm">Haga clic para subir fotos</p>
              <p className="text-xs">JPEG, PNG, WebP, GIF (máx. 10MB c/u)</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Preview thumbnails */}
          {filePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filePreviews.map((fp, idx) => (
                <div
                  key={idx}
                  className="relative group w-20 h-20 rounded-md overflow-hidden border"
                >
                  <img
                    src={fp.preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(idx)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}notas`}>Notas</Label>
        <Textarea
          id={`${idPrefix}notas`}
          value={formData.notas}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notas: e.target.value }))
          }
          placeholder="Observaciones o notas adicionales"
          rows={3}
        />
      </div>
    </div>
  )
}
