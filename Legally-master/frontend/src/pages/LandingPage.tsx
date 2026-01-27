"use client"

import type React from "react"
import HeroSection from "../components/landing/HeroSection"
import LawyerHireSection from "../components/landing/LawyerHireSection"
import BenefitsSection from "../components/landing/BenefitsSection"
import Footer from "../components/landing/Footer"

interface LandingPageProps {
  className?: string
}

const LandingPage: React.FC<LandingPageProps> = ({ className = "" }) => {
  return (
    <>
      <div className="overflow-x-hidden">
        {/* Hero Section */}
        <HeroSection />

        {/* <LawyerHireSection /> */}

        {/* Benefits Section */}
        <BenefitsSection />

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

export default LandingPage
