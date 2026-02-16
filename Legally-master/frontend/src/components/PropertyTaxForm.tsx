import React, { useState, useEffect, useRef } from "react";
import { calculatePropertyTax } from "../tax-engine/calculateTax";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, MapPin, Ruler, Briefcase, Calendar, 
  Calculator, Info, ChevronDown, User, Check 
} from "lucide-react";

type City =
  | "Delhi"
  | "Bangalore"
  | "Hyderabad"
  | "Ahmedabad"
  | "Chennai"
  | "Kolkata"
  | "Mumbai"
  | "Pune";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[] | string[];
  label: string;
  icon: React.ElementType;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, label, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLabel = (val: string) => {
    const option = options.find(opt => (typeof opt === 'string' ? opt === val : opt.value === val));
    if (!option) return val;
    return typeof option === 'string' ? option : option.label;
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block mb-2 text-sm font-bold text-gray-800 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm cursor-pointer flex justify-between items-center transition-all hover:bg-white/80 focus:ring-2 focus:ring-primary"
      >
        <span className="font-medium text-gray-900 truncate">{getLabel(value)}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map((option) => {
                const val = typeof option === 'string' ? option : option.value;
                const lab = typeof option === 'string' ? option : option.label;
                const isSelected = value === val;
                
                return (
                  <div
                    key={val}
                    onClick={() => {
                      onChange(val);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-primary/5'}`}
                  >
                    <span>{lab}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function PropertyTaxForm() {
  const [city, setCity] = useState<City>("Delhi");
  const [result, setResult] = useState<ReturnType<
    typeof calculatePropertyTax
  > | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});

  // Only reset result when city changes, keep form data
  useEffect(() => {
    setResult(null);
  }, [city]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.propertyAge) {
      alert("Please fill required fields");
      return;
    }

    const payload: Record<string, unknown> = { city };

    if (["Delhi", "Bangalore", "Hyderabad", "Ahmedabad"].includes(city)) {
      payload.area = Number(formData.area);
      payload.propertyType = formData.propertyType ?? "Residential";
      payload.usage = formData.usage ?? "SelfOccupied";
      payload.propertyAge = Number(formData.propertyAge);
      payload.zone = formData.zone ?? "A";
    }

    if (["Chennai", "Kolkata"].includes(city)) {
      payload.monthlyRent = Number(formData.monthlyRent);
      payload.propertyAge = Number(formData.propertyAge);
      payload.zone = formData.zone ?? "A";
    }

    if (["Mumbai", "Pune"].includes(city)) {
      payload.marketValue = Number(formData.marketValue);
      payload.constructionType = formData.constructionType ?? "RCC";
      payload.propertyAge = Number(formData.propertyAge);
      payload.usage = formData.usage ?? "SelfOccupied";
    }

    console.log("Payload:", payload);

    try {
      const taxResult = calculatePropertyTax(payload as any);
      setResult(taxResult);
    } catch (error) {
      console.error(error);
      alert("Error calculating tax. Please check your inputs.");
    }
  };

  const inputClass = "px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium";
  const labelClass = "block mb-2 text-sm font-bold text-gray-800 flex items-center gap-2";

  const cityOptions = [
    "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", 
    "Chennai", "Kolkata", "Mumbai", "Pune"
  ];

  const zoneOptions = [
      { value: "A", label: "Zone A" },
      { value: "B", label: "Zone B" },
      { value: "C", label: "Zone C" }
  ];

  const usageOptions = [
      { value: "SelfOccupied", label: "Self Occupied" },
      { value: "Rented", label: "Rented" }
  ];

  const typeOptions = [
      { value: "Residential", label: "Residential" },
      { value: "Commercial", label: "Commercial" }
  ];
  
  const constructionOptions = [
      { value: "RCC", label: "RCC" },
      { value: "NonRCC", label: "Non RCC" }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
                <Calculator className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Property Tax Calculator</h2>
                <p className="text-gray-600 text-sm">Calculate your estimated property tax based on city regulations</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
                <CustomSelect 
                    label="Select City"
                    icon={MapPin}
                    value={city}
                    onChange={(val) => setCity(val as City)}
                    options={cityOptions}
                />
            </div>

             {/* Dynamic Fields based on City */}
            <AnimatePresence mode="wait">
                {["Delhi", "Bangalore", "Hyderabad", "Ahmedabad"].includes(city) && (
                    <motion.div
                        key="uav-fields"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="contents"
                    >
                         <div>
                            <label className={labelClass}>
                                <Ruler className="w-4 h-4 text-primary" />
                                Area (sq ft)
                            </label>
                            <input
                                name="area"
                                type="number"
                                placeholder="e.g. 1200"
                                value={formData.area || ""}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <CustomSelect 
                                label="Property Type"
                                icon={Building}
                                value={formData.propertyType || "Residential"}
                                onChange={(val) => handleSelectChange("propertyType", val)}
                                options={typeOptions}
                            />
                        </div>
                        <div>
                            <CustomSelect 
                                label="Usage"
                                icon={User}
                                value={formData.usage || "SelfOccupied"}
                                onChange={(val) => handleSelectChange("usage", val)}
                                options={usageOptions}
                            />
                        </div>
                        <div>
                           <label className={labelClass}>
                                <Calendar className="w-4 h-4 text-primary" />
                                Property Age (Years)
                            </label>
                            <input
                                name="propertyAge"
                                type="number"
                                placeholder="e.g. 5"
                                value={formData.propertyAge || ""}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <CustomSelect 
                                label="Zone"
                                icon={MapPin}
                                value={formData.zone || "A"}
                                onChange={(val) => handleSelectChange("zone", val)}
                                options={zoneOptions}
                            />
                        </div>
                    </motion.div>
                )}

                {["Chennai", "Kolkata"].includes(city) && (
                    <motion.div
                        key="arv-fields"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="contents"
                    >
                         <div>
                            <label className={labelClass}>
                                <Briefcase className="w-4 h-4 text-primary" />
                                Monthly Rent (₹)
                            </label>
                            <input
                                name="monthlyRent"
                                type="number"
                                placeholder="e.g. 15000"
                                value={formData.monthlyRent || ""}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                           <label className={labelClass}>
                                <Calendar className="w-4 h-4 text-primary" />
                                Property Age (Years)
                            </label>
                            <input
                                name="propertyAge"
                                type="number"
                                placeholder="e.g. 5"
                                value={formData.propertyAge || ""}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <CustomSelect 
                                label="Zone"
                                icon={MapPin}
                                value={formData.zone || "A"}
                                onChange={(val) => handleSelectChange("zone", val)}
                                options={zoneOptions}
                            />
                        </div>
                    </motion.div>
                )}

                {["Mumbai", "Pune"].includes(city) && (
                    <motion.div
                         key="cvs-fields"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="contents"
                    >
                         <div>
                            <label className={labelClass}>
                                <Briefcase className="w-4 h-4 text-primary" />
                                Market Value (₹)
                            </label>
                            <input
                                name="marketValue"
                                type="number"
                                placeholder="e.g. 5000000"
                                value={formData.marketValue || ""}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                             <CustomSelect 
                                label="Construction Type"
                                icon={Building}
                                value={formData.constructionType || "RCC"}
                                onChange={(val) => handleSelectChange("constructionType", val)}
                                options={constructionOptions}
                            />
                        </div>
                         <div>
                           <label className={labelClass}>
                                <Calendar className="w-4 h-4 text-primary" />
                                Property Age (Years)
                            </label>
                            <input
                                name="propertyAge"
                                type="number"
                                placeholder="e.g. 5"
                                value={formData.propertyAge || ""}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        </div>
                         <div>
                            <CustomSelect 
                                label="Usage"
                                icon={User}
                                value={formData.usage || "SelfOccupied"}
                                onChange={(val) => handleSelectChange("usage", val)}
                                options={usageOptions}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="flex justify-end pt-4">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
                <Calculator className="w-5 h-5" />
                Calculate Tax
            </motion.button>
        </div>

        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 shadow-lg backdrop-blur-sm"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <Info className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Estimated Tax Amount</h3>
                            <div className="text-4xl font-bold text-gray-900">
                                ₹ {Number(result.taxAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Based on {result.system} system for {city}.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
