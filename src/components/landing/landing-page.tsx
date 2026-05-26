'use client'

import { useState } from 'react'
import { HeroSection } from './hero-section'
import { InstitutionsSection } from './institutions-section'
import { StatsSection } from './stats-section'
import { GallerySection } from './gallery-section'
import { ServicesSection } from './services-section'
import { FooterSection } from './footer-section'
import { LoginForm } from '@/components/login-form'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function LandingPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [showLogin, setShowLogin] = useState(false)

  const handleLoginClick = () => {
    setShowLogin(true)
  }

  const handleCtaClick = () => {
    setShowLogin(true)
  }

  return (
    <div className="min-h-screen">
      <HeroSection onLoginClick={handleLoginClick} onCtaClick={handleCtaClick} />
      <InstitutionsSection />
      <StatsSection />
      <GallerySection />
      <ServicesSection />
      <FooterSection onLoginClick={handleLoginClick} />

      {/* Login Modal */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-lg p-0 border-0 overflow-hidden bg-transparent shadow-none">
          <LoginForm embedded onLoginSuccess={() => {
            setShowLogin(false)
            onLoginSuccess?.()
          }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
