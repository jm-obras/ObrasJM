'use client';

import { Building2, Zap, Droplets, Wifi } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const services = [
  {
    title: 'Infraestructura Civil',
    institution: 'MPPOP / Alcaldía',
    description:
      'Restauración, impermeabilización y obras civiles para la recuperación estructural del hospital.',
    icon: Building2,
    accentClass: 'bg-blue-600/10 text-blue-600',
    iconBg: 'bg-blue-600/10',
  },
  {
    title: 'Energía Continua',
    institution: 'Corpoelec',
    description:
      'Generadores, UPS y luminarias de alta eficiencia para garantizar un suministro eléctrico ininterrumpido.',
    icon: Zap,
    accentClass: 'bg-amber-500/10 text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  {
    title: 'Agua y Saneamiento',
    institution: 'MinAguas / Hidroven',
    description:
      'Sistemas de bombeo, cloración y destape de tuberías para asegurar agua potable y saneamiento.',
    icon: Droplets,
    accentClass: 'bg-cyan-500/10 text-cyan-500',
    iconBg: 'bg-cyan-500/10',
  },
  {
    title: 'Conectividad',
    institution: 'CANTV',
    description:
      'Telecomunicaciones y redes de datos para telemedicina y comunicación institucional.',
    icon: Wifi,
    accentClass: 'bg-emerald-500/10 text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2
            className="font-[family-name:var(--font-poppins)] text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Ejes de Acción
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Cada institución aporta su expertise para la recuperación total del hospital
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          ref={sectionRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                variants={cardVariants}
                className="group rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="p-6">
                  {/* Icon */}
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${service.iconBg}`}
                  >
                    <Icon className={`h-7 w-7 ${service.accentClass.split(' ')[1]}`} />
                  </div>

                  {/* Institution badge */}
                  <span className="mb-3 inline-block rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {service.institution}
                  </span>

                  {/* Title */}
                  <h3
                    className="mb-2 text-lg font-semibold text-slate-900 font-[family-name:var(--font-poppins)]"
                  >
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
