const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyA2FooGn2pV7oH-YmwdzvjPV4wLzhBvtNg";

async function listModels() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  try {
    // There isn't a direct listModels method on the client instance in some versions,
    // but usually it's implied or we can try a simple generation to test connectivity.
    // Actually, for listModels, we might need to use the REST API manually if SDK doesn't expose it easily in this version.
    // Let's try to just hit the API with a known model to see if it works.
    
    console.log("Testing gemini-pro...");
    const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
    try {
        const result = await modelPro.generateContent("Test");
        console.log("✅ gemini-pro is AVAILABLE");
    } catch (e) {
        console.log("❌ gemini-pro failed:", e.message);
    }

    console.log("Testing gemini-1.5-flash...");
    const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        const result = await modelFlash.generateContent("Test");
        console.log("✅ gemini-1.5-flash is AVAILABLE");
    } catch (e) {
        console.log("❌ gemini-1.5-flash failed:", e.message);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
