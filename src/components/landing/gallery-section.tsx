'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// Gallery items: photos + institutional logos mixed in
const galleryItems = [
  { type: 'photo' as const, src: '/obras/obra-01.jpeg', alt: 'Avance de obra - Intervención hospitalaria' },
  { type: 'photo' as const, src: '/obras/obra-02.jpeg', alt: 'Avance de obra - Infraestructura' },
  { type: 'photo' as const, src: '/obras/obra-03.jpeg', alt: 'Avance de obra - Rehabilitación' },
  { type: 'photo' as const, src: '/obras/obra-04.jpeg', alt: 'Avance de obra - Trabajos en progreso' },
  { type: 'photo' as const, src: '/obras/obra-05.jpeg', alt: 'Avance de obra - Instalaciones' },
  { type: 'logo' as const, src: '/logo_hospital.png', alt: 'Hospital de Niños J.M. de los Ríos', name: 'Hospital de Niños\nJ.M. de los Ríos', wide: false },
  { type: 'photo' as const, src: '/obras/obra-06.jpeg', alt: 'Avance de obra - Obras civiles' },
  { type: 'photo' as const, src: '/obras/obra-07.jpeg', alt: 'Avance de obra - Equipamiento' },
  { type: 'photo' as const, src: '/obras/obra-08.jpeg', alt: 'Avance de obra - Avances eléctricos' },
  { type: 'logo' as const, src: '/logo_ministerio.png', alt: 'Ministerio del Poder Popular para la Salud', name: 'Ministerio del Poder Popular\npara la Salud', wide: true },
  { type: 'photo' as const, src: '/obras/obra-09.jpeg', alt: 'Avance de obra - Sistema de aguas' },
]

export function GallerySection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-white py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            El Impacto{' '}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Real
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            Avances en la infraestructura del Hospital J.M. de los Ríos
          </p>
        </motion.div>

        {/* Grid with photos + logos integrated */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {galleryItems.map((item, index) => (
            <motion.div
              key={`${item.type}-${item.src}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
              transition={{
                duration: 0.5,
                delay: 0.06 * index,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="group"
            >
              {item.type === 'photo' ? (
                <div className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 aspect-[4/3]">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex flex-col items-center justify-center gap-3 p-4">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className={item.wide 
                      ? 'h-10 sm:h-14 w-auto max-w-[80%] object-contain' 
                      : 'h-16 w-16 sm:h-20 sm:w-20 object-contain'
                    }
                  />
                  <p className="text-xs sm:text-sm text-slate-500 text-center font-medium leading-tight whitespace-pre-line">
                    {item.name}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
