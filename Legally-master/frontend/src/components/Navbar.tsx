import React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";
import ProfileImage from "./ProfileImage";

interface NavItem {
  label: string;
  id: string;
  path: string;
}

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { scrollY } = useScroll();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const navItems: ReadonlyArray<NavItem> = useMemo(
    () => [
      {
        label: t("navbar.summarisation"),
        id: "summarisation",
        path: "/summarisation",
      },
      { label: t("navbar.query"), id: "doc-query", path: "/query" },
      { label: t("navbar.draft"), id: "draft", path: "/draft" },
      {
        label: t("navbar.property_tax"),
        id: "property-tax",
        path: "/property-tax",
      },
      {
        label: t("navbar.find_lawyer"),
        id: "find-lawyer",
        path: "/find-lawyer",
      },
    ],
    [t],
  );

  const handleScroll = useCallback(() => {
    setIsScrolled(scrollY.get() > 20);
  }, [scrollY]);

  useMotionValueEvent(scrollY, "change", handleScroll);

  const toggleMobileMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Handle clicks outside of mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest(".mobile-menu-button")) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`sticky top-0 w-full z-50 transition-all duration-300 ${
          location.pathname === "/"
            ? isScrolled
              ? "py-2 shadow-lg backdrop-blur-lg bg-white/98 border-b border-gray-100"
              : "py-3 bg-gradient-to-br from-gray-50 to-white backdrop-blur-sm"
            : "py-3 bg-gradient-to-br from-background via-background to-primary/10 backdrop-blur-xl shadow-lg border-b border-white/30"
        }`}
      >
        <div className="container px-6 mx-auto">
          <div className="flex justify-between items-center h-16">
            {/* Logo positioned to the left with margin adjustment */}
            <Link
              to="/"
              className="flex flex-shrink-0 items-center -ml-4 group md:-ml-6 lg:-ml-8"
            >
              <img
                src={logo}
                alt="LegalEase Logo"
                className="
                  object-contain
                  h-12
                  w-auto
                  sm:h-14
                  md:h-16
                  lg:h-20
                  transition-all
                "
                style={{ display: "block" }}
              />
            </Link>
            {/* Desktop nav */}
            <motion.div
              className="hidden items-center space-x-8 md:flex"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, staggerChildren: 0.1 }}
            >
              {navItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    className={`transition-colors relative ${
                      location.pathname === "/"
                        ? "text-gray-700 hover:text-primary"
                        : "text-gray-700 hover:text-primary"
                    } ${
                      location.pathname === item.path
                        ? location.pathname === "/"
                          ? "font-semibold text-primary"
                          : "font-semibold text-primary"
                        : ""
                    }`}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <motion.div
                        className={`absolute right-0 left-0 h-[2px] bottom-[-4px] bg-primary`}
                        layoutId="activeNavIndicator"
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
              {/* Auth Button */}
              <motion.div>
                {user ? (
                  <Link to="/profile">
                    <ProfileImage className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                  >
                    {t("navbar.login")}
                  </Link>
                )}
              </motion.div>
            </motion.div>
            {/* Mobile menu button, absolutely positioned to the right */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-50 p-2 ml-auto md:hidden mobile-menu-button"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              style={{ marginLeft: "auto" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6 text-gray-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full z-50 bg-gradient-to-br border-b shadow-lg backdrop-blur-xl from-background via-background to-primary/10 border-white/30"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="px-4 py-2"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.2 },
                },
                closed: {
                  transition: { staggerChildren: 0.05, staggerDirection: -1 },
                },
              }}
            >
              <div className="space-y-1">
                {navItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={{
                      open: { y: 0, opacity: 1 },
                      closed: { y: -20, opacity: 0 },
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={item.path}
                      className={`block py-2.5 px-3 transition-all duration-200 rounded-md ${
                        location.pathname === "/"
                          ? "text-gray-700 hover:text-primary hover:bg-primary/5"
                          : "text-gray-700 hover:text-primary hover:bg-primary/5"
                      } ${
                        location.pathname === item.path
                          ? location.pathname === "/"
                            ? "font-semibold text-primary bg-primary/5"
                            : "font-semibold text-primary bg-primary/5"
                          : "hover:translate-x-1"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                {/* Mobile Auth */}
                <motion.div
                  variants={{
                    open: { y: 0, opacity: 1 },
                    closed: { y: -20, opacity: 0 },
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {user ? (
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 w-full py-2.5 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md mt-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ProfileImage className="w-8 h-8" />
                      <span className="font-semibold">My Profile</span>
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full py-2.5 px-3 text-center text-white bg-primary rounded-lg font-semibold hover:bg-primary-dark transition mt-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
