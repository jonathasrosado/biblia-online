import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, X, Image as ImageIcon, Palette, Type, BookOpen, Heart, Sun, Star, Flame, Anchor, Crown, Church, Sparkles, Square, Smartphone, RectangleHorizontal } from 'lucide-react';

interface VerseImageGeneratorProps {
    verseText: string;
    verseReference: string;
    onClose: () => void;
}

const THEMES = [
    {
        id: 'dawn',
        name: 'Amanhecer',
        bg: 'bg-gradient-to-br from-orange-100 via-orange-200 to-yellow-200',
        text: 'text-orange-900',
        accent: 'text-orange-700',
        font: 'font-serif'
    },
    {
        id: 'midnight',
        name: 'Meia-noite',
        bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
        text: 'text-white',
        accent: 'text-purple-300',
        font: 'font-serif'
    },
    {
        id: 'nature',
        name: 'Natureza',
        bg: 'bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-200',
        text: 'text-emerald-900',
        accent: 'text-emerald-700',
        font: 'font-sans'
    },
    {
        id: 'minimal',
        name: 'Minimalista',
        bg: 'bg-white',
        text: 'text-stone-800',
        accent: 'text-stone-500',
        font: 'font-serif'
    },
    {
        id: 'royal',
        name: 'Realeza',
        bg: 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900',
        text: 'text-bible-gold',
        accent: 'text-white/80',
        font: 'font-serif'
    }
];

const ICONS = [
    { id: 'book', icon: BookOpen, label: 'Bíblia' },
    { id: 'heart', icon: Heart, label: 'Amor' },
    { id: 'sun', icon: Sun, label: 'Luz' },
    { id: 'star', icon: Star, label: 'Guia' },
    { id: 'flame', icon: Flame, label: 'Espírito' },
    { id: 'anchor', icon: Anchor, label: 'Esperança' },
    { id: 'crown', icon: Crown, label: 'Reino' },
    { id: 'church', icon: Church, label: 'Igreja' },
    { id: 'sparkles', icon: Sparkles, label: 'Milagre' }
];

const FORMATS = [
    { id: 'square', label: 'Post (1:1)', aspect: 'aspect-square', icon: Square },
    { id: 'story', label: 'Story (9:16)', aspect: 'aspect-[9/16]', icon: Smartphone },
    { id: 'landscape', label: 'Paisagem (16:9)', aspect: 'aspect-video', icon: RectangleHorizontal }
];

const VerseImageGenerator: React.FC<VerseImageGeneratorProps> = ({ verseText, verseReference, onClose }) => {
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [selectedFormat, setSelectedFormat] = useState(FORMATS[0]);
    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(1);
    const cardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scale the card to fit the container
    React.useEffect(() => {
        const calculateScale = () => {
            if (!cardRef.current || !containerRef.current) return;

            const container = containerRef.current;
            const card = cardRef.current;

            // Add some padding/margin
            const padding = 40;
            const availableWidth = container.clientWidth - padding;
            const availableHeight = container.clientHeight - padding;

            const cardWidth = card.scrollWidth;
            const cardHeight = card.scrollHeight;

            const scaleX = availableWidth / cardWidth;
            const scaleY = availableHeight / cardHeight;

            // Use the smaller scale to ensure it fits both dimensions, max 1
            const newScale = Math.min(Math.min(scaleX, scaleY), 1);
            setScale(newScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        // Recalculate when format changes
        setTimeout(calculateScale, 100);

        return () => window.removeEventListener('resize', calculateScale);
    }, [selectedFormat, verseText]);

    const handleShare = async () => {
        if (!cardRef.current) return;
        setLoading(true);

        try {
            // Reset scale for capture to ensure high quality
            const currentScale = scale;
            // We need to capture it at scale 1, but it might be visually scaled down.
            // html-to-image captures the DOM element. If we use transform: scale, it captures it scaled.
            // Strategy: Clone it or temporarily reset scale? 
            // Actually, toPng has a style option. We can force scale 1.
            // But if we use CSS transform, we might need to handle it.
            // Let's try capturing as is, but with high pixelRatio.
            // If the element is visually small, the output might be small? 
            // No, pixelRatio handles resolution. But if transform is applied, it might be an issue.
            // Better approach: Wrap the card in a scaler div, but capture the card itself.
            // If we capture 'cardRef.current', and it has transform: scale(0.5), the image will be small.

            // Workaround: Temporarily remove scale
            const originalTransform = cardRef.current.style.transform;
            cardRef.current.style.transform = 'scale(1)';

            // Wait a tick for layout (though usually not needed for style changes if synchronous)
            // But we need to make sure it doesn't jump visually too much or use a hidden clone.
            // For now, let's just try capturing. If it fails, we'll use a hidden clone.

            // Actually, let's use a wrapper for the scale, and capture the inner card?
            // If the wrapper scales, the inner card is still full size in layout flow? No.
            // CSS transform scale affects the visual size.

            // Let's use the style property of toPng to override transform
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                style: { transform: 'scale(1)', transformOrigin: 'top left' } // Force scale 1 during capture
            });

            // Restore scale (react render will likely do this, but just in case)
            cardRef.current.style.transform = originalTransform;

            // Convert dataUrl to Blob for sharing
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'versiculo.png', { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: 'Versículo do Dia',
                    text: `${verseText} - ${verseReference}`
                });
            } else {
                // Fallback to download
                const link = document.createElement('a');
                link.download = `versiculo-${verseReference.replace(/\s/g, '-')}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Error generating image:', err);
            alert('Erro ao gerar imagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const IconComponent = selectedIcon.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Preview Area - Fixed height on mobile to ensure visibility */}
                <div
                    ref={containerRef}
                    className="h-[45%] md:h-auto md:flex-1 bg-stone-100 dark:bg-stone-950 p-4 md:p-8 flex items-center justify-center relative overflow-hidden"
                >
                    {/* Scalable Container */}
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transition: 'transform 0.3s ease-out'
                        }}
                    >
                        <div
                            ref={cardRef}
                            className={`${selectedFormat.aspect} w-[320px] md:w-[400px] shadow-2xl rounded-xl p-8 md:p-10 flex flex-col justify-center items-center text-center relative overflow-hidden transition-colors duration-500 ${selectedTheme.bg}`}
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>

                            <div className={`mb-6 md:mb-8 opacity-80 ${selectedTheme.accent}`}>
                                <IconComponent size={36} strokeWidth={1.5} />
                            </div>

                            <p className={`text-xl md:text-2xl leading-relaxed mb-8 md:mb-10 font-medium ${selectedTheme.text} ${selectedTheme.font}`}>
                                "{verseText}"
                            </p>

                            <div className={`w-16 h-px bg-current opacity-30 mb-6 md:mb-8 ${selectedTheme.text}`}></div>

                            <p className={`text-sm font-bold tracking-widest uppercase ${selectedTheme.accent}`}>
                                {verseReference}
                            </p>

                            <p className={`absolute bottom-6 text-[11px] font-bold opacity-50 tracking-[0.2em] uppercase ${selectedTheme.text}`}>
                                BibliaOnline.me
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls Area - Scrollable */}
                <div className="flex-1 md:flex-none md:w-80 bg-white dark:bg-stone-900 flex flex-col border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-900 sticky top-0 z-10">
                        <h3 className="font-serif font-bold text-lg md:text-xl text-bible-accent dark:text-bible-gold">Criar Imagem</h3>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Options */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                        {/* Format Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider">
                                <ImageIcon size={14} /> Formato
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {FORMATS.map(format => {
                                    const FormatIcon = format.icon;
                                    return (
                                        <button
                                            key={format.id}
                                            onClick={() => setSelectedFormat(format)}
                                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all
                                                ${selectedFormat.id === format.id
                                                    ? 'border-bible-gold bg-bible-gold text-white shadow-md'
                                                    : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:border-bible-gold/50 hover:text-bible-gold'}
                                            `}
                                        >
                                            <FormatIcon size={18} />
                                            <span className="text-[10px] font-bold">{format.label.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider">
                                <Palette size={14} /> Temas
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setSelectedTheme(theme)}
                                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-3
                                            ${selectedTheme.id === theme.id
                                                ? 'border-bible-gold ring-1 ring-bible-gold bg-bible-gold/5'
                                                : 'border-stone-200 dark:border-stone-700 hover:border-bible-gold/50'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full shadow-sm ${theme.bg}`}></div>
                                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Icon Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider">
                                <Sparkles size={14} /> Ícone
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {ICONS.map(item => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedIcon(item)}
                                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all aspect-square
                                                ${selectedIcon.id === item.id
                                                    ? 'border-bible-gold bg-bible-gold text-white shadow-md'
                                                    : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:border-bible-gold/50 hover:text-bible-gold'}
                                            `}
                                            title={item.label}
                                        >
                                            <ItemIcon size={18} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 md:p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                        <button
                            onClick={handleShare}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-bible-gold text-white font-bold text-lg shadow-lg hover:bg-yellow-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="animate-pulse">Gerando...</span>
                            ) : (
                                <>
                                    <Share2 size={20} />
                                    Compartilhar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerseImageGenerator;
