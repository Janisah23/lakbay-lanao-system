const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { CloudClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// ── Multer (memory storage) ───────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB — handles large PDFs
  fileFilter: (_, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, TXT, and DOCX files are supported."));
  },
});

// ── ChromaDB Cloud client ─────────────────────────────────────────────────────
function getChromaClient() {
  return new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
  });
}

const COLLECTION_NAME = "lakbay_lanao_knowledge";

async function getCollection(client) {
  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: null,
    metadata: { "hnsw:space": "cosine" },
  });
}

// ── Text helpers ──────────────────────────────────────────────────────────────
function chunkText(text, chunkSize = 1200, overlap = 150) {
  const cleaned = text.replace(/[ \t]{3,}/g, "  ").replace(/\n{4,}/g, "\n\n").trim();
  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 40) chunks.push(chunk); 
    start += chunkSize - overlap;
  }
  return chunks;
}

async function extractText(file) {
  if (file.mimetype === "application/pdf") {
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8");
  }
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return result.value;
}

// ── Embedding with rate-limit retry ──────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedChunk(text, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await embedModel.embedContent(text);
      if (result.embedding?.values) return result.embedding.values;
      throw new Error(`Invalid embedding response: ${JSON.stringify(result)}`);
    } catch (err) {
      const isRateLimit = err.status === 429;
      const isServerError = err.status >= 500 && err.status < 600;
      const isNetworkError = err.message?.includes('fetch failed') || err.name === 'TypeError' || err.code === 'ECONNRESET';
      
      if ((isRateLimit || isServerError || isNetworkError) && attempt < retries) {
        const wait = Math.pow(2, attempt + 1) * 1000;
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

async function embedAllChunks(chunks) {
  const DELAY_MS = 60;   
  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    embeddings.push(await embedChunk(chunks[i]));
    if (i < chunks.length - 1) await sleep(DELAY_MS);
  }
  return embeddings;
}

async function batchUpsert(collection, ids, embeddings, documents, metadatas, batchSize = 100) {
  for (let i = 0; i < ids.length; i += batchSize) {
    await collection.upsert({
      ids: ids.slice(i, i + batchSize),
      embeddings: embeddings.slice(i, i + batchSize),
      documents: documents.slice(i, i + batchSize),
      metadatas: metadatas.slice(i, i + batchSize),
    });
  }
}

// ── POST /api/knowledge/upload ────────────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const rawText = await extractText(req.file);
    if (!rawText.trim())
      return res.status(400).json({ error: "Could not extract text from file." });

    const chunks = chunkText(rawText);
    const docName = req.file.originalname;
    const now = new Date().toISOString();

    const embeddings = await embedAllChunks(chunks);

    const client = getChromaClient();
    const collection = await getCollection(client);

    const ids = chunks.map((_, i) => `${docName}__chunk_${i}`);
    const metadatas = chunks.map(() => ({ source: docName, uploadedAt: now }));

    await batchUpsert(collection, ids, embeddings, chunks, metadatas);

    res.json({
      message: `Uploaded "${docName}" — ${chunks.length} chunk(s) stored.`,
      chunkCount: chunks.length,
      docName,
    });
  } catch (err) {
    console.error("[Knowledge] Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/knowledge/documents (FIXED: SAFELY LOOPS 300 AT A TIME) ─────────
router.get("/documents", async (req, res) => {
  try {
    const client = getChromaClient();
    const collection = await getCollection(client);
    
    let allMetadatas = [];
    let offset = 0;
    const limit = 300; // Safe limit for Chroma Cloud

    while (true) {
      const result = await collection.get({ 
        limit: limit, 
        offset: offset,
        include: ["metadatas"] 
      });

      if (!result.metadatas || result.metadatas.length === 0) break;
      
      allMetadatas.push(...result.metadatas);

      if (result.metadatas.length < limit) break; // Reached the end
      
      offset += limit;
    }

    const docs = {};
    allMetadatas.forEach((meta) => {
      if (!meta) return;
      const src = meta.source || "Unknown";
      if (!docs[src]) {
        docs[src] = { name: src, chunkCount: 0, uploadedAt: meta.uploadedAt || null };
      }
      docs[src].chunkCount++;
    });

    res.json({ documents: Object.values(docs) });
  } catch (err) {
    console.error("[Knowledge] List error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/knowledge/documents/:name (FIXED: SAFELY LOOPS 300 AT A TIME) ─
router.delete("/documents/:name", async (req, res) => {
  try {
    const docName = decodeURIComponent(req.params.name);
    const client = getChromaClient();
    const collection = await getCollection(client);

    let allIds = [];
    let offset = 0;
    const limit = 300;

    // Fetch IDs in batches
    while (true) {
      const result = await collection.get({ 
        where: { source: docName },
        limit: limit,
        offset: offset
      });
      
      if (!result.ids || result.ids.length === 0) break;
      
      allIds.push(...result.ids);

      if (result.ids.length < limit) break; // Reached the end
      
      offset += limit;
    }

    if (allIds.length === 0) {
      return res.status(404).json({ error: "Document not found in knowledge base." });
    }

    // Delete in safe batches
    for (let i = 0; i < allIds.length; i += 300) {
      await collection.delete({ ids: allIds.slice(i, i + 300) });
    }

    res.json({ message: `Deleted "${docName}" (${allIds.length} chunks removed).` });
  } catch (err) {
    console.error("[Knowledge] Delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;