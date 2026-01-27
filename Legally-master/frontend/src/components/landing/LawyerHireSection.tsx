import React, { useState } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Star, Clock, Award, User } from "lucide-react"
import { coreLawyers, type Lawyer } from "../../data/lawyerData"
import RazorpayButton from "../RazorpayButton"
import LawyerChatModal from "../LawyerChatModal"

const sectionFadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeInOut" },
    },
}

const LawyerCard: React.FC<{ lawyer: Lawyer; index: number; onLearnMore: (lawyer: Lawyer) => void }> = ({ lawyer, index, onLearnMore }) => {

    return (
        <div className="overflow-hidden relative flex-col flex-shrink-0 p-3 mx-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg sm:mx-3 sm:p-4 sm:w-80 sm:rounded-2xl md:mx-4 md:p-6">
            <div className="flex relative z-10 flex-col h-full">
                {/* Specialization & Rating */}
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20 sm:text-sm sm:px-3 sm:py-1.5">
                        {lawyer.specialization}
                    </span>
                    <div className="flex gap-1 items-center">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 sm:w-4 sm:h-4" />
                        <span className="text-xs font-medium text-gray-700 sm:text-sm">{lawyer.rating}</span>
                    </div>
                </div>

                {/* Lawyer Image */}
                <div className="overflow-hidden relative mb-3 w-full h-32 rounded-lg sm:h-40 sm:mb-4 sm:rounded-xl md:h-48">
                    <img
                        src={lawyer.image}
                        alt={lawyer.name}
                        className="object-cover w-full h-full"
                    />
                </div>

                {/* Name & Experience */}
                <div className="mb-2 sm:mb-3">
                    <h3 className="mb-1 text-lg font-semibold tracking-tight leading-tight text-gray-900 sm:text-xl">
                        {lawyer.name}
                    </h3>
                    <div className="flex gap-2 items-center text-xs text-gray-600 sm:text-sm">
                        <Clock className="w-3 h-3 text-primary sm:w-4 sm:h-4" />
                        <span>{lawyer.experience} Experience</span>
                    </div>
                </div>

                {/* Description */}
                <p className="mb-3 text-gray-600 text-xs/relaxed line-clamp-2 sm:mb-4 sm:text-sm sm:line-clamp-3">
                    {lawyer.description}
                </p>

                {/* Achievements */}
                <div className="flex flex-wrap gap-1 mb-3 sm:gap-2 sm:mb-4">
                    {lawyer.achievements.slice(0, 2).map((achievement, i) => (
                        <span
                            key={i}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-full border"
                        >
                            {achievement}
                        </span>
                    ))}
                </div>

                {/* Languages */}
                <div className="mb-3 sm:mb-4">
                    <span className="text-xs font-medium text-gray-500">Languages: </span>
                    <span className="text-xs text-gray-600">{lawyer.languages.slice(0, 2).join(", ")}</span>
                    {lawyer.languages.length > 2 && (
                        <span className="text-xs text-gray-500"> +{lawyer.languages.length - 2}</span>
                    )}
                </div>

                {/* Pricing & Action */}
                <div className="mt-auto space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 sm:pt-3">
                        <span className="text-xs font-medium text-gray-600 sm:text-sm">30 min consultation</span>
                        <span className="text-xl font-bold text-primary sm:text-2xl">${lawyer.price}</span>
                    </div>

                    <button
                        onClick={() => onLearnMore(lawyer)}
                        className="flex gap-1 justify-center items-center px-3 py-2 w-full text-xs font-medium text-white rounded-lg shadow-lg transition-colors duration-200 bg-primary hover:bg-primary-dark sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:rounded-xl"
                    >
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    )
}

const LawyerHireSection: React.FC = () => {
    const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLearnMore = (lawyer: Lawyer) => {
        setSelectedLawyer(lawyer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLawyer(null);
    };

    // Create infinite array of lawyers for seamless looping
    const infiniteLawyers = [...coreLawyers, ...coreLawyers, ...coreLawyers, ...coreLawyers]

    return (
        <section
            id="lawyers"
            className="px-3 py-12 bg-gradient-to-br from-white to-gray-50 sm:px-4 sm:py-16 md:py-20 lg:px-8"
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
                        <Award className="mr-2 w-4 h-4" />
                        <span>Talk to the Experts</span>
                    </div>
                    <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
                        Hire Top <span className="text-primary">Legal Experts</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
                        Connect with experienced lawyers and get expert legal advice for your specific needs
                    </p>
                </motion.div>

                {/* Continuous Moving Carousel */}
                <div className="overflow-hidden relative">
                    <motion.div
                        className="flex"
                        animate={{
                            x: [0, -304 * coreLawyers.length] // Responsive: 304px for mobile (w-72 + mx-2*2), 352px for larger screens
                        }}
                        transition={{
                            duration: 40, // 40 seconds for one full cycle (slower as requested)
                            ease: "linear",
                            repeat: Infinity
                        }}
                    >
                        {infiniteLawyers.map((lawyer, index) => (
                            <LawyerCard
                                key={`${lawyer.id}-${index}`}
                                lawyer={lawyer}
                                index={index}
                                onLearnMore={handleLearnMore}
                            />
                        ))}
                    </motion.div>
                </div>
            </div>

            {selectedLawyer && (
                <LawyerChatModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    lawyer={selectedLawyer}
                />
            )}
        </section>
    )
}

export default LawyerHireSection
