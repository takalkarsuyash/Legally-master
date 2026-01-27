const express = require("express");
const router = express.Router();
const { searchLawyers, getLawyerDetails } = require("../services/googlePlaces");
const scoreLawyers = require("../utils/scorer");

router.get("/lawyers", async (req, res) => {
  try {
    const { city, type } = req.query;

    if (!city) {
      return res.status(400).json({ error: "City is required" });
    }

    const PROPERTY_QUERIES = [
      "property lawyer in",
      "real estate lawyer in",
      "land dispute lawyer in",
      "property law firm in",
    ];

    let allResults = [];

    for (const q of PROPERTY_QUERIES) {
      const results = await searchLawyers(`${q} ${city}`);
      allResults.push(...results);
    }

    // Remove duplicates by place_id
    let lawyers = Array.from(
      new Map(allResults.map((l) => [l.place_id, l])).values()
    );

    // 2️⃣ Filter low quality
    lawyers = lawyers.filter(
      (l) => l.rating && l.rating >= 3.5 && l.business_status === "OPERATIONAL"
    );

    // Property relevance filter (safe checks included)
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

    // 3️⃣ Score & sort
    const ranked = scoreLawyers(lawyers).slice(0, 5);

    // 4️⃣ Fetch contact details (only top 5)
    const finalResults = await Promise.all(
      ranked.map(async (l) => {
        const details = await getLawyerDetails(l.place_id);
        return {
          name: l.name,
          rating: l.rating,
          address: l.formatted_address,
          phone: details.phone,
          website: details.website,
        };
      })
    );

    res.json(finalResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
