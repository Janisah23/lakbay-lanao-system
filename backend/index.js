require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { CloudClient } = require("chromadb");
const knowledgeRouter = require("./routes/knowledge");
const admin = require("firebase-admin");

// OPTIONAL: uncomment if Node < 18
// const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/knowledge", knowledgeRouter);

/* =========================
   FIREBASE ADMIN INIT
========================= */
const serviceAccount = require("./config/firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/* =========================
   GEMINI SETUP
========================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are the Lakbay Lanao Assistant — a friendly, knowledgeable, and enthusiastic Smart Tourism Guide for Lanao del Sur, Philippines.

Your role is to help users explore and discover everything Lanao del Sur has to offer, including:
- Tourist destinations (landmarks, natural attractions, heritage sites)
- Upcoming or notable local events and festivals
- Hotels, inns, and accommodations
- Local cuisine, culture, and traditions of the Maranao people
- Travel tips and safety reminders

Guidelines:
- Be warm, respectful, and culturally sensitive.
- Use bullet points when needed.
- If unsure, admit it honestly.
- Keep answers tourism-focused.
`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.send("Node.js backend is running");
});

/* =========================
   CHROMA DB CLIENT
========================= */
function getChromaClient() {
  return new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
  });
}

/* =========================
   GEOCODE API
========================= */
app.get("/api/geocode", async (req, res) => {
  const { place, province } = req.query;

  if (!place || !province) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const fullAddress = `${place}, ${province}, Philippines`;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(400).json({ error: data.status });
    }

    const location = data.results[0].geometry.location;

    res.json({
      lat: location.lat,
      lng: location.lng,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

/* =========================
   CHAT (RAG + GEMINI)
========================= */
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const embedModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    const embedResult = await embedModel.embedContent(message);
    const queryEmbedding = embedResult.embedding?.values;

    let contextStr = "";

    if (queryEmbedding) {
      const client = getChromaClient();

      const collection = await client.getOrCreateCollection({
        name: "lakbay_lanao_knowledge",
        embeddingFunction: null,
        metadata: { "hnsw:space": "cosine" },
      });

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 5,
      });

      if (
        results.documents &&
        results.documents[0] &&
        results.documents[0].length > 0
      ) {
        contextStr = results.documents[0]
          .map((chunk, i) => `--- CHUNK ${i + 1} ---\n${chunk}`)
          .join("\n\n");
      }
    }

    const augmentedPrompt = contextStr
      ? `
Use the following knowledge base context:

${contextStr}

User question:
${message}
`
      : message;

    const chat = model.startChat();
    const result = await chat.sendMessage(augmentedPrompt);
    const text = result.response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error("Gemini/RAG error:", err);
    res.status(500).json({ error: "Failed to get a response from AI." });
  }
});

/* =========================
   CREATE STAFF (FIREBASE AUTH)
========================= */
app.post("/create-staff", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email, and password are required",
    });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      name,
      email,
      role: "staff",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      message: "Staff account created successfully",
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});