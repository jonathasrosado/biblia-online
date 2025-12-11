import 'dotenv/config'; // Load env vars
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from "module";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { aiManager } from './services/aiManager.js';
import connectDB from './config/db.js'; // Import MongoDB config
import os from 'os'; // Required for tmpdir

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// --- POLYFILL CRYPTO (Required for some libs on Railway/older Node) ---
import crypto from 'crypto';
if (!global.crypto) {
    global.crypto = crypto;
}

// --- LOAD KEYS FROM AI-CONFIG (Fix for missing local .env) ---
// This ensures process.env is populated even if .env is empty, satisfying libraries that verify keys.
try {
    const aiConfig = aiManager.getConfig();
    if (aiConfig.apiKeys) {
        if (aiConfig.apiKeys.gemini && !process.env.GEMINI_API_KEY) {
            process.env.GEMINI_API_KEY = aiConfig.apiKeys.gemini;
            console.log("[API] Loaded GEMINI_API_KEY from ai-config.json");
        }
        if (aiConfig.apiKeys.openrouter && !process.env.OPENROUTER_API_KEY) {
            process.env.OPENROUTER_API_KEY = aiConfig.apiKeys.openrouter;
            console.log("[API] Loaded OPENROUTER_API_KEY from ai-config.json");
        }
        if (aiConfig.apiKeys.freepik && !process.env.FREEPIK_API_KEY) {
            process.env.FREEPIK_API_KEY = aiConfig.apiKeys.freepik;
            console.log("[API] Loaded FREEPIK_API_KEY from ai-config.json");
        }
    }
} catch (e) {
    console.warn("[API] Failed to auto-load keys from aiManager:", e);
}

// --- CRASH HANDLERS (MUST BE FIRST) ---
process.on('uncaughtException', (error) => {
    console.error('FATAL: Uncaught Exception:', error);
    // Do not exit immediately to allow logs to flush
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// MongoDB will be connected before server starts (see bottom of file)

const app = express();
const PORT = process.env.PORT || 3002;
console.log("----------------------------------------");
console.log("SERVER VERSION: 1.1.0 - WITH MONGODB");
console.log(`Starting in directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);
console.log("----------------------------------------");

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Custom request logging for debugging
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
});

// --- ROUTES ---


// SECURITY: Allow data: blobs for audio (iOS fix)
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; connect-src 'self' https:;");
    next();
});

let FORCED_KEY = "";
try {
    // Now require is defined!
    const forced = require('./force_key.js');
    if (forced && forced.GEMINI_KEY) {
        FORCED_KEY = forced.GEMINI_KEY;
        console.log("⚠️ EMERGENCY: Loaded Hardcoded API Key.");
    }
} catch (e) {
    // Ignore error if file missing
}

// Configure Multer for uploads
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Sanitize filename
        const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({ storage: storage });

// Serve uploads statically (API route)
app.use('/api/uploads', express.static(UPLOADS_DIR));
// Fallback: Serve uploads at root /uploads for legacy/frontend compatibility
app.use('/uploads', express.static(UPLOADS_DIR));

// --- MEDIA API ---

// List files
app.get('/api/media', (req, res) => {
    try {
        const files = fs.readdirSync(UPLOADS_DIR);
        const fileInfos = files.map(file => {
            const stats = fs.statSync(path.join(UPLOADS_DIR, file));
            return {
                name: file,
                url: `/api/uploads/${file}`,
                size: stats.size,
                date: stats.mtime
            };
        });
        // Sort by date desc
        fileInfos.sort((a, b) => b.date - a.date);
        res.json(fileInfos);
    } catch (e) {
        res.status(500).json({ error: 'Failed to list media' });
    }
});

// Upload file (Multer)
app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({
        name: req.file.filename,
        url: `/api/uploads/${req.file.filename}`
    });
});

// Upload from URL
app.post('/api/media/upload-url', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Try to guess extension from content-type or url
        const contentType = response.headers.get('content-type');
        let ext = 'png';
        if (contentType) {
            const match = contentType.match(/image\/(.*)/);
            if (match) ext = match[1];
        } else {
            const urlExt = path.extname(url).split('?')[0].substring(1);
            if (urlExt) ext = urlExt;
        }

        const filename = `${Date.now()}-imported.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filePath, buffer);

        res.json({
            name: filename,
            url: `/api/uploads/${filename}`
        });
    } catch (error) {
        console.error("Upload from URL failed:", error);
        res.status(500).json({ error: 'Failed to upload from URL' });
    }
});

// Delete file
app.delete('/api/media/:filename', (req, res) => {
    // Decode filename to ensure we handle spaces/special chars correctly
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, filename);

    console.log(`[API] Deleting file: ${filename} at ${filePath}`);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[API] Deleted successfully: ${filename}`);
            res.json({ success: true });
        } else {
            console.warn(`[API] File not found: ${filename}`);
            // We treat "file not found" as success or 404? 
            // If the goal is "ensure it's gone", success is fine, but usually 404.
            // Let's return success to keeping UI in sync (it's gone).
            res.json({ success: true, message: 'File already gone' });
        }
    } catch (e) {
        console.error(`[API] Delete failed for ${filename}:`, e);
        res.status(500).json({ error: `Failed to delete file: ${e.message}` });
    }
});

// Helper to load env vars manually (since we don't have dotenv)
const loadEnv = () => {
    const envFiles = ['.env.local', '.env'];
    envFiles.forEach(file => {
        const filePath = path.resolve(__dirname, '../', file);
        if (fs.existsSync(filePath)) {
            console.log(`Loading env from ${file}`);
            const content = fs.readFileSync(filePath, 'utf-8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            });
        }
    });
};
loadEnv();



// --- AI CONFIG ENDPOINTS ---
console.log('Registering AI Config Endpoints...'); // DEBUG LOG

app.get('/api/ai/config', (req, res) => {
    console.log('GET /api/ai/config called'); // DEBUG LOG
    try {
        const config = aiManager.getConfig();
        console.log('Config fetched:', config); // DEBUG LOG
        res.json(config);
    } catch (error) {
        console.error('Error in GET /api/ai/config:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ai/config', (req, res) => {
    try {
        aiManager.saveConfig(req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

app.get('/api/ai/models', async (req, res) => {
    try {
        const models = await aiManager.getAvailableModels();
        res.json(models);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Validate Gemini API Key
app.post('/api/ai/validate-key', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) {
        return res.json({ valid: false, error: 'API key is required' });
    }

    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        // Make a minimal test request
        await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: 'test',
            config: { maxOutputTokens: 5 }
        });

        res.json({ valid: true });
    } catch (error) {
        console.error('API Key validation failed:', error.message);
        res.json({ valid: false, error: error.message || 'Invalid API key' });
    }
});

// --- PROMPTS CONFIG ENDPOINTS ---
const PROMPTS_CONFIG_PATH = path.join(__dirname, 'prompts-config.json');

app.get('/api/prompts/config', (req, res) => {
    try {
        if (fs.existsSync(PROMPTS_CONFIG_PATH)) {
            const prompts = JSON.parse(fs.readFileSync(PROMPTS_CONFIG_PATH, 'utf-8'));
            res.json(prompts);
        } else {
            res.status(404).json({ error: 'Prompts config not found' });
        }
    } catch (error) {
        console.error('Error loading prompts:', error);
        res.status(500).json({ error: 'Failed to load prompts' });
    }
});

app.post('/api/prompts/config', (req, res) => {
    try {
        const newPrompts = req.body;
        fs.writeFileSync(PROMPTS_CONFIG_PATH, JSON.stringify(newPrompts, null, 2), 'utf-8');
        res.json({ success: true, message: 'Prompts saved successfully' });
    } catch (error) {
        console.error('Error saving prompts:', error);
        res.status(500).json({ error: 'Failed to save prompts' });
    }
});

// --- AI GENERATION ENDPOINT ---
app.post('/api/ai/blog-title', async (req, res) => {
    try {
        const { keyword, language } = req.body;

        const systemInstruction = `
            Generate 5 catchy, SEO-friendly titles for a blog post about the given keyword.
            Language: ${language || 'pt'}.
            Return ONLY a JSON array of objects. Each object must have:
            - "title": The main blog post title.
            - "seoTitle": A version optimized for search engines (max 60 chars).
            - "metaDescription": A compelling description (max 160 chars).
            
            Example:
            [
                { "title": "...", "seoTitle": "...", "metaDescription": "..." }
            ]
        `;

        const response = await aiManager.generateContent('blog_title', keyword, systemInstruction, 'json_object');

        let json = JSON.parse(response);
        // Handle case where AI returns { titles: [...] } instead of [...]
        if (!Array.isArray(json) && json.titles) {
            json = json.titles;
        } else if (Array.isArray(json)) {
            // AI returned a raw array, which is what we want in 'json' variable
        }

        // Always return an object with 'titles' property as expected by frontend
        res.json({ titles: json });

    } catch (error) {
        console.error("AI Title Error:", error);
    }
});

// --- BOOK SUMMARY ENDPOINT ---
app.get('/api/books/:book/summary', async (req, res) => {
    try {
        const { book } = req.params;
        const { lang, force } = req.query; // 'pt', 'en', etc.
        const summary = await aiManager.generateBookSummary(book, lang || 'pt', force === 'true');
        res.json(summary);
    } catch (error) {
        console.error("Book Summary Error:", error);
        res.status(500).json({ error: 'Failed to get book summary' });
    }
});

// --- CHAPTER SUMMARY GENERATION ENDPOINT (LEGACY - NOW HANDLED BY ENDPOINT AT LINE ~477) ---
// This endpoint has been removed to avoid conflicts. See the second implementation below.

// --- CHAT ENDPOINT ---
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, history, language } = req.body;

        // Construct context from history
        // History is expected to be [{ role: 'user'|'model', text: '...' }]
        let context = "";
        if (history && Array.isArray(history)) {
            context = history.map(msg => (msg.role === 'user' ? 'User' : 'AI') + ": " + msg.text).join('\n');
        }

        // Construct context from previous messages if needed, or pass full history if aiManager supports it.
        // For now, simple interaction:
        // We can pass the history as part of the prompt or system instruction if needed, 
        // but aiManager.generateContent is designed for single-turn with context.
        // Let's create a specialized call for chat if we want history, but valid simple fix:

        const systemInstruction =
            "You are a warm, wise, and knowledgeable Bible study assistant.\n" +
            "You help users understand scripture, theology, and history.\n" +
            "You are respectful of different Christian traditions but lean towards orthodox, historical Christianity.\n\n" +
            "**STYLE GUIDELINES (CRITICAL):**\n" +
            "- **CHAT LIKE A FRIEND:** Be natural, warm, and simple. Avoid robotic language.\n" +
            "- **USE EMOJIS:** Use relevant emojis occasionally to make the conversation lighter 🌿 ✨.\n" +
            "- **KEEP IT BRIEF:** Avoid long lectures. Break text into short paragraphs.\n" +
            "- **ASK QUESTIONS:** End your answers with a thought-provoking question to keep the conversation going.\n" +
            "- **NO FLUFF:** Start answering immediately. Don't say 'That is a great question'.\n\n" +
            "**CITATION RULE (CRITICAL):**\n" +
            "When citing Bible verses, YOU MUST use Markdown links to the reading page.\n" +
            "- For Chapters: `[Book Chapter](/leitura/normalized-book/chapter)` (e.g., `[Gênesis 1](/leitura/genesis/1)`)\n" +
            "- For Verses: `[Book Chapter:Verse](/leitura/normalized-book/chapter?verses=start-end)` (e.g., `[João 3:16](/leitura/joao/3?verses=16-16)`)\n" +
            "- Use lowercase, no accents, and hyphens for spaces in book names.\n\n" +
            "Language: " + (language || 'pt') + ".\n\n" +
            "Previous Conversation:\n" +
            context;

        const fullPrompt = message;

        const response = await aiManager.generateContent('chat', fullPrompt, systemInstruction);
        res.json({ text: response });
    } catch (error) {
        console.error("Chat API Error:", error);
        fs.writeFileSync(path.join(__dirname, '../chat_error.log'), `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`);
        res.status(500).json({ error: 'Failed to generate chat response' });
    }
});

// --- CHAPTER SUMMARY ENDPOINT ---
app.post('/api/ai/chapter-summary', async (req, res) => {
    try {
        const { book, chapter, language } = req.body;
        if (!book || !chapter) return res.status(400).json({ error: 'Book and Chapter are required' });

        const summary = await aiManager.generateChapterSummary(book, chapter, language);
        // MOCK DATA FOR DEBUGGING
        /*
        const summary = {
            title: `Capítulo Mock ${chapter}`,
            summary: "Este é um resumo de teste para verificar a conectividade do servidor.",
            structure: {
                intro: "Intro teste",
                blocks: [],
                centralMessage: "Mensagem central teste"
            },
            keyVerses: [],
            historicalContext: "Contexto teste",
            practicalApplication: [],
            prayer: "Oração teste"
        };
        */
        res.json(summary);
    } catch (error) {
        console.error("Chapter Summary API Error:", error);
        fs.writeFileSync(path.join(__dirname, '../chapter_summary_error.log'), `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// --- DEVOTIONAL GENERATION ENDPOINT ---
app.post('/api/ai/devotional', async (req, res) => {
    try {
        const { language } = req.body;
        const targetLang = language || 'pt';
        // Get today's date in YYYY-MM-DD format (local time approximation or UTC)
        // Using simplified ISO date for consistency
        const today = new Date().toISOString().split('T')[0];

        // Dynamic import to avoid issues if model isn't loaded yet
        const { Devotional } = await import('./models/Devotional.js');

        // 1. Try to fetch from DB
        try {
            const existing = await Devotional.findOne({ date: today, language: targetLang });
            if (existing) {
                console.log(`[API] Returning cached devotional for ${today} (${targetLang})`);
                // Frontend expects { text: "JSON_STRING" }
                // We recreate that structure
                return res.json({ text: JSON.stringify(existing) });
            }
        } catch (dbErr) {
            console.error("[API] DB Read Error (Devotional):", dbErr);
            // Continue to generation if DB fails
        }

        console.log(`[API] Generating new devotional for ${today}...`);

        const systemInstruction = `
            You are a wise and compassionate Christian pastor. Write a daily devotional.
            Language: ${targetLang}.
            Return ONLY a valid JSON object:
            {
                "date": "${today}",
                "title": "Inspiring Title",
                "verse": { "text": "Verse text...", "reference": "Book Chapter:Verse" },
                "content": "A comforting and inspiring message (2-3 paragraphs).",
                "prayer": "A short closing prayer."
            }
        `;

        let responseText;
        try {
            responseText = await aiManager.generateContent('chat', 'Generate today\'s devotional', systemInstruction, 'json_object');
        } catch (genError) {
            console.error("AI Generation Failed:", genError);

            // FALLBACK: Try to find ANY recent devotional from DB
            const recent = await Devotional.findOne({ language: targetLang }).sort({ date: -1 });
            if (recent) {
                console.log("[API] AI failed. Returning most recent saved devotional as fallback.");
                return res.json({ text: JSON.stringify(recent) });
            }
            throw genError; // Re-throw if no fallback
        }

        // 2. Parse and Save to DB
        try {
            let jsonString = responseText;
            // Clean markdown if present
            jsonString = jsonString.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonString);

            // Ensure date is set (AI might hallucinate a different date)
            parsed.date = today;

            // Map flat structure (if AI returns flat) to schema if necessary, 
            // but prompt asks for nested 'verse'. 
            // Let's trust the AI follows the prompt, but be safe.
            const newDevotional = new Devotional({
                date: today,
                language: targetLang,
                title: parsed.title || "Devocional Diário",
                verse: {
                    text: parsed.verse?.text || parsed.verseText || "",
                    reference: parsed.verse?.reference || parsed.verseReference || ""
                },
                content: parsed.content || parsed.reflection || "",
                prayer: parsed.prayer || "",
                rawJson: jsonString
            });

            await newDevotional.save();
            console.log(`[API] Saved new devotional for ${today}`);

        } catch (saveError) {
            console.error("[API] Failed to save devotional to DB:", saveError);
            // Non-fatal: still return the generated text
        }

        res.json({ text: responseText });

    } catch (error) {
        console.error("Devotional Error:", error);
        res.status(500).json({ error: 'Failed to generate devotional' });
    }
});

// --- BLOG POST GENERATION ENDPOINT ---
app.post('/api/ai/blog-post', async (req, res) => {
    try {
        const { topic, title, language } = req.body;
        const systemInstruction = `
            You are a professional Christian blog writer. Write a comprehensive, SEO-optimized blog post.
            Topic: ${topic}
            Title: ${title || 'Auto-generated'}
            Language: ${language || 'pt'}
            
            Include:
            - Engaging Introduction
            - Clear Headings (Markdown ##)
            - Biblical References
            - Practical Applications
            - Conclusion
            
            Return ONLY a valid JSON object:
            {
                "content": {
                    "title": "Final Title",
                    "markdownContent": "The full blog post in Markdown format...",
                    "excerpt": "Short summary for preview..."
                }
            }
        `;

        // Using 'blog_post' feature config (likely OpenRouter/Claude or Gemini)
        const response = await aiManager.generateContent('blog_post', `Write a post about: ${topic}`, systemInstruction, 'json_object');
        res.json({ content: response });
    } catch (error) {
        console.error("Blog Gen Error:", error);
        res.status(500).json({ error: 'Failed to generate blog post' });
    }
});

// --- SEO METADATA GENERATION ENDPOINT ---
app.post('/api/ai/seo-metadata', async (req, res) => {
    try {
        const { content, keyword, language } = req.body;
        const systemInstruction = `
            Generate SEO metadata for the provided content.
            Keyword: ${keyword}
            Language: ${language || 'pt'}
            
            Return JSON:
            {
                "seoTitle": "Optimized Title (max 60 chars)",
                "metaDescription": "Optimized Description (max 160 chars)"
            }
        `;
        const response = await aiManager.generateContent('seo_metadata', `Content: ${content.substring(0, 500)}...`, systemInstruction, 'json_object');
        res.json(JSON.parse(response));
    } catch (error) {
        console.error("SEO Error:", error);
        res.status(500).json({ error: 'Failed to generate SEO metadata' });
    }
});

// --- AUDIO GENERATION ENDPOINT (Edge TTS) ---
app.post('/api/audio/edge', async (req, res) => {
    const debugFile = process.env.NODE_ENV === 'production'
        ? path.join('/tmp', 'server_debug.txt')
        : path.join(__dirname, 'server_debug.txt');
    const log = (msg) => {
        try {
            const time = new Date().toLocaleTimeString();
            fs.appendFileSync(debugFile, `[${time}] ${msg}\n`);
            console.log(`[AudioDebug] ${msg}`);
        } catch (e) { console.error("Log failed", e); }
    };

    try {
        log("--- New Audio Request ---");
        const { text, voice } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });


        log(`Voice: ${voice}, Text Length: ${text.length}`);

        // 1. Setup TTS
        const tts = new MsEdgeTTS();
        const voiceId = voice === 'female' ? "pt-BR-FranciscaNeural" : "pt-BR-AntonioNeural";

        // Switch to WebM Opus (Proven to work on PC with Web Audio API)
        await tts.setMetadata(voiceId, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);

        // 2. Generate
        log("Generating stream (96kbps)...");
        let stream = null;
        let result = null;

        try {
            result = await tts.toStream(text);
            if (result && result.audioStream) {
                stream = result.audioStream;
            } else if (result) {
                // Fallback if toStream returns the stream directly (Library version diff?)
                stream = result;
            }
            log(`Stream generated: ${!!stream}`);
        } catch (genErr) {
            console.error("TTS Generation Critical Error:", genErr);
            // Don't crash, return explicit error
            return res.status(500).json({ error: `TTS Gen Failed: ${genErr.message}` });
        }

        if (!stream) {
            const debugKeys = result ? Object.keys(result).join(',') : 'null';
            console.error(`Stream is null. Result keys: ${debugKeys}`);
            return res.status(500).json({ error: "Stream unavailable from TTS provider" });
        }

        // 3. Collect Data
        const chunks = [];
        stream.on('data', (c) => chunks.push(c));

        stream.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                log(`Success! Buffer size: ${buffer.length} bytes`);
                const base64 = buffer.toString('base64');
                res.json({ base64 });
            } catch (err) {
                log(`Buffer error: ${err.message}`);
                res.status(500).json({ error: 'Buffer conversion failed' });
            }
        });

        stream.on('error', (err) => {
            log(`Stream error: ${err.message}`);
            res.status(500).json({ error: 'Stream error', details: err.message });
        });

    } catch (e) {
        log(`CRITICAL ERROR: ${e.message}`);
        log(`Stack: ${e.stack}`);
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, '../src/data/fluid_chapters');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// GET: Retrieve chapter content
app.get('/api/fluid/:lang/:book/:chapter', (req, res) => {
    const { lang, book, chapter } = req.params;

    // Helper to normalize (remove accents)
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const decodedBook = decodeURIComponent(book);
    const normalizedBook = normalize(decodedBook);
    const rawBook = decodedBook.toLowerCase();

    // Generate candidates for filename matching
    const candidates = [
        normalizedBook, // e.g. "1-samuel"
        normalizedBook.replace(/-/g, ' '), // e.g. "1 samuel"
        normalizedBook.replace(/\s+/g, '-'), // e.g. "1-samuel"
        rawBook // legacy
    ];

    // Deduplicate
    const uniqueCandidates = [...new Set(candidates)];

    let finalPath = null;

    for (const cand of uniqueCandidates) {
        const fname = `${lang}_${cand}_${chapter}.json`.toLowerCase();
        const fpath = path.join(DATA_DIR, fname);
        if (fs.existsSync(fpath)) {
            finalPath = fpath;
            break;
        }
    }

    if (finalPath) {
        try {
            const content = fs.readFileSync(finalPath, 'utf-8');
            res.json(JSON.parse(content));
        } catch (error) {
            console.error(`Error reading file ${finalPath}:`, error);
            res.status(500).json({ error: 'Failed to read chapter data' });
        }
    } else {
        // Return 404 but with empty structure so editor can initialize
        res.status(404).json({ error: 'Chapter not found' });
    }
});

// POST: Save chapter content (with optional slug/meta)
app.post('/api/fluid', (req, res) => {
    const { lang, book, chapter, content, slug, metaDescription } = req.body;

    if (!lang || !book || !chapter || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Helper to normalize (remove accents) - MUST MATCH GET ENDPOINT
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const normalizedBook = normalize(book);
    const filename = `${lang}_${normalizedBook}_${chapter}.json`.toLowerCase();
    const filePath = path.join(DATA_DIR, filename);

    try {
        // 1. Save Content
        // Inject metaDescription into content if provided
        if (metaDescription) {
            content.metaDescription = metaDescription;
        }
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');

        // 2. Handle Slug (Update links.json)
        if (slug) {
            const linksPath = path.resolve(__dirname, '../src/data/links.json');
            let links = {};
            if (fs.existsSync(linksPath)) {
                try {
                    links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));
                } catch (e) { console.error("Error reading links", e); }
            }

            // Remove old slug pointing to this content (optional, but good for cleanup)
            // For now, just upsert the new slug
            const targetPath = `/leitura/${book}/${chapter}`;

            // Clean slug
            const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;
            links[cleanSlug] = targetPath;

            fs.writeFileSync(linksPath, JSON.stringify(links, null, 2), 'utf-8');
        }

        console.log(`Saved fluid chapter: ${filename}`);
        res.json({ success: true, filename });
    } catch (error) {
        console.error(`Error saving file ${filename}:`, error);
        res.status(500).json({ error: 'Failed to save chapter data' });
    }
});

// --- ADMIN ROUTES ---

// GET: List all fluid content files
app.get('/api/admin/files', (req, res) => {
    try {
        const files = fs.readdirSync(DATA_DIR);
        res.json(files);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// --- USER MANAGEMENT ---

const USERS_FILE = path.resolve(__dirname, '../src/data/users.json');

// --- AUTH ENDPOINT ---
app.post('/api/auth/google', async (req, res) => {
    try {
        const { profile } = req.body;
        if (!profile || !profile.email) {
            return res.status(400).json({ error: 'Invalid profile data' });
        }

        // Import User Model
        const { default: User } = await import('./models/User.js');

        // Check if user exists
        let user = await User.findOne({ email: profile.email });

        if (user) {
            // Update existing user info if changed
            user.name = profile.name;
            user.picture = profile.picture;
            user.googleId = profile.sub; // Ensure googleId is linked
            await user.save();
            console.log(`[Auth] User logged in: ${user.email}`);
        } else {
            // Create New User
            user = new User({
                googleId: profile.sub,
                name: profile.name,
                email: profile.email,
                picture: profile.picture,
                role: 'user' // Default role
            });
            await user.save();
            console.log(`[Auth] New user registered: ${user.email}`);
        }

        // Encryption Helpers
        const crypto = await import('crypto'); // Dynamic import or require if CommonJS

        const hashPassword = (password) => {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.scryptSync(password, salt, 64).toString('hex');
            return `${salt}:${hash}`;
        };

        const verifyPassword = (password, storedHash) => {
            const [salt, key] = storedHash.split(':');
            const hash = crypto.scryptSync(password, salt, 64).toString('hex');
            return key === hash;
        };

        // --- EMAIL/PASSWORD AUTH ENDPOINTS ---

        app.post('/api/auth/register', async (req, res) => {
            try {
                const { name, username, email, password } = req.body;

                if (!email || !password || !name) {
                    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
                }

                const { default: User } = await import('./models/User.js');

                // Check duplicates
                const existingUser = await User.findOne({ $or: [{ email }, { username }] });
                if (existingUser) {
                    return res.status(400).json({ error: 'Email ou nome de usuário já está em uso.' });
                }

                // Create User
                const hashedPassword = hashPassword(password);
                const user = new User({
                    name,
                    username: username || email.split('@')[0], // Fallback username
                    email,
                    password: hashedPassword,
                    role: 'user'
                });

                await user.save();
                console.log(`[Auth] New local user: ${email}`);

                // Return user without password
                const userObj = user.toObject();
                delete userObj.password;
                res.json({ user: userObj });

            } catch (error) {
                console.error("Register Error:", error);
                res.status(500).json({ error: 'Erro ao criar conta.' });
            }
        });

        app.post('/api/auth/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const { default: User } = await import('./models/User.js');

                const user = await User.findOne({ email });
                if (!user || !user.password) {
                    return res.status(401).json({ error: 'Credenciais inválidas.' });
                }

                if (!verifyPassword(password, user.password)) {
                    return res.status(401).json({ error: 'Senha incorreta.' });
                }

                console.log(`[Auth] Local login: ${email}`);
                const userObj = user.toObject();
                delete userObj.password;
                res.json({ user: userObj });

            } catch (error) {
                console.error("Login Error:", error);
                res.status(500).json({ error: 'Erro ao fazer login.' });
            }
        });

        // --- USER PROGRESS ---
        app.post('/api/user/complete-chapter', async (req, res) => {
            try {
                const { email, book, chapter, completed } = req.body;
                if (!email || !book || !chapter) return res.status(400).json({ error: 'Missing Data' });

                const { default: User } = await import('./models/User.js');
                const user = await User.findOne({ email });

                if (!user) return res.status(404).json({ error: 'User not found' });

                // Initialize if missing
                if (!user.completedChapters) user.completedChapters = [];

                if (completed) {
                    // Add if not exists
                    const exists = user.completedChapters.some(c => c.book === book && c.chapter === Number(chapter));
                    if (!exists) {
                        user.completedChapters.push({ book, chapter: Number(chapter) });
                    }
                } else {
                    // Remove
                    user.completedChapters = user.completedChapters.filter(c => !(c.book === book && c.chapter === Number(chapter)));
                }

                await user.save();

                // Return safe user
                const userObj = user.toObject();
                delete userObj.password;
                res.json({ user: userObj });

            } catch (e) {
                console.error("Progress Error:", e);
                res.status(500).json({ error: "Failed to update progress" });
            }
        });



        // Helper to read users
        const readUsers = () => {
            if (!fs.existsSync(USERS_FILE)) return [];
            try {
                return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
            } catch (e) { return []; }
        };

        // Helper to save users
        const saveUsers = (users) => {
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
        };

        // GET: List users
        app.get('/api/users', (req, res) => {
            const users = readUsers();
            // Return only safe info
            const safeUsers = users.map(u => ({
                id: u._id || u.id, // Adaptation for Mongo/FS hybrid state
                name: u.name,
                email: u.email,
                picture: u.picture,
                role: u.role || 'user',
                createdAt: u.createdAt
            }));
            res.json(safeUsers);
        });

        // --- DEBUG LOG ENDPOINT ---
        app.get('/api/debug/log', (req, res) => {
            const debugFile = process.env.NODE_ENV === 'production'
                ? path.join('/tmp', 'server_debug.txt')
                : path.join(__dirname, 'server_debug.txt');

            if (fs.existsSync(debugFile)) {
                res.sendFile(debugFile);
            } else {
                res.type('text/plain').send("Log file is empty or missing.");
            }
        });

        // --- IMAGE PERSISTENCE (MongoDB) ---
        app.get('/api/uploads/:filename', async (req, res) => {
            try {
                const { Image } = await import('./models/Image.js');
                const img = await Image.findOne({ filename: req.params.filename });

                if (img) {
                    const base64Data = img.data;
                    const imgBuffer = Buffer.from(base64Data, 'base64');
                    res.writeHead(200, {
                        'Content-Type': img.contentType,
                        'Content-Length': imgBuffer.length
                    });
                    res.end(imgBuffer);
                } else {
                    // Fallback to FS for legacy images
                    const filePath = path.join(UPLOADS_DIR, req.params.filename);
                    if (fs.existsSync(filePath)) {
                        res.sendFile(filePath);
                    } else {
                        res.status(404).json({ error: 'Image not found' });
                    }
                }
            } catch (e) {
                console.error("Image Serve Error:", e);
                res.status(500).end();
            }
        });

        app.post('/api/upload', async (req, res) => {
            try {
                const { image, filename } = req.body; // Expecting base64 string
                if (!image || !filename) return res.status(400).json({ error: 'Image and filename required' });

                // Generate unique name
                const uniqueName = `${Date.now()}-${filename.replace(/[^a-z0-9.]/gi, '_')}`;

                // Save to MongoDB
                const { Image } = await import('./models/Image.js');

                // Extract content type
                const match = image.match(/^data:(image\/\w+);base64,/);
                const contentType = match ? match[1] : 'image/png';
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

                const newImage = new Image({
                    filename: uniqueName,
                    contentType,
                    data: base64Data
                });
                await newImage.save();

                console.log(`[Upload] Image saved to MongoDB: ${uniqueName}`);

                // Return URL that points to our GET endpoint
                res.json({ url: `/api/uploads/${uniqueName}` });

            } catch (e) {
                console.error("Upload error:", e);
                res.status(500).json({ error: 'Failed to upload image' });
            }
        });



        // Deprecated in favor of Pollinations.ai
        export const generateSVGImage = async (prompt) => {
            return null;
        };

        // Helper to read categories
        const CATEGORIES_FILE = path.resolve(__dirname, '../src/data/categories.json');

        const readCategories = () => {
            if (fs.existsSync(CATEGORIES_FILE)) {
                try {
                    return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
                } catch (e) {
                    console.error("Error reading categories:", e);
                    return [];
                }
            }
            return [];
        };

        // Helper to save categories
        const saveCategories = (categories) => {
            fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8');
        };

        app.get('/api/categories', (req, res) => {
            try {
                const cats = readCategories();
                res.json(cats);
            } catch (error) {
                console.error('Route error /api/categories:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Add new category
        app.post('/api/categories', (req, res) => {
            try {
                const { name, slug, description } = req.body;
                if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });

                const categories = readCategories();
                const newCategory = {
                    id: Date.now().toString(),
                    name,
                    slug,
                    description: description || '',
                    parentId: req.body.parentId || null
                };

                categories.push(newCategory);
                saveCategories(categories);
                res.json(newCategory);
            } catch (e) {
                res.status(500).json({ error: 'Failed to add category' });
            }
        });

        // Update category
        app.put('/api/categories/:id', (req, res) => {
            try {
                const { id } = req.params;
                const { name, slug, description } = req.body;

                const categories = readCategories();
                const index = categories.findIndex(c => c.id === id);

                if (index === -1) return res.status(404).json({ error: 'Category not found' });

                categories[index] = {
                    ...categories[index],
                    name: name || categories[index].name,
                    slug: slug || categories[index].slug,
                    description: description !== undefined ? description : categories[index].description,
                    parentId: req.body.parentId !== undefined ? req.body.parentId : categories[index].parentId
                };

                saveCategories(categories);
                res.json(categories[index]);
            } catch (e) {
                res.status(500).json({ error: 'Failed to update category' });
            }
        });

        // Delete category
        app.delete('/api/categories/:id', (req, res) => {
            try {
                const { id } = req.params;
                let categories = readCategories();
                const initialLength = categories.length;

                categories = categories.filter(c => c.id !== id);

                if (categories.length < initialLength) {
                    saveCategories(categories);
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Category not found' });
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to delete category' });
            }
        });

        // --- BLOG API ---

        const BLOG_DIR = path.resolve(__dirname, '../src/data/blog_posts');
        if (!fs.existsSync(BLOG_DIR)) {
            fs.mkdirSync(BLOG_DIR, { recursive: true });
        }

        // List all posts (MongoDB)
        app.get('/api/blog/posts', async (req, res) => {
            try {
                const { include_drafts } = req.query;
                // Import Model dynamically
                const BlogPost = (await import('./models/BlogPost.js')).default;

                let query = {};
                if (include_drafts !== 'true') {
                    query.status = 'published';
                }

                // Optimize: Select only lightweight fields for listing
                // Exclude heavy 'content', 'markdownContent', 'htmlContent'
                const projection = {
                    title: 1,
                    slug: 1,
                    date: 1,
                    excerpt: 1,
                    coverImage: 1,
                    tags: 1,
                    category: 1,
                    status: 1
                };

                const posts = await BlogPost.find(query, projection).sort({ date: -1 }); // Sort desc
                res.json(posts);
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: 'Failed to list posts' });
            }
        });

        // Get single post
        // Get single post (MongoDB)
        app.get('/api/blog/posts/:slug', async (req, res) => {
            try {
                const BlogPost = (await import('./models/BlogPost.js')).default;
                const post = await BlogPost.findOne({ slug: req.params.slug });

                if (post) {
                    res.json(post);
                } else {
                    res.status(404).json({ error: 'Post not found' });
                }
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        // Save post (Create)
        // Save post (Create/Upsert MongoDB)
        app.post('/api/blog/posts', async (req, res) => {
            const { slug, ...data } = req.body;
            if (!slug) return res.status(400).json({ error: 'Slug required' });

            try {
                const BlogPost = (await import('./models/BlogPost.js')).default;

                // Check for existing text-file based logic removal -> Just direct Mongo save
                // Using findOneAndUpdate with upsert to handle both create and simple overwrites by slug
                // But traditional REST implies POST is create. Let's use clean logic.

                const existing = await BlogPost.findOne({ slug });
                if (existing) {
                    return res.status(409).json({ error: 'Post already exists' });
                }

                const newPost = new BlogPost({ slug, ...data });
                await newPost.save();
                res.json(newPost);
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: `Failed to save post: ${e.message}` });
            }
        });

        // Update post (Rename supported)
        // Update post (Rename supported via Mongo)
        app.put('/api/blog/posts/:oldSlug', async (req, res) => {
            const { oldSlug } = req.params;
            const { slug, ...data } = req.body; // New slug and data

            if (!slug) return res.status(400).json({ error: 'New slug required' });

            try {
                const BlogPost = (await import('./models/BlogPost.js')).default;
                const existing = await BlogPost.findOne({ slug: oldSlug });

                if (!existing) {
                    return res.status(404).json({ error: 'Post not found' });
                }

                // If slug changed, ensure new slug doesn't exist
                if (oldSlug !== slug) {
                    const conflict = await BlogPost.findOne({ slug });
                    if (conflict) {
                        return res.status(409).json({ error: 'Target slug already exists' });
                    }
                    existing.slug = slug;
                }

                // Update fields
                Object.assign(existing, data);
                await existing.save();

                res.json(existing);
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: `Failed to update post: ${e.message}` });
            }
        });

        // Delete post
        // Delete post (MongoDB)
        app.delete('/api/blog/posts/:slug', async (req, res) => {
            try {
                const BlogPost = (await import('./models/BlogPost.js')).default;
                await BlogPost.findOneAndDelete({ slug: req.params.slug });
                res.json({ success: true });
            } catch (e) {
                res.status(500).json({ error: 'Failed to delete post' });
            }
        });

        // --- AI CONFIG ENDPOINTS ---


        app.post('/api/ai/test-key', async (req, res) => {
            try {
                const { provider, apiKey } = req.body;
                if (!provider || !apiKey) return res.status(400).json({ success: false, message: 'Provider and API Key required' });

                const result = await aiManager.testConnection(provider, apiKey);
                res.json(result);
            } catch (e) {
            }
        });

        app.post('/api/ai/test-model', async (req, res) => {
            try {
                const { provider, model, type } = req.body;
                console.log(`[API] Testing model: ${provider}/${model} (${type})`);

                if (!provider || !model) {
                    return res.status(400).json({ success: false, message: 'Provider and model are required' });
                }

                let result;
                if (type === 'image') {
                    // Generate a small/fast image
                    result = await aiManager._generateRawImage("A simple geometric cube, white background", { width: 512, height: 512 });
                    if (!result) throw new Error("No image data returned");
                } else {
                    // Generate a short text
                    if (provider === 'openrouter') {
                        result = await aiManager._generateOpenRouterText("Say 'Hello'", model);
                    } else {
                        // Gemini direct test
                        const { GoogleGenerativeAI } = await import('@google/generative-ai');
                        const apiKey = aiManager.config.apiKeys.gemini;
                        if (!apiKey) throw new Error("Gemini API Key missing");
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const modelInstance = genAI.getGenerativeModel({ model: model });
                        const resp = await modelInstance.generateContent("Say 'Hello'");
                        result = resp.response.text();
                    }
                }

                res.json({ success: true, message: 'Model tested successfully', result: result ? result.substring(0, 50) + '...' : 'OK' });
            } catch (error) {
                console.error('[API] Test model failed:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        });

        app.get('/api/ai/status', (req, res) => {
            try {
                const status = aiManager.getStatus();
                res.json(status);
            } catch (e) {
                res.status(500).json({ error: 'Failed to get status' });
            }
        });

        // --- AI ENDPOINTS (Unified via aiManager) ---

        app.post('/api/ai/search', async (req, res) => {
            try {
                const { query, language } = req.body;
                const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';

                // RESTORED RICH PROMPT (Text Layout for Robustness)
                const systemInstruction = `You are a Bible search assistant. 
        CRITICAL: Follow this format STRICTLY.
        ===EXPLANATION===
        (Detailed theological answer in ${langName})
        ===VERSES===
        Book Chapter:Verse - "Verse text"
        Book Chapter:Verse - "Verse text"
        `;

                const prompt = `Search query: "${query}". Provide a comprehensive answer and 3-5 relevant verses. Use exactly these headers: ===EXPLANATION===, ===VERSES===.`;

                let rawText;
                try {
                    rawText = await aiManager.generateContent('chat', prompt, systemInstruction);
                } catch (e) {
                    console.warn("Primary model failed, retrying...");
                    rawText = await aiManager.generateContent('chat', prompt, systemInstruction);
                }

                const parts = { explanation: "", verses: [] };

                // Robust Parsing
                const sections = rawText.split('===');
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i].trim().toUpperCase();
                    const content = sections[i + 1] ? sections[i + 1].trim() : "";

                    if (section.includes('EXPLANATION')) {
                        parts.explanation = content;
                    } else if (section.includes('VERSES')) {
                        const lines = content.split('\n');
                        for (const line of lines) {
                            const match = line.match(/^([-0-9A-Za-zÀ-ÿ\s]+:\d+(?:-\d+)?)\s*-\s*["']?(.*?)["']?$/);
                            if (match) {
                                parts.verses.push({ reference: match[1].trim(), text: match[2].trim() });
                            }
                        }
                    }
                }

                // Fallback if parsing failed
                if (!parts.explanation) parts.explanation = rawText;

                res.json({ text: JSON.stringify(parts) });
            } catch (error) {
                console.error("Search API Error:", error);
                res.status(500).json({ error: error.message });
            }
        });



        app.post('/api/ai/explain', async (req, res) => {
            try {
                const { book, chapter, verse, text, language } = req.body;
                const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';

                const prompt = `Act as a bible scholar.Explain the theological meaning, historical context, and practical application of ${book} ${chapter}:${verse} - "${text}".Keep it concise(under 200 words) and accessible.Answer in ${langName}.`;

                const responseText = await aiManager.generateContent('explain', prompt, '');
                res.json({ text: responseText });
            } catch (error) {
                console.error("Explain API Error:", error);
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/ai/detailed-answer', async (req, res) => {
            try {
                const { query, language } = req.body;
                const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';

                const prompt = `You are a wise and knowledgeable Bible assistant. 
          Users are searching for: "${query}".
            Goal: Provide a "smart answer" that answers questions, summarizes topics, or provides context.
                Format: Markdown, concise(max 3 short paragraphs), include 2 - 3 key bible references.
        Answer in ${langName}.`;

                const text = await aiManager.generateContent('detailed_answer', prompt, '');
                res.json({ text });
            } catch (error) {
                console.error("Detailed Answer API Error:", error);
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/ai/fluid-gen', async (req, res) => {
            try {
                const { book, chapter, language, originalText } = req.body;

                const systemInstruction = `Atue como um especialista em teologia.
        CRITICAL: Follow this format STRICTLY.
        ===TITLE===
        (Write the chapter title here)
        ===PARAGRAPHS===
        (Write the modernized text here, paragraph by paragraph)
        `;

                const prompt = `
          Reescreva o capítulo ${chapter} de ${book} em linguagem moderna e fluida (${language}).
          Texto Base: ${originalText}
          Use exactly these headers: ===TITLE===, ===PARAGRAPHS===.
        `;

                const rawText = await aiManager.generateContent('fluid_gen', prompt, systemInstruction);

                const parts = { title: `Capítulo ${chapter}`, paragraphs: [] };

                const sections = rawText.split('===');
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i].trim().toUpperCase();
                    const content = sections[i + 1] ? sections[i + 1].trim() : "";

                    if (section.includes('TITLE')) {
                        parts.title = content;
                    } else if (section.includes('PARAGRAPHS')) {
                        parts.paragraphs = content.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                    }
                }

                // Fallback
                if (parts.paragraphs.length === 0) {
                    parts.paragraphs = rawText.split('\n').filter(p => p.length > 20);
                }

                res.json({ text: JSON.stringify(parts) });
            } catch (error) {
                console.error("Fluid Gen API Error:", error);
                res.status(500).json({ error: error.message });
            }
        });

        // --- GENERATION ENDPOINTS ---

        app.post('/api/ai/generate-image', async (req, res) => {
            console.log('[API] Request body:', JSON.stringify(req.body));
            try {
                const { prompt, width, height, customFilename } = req.body;
                if (!prompt) {
                    console.error('[API] Missing prompt');
                    return res.status(400).json({ error: 'Prompt is required' });
                }

                console.log('[API] Calling aiManager.generateImage...');
                const imageUrl = await aiManager.generateImage(prompt, { width, height }, customFilename);
                console.log('[API] Image generated:', imageUrl);
                res.json({ url: imageUrl });
            } catch (e) {
                console.error('Image Generation Error:', e);
                res.status(500).json({ error: 'Failed to generate image', details: e.message, stack: e.stack });
            }
        });

        app.post('/api/ai/blog-title', async (req, res) => {
            try {
                const { keyword, language } = req.body;

                const systemInstruction =
                    "Act as a professional Christian copywriter and theologian.\n" +
                    "TASK: Generate 5 distinct blog post title ideas based on the keyword: \"" + keyword + "\".\n" +
                    "CRITICAL RULE: EVERY SINGLE TITLE MUST BE BIBLICAL.\n" +
                    "- If the keyword is \"Homem mais rico do mundo\" (Richest man), you MUST write about King Solomon, or spiritual wealth vs earthly wealth.\n" +
                    "- If the keyword is \"Success\", write about success in God's eyes.\n" +
                    "- NEVER generate titles about modern celebrities, politicians, or secular economy.\n" +
                    "- If you cannot find a direct biblical connection, use a metaphor.\n\n" +
                    "Language: " + (language || 'pt') + ".\n\n" +
                    "You MUST return a JSON object with a \"titles\" array.\n" +
                    "Example Response Structure:\n" +
                    "{\n" +
                    "    \"titles\": [\n" +
                    "        { \"title\": \"A Riqueza de Salomão...\", \"seoTitle\": \"...\", \"metaDescription\": \"...\" },\n" +
                    "        { \"title\": \"O Que Jesus Disse...\", \"seoTitle\": \"...\", \"metaDescription\": \"...\" }\n" +
                    "    ]\n" +
                    "}";

                const response = await aiManager.generateContent('blog_title', keyword, systemInstruction, 'json_object');

                let json;
                try {
                    const cleanResponse = response.replace(new RegExp("```json", "g"), "").replace(new RegExp("```", "g"), "").trim();
                    json = JSON.parse(cleanResponse);
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                    console.error("Raw Response:", response);
                    throw new Error("Failed to parse AI response");
                }

                // Normalize response: Ensure 'titles' array exists
                if (!json.titles && json.title) {
                    // AI returned a single object, wrap it
                    json = { titles: [json] };
                } else if (Array.isArray(json)) {
                    // AI returned a raw array
                    json = { titles: json };
                }

                res.json(json);

            } catch (error) {
                console.error("AI Title Generation Error:", error);
                res.status(500).json({ error: 'Failed to generate titles', details: error.message });
            }
        });

        // Explain Verse
        app.post('/api/ai/explain', async (req, res) => {
            try {
                const { book, chapter, verse, text, language } = req.body;
                const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';

                const prompt = `
      Act as a biblical scholar. provide a brief, insightful, and spiritually enriching explanation of these specific verses:
      "${book} ${chapter}:${verse} - ${text}"

      Context: Verify the theological context. If multiple verses are provided, explain the passage as a whole.
      Output Language: ${langName}.
      Tone: Clear, inspiring, easy to understand.
      Length: 1-2 paragraphs maximum.
      Constraint: Start directly with the explanation. Do NOT start with "Okay", "Here is", "Sure", or any intro filler.
    `;

                const result = await aiManager.model.generateContent(prompt);
                const response = await result.response;
                res.json({ text: response.text() });
            } catch (error) {
                console.error("Explain Error:", error);
                res.status(500).json({ error: "Failed to explain verse" });
            }
        });

        // Ask Verse Question
        app.post('/api/ai/ask-verse', async (req, res) => {
            try {
                const { book, chapter, verse, text, question, language } = req.body;
                const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';

                const prompt = `
      Act as a knowledgeable and friendly Bible study assistant.
      
      Verse(s): "${book} ${chapter}:${verse} - ${text}"
      
      User Question: "${question}"
      
      Task: Answer the user's question specifically based on these verses and their immediate context.
      Output Language: ${langName}.
      Tone: Helpful, concise, theological but accessible.
      Limit: Keep the answer under 100 words if possible.
      Constraint: Start directly with the answer. Do NOT start with "Okay", "Here is", "Sure", or any intro filler.
    `;

                const result = await aiManager.model.generateContent(prompt);
                const response = await result.response;
                res.json({ text: response.text() });
            } catch (error) {
                console.error("Ask Verse Error:", error);
                res.status(500).json({ error: "Failed to answer question" });
            }
        });


        app.post('/api/ai/blog-post', async (req, res) => {
            try {
                const { title, context, language } = req.body;

                const systemInstruction =
                    "Act as a professional Christian content creator and theologian.\n" +
                    "Write a comprehensive, engaging, and visually structured blog post with the title: \"" + title + "\".\n\n" +
                    "Context / Instructions: " + context + "\n\n" +
                    "** SEO & AIO Requirements:**\n" +
                    "- ** Keywords:** Naturally integrate relevant keywords.\n" +
                    "- ** Structure:** Use <h2 class=\"text-3xl font-bold mt-12 mb-6 text-stone-900 dark:text-stone-100 font-serif\"> and <h3 class=\"text-2xl font-bold mt-8 mb-4 text-stone-800 dark:text-stone-200 font-serif\">. NEVER use h1.\n" +
                    "- ** Typography:** Paragraphs MUST use <p class=\"mb-6 text-lg text-stone-700 dark:text-stone-300 leading-relaxed font-serif\">.\n" +
                    "- ** Tone Analysis:** Analyze the title/theme carefully.\n" +
                    "    - If 'Prayer/Devotional': Use comforting, poetic language. Use more Verse Blocks.\n" +
                    "    - If 'Study/Theology': Use analytical language. Use Tables and Insight Cards.\n" +
                    "    - If 'Q&A/Curiosity': Use a conversational tone. Use Accordions.\n\n" +
                    "** MANDATORY VISUAL BLOCKS (Use these HTML classes EXACTLY):**\n\n" +
                    "1. **BIBLE VERSES (Must appear at least once):**\n" +
                    "   `<div class=\"blog-verse-block\">`\n" +
                    "   `  <p class=\"blog-verse-text\">\"Write the verse text here...\"</p>`\n" +
                    "   `  <span class=\"blog-verse-ref\">Book Chapter:Verse</span>`\n" +
                    "   `</div>`\n\n" +
                    "2. **INSIGHT CARD (Key takeaways, applications, or reflections):**\n" +
                    "   `<div class=\"blog-card\">`\n" +
                    "   `  <h4 class=\"blog-card-title\">💡 Reflexão Prática / Curiosidade</h4>`\n" +
                    "   `  <p>Content goes here...</p>`\n" +
                    "   `</div>`\n\n" +
                    "3. **RESPONSIVE TABLE (If comparing concepts, history, or lists):**\n" +
                    "   `<div class=\"blog-table-container\">`\n" +
                    "   `  <table class=\"blog-table\">`\n" +
                    "   `    <thead><tr><th>Header 1</th><th>Header 2</th></tr></thead>`\n" +
                    "   `    <tbody><tr><td>Data 1</td><td>Data 2</td></tr></tbody>`\n" +
                    "   `  </table>`\n" +
                    "   `</div>`\n\n" +
                    "4. **CHAT INVITATION (Insert naturally in the middle):**\n" +
                    "   `<div class=\"blog-chat-cta\">`\n" +
                    "   `  <div class=\"blog-chat-inner\">`\n" +
                    "   `    <div class=\"flex-1\">`\n" +
                    "   `      <h4 class=\"text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 font-serif\">📖 Quer aprofundar seu estudo?</h4>`\n" +
                    "   `      <p class=\"text-stone-700 dark:text-stone-300\">Tem dúvidas sobre este tema? Nossa IA pode te ajudar a explorar mais.</p>`\n" +
                    "   `    </div>`\n" +
                    "   `    <a href=\"http://localhost:5173/chat?p=Gostaria de saber mais sobre: " + title + "\" class=\"blog-chat-btn\">`\n" +
                    "   `      Conversar com IA`\n" +
                    "   `    </a>`\n" +
                    "   `  </div>`\n" +
                    "   `</div>`\n\n" +
                    "5. **Q&A ACCORDION (At the end - MANDATORY):**\n" +
                    "   `<h2 class=\"text-3xl font-bold mt-12 mb-6 text-stone-900 dark:text-stone-100 font-serif border-b border-stone-200 pb-4\">Perguntas Frequentes</h2>`\n" +
                    "   `<div class=\"blog-accordion\">`\n" +
                    "     (Generate 3-4 Q&A pairs): \n" +
                    "     `<details>`\n" +
                    "     `  <summary>Question goes here?</summary>`\n" +
                    "     `  <div class=\"blog-accordion-content\">Answer goes here...</div>`\n" +
                    "     `</details>`\n" +
                    "   `</div>`\n\n" +
                    "** Internal Links:** Link Bible verses using: <a href=\"/leitura/{normalized_book}/{chapter}\" class=\"text-bible-accent hover:underline font-bold\">{Ref}</a>\n" +
                    "** Images:** Include 2-3: [[IMAGE: Description_in_Portuguese]]\n" +
                    "** Length:** 800-1200 words.\n\n" +
                    "Return ONLY the HTML content of the body (no <html>, <head>, or <body> tags).\n" + ((() => {
                        try {
                            const files = fs.readdirSync(BLOG_DIR);
                            // Read categories to map ID -> Slug
                            let categoryMap = {};
                            if (fs.existsSync(CATEGORIES_FILE)) {
                                try {
                                    const cats = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
                                    cats.forEach(c => categoryMap[c.id] = c.slug);
                                } catch (e) { }
                            }

                            const posts = files.map(file => {
                                try {
                                    const c = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8'));
                                    // Resolve category slug from ID, fallback to 'blog'
                                    const catSlug = (c.category && categoryMap[c.category]) ? categoryMap[c.category] : 'blog';
                                    return { title: c.title, slug: file.replace('.json', ''), categorySlug: catSlug };
                                } catch (e) { return null; }
                            }).filter(p => p && p.title);

                            if (posts.length === 0) return "";

                            return "\n\n**INTERNAL LINKING (MANDATORY):**\n" +
                                "You MUST check the following list of existing articles. If any are relevant to the topic, insert a contextually appropriate link.\n\n" +
                                "**Format:** <a href=\"/{category}/{slug}\" class=\"text-bible-gold hover:underline\">{Title}</a>\n\n" +
                                "**Available Articles:**\n" +
                                posts.map(p => "- Title: \"" + p.title + "\" | Link: /" + p.categorySlug + "/" + p.slug).join('\n');
                        } catch (e) { return ""; }
                    })());

                const result = await aiManager.generateContent('blog_post', "Write the blog post", systemInstruction);
                let cleanResult = result ? result.replace(new RegExp("```html", "g"), "").replace(new RegExp("```", "g"), "").trim() : "";

                // Post-processing: Fix Markdown bold leakage
                cleanResult = cleanResult.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                res.json({ content: cleanResult });

            } catch (error) {
                console.error("AI Generation Error:", error);
                const logMsg = "[" + new Date().toISOString() + "] Error: " + error.message + "\nStack: " + error.stack + "\n";
                try {
                    fs.appendFileSync(path.resolve(__dirname, '../server_error.log'), logMsg);
                } catch (e) { console.error("Failed to write log", e); }

                res.status(500).json({ error: 'Failed to generate content', details: error.message });
            }
        });

        app.post('/api/ai/seo-metadata', async (req, res) => {
            try {
                const { content, keyword, language } = req.body;

                const systemInstruction =
                    "Act as an SEO expert.\n" +
                    "Analyze the provided blog post content(or title) and keyword: \"" + keyword + "\".\n" +
                    "Generate an optimized SEO Title and Meta Description.\n" +
                    "Language: " + (language || 'pt') + ".\n\n" +
                    "Return ONLY a JSON object:\n" +
                    "{\n" +
                    "    \"seoTitle\": \"Title (max 60 chars)\",\n" +
                    "    \"metaDescription\": \"Description (max 160 chars)\"\n" +
                    "}";

                const response = await aiManager.generateContent('seo_metadata', content || keyword, systemInstruction, 'json_object');

                const cleanResponse = response.replace(new RegExp("```json", "g"), "").replace(new RegExp("```", "g"), "").trim();
                let json = JSON.parse(cleanResponse);
                res.json(json);

            } catch (error) {
                console.error("AI SEO Error:", error);
                res.status(500).json({ error: 'Failed to generate SEO metadata', details: error.message });
            }
        });

        app.post('/api/ai/generate-image', async (req, res) => {
            try {
                const { prompt, width, height, customFilename } = req.body;
                if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

                // Call AI Manager to generate AND save locally
                const url = await aiManager.generateImage(prompt, { width, height, customFilename });

                res.json({ url });
            } catch (error) {
                console.error("Image Generation Error:", error);
                res.status(500).json({ error: 'Failed to generate image', details: error.message });
            }
        });

        app.post('/api/ai/chat', async (req, res) => {
            try {
                const { message, history, language } = req.body;

                // Construct context from history
                // History is expected to be [{ role: 'user'|'model', text: '...' }]
                let context = "";
                if (history && Array.isArray(history)) {
                    context = history.map(msg => (msg.role === 'user' ? 'User' : 'AI') + ": " + msg.text).join('\n');
                }

                const systemInstruction =
                    "You are a warm, wise, and knowledgeable Bible study assistant.\n" +
                    "You help users understand scripture, theology, and history.\n" +
                    "You are respectful of different Christian traditions but lean towards orthodox, historical Christianity.\n\n" +
                    "**STYLE GUIDELINES (CRITICAL):**\n" +
                    "- **CHAT LIKE A FRIEND:** Be natural, warm, and simple. Avoid robotic language.\n" +
                    "- **ADAPTIVE LENGTH:** Adjust your depth based on the question. Simple question? Short answer (2-3 sentences). Complex theological question? Deeper answer (max 2 paragraphs).\n" +
                    "- **ENGAGEMENT (CRITICAL):** If your answer is short, YOU MUST end with a follow-up question to keep the conversation going (e.g., 'Would you like to know more about X?' or 'Have you ever felt like that?').\n" +
                    "- **NO FLUFF:** Start answering immediately. Don't say 'That is a great question'.\n\n" +
                    "**CITATION RULE (CRITICAL):**\n" +
                    "When citing Bible verses, YOU MUST use Markdown links to the reading page.\n" +
                    "- For Chapters: `[Book Chapter](/leitura/normalized-book/chapter)` (e.g., `[Gênesis 1](/leitura/genesis/1)`)\n" +
                    "- For Verses: `[Book Chapter:Verse](/leitura/normalized-book/chapter?verses=start-end)` (e.g., `[João 3:16](/leitura/joao/3?verses=16-16)`)\n" +
                    "- Use lowercase, no accents, and hyphens for spaces in book names.\n\n" +
                    "Language: " + (language || 'pt') + ".\n\n" +
                    "Previous Conversation:\n" +
                    context;

                const response = await aiManager.generateContent('chat', message, systemInstruction);
                res.json({ text: response });

            } catch (error) {
                console.error("AI Chat Error:", error);
                res.status(500).json({ error: 'Failed to generate chat response' });
            }
        });

        app.post('/api/ai/rewrite', async (req, res) => {
            try {
                const { text, prompt, language } = req.body;
                if (!text || !prompt) return res.status(400).json({ error: 'Text and prompt are required' });

                const systemInstruction =
                    "You are an expert editor and writer.\n" +
                    "TASK: Rewrite the provided text based on the user's instruction.\n" +
                    "Language: " + (language || 'pt') + ".\n" +
                    "Instruction: " + prompt + "\n\n" +
                    "Return ONLY the rewritten text, maintaining the original meaning unless asked to change it.\n" +
                    "Do not add quotes or explanations.";

                const response = await aiManager.generateContent('rewrite', text, systemInstruction);
                res.json({ text: response });
            } catch (error) {
                console.error("AI Rewrite Error:", error);
                res.status(500).json({ error: 'Failed to rewrite text' });
            }
        });




        app.get('/api/ai/debug-raw', async (req, res) => {
            try {
                const apiKey = process.env.GEMINI_API_KEY || aiManager.config.apiKeys.gemini;
                const genAI = new GoogleGenerativeAI(apiKey);
                const results = {};

                // Test 1: Gemini 2.0 Flash Exp
                try {
                    const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                    const result2 = await model2.generateContent("Test connection");
                    results.model_2_0 = { success: true, text: result2.response.text() };
                } catch (e) {
                    results.model_2_0 = { success: false, error: e.message, details: JSON.stringify(e) };
                }

                // Test 2: Gemini 1.5 Flash
                try {
                    const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const result15 = await model15.generateContent("Test connection");
                    results.model_1_5 = { success: true, text: result15.response.text() };
                } catch (e) {
                    results.model_1_5 = { success: false, error: e.message, details: JSON.stringify(e) };
                }

                results.env = {
                    node: process.version,
                    hasFetch: typeof fetch !== 'undefined',
                    keyLength: apiKey ? apiKey.length : 0
                };

                res.json(results);
            } catch (globalError) {
                res.status(500).json({ error: globalError.message });
            }

        });

        // --- PRODUCTION STATIC FILES ---
        const distPath = path.resolve(__dirname, '../dist');
        if (fs.existsSync(distPath)) {
            console.log(`Serving static files from: ${distPath}`);
            app.use(express.static(distPath));

            // Handle SPA routing - return index.html for all non-API routes
            // Express 5 requires regex or specific syntax instead of '*'
            app.get(/.*/, (req, res) => {
                if (req.path.startsWith('/api')) {
                    return res.status(404).json({ error: 'API route not found' });
                }
                res.sendFile(path.join(distPath, 'index.html'));
            });
        } else {
            console.warn(`WARNING: 'dist' folder not found at ${distPath}. Build the frontend first!`);
        }

        // Start Server

        // --- START SERVER (After MongoDB Connection) ---
        (async () => {
            try {
                // Wait for MongoDB to connect before starting server
                await connectDB();
                console.log('[Server] MongoDB connected, starting Express server...');

                app.listen(PORT, '0.0.0.0', () => {
                    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
                    console.log(`📡 API ready at http://localhost:${PORT}/api`);
                    console.log(`📊 MongoDB: Connected and ready`);
                    console.log(`Environment: ${process.env.NODE_ENV}`);
                    console.log(`Storage directory: ${DATA_DIR}`);
                });
            } catch (error) {
                console.error('[Server] Failed to start:', error);
                process.exit(1);
            }
        })();

        // Keep the server alive
        const keepAliveInterval = setInterval(() => {
            // This prevents the Node process from exiting
        }, 60000);



        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down gracefully...');
            clearInterval(keepAliveInterval);
            process.exit(0);
        });

