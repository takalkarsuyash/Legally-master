import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी' },
        { code: 'mr', label: 'मराठी' },
    ];

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl overflow-hidden shadow-2xl"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors
                                    ${i18n.language === lang.code 
                                        ? 'bg-purple-600 text-white' 
                                        : 'text-gray-800 hover:bg-gray-100'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/50 transition-shadow"
            >
                <Globe className="w-6 h-6" />
            </motion.button>
        </div>
    );
};

export default LanguageToggle;
