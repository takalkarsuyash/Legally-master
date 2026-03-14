import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  Award,
  Briefcase,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { searchPropertyLawyers, Lawyer } from "../services/lawyerService";

const FindLawyer: React.FC = () => {
  const { t } = useTranslation();
  const [city, setCity] = useState("");
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      toast.error(t("find_lawyer.enter_location_error"));
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchPropertyLawyers(city);
      setLawyers(results);
      if (results.length === 0) {
        toast(t("find_lawyer.no_results_toast"), { icon: "ℹ️" });
      }
    } catch (error) {
      toast.error(t("find_lawyer.search_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (name: string) => {
    toast.success(`${t("find_lawyer.contact_sent")} ${name}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden relative min-h-screen bg-gradient-to-br from-background via-background to-primary/10"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>
      <div className="absolute right-0 top-0 w-64 h-64 rounded-full blur-3xl bg-primary/5"></div>
      <div className="absolute left-0 bottom-0 w-64 h-64 rounded-full blur-3xl bg-secondary/10"></div>

      <div className="container relative z-10 px-4 py-8 mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary">
            <Briefcase className="mr-2 w-4 h-4" />
            <span className="font-semibold">{t("find_lawyer.badge")}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {t("find_lawyer.title_prefix")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              {t("find_lawyer.title_suffix")}
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            {t("find_lawyer.subtitle")}
          </p>
        </motion.div>

        {/* Search Only Location */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto p-6 mb-12 bg-white/70 rounded-2xl border border-white/50 shadow-xl backdrop-blur-xl"
        >
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("find_lawyer.search_placeholder")}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white/80"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 font-semibold text-white bg-gradient-to-r rounded-xl shadow-lg transition-all from-primary to-primary-dark hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading
                ? t("find_lawyer.searching")
                : t("find_lawyer.search_btn")}
            </button>
          </form>
        </motion.div>

        {/* Lawyers Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lawyers.map((lawyer, index) => (
            <motion.div
              key={lawyer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative bg-white/60 rounded-2xl border border-white/60 shadow-lg backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={lawyer.image}
                      alt={lawyer.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {lawyer.name}
                      </h3>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide">
                        {lawyer.specialization}
                      </p>
                    </div>
                  </div>
                  {lawyer.rating ? (
                    <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" />
                      <span className="text-xs font-bold text-yellow-700">
                        {lawyer.rating}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{lawyer.experience}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="line-clamp-1">{lawyer.address}</span>
                  </div>
                  {lawyer.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{lawyer.phone}</span>
                    </div>
                  )}
                  {lawyer.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a
                        href={lawyer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[200px] block"
                      >
                        {t("find_lawyer.website_link")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {hasSearched && lawyers.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">
              {t("find_lawyer.no_results_title")}
            </h3>
            <p className="text-gray-500 mt-2">
              {t("find_lawyer.no_results_desc")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FindLawyer;
