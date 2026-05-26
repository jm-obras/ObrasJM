'use client'

import { motion } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface HeroSectionProps {
  onLoginClick: () => void
  onCtaClick: () => void
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * i,
      duration: 0.7,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

export function HeroSection({ onLoginClick, onCtaClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle radial glow accents */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl" />

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2.5">
              <Image
                src="/VSOPS.png"
                alt="VSOPS"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
              />
              <span className="text-white font-semibold text-lg tracking-tight font-[family-name:var(--font-poppins)]">
                ObrasJM
              </span>
            </div>

            {/* Login Button */}
            <Button
              variant="ghost"
              onClick={onLoginClick}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Iniciar Sesion
            </Button>
          </div>
        </div>
      </nav>

      {/* Center Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-emerald-400 text-xs sm:text-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plan de Recuperacion de Infraestructura Hospitalaria
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-[family-name:var(--font-poppins)] leading-tight"
          >
            Dr. Jose Gregorio{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Hernandez
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Uniendo esfuerzos del Estado para garantizar espacios de salud dignos,
            modernos y 100% operativos.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Button
              onClick={onCtaClick}
              size="lg"
              className="group relative bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
            >
              Ver Avance de Obras en Tiempo Real
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="relative z-10 flex justify-center pb-8"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1 text-white/40"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
