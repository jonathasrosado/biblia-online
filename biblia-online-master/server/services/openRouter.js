// Native fetch is available in Node.js 18+

export class OpenRouterService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://openrouter.ai/api/v1';
    }

    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            const data = await response.json();
            const allModels = data.data || [];

            // Curated list of high-quality models
            const curatedIds = [
                // Text Models
                'openai/gpt-4o',
                'openai/gpt-4o-mini',
                'google/gemini-pro-1.5',
                'google/gemini-flash-1.5',
                'google/gemini-pro-1.5-exp', // Often free/low cost
                'anthropic/claude-3.5-sonnet',
                'anthropic/claude-3-opus',
                'anthropic/claude-3-haiku',
                'x-ai/grok-2',
                'deepseek/deepseek-chat',
                'deepseek/deepseek-coder',
                'meta-llama/llama-3.1-405b-instruct',
                'meta-llama/llama-3.1-70b-instruct',
                'meta-llama/llama-3.1-8b-instruct:free', // Free model
                'mistralai/mistral-large',
                'microsoft/wizardlm-2-8x22b',
                'nousresearch/hermes-3-llama-3.1-405b',

                // Image Models (for OpenRouter)
                'black-forest-labs/flux-1-schnell',
                'black-forest-labs/flux-1-dev',
                'stabilityai/stable-diffusion-xl-base-1.0',
                'stabilityai/stable-diffusion-3-medium'
            ];

            // Helper to determine if a model is free
            const isModelFree = (model) => {
                const pricing = model.pricing;
                return pricing && pricing.prompt === "0" && pricing.completion === "0";
            };

            // Map all models to our format
            const mappedModels = allModels.map(m => ({
                id: m.id,
                name: m.name,
                type: (m.id.includes('flux') || m.id.includes('diffusion') || m.id.includes('stabilityai')) ? 'image' : 'text',
                isFree: isModelFree(m) || m.id.endsWith(':free')
            }));

            // Filter by curated list to avoid overwhelming the UI, but ensure we keep the "free" ones if they are good
            const textModels = mappedModels
                .filter(m => curatedIds.includes(m.id) && m.type === 'text')
                .sort((a, b) => curatedIds.indexOf(a.id) - curatedIds.indexOf(b.id));

            const imageModels = [
                { id: 'black-forest-labs/flux-1-schnell', name: 'Flux 1 Schnell', type: 'image', isFree: false },
                { id: 'black-forest-labs/flux-1-dev', name: 'Flux 1 Dev', type: 'image', isFree: false },
                { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL', type: 'image', isFree: false },
                { id: 'stabilityai/stable-diffusion-3-medium', name: 'Stable Diffusion 3', type: 'image', isFree: false }
            ];

            return [...textModels, ...imageModels];

        } catch (error) {
            console.error('OpenRouter getModels error:', error);
            return [];
        }
    }

    async generateContent(model, prompt, systemInstruction = '', responseFormat = null) {
        try {
            const messages = [];
            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }
            messages.push({ role: 'user', content: prompt });

            const body = {
                model: model,
                messages: messages,
                temperature: 0.7
            };

            if (responseFormat === 'json_object' && model.startsWith('openai/')) {
                body.response_format = { type: 'json_object' };
            }

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                    'X-Title': 'Biblia App'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenRouter generateContent error:', error);
            throw error;
        }
    }

    async generateImage(model, prompt) {
        try {
            // OpenRouter uses the OpenAI-compatible /images/generations endpoint for some models,
            // but many are accessed via chat completions with a specific prompt.
            // However, for standard image models (Flux, SD), OpenRouter often supports the standard image endpoint.
            // Let's try the standard OpenAI image endpoint format first.

            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Biblia App'
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024"
                })
            });

            if (!response.ok) {
                // Fallback: Some models on OpenRouter might be chat-based. 
                // But for now, let's assume standard image endpoint or throw.
                const errorText = await response.text();
                throw new Error(`OpenRouter Image Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.data[0].url; // OpenAI format returns url in data array
        } catch (error) {
            console.error('OpenRouter generateImage error:', error);
            throw error;
        }
    }
}
