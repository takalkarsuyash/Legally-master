import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import lighthouse from "@lighthouse-web3/sdk";
import dotenv from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import LegalMettaService from "./legalMettaService.js";
import { searchLawyers, getLawyerDetails } from "./services/googlePlaces.js";
import scoreLawyers from "./utils/lawyerScorer.js";
import nodemailer from "nodemailer";
dotenv.config();

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize MeTTa service
const mettaService = new LegalMettaService();

// In-memory OTP store for email verification
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

// Configure nodemailer transporter
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpSecure = process.env.SMTP_SECURE === 'true';

let transporter: nodemailer.Transporter;

if (smtpHost) {
  console.log(`[SMTP] Using custom SMTP server: ${smtpHost}:${smtpPort}`);
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  });
} else {
  console.log(`[SMTP] Using Gmail service fallback`);
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  });
}

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

console.log(
  "API Key loaded? ",
  process.env.LIGHTHOUSE_API?.slice(0, 6) + "..."
);

// MeTTa query endpoint
app.post("/api/metta-query", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Received MeTTa query:", query);

    const result = await mettaService.query(query);

    console.log("MeTTa response:", result);
    res.json(result);

  } catch (error) {
    console.error("MeTTa query error:", error);
    res.status(500).json({
      error: "Failed to process MeTTa query",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Lawyer Search Endpoint
app.get("/api/lawyers", async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    if (!city || typeof city !== "string") {
      res.status(400).json({ error: "City is required" });
      return;
    }

    console.log(`Searching for property lawyers in ${city}...`);

    const PROPERTY_QUERIES = [
      "property lawyer in",
      "real estate lawyer in",
      "land dispute lawyer in",
      "property law firm in",
    ];

    let allResults: any[] = [];

    // Parallel execution for faster response
    const searchPromises = PROPERTY_QUERIES.map(q => searchLawyers(`${q} ${city}`));
    const resultsArrays = await Promise.all(searchPromises);

    resultsArrays.forEach(results => {
      allResults.push(...results);
    });

    // Remove duplicates by place_id
    let lawyers = Array.from(
      new Map(allResults.map((l) => [l.place_id, l])).values()
    );

    // Filter low quality
    lawyers = lawyers.filter(
      (l) => (l.rating || 0) >= 3.5 && l.business_status === "OPERATIONAL"
    );

    // Property relevance filter
    lawyers = lawyers.filter((l) => {
      const name = (l.name || "").toLowerCase();
      const address = (l.formatted_address || "").toLowerCase();

      return (
        name.includes("property") ||
        name.includes("real estate") ||
        address.includes("property") ||
        address.includes("real estate") ||
        address.includes("land")
      );
    });

    // Score & sort
    const ranked = scoreLawyers(lawyers).slice(0, 10); // Return top 10

    // Fetch contact details (only top 10 to save API quota/time)
    const finalResults = await Promise.all(
      ranked.map(async (l) => {
        const details = await getLawyerDetails(l.place_id);
        return {
          id: l.place_id,
          name: l.name,
          rating: l.rating,
          address: l.formatted_address,
          phone: details.phone,
          website: details.website,
          location: l.formatted_address,
          specialization: "Property & Real Estate", // Inferred
          experience: "Verified Expert",
          image: l.icon || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          availability: "Contact for availability"
        };
      })
    );

    res.json(finalResults);
  } catch (err) {
    console.error("Error in /api/lawyers:", err);
    res.status(500).json({ error: "Failed to fetch lawyers" });
  }
});

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      console.log("Received file:", req.file);

      const filePath = path.join(__dirname, "uploads", req.file.filename);
      console.log("File exists? ", fs.existsSync(filePath));
      console.log("File path: ", filePath);

      const apiKey = process.env.LIGHTHOUSE_API || "";

      const uploadResponse = await lighthouse.upload(filePath, apiKey);
      console.log("Lighthouse upload response:", uploadResponse);

      // Clean up the temporary file
      fs.unlinkSync(filePath);

      res.json({
        message: "File uploaded successfully",
        cid: uploadResponse.data.Hash,
        lighthouseResponse: uploadResponse,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// Original retrieve endpoint (for backward compatibility)
app.get("/retrieve", async (req, res) => {
  const response = await lighthouse.getUploads(
    process.env.LIGHTHOUSE_API!,
    null
  );
  console.log("Response: ", response);
  res.json({ message: "Retrieve endpoint", data: response });
});

// OTP Endpoints
app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    console.log(`[OTP] Generated OTP for ${email}: ${otp}`);

    // Attempt to send email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"LegalEase Accounts" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your LegalEase Account Verification Code",
          text: `Your OTP for account registration is: ${otp}. This code expires in 10 minutes.`,
          html: `<h2>LegalEase Registration</h2><p>Your OTP for account registration is: <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`
        });
        console.log(`[OTP] Sent email directly to ${email}`);
      } catch (emailError: any) {
        console.error(`[OTP] Failed to send email to ${email}:`, emailError);
        res.status(500).json({ error: `Failed to send verification email: ${emailError.message || emailError}`, success: false });
        return;
      }
    } else {
      console.log(`[OTP] Email credentials not found in .env. Skipping actual email dispatch.`);
    }

    res.json({ message: "OTP sent successfully", success: true });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP", success: false });
  }
});

app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required" });
    return;
  }

  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) {
    res.status(400).json({ error: "No OTP found for this email. Please request a new one.", success: false });
    return;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    res.status(400).json({ error: "OTP has expired. Please request a new one.", success: false });
    return;
  }

  if (stored.otp !== otp) {
    res.status(400).json({ error: "Invalid OTP. Please try again.", success: false });
    return;
  }

  // OTP is valid
  otpStore.delete(email.toLowerCase());
  res.json({ message: "OTP verified successfully", success: true });
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
