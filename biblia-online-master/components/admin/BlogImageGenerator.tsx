import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Wand2, Palette, Square, Smartphone, RectangleHorizontal, Check } from 'lucide-react';
import { generateImage, generatePollinationsImage } from '../../services/geminiService';

interface BlogImageGeneratorProps {
    initialPrompt?: string;
    onClose: () => void;
    onInsert: (imageUrl: string, altText: string) => void;
}

const STYLES = [
    { id: 'photorealistic', label: 'Fotorealista', prompt: 'photorealistic, 8k, highly detailed, cinematic lighting' },
    { id: 'cinematic', label: 'Cinematográfico', prompt: 'cinematic shot, dramatic lighting, movie scene, 8k, depth of field' },
    { id: 'oil', label: 'Pintura a Óleo', prompt: 'oil painting, textured, classical art style, detailed brushstrokes' },
    { id: 'digital', label: 'Arte Digital', prompt: 'digital art, modern, vibrant colors, sharp focus, concept art' },
    { id: 'minimal', label: 'Minimalista', prompt: 'minimalist, clean lines, simple composition, soft colors, flat design' },
    { id: 'sketch', label: 'Esboço', prompt: 'pencil sketch, charcoal, artistic, rough lines, monochrome' },
    { id: 'anime', label: 'Anime', prompt: 'anime style, studio ghibli, vibrant, cel shaded' },
    { id: '3d', label: '3D Render', prompt: '3d render, unreal engine 5, ray tracing, plastic texture, cute' }
];

const ASPECT_RATIOS = [
    { id: 'landscape', label: 'Paisagem (16:9)', width: 1024, height: 576, icon: RectangleHorizontal },
    { id: 'portrait', label: 'Retrato (9:16)', width: 576, height: 1024, icon: Smartphone },
    { id: 'square', label: 'Quadrado (1:1)', width: 1024, height: 1024, icon: Square }
];

const BlogImageGenerator: React.FC<BlogImageGeneratorProps> = ({ initialPrompt = '', onClose, onInsert }) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
    const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        setGeneratedImage(null);

        try {
            // Combine prompt with style
            const fullPrompt = `${prompt}, ${selectedStyle.prompt}`;

            // Use centralized generation service (respects backend config)
            const imageUrl = await generateImage(fullPrompt, {
                width: selectedRatio.width,
                height: selectedRatio.height
            });

            if (imageUrl) {
                // Pre-load image to ensure it's ready
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                    setGeneratedImage(imageUrl);
                    setGenerating(false);
                };
                img.onerror = () => {
                    setGeneratedImage(imageUrl); // Just show it, maybe browser handles retry
                    setGenerating(false);
                };
            } else {
                throw new Error("Failed to generate image");
            }

        } catch (e) {
            console.error(e);
            setGenerating(false);
        }
    };

    const handleInsert = () => {
        if (generatedImage) {
            onInsert(generatedImage, prompt);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px]">

                {/* Left: Controls */}
                <div className="w-full md:w-1/3 p-6 border-r border-stone-200 dark:border-stone-800 overflow-y-auto flex flex-col gap-6 bg-stone-50 dark:bg-stone-950">
                    <div className="flex justify-between items-center md:hidden">
                        <h3 className="font-bold text-lg">Gerar Imagem</h3>
                        <button onClick={onClose}><X /></button>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500 tracking-wider flex items-center gap-2">
                            <Wand2 size={14} /> Descrição da Imagem
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Descreva a imagem que você quer criar..."
                            className="w-full h-32 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm resize-none focus:ring-2 focus:ring-bible-gold outline-none"
                        />
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500 tracking-wider flex items-center gap-2">
                            <Palette size={14} /> Estilo
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                                        ${selectedStyle.id === style.id
                                            ? 'bg-bible-gold text-white border-bible-gold shadow-md'
                                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-bible-gold/50'}
                                    `}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500 tracking-wider flex items-center gap-2">
                            <ImageIcon size={14} /> Formato
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {ASPECT_RATIOS.map(ratio => {
                                const Icon = ratio.icon;
                                return (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setSelectedRatio(ratio)}
                                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all
                                            ${selectedRatio.id === ratio.id
                                                ? 'bg-bible-gold text-white border-bible-gold shadow-md'
                                                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-bible-gold/50'}
                                        `}
                                    >
                                        <Icon size={16} />
                                        <span className="text-[10px] font-bold">{ratio.label.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating || !prompt.trim()}
                        className="mt-auto w-full py-3 bg-bible-gold text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Gerar Imagem
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Preview */}
                <div className="flex-1 bg-stone-100 dark:bg-stone-900/50 flex items-center justify-center p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-stone-500 hover:text-stone-800 transition-colors hidden md:block"
                    >
                        <X size={24} />
                    </button>

                    {generatedImage ? (
                        <div className="relative group max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden">
                            <img
                                src={generatedImage}
                                alt="Generated"
                                className="max-w-full max-h-[500px] object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                    onClick={handleGenerate}
                                    className="px-4 py-2 bg-white text-stone-900 rounded-lg font-bold hover:bg-stone-100 transition-colors flex items-center gap-2"
                                >
                                    <Sparkles size={16} /> Regenerar
                                </button>
                                <button
                                    onClick={handleInsert}
                                    className="px-4 py-2 bg-bible-gold text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors flex items-center gap-2 shadow-lg"
                                >
                                    <Check size={16} /> Inserir no Post
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-stone-400">
                            <div className="w-24 h-24 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon size={48} className="opacity-50" />
                            </div>
                            <p className="font-medium">Sua imagem aparecerá aqui</p>
                            <p className="text-sm opacity-70 mt-2 max-w-xs mx-auto">
                                Configure o prompt e o estilo ao lado para começar a criar.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogImageGenerator;
