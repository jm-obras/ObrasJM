'use client'

import { LogIn } from 'lucide-react'

interface FooterSectionProps {
  onLoginClick: () => void
}

export function FooterSection({ onLoginClick }: FooterSectionProps) {
  return (
    <footer className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/VSOPS.png"
                alt="VSOPS"
                className="h-8 w-auto object-contain rounded"
              />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Sistema de Control de Avance Físico del Hospital de Niños J.M. de
              los Ríos
            </p>
            <p className="text-xs text-slate-500">
              © 2026 ObrasJM. Todos los derechos reservados.
            </p>
          </div>

          {/* Column 2 - Enlaces */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-poppins)] text-xs font-semibold uppercase tracking-wider text-slate-400">
              Enlaces
            </h3>
            <ul className="space-y-2.5">
              {[
                'Avance de Obras',
                'Especialidades',
                'Instituciones Participantes',
                'Contacto',
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Acceso Privado */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-poppins)] text-xs font-semibold uppercase tracking-wider text-slate-400">
              Acceso Privado
            </h3>
            <p className="text-sm text-slate-400">
              Ingreso de Contratistas e Inspectores
            </p>
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </button>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="/logo_hospital.png"
                alt="Hospital de Niños"
                className="h-8 w-auto object-contain rounded"
              />
              <img
                src="/logo_ministerio.png"
                alt="MPPOP"
                className="h-6 w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500">
            Plan de Recuperación de Infraestructura Hospitalaria «Dr. José
            Gregorio Hernández»
          </p>
          <p className="mt-1 text-center text-xs text-slate-600">
            IT Development by @libnimaster
          </p>
        </div>
      </div>
    </footer>
  )
}
