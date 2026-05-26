'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { HardHat, Ruler, Wrench, TrendingUp } from 'lucide-react'

interface StatsData {
  frentesActivos: number
  metrosCuadrados: number
  especialidades: number
  pafGlobal: number
}

interface CounterCardProps {
  icon: React.ElementType
  label: string
  value: number
  suffix?: string
  inView: boolean
  delay: number
}

function AnimatedCounter({
  value,
  suffix = '',
  inView,
}: {
  value: number
  suffix?: string
  inView: boolean
}) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef<number | null>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Only animate once when section scrolls into view
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    const duration = 1800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * value))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [inView, value])

  return (
    <span className="text-4xl sm:text-5xl font-bold text-emerald-400 font-[family-name:var(--font-poppins)] tabular-nums">
      {displayed.toLocaleString('es-VE')}
      {suffix}
    </span>
  )
}

function CounterCard({ icon: Icon, label, value, suffix, inView, delay }: CounterCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative group rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 text-center hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-emerald-500/0 group-hover:from-blue-500/5 group-hover:to-emerald-500/5 transition-all duration-300" />

      <div className="relative z-10 space-y-3 sm:space-y-4">
        <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-400" />
        </div>
        <AnimatedCounter value={value} suffix={suffix} inView={inView} />
        <p className="text-sm sm:text-base text-white/60 font-medium leading-snug">
          {label}
        </p>
      </div>
    </motion.div>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [data, setData] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/landing/stats')
      .then((res) => res.json())
      .then((json) => {
        // API returns { data: StatsData } shape
        const payload = json.data ?? json
        setData(payload)
      })
      .catch(() => {
        // Fallback data if API fails
        setData({
          frentesActivos: 12,
          metrosCuadrados: 25000,
          especialidades: 16,
          pafGlobal: 34,
        })
      })
  }, [])

  const cards: CounterCardProps[] = data
    ? [
        {
          icon: HardHat,
          label: 'Frentes de Obra Activos',
          value: data.frentesActivos,
          inView: isInView,
          delay: 0,
        },
        {
          icon: Ruler,
          label: 'Metros Cuadrados Intervenidos',
          value: data.metrosCuadrados,
          suffix: ' m\u00B2',
          inView: isInView,
          delay: 0.1,
        },
        {
          icon: Wrench,
          label: 'Especialidades Desplegadas',
          value: data.especialidades,
          inView: isInView,
          delay: 0.2,
        },
        {
          icon: TrendingUp,
          label: 'Avance Global',
          value: data.pafGlobal,
          suffix: '%',
          inView: isInView,
          delay: 0.3,
        },
      ]
    : []

  return (
    <section ref={ref} className="relative bg-slate-900 py-16 sm:py-20 md:py-24 overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-500/3 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-emerald-500/3 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-poppins)]">
            Cifras que{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Hablan
            </span>
          </h2>
          <p className="mt-3 text-white/50 text-sm sm:text-base max-w-lg mx-auto">
            Datos en tiempo real del avance de la recuperacion infraestructural
          </p>
        </motion.div>

        {/* Counter Cards Grid */}
        {data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card) => (
              <CounterCard key={card.label} {...card} />
            ))}
          </div>
        ) : (
          /* Loading skeleton */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 text-center animate-pulse"
              >
                <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white/5 mb-4" />
                <div className="h-10 sm:h-12 w-20 sm:w-24 bg-white/5 rounded mx-auto mb-3" />
                <div className="h-4 w-28 sm:w-32 bg-white/5 rounded mx-auto" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
