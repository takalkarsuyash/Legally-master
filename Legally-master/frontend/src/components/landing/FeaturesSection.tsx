import type React from "react"
import type { JSX } from "react"
import { useMemo } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Brain, Shield, MessageSquare } from "lucide-react"

interface Feature {
  icon: JSX.Element
  title: string
  description: string
}

const sectionFadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
}

const FeaturesSection: React.FC = () => {
  const features: Feature[] = useMemo(
    () => [
      {
        icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: "AI-Powered Insights",
        description: "Advanced algorithms analyze case law and documents to provide actionable legal insights",
      },
      {
        icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: "Enterprise Security",
        description: "Military-grade encryption protects all sensitive data and client communications",
      },
      {
        icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
        title: "Seamless Collaboration",
        description: "Real-time document sharing and communication between all stakeholders",
      },
    ],
    [],
  )

  return (
    <section id="features" className="px-3 pt-4 pb-12 bg-white sm:px-4 sm:pt-6 sm:pb-16 md:pt-8 md:pb-20 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          variants={sectionFadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8 text-center sm:mb-10 md:mb-12"
        >
          <div className="inline-flex items-center px-3 py-1 mb-3 text-xs rounded-full bg-primary/10 text-primary sm:px-4 sm:py-1.5 sm:text-sm sm:mb-4">
            <span>Core Capabilities</span>
          </div>
          <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
            Powerful <span className="text-primary">Features</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            Discover the comprehensive suite of AI-powered tools designed to revolutionize your legal practice
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={sectionFadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{
                y: -5,
                boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
              }}
              className="relative p-4 bg-white rounded-lg border border-gray-100 shadow-md transition-all sm:p-6 md:rounded-xl group"
            >
              <div className="mb-3 text-primary sm:mb-4">{feature.icon}</div>
              <h3 className="mb-2 text-base font-semibold sm:text-lg md:text-xl">{feature.title}</h3>
              <p className="text-sm text-gray-600 sm:text-base">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection