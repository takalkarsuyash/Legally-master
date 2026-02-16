"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { FaXTwitter as XIcon, FaGithub, FaLinkedinIn } from "react-icons/fa6"; // make sure you install react-icons v6+

const sectionFadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer
      id="footer"
      className="overflow-hidden relative px-6 py-12 text-gray-800 bg-gradient-to-br from-gray-50 via-white to-gray-100"
    >
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 md:gap-10">
          {/* About & Social */}
          <motion.div
            variants={sectionFadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="col-span-2 md:col-span-1"
          >
            <div className="flex gap-2 items-center mb-4">
              <Scale className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">LegalEase</span>
            </div>
            <p className="text-sm text-gray-600">
              {t('landing.footer.desc')}
            </p>

            <div className="flex gap-3 mt-4">
              {/* X */}
              <a
                href="https://x.com/takalkar_s85267"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center w-8 h-8 text-gray-600 bg-gray-100 rounded-full transition-all hover:bg-primary hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </a>
              {/* GitHub */}
              <a
                href="https://github.com/takalkarsuyash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center w-8 h-8 text-gray-600 bg-gray-100 rounded-full transition-all hover:bg-primary hover:text-white"
              >
                <FaGithub className="w-4 h-4" />
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/suyash-takalkar-1b52b6208/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center w-8 h-8 text-gray-600 bg-gray-100 rounded-full transition-all hover:bg-primary hover:text-white"
              >
                <FaLinkedinIn className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Footer Links */}
          {[
            {
              title: t('landing.footer.sections.product'),
              links: [
                { label: t('landing.footer.links.research'), to: "/research" },
                { label: t('landing.footer.links.drafting'), to: "/draft" },
                { label: t('landing.footer.links.management'), to: "/management" },
                { label: t('landing.footer.links.analytics'), to: "/analytics" },
              ],
            },
            {
              title: t('landing.footer.sections.company'),
              links: [
                { label: t('landing.footer.links.about'), to: "/about" },
                { label: t('landing.footer.links.careers'), to: "/careers" },
                { label: t('landing.footer.links.press'), to: "/press" },
                { label: t('landing.footer.links.contact'), to: "/contact" },
              ],
            },
            {
              title: t('landing.footer.sections.resources'),
              links: [
                { label: t('landing.footer.links.blog'), to: "/blog" },
                { label: t('landing.footer.links.insights'), to: "/insights" },
                { label: t('landing.footer.links.studies'), to: "/studies" },
                { label: t('landing.footer.links.help'), to: "/help" },
              ],
            },
          ].map((section, index) => (
            <motion.div
              key={index}
              variants={sectionFadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={index === 0 ? "hidden sm:block" : ""}
            >
              <h3 className="mb-3 text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-600 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={sectionFadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="pt-6 mt-10 text-center text-gray-600 border-t border-gray-200"
        >
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()} {t('landing.footer.rights')}
          </p>
          <p className="mt-1 text-xs sm:text-sm">
            {t('landing.footer.made_with')} <span className="text-red-500">❤️</span> by Team
            RobinHood
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;