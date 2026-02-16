import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PropertyTaxForm from '../components/PropertyTaxForm';
import { Calculator } from 'lucide-react';

const PropertyTax: React.FC = () => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>

      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-60 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-20 w-36 h-36 bg-primary/8 rounded-full blur-3xl"></div>

      <div className="container px-4 py-8 mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 mb-6 text-sm rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
            whileHover={{ scale: 1.05 }}
          >
            <Calculator className="w-4 h-4 mr-2 text-primary" />
            <span className="text-primary font-medium">{t('property_tax.header.badge')}</span>
          </motion.div>
          <h1 className="mb-4 text-4xl font-bold tracking-wide lg:text-6xl">
            <span className="text-gray-900">{t('property_tax.header.title_prefix')}</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-secondary">
              {t('property_tax.header.title_suffix')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('property_tax.header.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
            <PropertyTaxForm />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PropertyTax;
