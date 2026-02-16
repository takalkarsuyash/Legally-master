import type React from "react"
import type { JSX } from "react"
import { useMemo } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Brain, Database, MessageSquare, Calendar, FileText, Users, Zap, Shield } from "lucide-react"
interface Benefit {
  icon: JSX.Element
  title: string
  description: string
  highlight?: boolean
}

const sectionFadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
}

const BenefitsSection: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const benefits: Benefit[] = useMemo(
    () => [
      {
        icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: t("landing.benefits.items.a2a.title"),
        description: t("landing.benefits.items.a2a.desc"),
        highlight: true,
      },
      {
        icon: <Database className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: t("landing.benefits.items.rag.title"),
        description: t("landing.benefits.items.rag.desc"),
        highlight: true,
      },
      {
        icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: t("landing.benefits.items.query.title"),
        description: t("landing.benefits.items.query.desc"),
      },
      {
        icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: t("landing.benefits.items.summarization.title"),
        description: t("landing.benefits.items.summarization.desc"),
      },
      {
        icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: t("landing.benefits.items.diary.title"),
        description: t("landing.benefits.items.diary.desc"),
      },
      {
        icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: t("landing.benefits.items.finding.title"),
        description: t("landing.benefits.items.finding.desc"),
      },
    ],
    [t],
  )

  return (
    <section id="benefits" className="px-3 py-8 bg-gradient-to-br from-gray-50 to-white sm:px-4 sm:py-12 md:py-16 lg:px-8 lg:py-20">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          variants={sectionFadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8 text-center sm:mb-12 md:mb-16"
        >
          <div className="inline-flex items-center px-3 py-1.5 mb-3 text-xs rounded-full bg-primary/10 text-primary sm:px-4 sm:py-2 sm:text-sm sm:mb-4">
            <Zap className="mr-1.5 w-3 h-3 sm:mr-2 sm:w-4 sm:h-4" />
            <span>{t("landing.benefits.badge")}</span>
          </div>
          <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
            {t("landing.benefits.title_prefix")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t("landing.benefits.title_highlight")}</span> {t("landing.benefits.title_suffix")}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base md:text-lg">
            {t("landing.benefits.description")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item, index) => (
            <motion.div
              key={index}
              variants={sectionFadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              className={`relative p-4 rounded-xl transition-all duration-300 sm:p-6 sm:rounded-2xl ${item.highlight
                ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 shadow-lg"
                : "bg-white border border-gray-200 shadow-md hover:shadow-lg"
                }`}
            >
              {item.highlight && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r rounded-full from-primary to-secondary"></div>
              )}

              <div className={`flex justify-center items-center w-10 h-10 rounded-lg mb-3 sm:w-12 sm:h-12 sm:rounded-xl sm:mb-4 ${item.highlight
                ? "bg-gradient-to-r from-primary to-secondary"
                : "bg-primary/10"
                }`}>
                <div className={item.highlight ? "text-white" : "text-primary"}>
                  {item.icon}
                </div>
              </div>

              <h3 className="mb-2 text-base font-bold text-gray-900 sm:text-lg md:text-xl">
                {item.title}
              </h3>

              <p className="text-xs leading-relaxed text-gray-600 sm:text-sm md:text-base">
                {item.description}
              </p>

              {item.highlight && (
                <div className="flex items-center mt-4 text-xs font-semibold text-primary">
                  <span className="px-2 py-1 rounded-full bg-primary/10">Featured</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          variants={sectionFadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 text-center sm:mt-12 md:mt-16"
        >
          <div className="p-4 bg-gradient-to-r rounded-xl border from-primary/10 to-secondary/10 border-primary/20 sm:p-6 md:p-8 sm:rounded-2xl">
            <h3 className="mb-3 text-lg font-bold text-gray-900 sm:mb-4 sm:text-xl md:text-2xl">
              {t("landing.benefits.cta.title")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
              {t("landing.benefits.cta.subtitle")}
            </p>
            <div className="flex flex-col gap-3 justify-center sm:flex-row sm:gap-4">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => navigate('/query')}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r rounded-lg shadow-lg transition-all from-primary to-primary-dark hover:shadow-xl sm:px-6 sm:py-3"
              >
                {t("landing.benefits.cta.search_btn")}
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => navigate('/draft')}
                className="px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all text-primary border-primary hover:bg-primary hover:text-white sm:px-6 sm:py-3"
              >
                {t("landing.benefits.cta.draft_btn")}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default BenefitsSection