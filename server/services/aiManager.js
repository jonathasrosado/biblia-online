import fs from 'fs';
import path from 'path';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const CONFIG_PATH = path.join(process.cwd(), 'server', 'ai-config.json');

export class AIManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const logMsg = `[AIManager] Loading config from ${CONFIG_PATH}\n`;
            fs.appendFileSync(path.join(process.cwd(), 'server-debug.log'), logMsg);

            if (fs.existsSync(CONFIG_PATH)) {
                const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
                fs.appendFileSync(path.join(process.cwd(), 'server-debug.log'), `[AIManager] Config loaded. Length: ${content.length}\n`);
                return JSON.parse(content);
            }
            fs.appendFileSync(path.join(process.cwd(), 'server-debug.log'), `[AIManager] Config file not found!\n`);
        } catch (e) {
            console.error(e);
        }
        return {
            apiKeys: { gemini: '' },
            features: {}
        };
    }

    saveConfig(newConfig) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
        this.config = newConfig;
    }

    loadStatus() {
        const STATUS_PATH = path.join(process.cwd(), 'server', 'ai-status.json');
        if (fs.existsSync(STATUS_PATH)) {
            try {
                return JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
            } catch (e) { console.error("Error reading status:", e); }
        }
        return {};
    }

    saveStatus(provider, status) {
        const STATUS_PATH = path.join(process.cwd(), 'server', 'ai-status.json');
        const currentStatus = this.loadStatus();
        currentStatus[provider] = {
            ...status,
            lastChecked: new Date().toISOString()
        };
        fs.writeFileSync(STATUS_PATH, JSON.stringify(currentStatus, null, 2), 'utf-8');
        return currentStatus;
    }

    getStatus() {
        return this.loadStatus();
    }

    getConfig() {
        this.config = this.loadConfig();
        return this.config;
    }

    async getAvailableModels() {
        // Only models confirmed working with current API
        const geminiModels = [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'text', isFree: true },
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', type: 'text', isFree: true }
        ];

        // Pollinations image models
        const pollinationsModels = [
            { id: 'flux', name: 'Flux', type: 'image', isFree: true },
            { id: 'flux-realism', name: 'Flux Realism', type: 'image', isFree: true },
            { id: 'flux-anime', name: 'Flux Anime', type: 'image', isFree: true },
            { id: 'flux-3d', name: 'Flux 3D', type: 'image', isFree: true },
            { id: 'turbo', name: 'Turbo', type: 'image', isFree: true }
        ];

        const openrouterModels = [
            // Image Models
            { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image (Preview)', type: 'image', isFree: true },
            { id: 'black-forest-labs/flux-1-schnell', name: 'Flux 1 Schnell (Fast/Free)', type: 'image', isFree: true },
            { id: 'black-forest-labs/flux-1-dev', name: 'Flux 1 Dev (High Quality)', type: 'image', isFree: false },
            { id: 'stabilityai/stable-diffusion-3-medium', name: 'Stable Diffusion 3 Medium', type: 'image', isFree: false },

            // Text Models
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)', type: 'text', isFree: false },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)', type: 'text', isFree: false },
            { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (Meta)', type: 'text', isFree: false },
            { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', type: 'text', isFree: false },
            { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)', type: 'text', isFree: true },
            { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', type: 'text', isFree: false }
        ];

        const freepikModels = [
            { id: 'flux-realism', name: 'Flux Realism (Freepik)', type: 'image', isFree: false },
            { id: 'mystic', name: 'Mystic (Freepik)', type: 'image', isFree: false }
        ];

        return {
            gemini: geminiModels,
            pollinations: pollinationsModels,
            freepik: freepikModels,
            openrouter: openrouterModels
        };
    }

    async generateContent(feature, prompt, systemInstruction = '', responseFormat = null) {
        const featureConfig = this.config.features[feature];

        // Default to OpenRouter to bypass Railway region blocks for Gemini
        const provider = featureConfig?.provider || 'openrouter';
        const model = featureConfig?.model || 'google/gemini-2.0-flash-exp:free';

        console.log(`[AIManager] Generating for ${feature} using ${provider}/${model}`);

        console.log(`[AIManager] Generating for ${feature} using ${provider}/${model}`);

        const fullPrompt = systemInstruction
            ? `${systemInstruction}\n\n${prompt}`
            : prompt;

        if (provider === 'openrouter') {
            return this._generateOpenRouterText(fullPrompt, model, responseFormat);
        }

        // Gemini Generation
        const apiKey = this.config.apiKeys.gemini || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API Key missing");

        const ai = new GoogleGenerativeAI(apiKey);

        const config = {};
        if (responseFormat === 'json_object') {
            config.responseMimeType = 'application/json';
        }

        const modelInstance = ai.getGenerativeModel({ model: model, generationConfig: config });
        const result = await modelInstance.generateContent(fullPrompt);

        let text = result.response.text();
        return this.processImagePrompts(text, feature);
    }

    async _generateOpenRouterText(prompt, model, responseFormat = null) {
        const apiKey = this.config.apiKeys.openrouter;
        if (!apiKey) throw new Error("OpenRouter API Key missing");

        console.log(`[AIManager] Generating text via OpenRouter (${model})...`);

        const body = {
            model: model,
            messages: [
                { role: "user", content: prompt }
            ]
        };

        // Add JSON mode if requested (supported by some OpenRouter models)
        if (responseFormat === 'json_object') {
            body.response_format = { type: "json_object" };
            // Append instruction for models that need explicit prompting for JSON
            body.messages[0].content += "\n\nIMPORTANT: Respond with valid JSON only.";
        }

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://biblia-online-inteligente.com",
                    "X-Title": "Biblia Online Inteligente"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
            throw new Error('No content in OpenRouter response');
        } catch (error) {
            const fs = await import('fs');
            const path = await import('path');
            fs.writeFileSync(path.join(process.cwd(), 'error.txt'), `OpenRouter Text Error: ${error.message}\nStack: ${error.stack}`);
            console.error('[AIManager] OpenRouter text generation failed:', error);
            throw error;
        }
    }

    async processImagePrompts(text, feature) {
        if (feature === 'blog_post' && text.includes('[[IMAGE_PROMPT:')) {
            console.log('[AIManager] Detecting image prompts in content...');
            const regex = /\[\[IMAGE_PROMPT:\s*(.*?)\]\]/g;
            const matches = [...text.matchAll(regex)];

            for (const match of matches) {
                const fullMatch = match[0];
                const imagePrompt = match[1];
                console.log(`[AIManager] Generating auto-image for prompt: "${imagePrompt.substring(0, 50)}..."`);

                try {
                    const imageUrl = await this.generateImage(imagePrompt, { width: 1280, height: 720 });

                    const imageHtml = `
                        <figure class="my-8">
                            <img src="${imageUrl}" alt="${imagePrompt}" class="w-full rounded-xl shadow-lg" />
                            <figcaption class="text-center text-sm text-stone-500 mt-2 italic">Ilustração gerada por IA</figcaption>
                        </figure>
                    `;

                    text = text.replace(fullMatch, imageHtml);
                } catch (err) {
                    console.error('[AIManager] Failed to generate auto-image:', err);
                    text = text.replace(fullMatch, '');
                }
            }
        }
        return text;
    }

    getPollinationsUrl(prompt, options = {}, model = 'flux-realism') {
        const width = options.width || 1280;
        const height = options.height || 720;
        const seed = options.seed || Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
    }

    async saveImageLocally(imageData, prompt, customFilename = null) {
        let filename;
        if (customFilename) {
            // Sanitize custom filename
            const safeCustom = customFilename.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
            filename = `${safeCustom}-${Date.now()}.png`;
        } else {
            const safeName = prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 50).toLowerCase();
            filename = `ai-${Date.now()}-${safeName}.png`;
        }
        const filePath = path.join(UPLOADS_DIR, filename);

        console.log(`[AIManager] Saving image to ${filePath}...`);

        try {
            if (imageData.startsWith('http')) {
                // Download from URL using fetch (handles redirects)
                console.log(`[AIManager] Downloading from URL: ${imageData}`);
                const response = await fetch(imageData);
                if (!response.ok) throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(filePath, buffer);
                console.log(`[AIManager] Image saved successfully.`);
            } else if (imageData.startsWith('data:image')) {
                // Save Base64
                console.log(`[AIManager] Saving Base64 image.`);
                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(filePath, buffer);
                console.log(`[AIManager] Image saved successfully.`);
            } else {
                throw new Error('Unknown image data format');
            }

            return `/uploads/${filename}`;
        } catch (error) {
            console.error('[AIManager] Failed to save image locally:', error);
            // Fallback: return original data if save fails
            return imageData;
        }
    }

    // Wrapper to generate AND save
    async generateImage(prompt, options = {}) {
        const rawImage = await this._generateRawImage(prompt, options);
        return await this.saveImageLocally(rawImage, prompt);
    }

    async _generateRawImage(prompt, options = {}) {
        // Force reload config to ensure we have latest settings
        this.config = this.loadConfig();

        const featureConfig = this.config.features.images;
        const provider = featureConfig?.provider || 'pollinations';
        const model = featureConfig?.model || 'flux';

        try {
            const logMsg = `[AIManager] _generateRawImage called.\nConfig provider: ${featureConfig?.provider}, model: ${featureConfig?.model}\nSelected provider: ${provider}, model: ${model}\n`;
            fs.appendFileSync(path.join(process.cwd(), 'server-debug.log'), logMsg);
        } catch (e) { }

        console.log(`[AIManager] _generateRawImage called.`);
        console.log(`[AIManager] Config provider: ${featureConfig?.provider}, model: ${featureConfig?.model}`);
        console.log(`[AIManager] Selected provider: ${provider}, model: ${model}`);

        if (provider === 'pollinations') {
            return this.getPollinationsUrl(prompt, options, model);
        }

        if (provider === 'openrouter') {
            const apiKey = this.config.apiKeys.openrouter;
            if (!apiKey) throw new Error("OpenRouter API Key missing");

            console.log('[AIManager] Calling OpenRouter API...');

            // Gemini 2.5 Flash Image Preview specific logic for Aspect Ratio
            let extraBody = {};
            let finalPrompt = prompt;
            if (model === 'google/gemini-2.5-flash-image-preview') {
                const width = options.width || 1024;
                const height = options.height || 1024;
                let ratio = "1:1";

                if (width > height) {
                    ratio = "16:9";
                    finalPrompt = `Wide 16:9 landscape image of ${prompt}`;
                } else if (height > width) {
                    ratio = "9:16";
                    finalPrompt = `Tall 9:16 portrait image of ${prompt}`;
                } else {
                    finalPrompt = `Square 1:1 image of ${prompt}`;
                }

                extraBody = {
                    image_config: {
                        aspect_ratio: ratio
                    }
                };
                console.log(`[AIManager] Aggressive Fix: Prompt="${finalPrompt}", Ratio="${ratio}"`);
            }

            const requestBody = {
                model: model,
                messages: [
                    { role: "user", content: finalPrompt }
                ],
                modalities: ["image", "text"],
                extra_body: extraBody
            };

            console.log('[AIManager] OpenRouter Request Body:', JSON.stringify(requestBody, null, 2));

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://biblia-online-inteligente.com",
                        "X-Title": "Biblia Online Inteligente"
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                if (data.choices && data.choices.length > 0) {
                    const message = data.choices[0].message;

                    // 1. Check for direct 'images' array in message (OpenRouter/Gemini standard)
                    if (message.images && message.images.length > 0) {
                        return message.images[0].url || message.images[0].image_url?.url || message.images[0];
                    }

                    const content = message.content;

                    // 2. Check for Markdown image syntax ![alt](url)
                    const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
                    if (markdownMatch) return markdownMatch[1];

                    // 3. Check for any URL in parentheses (fallback)
                    const parenMatch = content.match(/\((https?:\/\/.*?)\)/);
                    if (parenMatch) return parenMatch[1];

                    // 4. Check if content itself is a URL
                    if (content && content.startsWith('http')) {
                        return content;
                    }
                }

                if (data.data && data.data[0] && data.data[0].url) {
                    return data.data[0].url;
                }

                console.log('[AIManager] OpenRouter response data:', JSON.stringify(data).substring(0, 200));

                if (data.choices && data.choices.length > 0) {
                    // If we have content but no image, throw error instead of returning text
                    // This prevents the "Here's an image..." text from being saved as the image URL
                    throw new Error('Received text response but no image URL found: ' + data.choices[0].message.content.substring(0, 50) + '...');
                }

                throw new Error('No image URL found in OpenRouter response');

            } catch (error) {
                fs.writeFileSync(path.join(process.cwd(), 'error.txt'), `OpenRouter Error: ${error.message}\nStack: ${error.stack}`);
                console.error('[AIManager] OpenRouter generation failed:', error.message);
                throw error;
            }
        }

        if (provider === 'freepik') {
            const apiKey = this.config.apiKeys.freepik;
            if (!apiKey) throw new Error("Freepik API Key missing");

            console.log('[AIManager] Calling Freepik API...');
            const aspectRatio = 'cinematic_16_9';

            try {
                const response = await fetch('https://api.freepik.com/v1/ai/text-to-image', {
                    method: 'POST',
                    headers: {
                        'x-freepik-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        aspect_ratio: aspectRatio,
                        num_images: 1,
                        guidance_scale: 2.5,
                        num_inference_steps: 20
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Freepik API Error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                if (data.data && data.data.length > 0 && data.data[0].base64) {
                    return `data:image/png;base64,${data.data[0].base64}`;
                } else {
                    throw new Error('No image data returned from Freepik');
                }

            } catch (error) {
                console.error('[AIManager] Freepik generation failed, falling back to Pollinations:', error.message);
                return this.getPollinationsUrl(prompt, options, 'flux-realism');
            }
        }

        throw new Error(`Unsupported image provider: ${provider}`);
    }



    async testConnection(provider, apiKey) {
        console.log(`[AIManager] Testing connection for ${provider}...`);

        try {
            let result = { success: false, message: '' };

            if (provider === 'gemini') {
                const ai = new GoogleGenerativeAI(apiKey);
                const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                await model.generateContent("Hello");
                result = { success: true, message: "Conexão com Gemini bem-sucedida!" };
            }

            else if (provider === 'freepik') {
                const response = await fetch('https://api.freepik.com/v1/ai/text-to-image', {
                    method: 'POST',
                    headers: {
                        'x-freepik-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: "test",
                        num_images: 1
                    })
                });

                if (response.ok) result = { success: true, message: "Conexão com Freepik bem-sucedida!" };
                else {
                    const err = await response.text();
                    throw new Error(err);
                }
            }

            else if (provider === 'openrouter') {
                const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    result = { success: true, message: `Conexão com OpenRouter bem-sucedida! (Limite: ${data.data?.limit || 'N/A'})` };
                } else {
                    const err = await response.text();
                    throw new Error(`Erro OpenRouter: ${response.status} - ${err}`);
                }
            } else {
                throw new Error("Provedor desconhecido para teste.");
            }

            // Save status
            this.saveStatus(provider, { valid: true, message: result.message });
            return result;

        } catch (error) {
            console.error(`[AIManager] Test failed for ${provider}:`, error);
            this.saveStatus(provider, { valid: false, message: error.message });
            return { success: false, message: error.message };
        }
    }
}

export const aiManager = new AIManager();
