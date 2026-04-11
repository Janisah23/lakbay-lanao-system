require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the Lakbay Lanao Assistant — a friendly, knowledgeable, and enthusiastic Smart Tourism Guide for Lanao del Sur, Philippines.

Your role is to help users explore and discover everything Lanao del Sur has to offer, including:
- Tourist destinations (landmarks, natural attractions, heritage sites)
- Upcoming or notable local events and festivals (e.g., Sagayan Festival, Kanduli)
- Hotels, inns, and accommodations in Marawi City and surrounding areas
- Local cuisine, culture, and traditions of the Maranao people
- Travel tips, safety reminders, and practical advice for visiting the region

Guidelines:
- Always be warm, welcoming, and culturally respectful, especially regarding Islamic traditions and Maranao heritage.
- Keep answers concise but informative. Use bullet points or numbered lists when listing multiple items.
- If a question is outside your tourism scope (e.g., unrelated general knowledge), politely redirect the user back to tourism topics in Lanao del Sur.
- Never make up specific facts you are unsure about — say so honestly and encourage the user to verify with local tourism offices.
- Greet first-time questions warmly and encourage exploration.`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

app.get("/", (req, res) => {
  res.send("Node.js backend is running");
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const text = result.response.text();
    res.json({ reply: text });
  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(500).json({ error: "Failed to get a response from AI." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
