require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { CloudClient } = require("chromadb");
const knowledgeRouter = require("./routes/knowledge");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/knowledge", knowledgeRouter);

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

// Set up Chroma client connection helper for query
function getChromaClient() {
  return new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
  });
}

// Chat endpoint with RAG (Retrieval-Augmented Generation)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // 1. Embed the user's query
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResult = await embedModel.embedContent(message);
    const queryEmbedding = embedResult.embedding?.values;

    let contextStr = "";
    
    if (queryEmbedding) {
      // 2. Search the ChromaDB knowledge base
      const client = getChromaClient();
      const collection = await client.getOrCreateCollection({
        name: "lakbay_lanao_knowledge",
        embeddingFunction: null,
        metadata: { "hnsw:space": "cosine" },
      });

      // Note: Because we used HNSW in upload, we search to get the closest neighbors
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding], // Must be array of arrays
        nResults: 5, // Retrieve top 5 most relevant chunks
      });

      // 3. Compile the returned text chunks
      if (results.documents && results.documents.length > 0 && results.documents[0].length > 0) {
        contextStr = results.documents[0]
          .map((chunk, i) => `[Source ${i + 1}]:\n${chunk}`)
          .join("\n\n");
      }
    }

    // 4. Augment the user's prompt with retrieved knowledge
    const augmentedPrompt = contextStr
      ? `Answer the user's question based primarily on the following local knowledge base context. If the context does not contain relevant info, use your general knowledge, but prioritize the provided context.\n\n### KNOWLEDGE BASE CONTEXT ###\n${contextStr}\n\n### USER QUESTION ###\n${message}`
      : message;

    // 5. Send to Gemini
    const chat = model.startChat();
    const result = await chat.sendMessage(augmentedPrompt);
    const text = result.response.text();
    
    res.json({ reply: text });
  } catch (err) {
    console.error("Gemini/RAG error:", err);
    res.status(500).json({ error: "Failed to get a response from AI." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
