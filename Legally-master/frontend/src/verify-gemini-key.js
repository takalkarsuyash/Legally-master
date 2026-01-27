const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Hardcoded check of the key we saw in .env
const KEY_TO_TEST = process.env.VITE_API_KEY || "AIzaSyCWbu9jPfTRFcmO6NlnhhIHtFzNNiQBRd8";

console.log(`Testing Gemini API Key: ${KEY_TO_TEST.substring(0, 5)}...${KEY_TO_TEST.substring(KEY_TO_TEST.length - 4)}`);

async function testKey() {
  try {
    const genAI = new GoogleGenerativeAI(KEY_TO_TEST);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Sending test request to Gemini...");
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log("Success! Response:", response.text());
  } catch (error) {
    console.error("\n❌ API Key Verification Failed!");
    console.error("Error Message:", error.message);
    console.error("\nThis confirms the API key itself is invalid or has expired.");
  }
}

testKey();
