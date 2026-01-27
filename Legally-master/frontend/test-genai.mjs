const API_KEY = "AIzaSyA2FooGn2pV7oH-YmwdzvjPV4wLzhBvtNg";
const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function test() {
  console.log("Testing Gemini 1.5 Flash Endpoint...");
  try {
    const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello from test script" }] }] })
    });
    
    const data = await response.json();
    console.log("✅ Response Status:", response.status);
    if (response.ok) {
        console.log("✅ Success! API Key is working.");
        console.log("Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
        console.log("❌ Failed! API Key or Model is invalid.");
        console.log("Error Details:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
      console.error("Network Error:", err);
  }
}

test();
