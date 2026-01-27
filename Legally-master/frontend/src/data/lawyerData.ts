// Import lawyer images
import badalSharma from "../assets/lawyers/badalsharma.png";
import brijeshKulkarni from "../assets/lawyers/brijeshkulkarni.png";
import pandurangKamble from "../assets/lawyers/pandurangkamble.png";
import poojaMishra from "../assets/lawyers/poojamishra.png";
import rakeshVerma from "../assets/lawyers/rakeshverma.png";
import sachinSonawane from "../assets/lawyers/sachinsonawane.png";
import smitaSingh from "../assets/lawyers/smitasingh.png";

export interface Lawyer {
  id: number;
  name: string;
  image: string;
  specialization: string;
  experience: string;
  rating: number;
  price: number;
  description: string;
  achievements: string[];
  languages: string[];
  location?: string;
  education?: string;
  barAssociation?: string;
  casesWon?: number;
  yearsOfPractice?: number;
  website?: string;
  phone_number?: string;
}

// Core lawyers displayed in the carousel (existing data)
export const coreLawyers: Lawyer[] = [
  {
    id: 1,
    name: "Badal Sharma",
    image: badalSharma,
    specialization: "Corporate Law",
    experience: "12+ Years",
    rating: 4.9,
    price: 25,
    description: "Expert in corporate restructuring and M&A transactions",
    achievements: ["Top 100 Corporate Lawyers", "Best M&A Lawyer 2023"],
    languages: ["English", "Hindi", "Gujarati"],
    location: "Mumbai",
    education: "LLB, Harvard Law School",
    barAssociation: "Bombay High Court",
    casesWon: 150,
    yearsOfPractice: 12,
    website: "www.sharmalegal.com",
    phone_number: "+91 98765 43210",
  },
  {
    id: 2,
    name: "Brijesh Kulkarni",
    image: brijeshKulkarni,
    specialization: "Criminal Law",
    experience: "15+ Years",
    rating: 4.8,
    price: 20,
    description: "Renowned criminal defense attorney with high success rate",
    achievements: ["Senior Advocate", "Criminal Law Expert"],
    languages: ["English", "Hindi", "Marathi"],
    location: "Delhi",
    education: "LLB, Delhi University",
    barAssociation: "Delhi High Court",
    casesWon: 200,
    yearsOfPractice: 15,
    website: "www.kulkarnilaw.com",
    phone_number: "+91 98123 45678",
  },
  {
    id: 3,
    name: "Pandurang Kamble",
    image: pandurangKamble,
    specialization: "Property Law",
    experience: "8 Years",
    rating: 4.7,
    price: 18,
    description: "Specialist in real estate and property disputes",
    achievements: ["Property Law Specialist", "Real Estate Expert"],
    languages: ["English", "Hindi", "Marathi", "Kannada"],
    location: "Bangalore",
    education: "LLB, Karnataka State Law University",
    barAssociation: "Karnataka High Court",
    casesWon: 180,
    yearsOfPractice: 18,
    website: "www.kambleassociates.com",
    phone_number: "+91 99887 76655",
  },
  {
    id: 4,
    name: "Pooja Mishra",
    image: poojaMishra,
    specialization: "Family Law",
    experience: "10+ Years",
    rating: 4.9,
    price: 22,
    description: "Compassionate family law expert with mediation skills",
    achievements: ["Family Mediator", "Women's Rights Advocate"],
    languages: ["English", "Hindi", "Bengali"],
    location: "Kolkata",
    education: "LLB, Calcutta University",
    barAssociation: "Calcutta High Court",
    casesWon: 120,
    yearsOfPractice: 10,
    website: "www.mishrafamilylaw.com",
    phone_number: "+91 98765 12345",
  },
  {
    id: 5,
    name: "Rakesh Verma",
    image: rakeshVerma,
    specialization: "Tax Law",
    experience: "14+ Years",
    rating: 4.6,
    price: 30,
    description: "Expert in tax planning and international taxation",
    achievements: ["CA + LLB", "Tax Consultant"],
    languages: ["English", "Hindi", "Punjabi"],
    location: "Chandigarh",
    education: "LLB + CA, Panjab University",
    barAssociation: "Punjab & Haryana High Court",
    casesWon: 160,
    yearsOfPractice: 14,
    website: "www.vermataxlaw.com",
    phone_number: "+91 91234 56789",
  },
  {
    id: 6,
    name: "Sachin Sonawane",
    image: sachinSonawane,
    specialization: "Intellectual Property",
    experience: "8+ Years",
    rating: 4.8,
    price: 28,
    description: "IP law specialist for startups and tech companies",
    achievements: ["IP Attorney", "Startup Legal Advisor"],
    languages: ["English", "Hindi", "Marathi"],
    location: "Pune",
    education: "LLB, Symbiosis Law School",
    barAssociation: "Bombay High Court",
    casesWon: 80,
    yearsOfPractice: 8,
    website: "www.sonawaneip.com",
    phone_number: "+91 95544 33222",
  },
  {
    id: 7,
    name: "Smita Singh",
    image: smitaSingh,
    specialization: "Employment Law",
    experience: "11+ Years",
    rating: 4.7,
    price: 19,
    description: "HR and employment law expert for businesses",
    achievements: ["Employment Law Expert", "HR Legal Advisor"],
    languages: ["English", "Hindi", "Punjabi", "Tamil"],
    location: "Chennai",
    education: "LLB, Madras University",
    barAssociation: "Madras High Court",
    casesWon: 140,
    yearsOfPractice: 11,
    website: "www.singhemploymentlaw.com",
    phone_number: "+91 98877 66554",
  },
];

// Extended database of Indian lawyers for AI model training and future use
export const extendedLawyers: Lawyer[] = [
  // Constitutional Law Specialists
  {
    id: 8,
    name: "Rajesh Kumar",
    specialization: "Constitutional Law",
    experience: "15+ Years",
    rating: 4.9,
    price: 35,
    description: "Constitutional law expert with Supreme Court experience",
    achievements: [
      "Senior Advocate",
      "Constitutional Expert",
      "Supreme Court Bar",
    ],
    languages: ["English", "Hindi", "Sanskrit"],
    location: "New Delhi",
    education: "LLB, Delhi University; LLM, Harvard",
    barAssociation: "Supreme Court of India",
    casesWon: 300,
    yearsOfPractice: 15,
    image: badalSharma, // Placeholder
  },
  {
    id: 9,
    name: "Priya Nair",
    specialization: "Constitutional Law",
    experience: "12+ Years",
    rating: 4.8,
    price: 32,
    description: "Specialist in fundamental rights and constitutional remedies",
    achievements: [
      "Constitutional Rights Expert",
      "Public Interest Litigation",
    ],
    languages: ["English", "Hindi", "Malayalam", "Tamil"],
    location: "Kochi",
    education: "LLB, Kerala University",
    barAssociation: "Kerala High Court",
    casesWon: 180,
    yearsOfPractice: 12,
    image: poojaMishra, // Placeholder
  },

  // Banking & Finance Law
  {
    id: 10,
    name: "Vikram Mehta",
    specialization: "Banking & Finance Law",
    experience: "13+ Years",
    rating: 4.7,
    price: 28,
    description: "Expert in banking regulations and financial compliance",
    achievements: ["Banking Law Specialist", "RBI Compliance Expert"],
    languages: ["English", "Hindi", "Gujarati"],
    location: "Ahmedabad",
    education: "LLB, Gujarat University",
    barAssociation: "Gujarat High Court",
    casesWon: 200,
    yearsOfPractice: 13,
    image: rakeshVerma, // Placeholder
  },
  {
    id: 11,
    name: "Deepika Sharma",
    specialization: "Banking & Finance Law",
    experience: "9+ Years",
    rating: 4.6,
    price: 24,
    description: "Specialist in loan recovery and banking disputes",
    achievements: ["Banking Disputes Expert", "Recovery Specialist"],
    languages: ["English", "Hindi", "Punjabi"],
    location: "Ludhiana",
    education: "LLB, Panjab University",
    barAssociation: "Punjab & Haryana High Court",
    casesWon: 120,
    yearsOfPractice: 9,
    image: smitaSingh, // Placeholder
  },

  // Environmental Law
  {
    id: 12,
    name: "Arjun Patel",
    specialization: "Environmental Law",
    experience: "11+ Years",
    rating: 4.8,
    price: 22,
    description: "Environmental law expert focusing on sustainable development",
    achievements: ["Environmental Activist", "Green Law Expert"],
    languages: ["English", "Hindi", "Gujarati"],
    location: "Vadodara",
    education: "LLB, MS University",
    barAssociation: "Gujarat High Court",
    casesWon: 90,
    yearsOfPractice: 11,
    image: pandurangKamble, // Placeholder
  },
  {
    id: 13,
    name: "Meera Reddy",
    specialization: "Environmental Law",
    experience: "7+ Years",
    rating: 4.5,
    price: 20,
    description: "Climate change law and environmental compliance specialist",
    achievements: ["Climate Law Expert", "Environmental Compliance"],
    languages: ["English", "Hindi", "Telugu"],
    location: "Hyderabad",
    education: "LLB, Osmania University",
    barAssociation: "Telangana High Court",
    casesWon: 60,
    yearsOfPractice: 7,
    image: poojaMishra, // Placeholder
  },

  // Cyber Law & Technology
  {
    id: 14,
    name: "Karan Malhotra",
    specialization: "Cyber Law",
    experience: "8+ Years",
    rating: 4.9,
    price: 32,
    description: "Cyber law expert specializing in data protection and IT Act",
    achievements: ["Cyber Security Expert", "Data Protection Specialist"],
    languages: ["English", "Hindi", "Punjabi"],
    location: "Gurgaon",
    education: "LLB, Delhi University; MS Computer Science",
    barAssociation: "Delhi High Court",
    casesWon: 100,
    yearsOfPractice: 8,
    image: sachinSonawane, // Placeholder
  },
  {
    id: 15,
    name: "Sneha Joshi",
    specialization: "Cyber Law",
    experience: "6+ Years",
    rating: 4.7,
    price: 26,
    description: "Digital rights and online privacy law specialist",
    achievements: ["Digital Rights Expert", "Privacy Law Specialist"],
    languages: ["English", "Hindi", "Marathi"],
    location: "Mumbai",
    education: "LLB, Mumbai University",
    barAssociation: "Bombay High Court",
    casesWon: 70,
    yearsOfPractice: 6,
    image: smitaSingh, // Placeholder
  },

  // Medical Law & Healthcare
  {
    id: 16,
    name: "Sunil Gupta",
    specialization: "Medical Law",
    experience: "14+ Years",
    rating: 4.8,
    price: 30,
    description: "Medical negligence and healthcare law expert",
    achievements: ["Medical Law Expert", "Healthcare Compliance"],
    languages: ["English", "Hindi", "Bengali"],
    location: "Kolkata",
    education: "MBBS + LLB, Calcutta University",
    barAssociation: "Calcutta High Court",
    casesWon: 150,
    yearsOfPractice: 14,
    image: brijeshKulkarni, // Placeholder
  },
  {
    id: 17,
    name: "Priya Agarwal",
    specialization: "Medical Law",
    experience: "10+ Years",
    rating: 4.6,
    price: 25,
    description: "Healthcare regulations and medical ethics specialist",
    achievements: ["Healthcare Law Expert", "Medical Ethics Specialist"],
    languages: ["English", "Hindi", "Bengali"],
    location: "Kolkata",
    education: "MBBS + LLB, AIIMS",
    barAssociation: "Calcutta High Court",
    casesWon: 110,
    yearsOfPractice: 10,
    image: poojaMishra, // Placeholder
  },

  // Labor Law & Industrial Relations
  {
    id: 18,
    name: "Ravi Kumar",
    specialization: "Labor Law",
    experience: "16+ Years",
    rating: 4.7,
    price: 22,
    description: "Industrial disputes and labor rights expert",
    achievements: ["Labor Law Expert", "Industrial Relations Specialist"],
    languages: ["English", "Hindi", "Tamil"],
    location: "Coimbatore",
    education: "LLB, Madras University",
    barAssociation: "Madras High Court",
    casesWon: 250,
    yearsOfPractice: 16,
    image: pandurangKamble, // Placeholder
  },
  {
    id: 19,
    name: "Lakshmi Devi",
    specialization: "Labor Law",
    experience: "12+ Years",
    rating: 4.5,
    price: 20,
    description: "Workers' rights and employment dispute specialist",
    achievements: ["Workers' Rights Expert", "Employment Disputes"],
    languages: ["English", "Hindi", "Tamil", "Telugu"],
    location: "Chennai",
    education: "LLB, Madras University",
    barAssociation: "Madras High Court",
    casesWon: 180,
    yearsOfPractice: 12,
    image: smitaSingh, // Placeholder
  },

  // Real Estate & Construction Law
  {
    id: 20,
    name: "Mohan Das",
    specialization: "Real Estate Law",
    experience: "17+ Years",
    rating: 4.8,
    price: 24,
    description: "Real estate transactions and property development expert",
    achievements: ["Real Estate Expert", "Property Development Specialist"],
    languages: ["English", "Hindi", "Kannada"],
    location: "Bangalore",
    education: "LLB, Karnataka State Law University",
    barAssociation: "Karnataka High Court",
    casesWon: 220,
    yearsOfPractice: 17,
    image: pandurangKamble, // Placeholder
  },
  {
    id: 21,
    name: "Kavitha Reddy",
    specialization: "Construction Law",
    experience: "9+ Years",
    rating: 4.6,
    price: 21,
    description: "Construction contracts and infrastructure law specialist",
    achievements: ["Construction Law Expert", "Infrastructure Specialist"],
    languages: ["English", "Hindi", "Telugu"],
    location: "Hyderabad",
    education: "LLB, Osmania University",
    barAssociation: "Telangana High Court",
    casesWon: 100,
    yearsOfPractice: 9,
    image: poojaMishra, // Placeholder
  },

  // International Law & Trade
  {
    id: 22,
    name: "Rajesh Khanna",
    specialization: "International Law",
    experience: "15+ Years",
    rating: 4.9,
    price: 40,
    description: "International trade law and cross-border disputes expert",
    achievements: ["International Law Expert", "Trade Law Specialist"],
    languages: ["English", "Hindi", "French", "German"],
    location: "New Delhi",
    education: "LLB, Delhi University; LLM, London School of Economics",
    barAssociation: "Supreme Court of India",
    casesWon: 200,
    yearsOfPractice: 15,
    image: badalSharma, // Placeholder
  },
  {
    id: 23,
    name: "Anjali Sinha",
    specialization: "International Law",
    experience: "11+ Years",
    rating: 4.7,
    price: 32,
    description: "WTO law and international commercial arbitration specialist",
    achievements: ["WTO Law Expert", "International Arbitration"],
    languages: ["English", "Hindi", "Bengali", "Spanish"],
    location: "Kolkata",
    education: "LLB, Calcutta University; LLM, Cambridge",
    barAssociation: "Calcutta High Court",
    casesWon: 120,
    yearsOfPractice: 11,
    image: poojaMishra, // Placeholder
  },

  // Consumer Protection Law
  {
    id: 24,
    name: "Vinod Sharma",
    specialization: "Consumer Protection Law",
    experience: "13+ Years",
    rating: 4.6,
    price: 18,
    description: "Consumer rights and product liability expert",
    achievements: ["Consumer Rights Expert", "Product Liability Specialist"],
    languages: ["English", "Hindi", "Punjabi"],
    location: "Chandigarh",
    education: "LLB, Panjab University",
    barAssociation: "Punjab & Haryana High Court",
    casesWon: 160,
    yearsOfPractice: 13,
    image: rakeshVerma, // Placeholder
  },
  {
    id: 25,
    name: "Geeta Nair",
    specialization: "Consumer Protection Law",
    experience: "8+ Years",
    rating: 4.5,
    price: 16,
    description: "Consumer dispute resolution and e-commerce law specialist",
    achievements: ["Consumer Disputes Expert", "E-commerce Law"],
    languages: ["English", "Hindi", "Malayalam"],
    location: "Kochi",
    education: "LLB, Kerala University",
    barAssociation: "Kerala High Court",
    casesWon: 80,
    yearsOfPractice: 8,
    image: smitaSingh, // Placeholder
  },

  // Sports Law
  {
    id: 26,
    name: "Rohit Singh",
    specialization: "Sports Law",
    experience: "7+ Years",
    rating: 4.4,
    price: 22,
    description: "Sports contracts and athlete rights specialist",
    achievements: ["Sports Law Expert", "Athlete Rights Specialist"],
    languages: ["English", "Hindi", "Punjabi"],
    location: "Chandigarh",
    education: "LLB, Panjab University",
    barAssociation: "Punjab & Haryana High Court",
    casesWon: 50,
    yearsOfPractice: 7,
    image: sachinSonawane, // Placeholder
  },

  // Entertainment Law
  {
    id: 27,
    name: "Priyanka Mehta",
    specialization: "Entertainment Law",
    experience: "9+ Years",
    rating: 4.6,
    price: 28,
    description: "Film industry contracts and intellectual property specialist",
    achievements: ["Entertainment Law Expert", "Film Industry Specialist"],
    languages: ["English", "Hindi", "Gujarati"],
    location: "Mumbai",
    education: "LLB, Mumbai University",
    barAssociation: "Bombay High Court",
    casesWon: 90,
    yearsOfPractice: 9,
    image: poojaMishra, // Placeholder
  },

  // Immigration Law
  {
    id: 28,
    name: "Amit Kumar",
    specialization: "Immigration Law",
    experience: "12+ Years",
    rating: 4.7,
    price: 26,
    description: "Visa applications and immigration compliance expert",
    achievements: ["Immigration Expert", "Visa Specialist"],
    languages: ["English", "Hindi", "Punjabi", "French"],
    location: "New Delhi",
    education: "LLB, Delhi University; PhD International Law",
    barAssociation: "Delhi High Court",
    casesWon: 150,
    yearsOfPractice: 12,
    image: brijeshKulkarni, // Placeholder
  },

  // Education Law
  {
    id: 29,
    name: "Sunita Patel",
    specialization: "Education Law",
    experience: "10+ Years",
    rating: 4.5,
    price: 20,
    description: "Educational institutions and student rights specialist",
    achievements: ["Education Law Expert", "Student Rights Specialist"],
    languages: ["English", "Hindi", "Gujarati"],
    location: "Ahmedabad",
    education: "LLB, Gujarat University; PhD Education Law",
    barAssociation: "Gujarat High Court",
    casesWon: 100,
    yearsOfPractice: 10,
    image: smitaSingh, // Placeholder
  },

  // Insurance Law
  {
    id: 30,
    name: "Rajesh Agarwal",
    specialization: "Insurance Law",
    experience: "14+ Years",
    rating: 4.6,
    price: 23,
    description: "Insurance claims and risk management expert",
    achievements: ["Insurance Law Expert", "Risk Management Specialist"],
    languages: ["English", "Hindi", "Bengali"],
    location: "Kolkata",
    education: "LLB, Calcutta University",
    barAssociation: "Calcutta High Court",
    casesWon: 180,
    yearsOfPractice: 14,
    image: rakeshVerma, // Placeholder
  },

  // Maritime Law
  {
    id: 31,
    name: "Ravi Menon",
    specialization: "Maritime Law",
    experience: "16+ Years",
    rating: 4.8,
    price: 30,
    description: "Shipping law and maritime disputes expert",
    achievements: ["Maritime Law Expert", "Shipping Specialist"],
    languages: ["English", "Hindi", "Malayalam"],
    location: "Kochi",
    education: "LLB, Kerala University; Maritime Law Certificate",
    barAssociation: "Kerala High Court",
    casesWon: 120,
    yearsOfPractice: 16,
    image: pandurangKamble, // Placeholder
  },

  // Aviation Law
  {
    id: 32,
    name: "Neha Sharma",
    specialization: "Aviation Law",
    experience: "8+ Years",
    rating: 4.5,
    price: 25,
    description: "Aviation regulations and air travel law specialist",
    achievements: ["Aviation Law Expert", "Air Travel Specialist"],
    languages: ["English", "Hindi", "Punjabi"],
    location: "New Delhi",
    education: "LLB, Delhi University; Aviation Law Certificate",
    barAssociation: "Delhi High Court",
    casesWon: 60,
    yearsOfPractice: 8,
    image: poojaMishra, // Placeholder
  },
];

// Combined database for AI model training
export const allLawyers: Lawyer[] = [...coreLawyers, ...extendedLawyers];

// Specialization categories for filtering
export const specializations = [
  "Corporate Law",
  "Criminal Law",
  "Property Law",
  "Family Law",
  "Tax Law",
  "Intellectual Property",
  "Employment Law",
  "Constitutional Law",
  "Banking & Finance Law",
  "Environmental Law",
  "Cyber Law",
  "Medical Law",
  "Labor Law",
  "Real Estate Law",
  "Construction Law",
  "International Law",
  "Consumer Protection Law",
  "Sports Law",
  "Entertainment Law",
  "Immigration Law",
  "Education Law",
  "Insurance Law",
  "Maritime Law",
  "Aviation Law",
];

// Experience ranges
export const experienceRanges = [
  "5-7 Years",
  "8-10 Years",
  "11-13 Years",
  "14-16 Years",
  "17+ Years",
];

// Price ranges for consultations
export const priceRanges = [
  "$15-20",
  "$20-25",
  "$25-30",
  "$30-35",
  "$35+",
];
