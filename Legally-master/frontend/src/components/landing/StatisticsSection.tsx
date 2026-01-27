import type React from "react"
import { useMemo } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"

interface Statistic {
  value: string
  label: string
}

const sectionFadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
}

const StatisticsSection: React.FC = () => {
  const statistics: Statistic[] = useMemo(
    () => [
      { value: "98%", label: "Success Rate" },
      { value: "50K+", label: "Cases Analyzed" },
      { value: "24/7", label: "Support" },
      { value: "100+", label: "Legal Experts" },
    ],
    [],
  )

  return (
    <section
      id="statistics"
      className="px-3 py-12 bg-gradient-to-b from-gray-50 to-primary/5 sm:px-4 sm:py-16 md:py-20 lg:px-8"
    >
      <div className="container mx-auto max-w-7xl">
        <motion.div
          variants={sectionFadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8 text-center sm:mb-10 md:mb-12"
        >
          <div className="inline-flex items-center px-3 py-1 mb-3 text-xs rounded-full bg-primary/10 text-primary sm:px-4 sm:py-1.5 sm:text-sm sm:mb-4">
            <span>By The Numbers</span>
          </div>
          <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
            Measurable <span className="text-primary">Results</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            Our platform delivers tangible success for legal professionals worldwide
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {statistics.map((stat, index) => (
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
              className="overflow-hidden relative p-4 text-center bg-white rounded-lg shadow-md sm:p-6 md:rounded-xl"
            >
              <motion.div
                className="mb-1 text-xl font-bold text-primary sm:mb-2 sm:text-2xl md:text-3xl lg:text-4xl"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs font-medium text-gray-500 sm:text-sm md:text-base">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatisticsSection