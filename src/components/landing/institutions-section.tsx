'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const logos = [
  { src: '/instituciones/mppop.png', name: 'MPPOP' },
  { src: '/instituciones/corpoelec.png', name: 'CORPOELEC Industrial' },
  { src: '/instituciones/cantv.png', name: 'CANTV' },
  { src: '/instituciones/minaguas.png', name: 'MinAguas' },
  { src: '/instituciones/hidroven.png', name: 'Hidroven' },
  { src: '/instituciones/fundeeh.png', name: 'FUNDEEH' },
  { src: '/instituciones/alcaldia.png', name: 'Alcaldía de Caracas' },
]

// Duplicate for seamless loop
const duplicatedLogos = [...logos, ...logos]

export function InstitutionsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-gray-50 py-16 sm:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 font-[family-name:var(--font-poppins)] max-w-3xl mx-auto leading-relaxed">
            Un esfuerzo articulado por la Vicepresidencia Sectorial de Obras Públicas y Servicios
          </h2>
        </motion.div>

        {/* Marquee Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

          {/* Overflow hidden wrapper */}
          <div className="overflow-hidden">
            {/* Scrolling track using CSS animation via inline style */}
            <div
              className="flex gap-4 sm:gap-6 w-max animate-[marquee_30s_linear_infinite]"
              onMouseEnter={(e) => {
                e.currentTarget.style.animationPlayState = 'paused'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animationPlayState = 'running'
              }}
            >
              {duplicatedLogos.map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-20 sm:h-24 w-40 sm:w-48 flex items-center justify-center shrink-0 group/card"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="max-h-full max-w-full object-contain filter grayscale group-hover/card:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Keyframes in global CSS - added to tailwind config via arbitrary value */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </section>
  )
}
