import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Readable } from "stream";
import { GoogleGenAI } from "@google/genai";
import { aiManager } from './services/aiManager.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// SECURITY: Allow data: blobs for audio (iOS fix)
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; connect-src 'self' https:;");
    next();
});

// EMERGENCY KEY FALLBACK
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let FORCED_KEY = "";
try {
    const forced = require('./force_key.js');
    if (forced && forced.GEMINI_KEY) {
        FORCED_KEY = forced.GEMINI_KEY;
        console.log("⚠️ EMERGENCY: Loaded Hardcoded API Key. This is a temporary production fix.");
        if (!process.env.GEMINI_API_KEY) {
            process.env.GEMINI_API_KEY = FORCED_KEY;
        }
    }
} catch (e) { console.log("No forced key found."); }

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

// Serve uploads statically
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
                url: `/uploads/${file}`,
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
        url: `/uploads/${req.file.filename}`
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
            url: `/uploads/${filename}`
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
        res.status(500).json({ error: 'Failed to generate titles' });
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
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        role: u.role || 'user',
        createdAt: u.createdAt
    }));
    res.json(safeUsers);
});

// POST: Google Login (Create/Update user)
app.post('/api/auth/google', (req, res) => {
    const { profile } = req.body; // Expecting decoded profile from frontend

    if (!profile || !profile.email) {
        return res.status(400).json({ error: 'Invalid profile data' });
    }

    const users = readUsers();
    let user = users.find(u => u.email === profile.email);

    const timestamp = new Date().toISOString();

    if (user) {
        // Update existing user
        user.name = profile.name || user.name;
        user.picture = profile.picture || user.picture;
        user.lastLogin = timestamp;
    } else {
        // Create new user
        user = {
            id: Date.now().toString(), // Simple ID
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            role: 'user', // Default role
            createdAt: timestamp,
            lastLogin: timestamp
        };
        users.push(user);
    }

    saveUsers(users);
    res.json({ success: true, user });
});

// DELETE: Remove user
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    let users = readUsers();
    const initialLength = users.length;

    users = users.filter(u => u.id !== id);

    if (users.length < initialLength) {
        saveUsers(users);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// POST: Create User (Manual)
app.post('/api/users', (req, res) => {
    const { name, email, role, password } = req.body; // Password ignored for now as we use Google Auth primarily, but kept for structure
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        role: role || 'user',
        picture: '', // Default empty
        createdAt: new Date().toISOString(),
        lastLogin: null
    };

    users.push(newUser);
    saveUsers(users);
    res.json(newUser);
});

// PUT: Update User
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const users = readUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) return res.status(404).json({ error: 'User not found' });

    // Update fields
    users[index] = {
        ...users[index],
        name: name || users[index].name,
        email: email || users[index].email,
        role: role || users[index].role
    };

    saveUsers(users);
    res.json(users[index]);
});

// --- UPLOAD API (Base64) ---
// --- UPLOAD API (Base64) ---
// Uses the global UPLOADS_DIR defined at the top

app.post('/api/upload', (req, res) => {
    try {
        const { image, filename } = req.body; // Expecting base64 string
        if (!image || !filename) return res.status(400).json({ error: 'Image and filename required' });

        // Remove header if present (e.g., "data:image/png;base64,")
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique name to prevent overwrites
        const uniqueName = `${Date.now()}-${filename.replace(/[^a-z0-9.]/gi, '_')}`;
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        fs.writeFileSync(filePath, buffer);

        // Return public URL
        res.json({ url: `/uploads/${uniqueName}` });
    } catch (e) {
        console.error("Upload error:", e);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// LINKS MANAGEMENT
const LINKS_FILE = path.resolve(__dirname, '../src/data/links.json');
const LINKS_DIR = path.dirname(LINKS_FILE);

if (!fs.existsSync(LINKS_DIR)) {
    fs.mkdirSync(LINKS_DIR, { recursive: true });
}

// GET: Get all custom links
app.get('/api/admin/links', (req, res) => {
    if (fs.existsSync(LINKS_FILE)) {
        try {
            const content = fs.readFileSync(LINKS_FILE, 'utf-8');
            res.json(JSON.parse(content));
        } catch (error) {
            console.error('Error reading links file:', error);
            res.json({}); // Return empty object on error
        }
    } else {
        res.json({}); // Return empty object if no file
    }
});

// POST: Save custom links
app.post('/api/admin/links', (req, res) => {
    const links = req.body;
    try {
        fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving links file:', error);
        res.status(500).json({ error: 'Failed to save links' });
    }
});

const SETTINGS_FILE = path.resolve(__dirname, '../src/data/settings.json');

app.get('/api/settings', (req, res) => {
    if (fs.existsSync(SETTINGS_FILE)) {
        res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')));
    } else {
        res.json({});
    }
});

app.post('/api/settings', (req, res) => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// DEBUG LOG ENDPOINT
app.get('/api/debug/log', (req, res) => {
    const debugFile = path.join(__dirname, 'server_debug.txt');
    if (fs.existsSync(debugFile)) {
        res.sendFile(debugFile);
    } else {
        res.type('text/plain').send("Log file is empty or missing.");
    }
});

app.post('/api/audio/edge', async (req, res) => {
    const debugFile = path.join(__dirname, 'server_debug.txt');
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
        await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        // 2. Generate
        log("Generating stream...");
        const result = await tts.toStream(text);
        const stream = result ? result.audioStream : null;

        if (!stream) {
            throw new Error(`Stream is null. Result keys: ${result ? Object.keys(result).join(',') : 'null'}`);
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

// List all posts
app.get('/api/blog/posts', (req, res) => {
    try {
        const { include_drafts } = req.query;
        const files = fs.readdirSync(BLOG_DIR);
        const posts = files.map(file => {
            const content = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8'));
            return {
                slug: file.replace('.json', ''),
                ...content
            };
        });

        // Filter drafts unless requested
        const filteredPosts = include_drafts === 'true'
            ? posts
            : posts.filter(p => p.status === 'published');

        // Sort by date desc
        filteredPosts.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        res.json(filteredPosts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to list posts' });
    }
});

// Get single post
app.get('/api/blog/posts/:slug', (req, res) => {
    const filePath = path.join(BLOG_DIR, `${req.params.slug}.json`);
    if (fs.existsSync(filePath)) {
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
});

// Save post (Create)
app.post('/api/blog/posts', (req, res) => {
    const { slug, ...data } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug required' });

    const filePath = path.join(BLOG_DIR, `${slug}.json`);
    try {
        if (fs.existsSync(filePath)) {
            return res.status(409).json({ error: 'Post already exists' });
        }
        const savedPost = { slug, ...data };
        fs.writeFileSync(filePath, JSON.stringify(savedPost, null, 2), 'utf-8');
        res.json(savedPost);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: `Failed to save post: ${e.message}` });
    }
});

// Update post (Rename supported)
app.put('/api/blog/posts/:oldSlug', (req, res) => {
    const { oldSlug } = req.params;
    const { slug, ...data } = req.body; // New slug and data

    if (!slug) return res.status(400).json({ error: 'New slug required' });

    const oldFilePath = path.join(BLOG_DIR, `${oldSlug}.json`);
    const newFilePath = path.join(BLOG_DIR, `${slug}.json`);

    try {
        if (!fs.existsSync(oldFilePath)) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // If slug changed, rename file
        if (oldSlug !== slug) {
            if (fs.existsSync(newFilePath)) {
                return res.status(409).json({ error: 'Target slug already exists' });
            }
            fs.renameSync(oldFilePath, newFilePath);
        }

        // Write new content
        const savedPost = { slug, ...data };
        fs.writeFileSync(newFilePath, JSON.stringify(savedPost, null, 2), 'utf-8');
        res.json(savedPost);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: `Failed to update post: ${e.message}` });
    }
});

// Delete post
app.delete('/api/blog/posts/:slug', (req, res) => {
    const filePath = path.join(BLOG_DIR, `${req.params.slug}.json`);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

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
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// --- SEARCH & ANSWER API (Server-Side) ---
app.post('/api/ai/search', async (req, res) => {
    try {
        const { query, language } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || aiManager.config.apiKeys.gemini;

        if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';
        const prompt = `Search the bible for verses related to: "${query}". 
          If the query is a specific topic (e.g. "hope", "salvation"), find the most relevant verses.
          If the query is a phrase, try to find where it appears.
          Return the top 5 most relevant results in ${langName} as a JSON array of objects with keys: reference, text, context.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ text });
    } catch (error) {
        console.error("Search API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ai/detailed-answer', async (req, res) => {
    try {
        const { query, language } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || aiManager.config.apiKeys.gemini;

        if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });

        const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';
        const prompt = `You are a wise and knowledgeable Bible assistant. 
          Users are searching for: "${query}".
          
          Your goal is to provide a "smart answer" that:
          1. Directly answers the question if it is a question (e.g. "Who is David?").
          2. Summarizes the biblical perspective if it is a topic (e.g. "Faith").
          3. provides context if it is a keyword.

          Format:
          - Use **Markdown** for emphasis.
          - Be concise (max 3 short paragraphs).
          - Include 2-3 key bible references (e.g. Joao 3:16) if applicable.
          - Answer in ${langName}.`;

        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Detailed Answer API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI GENERATION ENDPOINT ---
app.post('/api/ai/devotional', async (req, res) => {
    try {
        const { language } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || aiManager.config.apiKeys.gemini;
        if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
            generationConfig: { responseMimeType: "application/json" }
        });

        const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';
        const prompt = `Generate a short, inspiring daily Christian devotional in ${langName}. Return a JSON object with: title, verseReference, verseText, reflection (approx 150 words), and a short prayer.`;

        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Devotional API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI EXPLAIN ENDPOINT ---
app.post('/api/ai/explain', async (req, res) => {
    try {
        const { book, chapter, verse, text, language } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || aiManager.config.apiKeys.gemini;
        if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });

        const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';
        const prompt = `Act as a bible scholar. Explain the theological meaning, historical context, and practical application of ${book} ${chapter}:${verse} - "${text}". Keep it concise (under 200 words) and accessible. Answer in ${langName}.`;

        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Explain API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI FLUID GEN ENDPOINT ---
app.post('/api/ai/fluid-gen', async (req, res) => {
    try {
        const { book, chapter, language, originalText } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || aiManager.config.apiKeys.gemini;
        if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
            generationConfig: { temperature: 0.7 }
        });

        const prompt = `
          Atue como um especialista em teologia e linguística.
          Seu objetivo é reescrever o capítulo ${chapter} do livro de ${book} da Bíblia para uma linguagem moderna e fluida, em ${language === 'pt' ? 'Português do Brasil' : language}.
          
          USE O SEGUINTE TEXTO ORIGINAL COMO BASE:
          ---
          ${originalText}
          ---
    
          Regras:
          1. Mantenha a fidelidade teológica absoluta ao texto fornecido acima.
          2. Substitua termos arcaicos por equivalentes modernos.
          3. Organize o texto em parágrafos lógicos e fluidos (narrativa), NÃO em versículos isolados.
          4. Destaque em **negrito** (Markdown) as frases teologicamente mais importantes.
          5. O texto deve ser envolvente, como um livro de literatura.
          6. Retorne APENAS um JSON válido com a seguinte estrutura:
          {
            "title": "Título do Capítulo (ex: A Criação do Mundo)",
            "paragraphs": ["parágrafo 1...", "parágrafo 2..."]
          }
        `;

        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Fluid Gen API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI GENERATION ENDPOINT ---
app.post('/api/ai/generate-image', async (req, res) => {
    console.log('[API] /api/ai/generate-image called');
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
        console.error("AI Title Generation Error:");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", JSON.stringify(error, null, 2));
        res.status(500).json({ error: 'Failed to generate titles', details: error.message });
    }
});

app.post('/api/ai/blog-post', async (req, res) => {
    try {
        const { title, context, language } = req.body;

        const systemInstruction =
            "Act as a professional Christian content creator and theologian.\n" +
            "Write a comprehensive, engaging, and visually structured blog post with the title: \"" + title + "\".\n\n" +
            "Context / Instructions: " + context + "\n\n" +
            "** SEO & AIO(Artificial Intelligence Optimization) Requirements:**\n" +
            "- ** Keywords:** Naturally integrate relevant keywords related to the title and biblical themes.\n" +
            "- ** Structure:** Use a clear hierarchy.Use < h2 > for main sections and < h3 > for subsections.NEVER use < h1 > (reserved for page title).\n" +
            "- ** Readability:** Keep paragraphs short(3 - 4 lines).Use bullet points and numbered lists where possible.\n" +
            "- ** Engagement:** Ask rhetorical questions to encourage reflection.\n" +
            "- ** Engagement:** Ask rhetorical questions to encourage reflection.\n" +
            "- ** Semantic HTML:** Use < strong > for emphasis on key concepts, not just for styling.\n" +
            "- ** NO MARKDOWN:** Do NOT use markdown formatting like **bold** or *italic*. Use HTML <strong> and <em> tags ONLY.\n\n" +
            "** Structure & Formatting:**\n" +
            "    - Use HTML tags for formatting(h2, h3, p, ul, li, blockquote, strong, em).\n" +
            "- ** Internal Links(CRITICAL):** Whenever you mention a Bible book, chapter, or verse, YOU MUST create an HTML link to the reading page.\n" +
            "    - Format for Chapter: <a href=\"/leitura/{normalized_book_name}/{chapter}\" class=\"text-bible-gold hover:underline\">{Book} {Chapter}</a>\n" +
            "    - Format for Verse(s): <a href=\"/leitura/{normalized_book_name}/{chapter}?verses={start}-{end}\" class=\"text-bible-gold hover:underline\">{Book} {Chapter}:{VerseRange}</a>\n" +
            "    - Example 1: \"Como diz em <a href=\"/leitura/joao/3?verses=16-16\" class=\"text-bible-gold hover:underline\">João 3:16</a>...\"\n" +
            "    - Example 2: \"Paulo explica em <a href=\"/leitura/1-corintios/8?verses=4-6\" class=\"text-bible-gold hover:underline\">1 Coríntios 8:4-6</a>...\"\n" +
            "    - Use normalized book names (lowercase, no accents, REPLACE SPACES WITH HYPHENS).\n" +
            "- **Images (CRITICAL):** You MUST include 2-3 relevant image placeholders where they fit best contextually to break up the text.\n" +
            "    - Format: [[IMAGE: Descrição detalhada para geração de imagem em Português]]\n" +
            "    - The description inside the brackets MUST be in Portuguese.\n" +
            "- **Tone:** Inspiring, educational, and faithful to the Scriptures.\n" +
            "- **Length:** Approximately 800-1200 words.\n\n" +
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


// --- SERVE STATIC FRONTEND (Production) ---
const DIST_DIR = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
    console.log(`Serving static files from ${DIST_DIR}`);
    app.use(express.static(DIST_DIR));

    // Handle SPA routing: return index.html for any unknown route
    app.get(/.*/, (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(DIST_DIR, 'index.html'));
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Storage directory: ${DATA_DIR}`);
});

// Keep the server alive
const keepAliveInterval = setInterval(() => {
    // This prevents the Node process from exiting
}, 60000);

// Error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    clearInterval(keepAliveInterval);
    process.exit(0);
});

