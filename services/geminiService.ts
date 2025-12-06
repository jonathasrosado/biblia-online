import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Verse, SearchResult, DevotionalContent, BlogPost } from '../types';
import { getChapterContentLocal } from './localBibleService';

// IMPORTANT: Handle both Vite (browser) and Node (server) environments
const getApiKey = () => {
  // 1. Check Vite injected process.env (from vite.config.ts define)
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  // 2. Check standard Vite env vars
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();

if (!apiKey) {
  console.error("Gemini API Key is missing! Please check .env.local");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key_to_prevent_crash' });

const modelName = 'gemini-1.5-flash';

// --- CACHE HELPERS ---
const CACHE_PREFIX = 'bible_app_v1_';

const getFromCache = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    // Check for expiration if object has timestamp (optional logic)
    // For now, we return the data directly
    return JSON.parse(item);
  } catch (e) {
    console.warn('Cache read error:', e);
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Cache write error (likely quota exceeded):', e);
    // Basic strategy: if quota exceeded, clear all search caches to free space
    if (key.includes('search')) {
      // Logic to clear old keys could go here
    }
  }
};

// Retrieve chapter content structured as JSON
export const getChapterContent = async (book: string, chapter: number, language: string = 'pt'): Promise<Verse[]> => {
  // 1. Try Local JSON first (FAST & FREE)
  // Only for Portuguese for now, as the JSON is likely PT-BR based on filename
  if (language === 'pt') {
    const localData = getChapterContentLocal(book, chapter);
    if (localData) {
      console.log(`Loaded ${book} ${chapter} from local JSON.`);
      return localData;
    }
  }

  // 2. Try Cache
  const cacheKey = `chapter_${language}_${book}_${chapter}`;
  const cached = getFromCache<Verse[]>(cacheKey);
  if (cached) return cached;

  if (!apiKey) {
    return [{ number: 1, text: "Erro de configuração: Chave de API do Gemini não encontrada. Verifique o arquivo .env.local." }];
  }

  try {
    const langName = language === 'en' ? 'English (KJV or NIV)' : language === 'es' ? 'Spanish (Reina-Valera)' : 'Portuguese (Almeida)';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Provide the full text of the Bible book of ${book} chapter ${chapter} in ${langName}. Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  text: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{"verses": []}');
    const verses = json.verses || [];

    if (verses.length > 0) {
      saveToCache(cacheKey, verses);
    }

    return verses;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    let errorMessage = "Não foi possível carregar o texto. Por favor, verifique sua conexão.";

    if (error.message?.includes('API key')) {
      errorMessage = "Erro de autenticação: Chave de API inválida.";
    } else if (error.message?.includes('quota')) {
      errorMessage = "Cota da API excedida. Tente novamente mais tarde.";
    }

    return [{ number: 1, text: errorMessage }];
  }
};

// Define FluidChapterContent type (assuming it's not imported)
type FluidChapterContent = { title: string; paragraphs: string[] };

// Direct AI Generation (Bypasses cache/local API)
export const generateFluidContent = async (book: string, chapter: number, language: string = 'pt'): Promise<FluidChapterContent | { error: string }> => {
  try {
    // 1. Fetch Original Verses (Grounded Generation)
    const verses = await getChapterContent(book, chapter, language);
    const originalText = verses.map(v => `${v.number}. ${v.text}`).join('\n');

    const response = await fetch('/api/ai/fluid-gen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book, chapter, language, originalText })
    });

    if (!response.ok) throw new Error(`Fluid Gen Error: ${response.status}`);
    const data = await response.json();

    // Parse text inside response
    let text = data.text || '';
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
      const parsed = JSON.parse(jsonString) as FluidChapterContent;
      return parsed;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw text:", text);
      return { error: "Estrutura inválida da IA. Tente novamente." };
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { error: error.message || "Erro desconhecido na API." };
  }
};

// Retrieve fluid chapter content (organized paragraphs, modern language)
export const getFluidChapterContent = async (book: string, chapter: number, language: string = 'pt'): Promise<FluidChapterContent | { error: string }> => {
  const cacheKey = `${CACHE_PREFIX}fluid_${language}_${book}_${chapter}`;

  // 1. Try Local Storage Cache (Fastest)
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Try Local API (Persistent Storage)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const apiResponse = await fetch(`/api/fluid/${language}/${book}/${chapter}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      localStorage.setItem(cacheKey, JSON.stringify(data)); // Update local cache
      return data;
    }
  } catch (e) {
    console.warn("Local API fetch failed", e);
  }

  // 3. Generate with AI (Fallback)
  // Only generate if we really couldn't find it
  const data = await generateFluidContent(book, chapter, language);

  if ('error' in data) {
    return data;
  }

  // Save to Local Storage
  localStorage.setItem(cacheKey, JSON.stringify(data));

  // 4. Save to Local API (Background)
  // This ensures the next user will find it on the server!
  fetch('/api/fluid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang: language, book, chapter, content: data })
  }).catch(err => console.error("Failed to save to local API:", err));

  return data;
};

// Get a devotional
// Get a devotional
export const getDevotional = async (language: string = 'pt'): Promise<DevotionalContent | null> => {
  // Cache key includes date to ensure daily rotation
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `devotional_${language}_${today}`;

  const cached = getFromCache<DevotionalContent>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('/api/ai/devotional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data.text) {
      const content = JSON.parse(data.text) as DevotionalContent;
      saveToCache(cacheKey, content);
      return content;
    }
    return null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

// Explain a verse
export const explainVerse = async (book: string, chapter: number, verse: number, text: string, language: string = 'pt'): Promise<string> => {
  const cacheKey = `explain_${language}_${book}_${chapter}_${verse}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book, chapter, verse, text, language })
    });

    if (!response.ok) return "Explicação indisponível (Server Error).";
    const data = await response.json();

    const explanation = data.text || "";
    if (explanation) {
      saveToCache(cacheKey, explanation);
    }
    return explanation;
  } catch (error) {
    console.error(error);
    return "Explicação indisponível.";
  }
};

// Search functionality
import { searchBibleLocal } from './localBibleService';

export const searchBible = async (query: string, language: string = 'pt'): Promise<SearchResult[]> => {
  const cacheKey = `search_${language}_${query.trim().toLowerCase()}`;
  const cached = getFromCache<SearchResult[]>(cacheKey);
  if (cached) return cached;

  let results: SearchResult[] = [];

  // 1. Try Local Search first (Fast & Deterministic)
  if (language === 'pt') {
    const localResults = searchBibleLocal(query);
    if (localResults.length > 0) {
      results = localResults;
      // If we have plenty of exact matches, we might not need AI, 
      // but let's keep AI for "semantic" understanding if local results are few
      // if (results.length >= 5) {
      //   saveToCache(cacheKey, results);
      //   return results;
      // }
    }
  }

  // 2. AI Search (Semantic / Fallback) - via Server Backend
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language })
    });

    if (!response.ok) throw new Error('Search API failed');
    const data = await response.json();

    // Parse the text which is expected to be JSON string
    let json = [];
    try {
      json = JSON.parse(data.text || '[]');
      // Clean up markdown code blocks if present
      if (typeof json === 'string') {
        // Occasionally it returns a string if prompt blocked json, try to parse substring
        const match = json.match(/\[.*\]/s);
        if (match) json = JSON.parse(match[0]);
      }
    } catch {
      // Fallback: try to extract JSON array from string
      const match = data.text.match(/\[.*\]/s);
      if (match) json = JSON.parse(match[0]);
    }

    const aiResults = Array.isArray(json) ? json : [];

    // Combine results: Local first, then AI (deduplicated by reference)
    const existingRefs = new Set(results.map(r => r.reference));

    aiResults.forEach((r: any) => {
      if (!existingRefs.has(r.reference)) {
        results.push(r);
        existingRefs.add(r.reference);
      }
    });

    if (results.length > 0) {
      saveToCache(cacheKey, results);
    }
    return results;
  } catch (error) {
    console.error("AI Search Error:", error);
    return results;
  }
}

// Search Blog Posts (Local Filter)


export const searchBlogPosts = async (query: string): Promise<BlogPost[]> => {
  try {
    const response = await fetch('/api/blog/posts?status=published');
    if (!response.ok) return [];

    const posts: BlogPost[] = await response.json();
    if (!Array.isArray(posts)) return [];

    const lowerQuery = query.toLowerCase();

    // Simple relevance filtering
    return posts.filter(post =>
      post.title.toLowerCase().includes(lowerQuery) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(lowerQuery)) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    ).slice(0, 5); // Return top 5
  } catch (error) {
    console.error("Blog Search Error:", error);
    return [];
  }
};

// New Smart Search Summary (Server Proxy)
export const getDetailedAnswer = async (query: string, language: string = 'pt'): Promise<string> => {
  try {
    const response = await fetch('/api/ai/detailed-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language })
    });

    if (!response.ok) return "";
    const data = await response.json();
    return data.text ? data.text.trim() : "";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "";

  }
};

// Chat instance creator - DEPRECATED in favor of backend API
export const createChat = (language: string = 'pt'): Chat => {
  const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';
  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: `You are a warm, wise, and knowledgeable Bible study assistant. You help users understand scripture, theology, and history. You are respectful of different Christian traditions but lean towards orthodox, historical Christianity. Always answer in ${langName}.`
    }
  });
};

// Send Chat Message (Backend API)
export const sendChatMessage = async (message: string, history: any[], language: string = 'pt'): Promise<string> => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, language })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || "";
    }
    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    console.error("Error sending chat message:", error);
    return "Desculpe, ocorreu um erro ao processar sua mensagem.";
  }
};

// Generate Blog Post with Images
export const generateBlogPost = async (title: string, context: string = '', language: string = 'pt'): Promise<string> => {
  try {
    const response = await fetch('/api/ai/blog-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, context, language })
    });

    if (response.ok) {
      const data = await response.json();
      let content = data.content || "";

      // Find all image placeholders: [[IMAGE: description]]
      const imageRegex = /\[\[IMAGE: (.*?)\]\]/g;
      const matches = [...content.matchAll(imageRegex)];

      if (matches.length > 0) {
        console.log(`Found ${matches.length} image placeholders. Generating images...`);

        // Process sequentially to avoid overwhelming the API
        for (const match of matches) {
          const [fullMatch, prompt] = match;
          console.log(`Generating image for: ${prompt}`);

          try {
            const imageUrl = await generateImage(prompt);
            if (imageUrl) {
              // Replace the placeholder with the actual image HTML
              // We use a responsive figure with caption
              const imageHtml = `
                <figure class="my-8">
                  <img src="${imageUrl}" alt="${prompt}" class="w-full rounded-xl shadow-lg" />
                  <figcaption class="text-center text-sm text-stone-500 mt-2 italic">${prompt}</figcaption>
                </figure>
              `;
              content = content.replace(fullMatch, imageHtml);
            } else {
              // If generation fails, remove the placeholder
              content = content.replace(fullMatch, '');
            }
          } catch (err) {
            console.error(`Failed to generate image for "${prompt}":`, err);
            content = content.replace(fullMatch, '');
          }
        }
      }

      return content;
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  } catch (error) {
    console.error("Error generating blog post:", error);
    throw error;
  }
};

// Generate Blog Title & SEO
export const generateBlogTitle = async (keyword: string, language: string = 'pt'): Promise<{ title: string, seoTitle: string, metaDescription: string }[] | null> => {
  try {
    const response = await fetch('/api/ai/blog-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, language })
    });

    if (response.ok) {
      const data = await response.json();
      return data.titles || [];
    }
    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    console.error("Error generating blog title:", error);
    throw error;
  }
};

// Generate SEO Metadata
export const generateSEOMetadata = async (content: string, keyword: string, language: string = 'pt'): Promise<{ seoTitle: string, metaDescription: string } | null> => {
  try {
    const response = await fetch('/api/ai/seo-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, keyword, language })
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    console.error("Error generating SEO metadata:", error);
    throw error;
  }
};

// Generate Category Description
export const generateCategoryDescription = async (categoryName: string, language: string = 'pt'): Promise<string> => {
  try {
    const langName = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
      Act as an SEO expert and theologian.
      Write a concise, engaging, and SEO-optimized description for a blog category named "${categoryName}" in a Christian/Bible study website.
      
      Requirements:
      - Length: 150-160 characters (ideal for meta description).
      - Tone: Inspiring, inviting, and professional.
      - Language: ${langName}.
      - Do not use quotes or markdown. Just the raw text.
      `
    });

    return response.text ? response.text.trim() : "";
  } catch (error) {
    console.error("Error generating category description:", error);
    return "";
  }
};

// Generate Detailed Image Prompt
export const generateImagePrompt = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
      Act as a professional prompt engineer for AI image generation (Midjourney/Flux/Mystic style).
      
      TASK: Create a highly detailed, artistic, and cinematic image prompt based on this blog post title: "${title}".
      
      REQUIREMENTS:
      - Style: Cinematic, Photorealistic, Biblical Epic, 8k resolution.
      - Lighting: Dramatic, volumetric lighting, golden hour or ethereal glow.
      - Composition: Wide angle, Landscape orientation (16:9), rule of thirds, dynamic.
      - Details: Intricate textures, historical accuracy (if biblical), atmospheric depth.
      - NEGATIVE PROMPT (include this logic in the description): No text, no words, no letters, no modern elements, no blurry faces, no distortion.
      
      OUTPUT: Return ONLY the prompt text in English. Do not add "Prompt:" or quotes.
      `
    });

    return response.text ? response.text.trim() : title;
  } catch (error) {
    console.error("Error generating image prompt:", error);
    return `Cinematic biblical scene representing ${title}, high quality, 8k, photorealistic`;
  }
};

// Generate Pollinations Image (High Quality Fallback)
export const generatePollinationsImage = (prompt: string): string => {
  const encodedPrompt = encodeURIComponent(prompt + ", hyperrealistic, 8k resolution, cinematic lighting, intricate details, masterpiece, spiritual atmosphere, dramatic shadows, ray tracing, anatomically correct, perfect faces, high quality");
  // Using 'flux-realism' model if available or sticking to 'flux' with better prompt
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-realism&width=1024&height=576&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
};

// Generate Image (Try Imagen -> Fallback to Pollinations)
// Generate Image (Backend API - Respects Config)
export const generateImage = async (prompt: string, options: { width?: number, height?: number } = {}, customFilename?: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width: options.width, height: options.height, customFilename })
    });

    if (response.ok) {
      const data = await response.json();
      return data.url;
    }
    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    console.warn("Backend image generation failed, falling back to Pollinations:", error);
    // Fallback to Pollinations (Instant, High Quality)
    // Note: Pollinations fallback here doesn't use width/height, but that's acceptable for a fallback
    return generatePollinationsImage(prompt);
  }
};

export const generateSVGImage = async (prompt: string): Promise<string | null> => {
  // Deprecated in favor of Pollinations.ai
  return null;
};

// --- AUDIO GENERATION (TTS) ---

// Helper to decode Base64 to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}



// Return Data URI string instead of AudioBuffer for better compatibility
export const generateAudioFromText = async (text: string, voice: 'male' | 'female' = 'male'): Promise<string | null> => {
  try {
    console.log(`[Audio] Generating audio for text: "${text.substring(0, 20)}..." with voice: ${voice}`);

    const response = await fetch('/api/audio/edge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
      throw new Error(`Edge TTS API failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.base64) {
      // Simplified: Return the Data URI directly for HTML5 Audio
      // This bypasses complex AudioContext decoding issues on iOS
      return `data:audio/mp3;base64,${data.base64}`;
    }

    return null;
  } catch (error: any) {
    console.error("Audio Generation Error:", error);
    return null;
  }
};

export const rewriteText = async (text: string, prompt: string, language: string = 'pt'): Promise<string | null> => {
  try {
    const response = await fetch('/api/ai/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prompt, language })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text;
    }
    return null;
  } catch (error) {
    console.error("Rewrite Error:", error);
    return null;
  }
};