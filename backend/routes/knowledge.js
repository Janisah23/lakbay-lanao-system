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

/**
 * Split text into overlapping chunks.
 * Larger chunk size (1200) means fewer API calls for big docs.
 */
function chunkText(text, chunkSize = 1200, overlap = 150) {
  // Normalise excessive whitespace produced by table extraction
  const cleaned = text.replace(/[ \t]{3,}/g, "  ").replace(/\n{4,}/g, "\n\n").trim();
  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 40) chunks.push(chunk); // skip tiny artefacts
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
        console.log(`[Attempt ${attempt + 1}/${retries}] Network/Rate issue. Retrying in ${wait / 1000}s…`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Embed all chunks in batches with a small inter-request delay to stay
 * within Gemini's free-tier rate limit (~1500 RPM = 25 RPS).
 * We use 50ms delay → max 20 RPS (well within limits).
 */
async function embedAllChunks(chunks) {
  const DELAY_MS = 60;   // ms between individual requests
  const BATCH_LOG = 50;  // log progress every N chunks

  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    embeddings.push(await embedChunk(chunks[i]));
    if ((i + 1) % BATCH_LOG === 0) {
      console.log(`  Embedded ${i + 1}/${chunks.length} chunks…`);
    }
    if (i < chunks.length - 1) await sleep(DELAY_MS);
  }
  return embeddings;
}

// ── Upsert to ChromaDB in batches (avoid payload-size limits) ────────────────
async function batchUpsert(collection, ids, embeddings, documents, metadatas, batchSize = 100) {
  for (let i = 0; i < ids.length; i += batchSize) {
    await collection.upsert({
      ids: ids.slice(i, i + batchSize),
      embeddings: embeddings.slice(i, i + batchSize),
      documents: documents.slice(i, i + batchSize),
      metadatas: metadatas.slice(i, i + batchSize),
    });
    console.log(`  Upserted ${Math.min(i + batchSize, ids.length)}/${ids.length} chunks to ChromaDB`);
  }
}

// ── POST /api/knowledge/upload ────────────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    console.log(`\n[Knowledge] Processing: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)} MB)`);

    const rawText = await extractText(req.file);
    if (!rawText.trim())
      return res.status(400).json({ error: "Could not extract text from file." });

    const chunks = chunkText(rawText);
    const docName = req.file.originalname;
    const now = new Date().toISOString();

    console.log(`[Knowledge] Chunked into ${chunks.length} pieces. Starting embedding…`);

    const embeddings = await embedAllChunks(chunks);

    console.log(`[Knowledge] All embeddings done. Upserting to ChromaDB…`);

    const client = getChromaClient();
    const collection = await getCollection(client);

    const ids = chunks.map((_, i) => `${docName}__chunk_${i}`);
    const metadatas = chunks.map(() => ({ source: docName, uploadedAt: now }));

    await batchUpsert(collection, ids, embeddings, chunks, metadatas);

    console.log(`[Knowledge] Done — ${chunks.length} chunks stored for "${docName}"`);

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

// ── GET /api/knowledge/documents ─────────────────────────────────────────────
router.get("/documents", async (req, res) => {
  try {
    const client = getChromaClient();
    const collection = await getCollection(client);
    const result = await collection.get({ include: ["metadatas"] });

    const docs = {};
    (result.metadatas || []).forEach((meta) => {
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

// ── DELETE /api/knowledge/documents/:name ────────────────────────────────────
router.delete("/documents/:name", async (req, res) => {
  try {
    const docName = decodeURIComponent(req.params.name);
    const client = getChromaClient();
    const collection = await getCollection(client);

    const result = await collection.get({ where: { source: docName } });
    if (!result.ids || result.ids.length === 0) {
      return res.status(404).json({ error: "Document not found in knowledge base." });
    }

    await collection.delete({ ids: result.ids });

    res.json({ message: `Deleted "${docName}" (${result.ids.length} chunks removed).` });
  } catch (err) {
    console.error("[Knowledge] Delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
