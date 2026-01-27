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
dotenv.config();

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize MeTTa service
const mettaService = new LegalMettaService();

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

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
