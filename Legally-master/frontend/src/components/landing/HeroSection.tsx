"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";
import {
  Shield,
  ArrowRight,
  Users,
  ChevronDown,
  Zap,
  Brain,
  Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import homeimg from "../../assets/homeimg.png";

const heroFadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden relative pb-8 w-full bg-gradient-to-br from-gray-50 to-white sm:pb-10">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-ambient-pattern" />

      <div className="relative px-3 pt-2 sm:px-6 sm:pt-4 md:px-8 md:pt-6 lg:px-12 lg:pt-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            {/* Left */}
            <div className="w-full text-center lg:w-2/5 lg:text-left">
              <div className="mx-auto max-w-sm sm:max-w-md lg:mx-0">
                <motion.div
                  variants={heroFadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-primary/10 text-primary"
                >
                  <Zap className="mr-2 w-4 h-4" />
                  <span>Revolutionary Legal Platform</span>
                </motion.div>

                <motion.h1
                  variants={heroFadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="mb-4 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl"
                >
                  <span className="block">{t('landing.hero_title')}</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary underline decoration-wavy decoration-primary underline-offset-4 sm:underline-offset-6 lg:underline-offset-8">
                    Legal Practice
                  </span>
                  <span className="block">is Here</span>
                </motion.h1>

                <motion.p
                  variants={heroFadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="mx-auto mb-6 text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg lg:mx-0"
                >
                  {t('landing.hero_subtitle')}
                </motion.p>

                <motion.div
                  variants={heroFadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3 justify-center mt-6 sm:flex-row sm:gap-4 lg:justify-start sm:mt-8"
                >
                  {/* Search Query Button */}
                  <motion.button
                    onClick={() => navigate('/query')}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    className="flex gap-2 justify-center items-center px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r rounded-lg shadow-lg transition-all from-primary to-primary-dark hover:shadow-xl sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t('landing.hero_features.search')}</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </motion.button>

                  {/* Draft Document Button */}
                  <motion.button
                    onClick={() => navigate('/draft')}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    className="flex gap-2 justify-center items-center px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all text-primary border-primary hover:bg-primary hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t('landing.hero_features.draft')}</span>
                  </motion.button>
                </motion.div>

                <motion.div
                  variants={heroFadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-3 justify-center mt-6 text-xs text-gray-500 sm:flex-row sm:gap-6 lg:justify-start sm:text-sm"
                >
                  <div className="flex gap-2 justify-center items-center sm:justify-start">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>{t('landing.hero_features.security')}</span>
                  </div>
                  <div className="flex gap-2 justify-center items-center sm:justify-start">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{t('landing.hero_features.law_firms')}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right */}
            <motion.div
              variants={heroFadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="relative w-full lg:w-3/5"
            >
              <div className="overflow-hidden mx-auto w-full max-w-xs bg-white rounded-2xl border border-gray-100 shadow-2xl sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl lg:ml-auto">
                <div className="absolute inset-0 bg-gradient-to-tr mix-blend-overlay from-primary/10 to-secondary/10" />
                <img
                  src={homeimg}
                  alt="Legal dashboard"
                  className="object-cover w-full h-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder.svg?height=600&width=800";
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        variants={heroFadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.5 }}
        className="hidden absolute bottom-6 left-1/2 flex-col items-center transform -translate-x-1/2 sm:flex"
      >
        <span className="mb-1 text-xs text-gray-500">Scroll to explore</span>
        <ChevronDown className="w-5 h-5 text-primary" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
