'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const obras = [
  { src: '/obras/obra-01.jpeg', alt: 'Avance de obra - Intervención hospitalaria' },
  { src: '/obras/obra-02.jpeg', alt: 'Avance de obra - Infraestructura' },
  { src: '/obras/obra-03.jpeg', alt: 'Avance de obra - Rehabilitación' },
  { src: '/obras/obra-04.jpeg', alt: 'Avance de obra - Trabajos en progreso' },
  { src: '/obras/obra-05.jpeg', alt: 'Avance de obra - Instalaciones' },
  { src: '/obras/obra-06.jpeg', alt: 'Avance de obra - Obras civiles' },
  { src: '/obras/obra-07.jpeg', alt: 'Avance de obra - Equipamiento' },
  { src: '/obras/obra-08.jpeg', alt: 'Avance de obra - Avances eléctricos' },
  { src: '/obras/obra-09.jpeg', alt: 'Avance de obra - Sistema de aguas' },
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

        {/* Masonry-like Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 sm:gap-5 space-y-4 sm:space-y-5">
          {obras.map((obra, index) => (
            <motion.div
              key={obra.src}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
              transition={{
                duration: 0.5,
                delay: 0.08 * index,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="break-inside-avoid group"
            >
              <div className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                <img
                  src={obra.src}
                  alt={obra.alt}
                  className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                />
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
