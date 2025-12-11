import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, X, Image as ImageIcon, Palette, Type, BookOpen, Heart, Sun, Star, Flame, Anchor, Crown, Church, Sparkles, Square, Smartphone, RectangleHorizontal } from 'lucide-react';

interface VerseImageGeneratorProps {
    verseText: string;
    verseReference: string;
    onClose?: () => void;
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
    { id: 'story', label: 'Story (9:16)', aspect: 'aspect-[9/16]', icon: Smartphone }
];

const VerseImageGenerator: React.FC<VerseImageGeneratorProps> = ({ verseText, verseReference, onClose }) => {
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [selectedFormat, setSelectedFormat] = useState(FORMATS[0]);
    const [loading, setLoading] = useState(false);
    const [fontSize, setFontSize] = useState(24); // Base font size
    const [textPos, setTextPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const [scale, setScale] = useState(1);
    const cardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStartRef.current = {
            x: e.clientX - textPos.x,
            y: e.clientY - textPos.y
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        // Calculate new position relative to initial drag
        // Divide by scale to maintain 1:1 movement feeling
        let newX = (e.clientX - dragStartRef.current.x);
        let newY = (e.clientY - dragStartRef.current.y);

        // Simple constraints (approximate, to keep center vaguely in view)
        // You can refine these bounds based on card size if needed
        const limitX = 140;
        const limitY = 200;

        newX = Math.max(-limitX, Math.min(newX, limitX));
        newY = Math.max(-limitY, Math.min(newY, limitY));

        setTextPos({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };


    // Auto-scale the card to fit the container
    React.useEffect(() => {
        const calculateScale = () => {
            if (!cardRef.current || !containerRef.current) return;

            const container = containerRef.current;
            const card = cardRef.current;

            const padding = 40;
            const availableWidth = container.clientWidth - padding;
            const availableHeight = container.clientHeight - padding;

            const cardWidth = card.scrollWidth;
            const cardHeight = card.scrollHeight;

            const scaleX = availableWidth / cardWidth;
            const scaleY = availableHeight / cardHeight;

            const newScale = Math.min(Math.min(scaleX, scaleY), 1);
            setScale(newScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        setTimeout(calculateScale, 100);

        return () => window.removeEventListener('resize', calculateScale);
    }, [selectedFormat, verseText]);



    // Helper to convert data URI to Blob without using fetch (avoids "Failed to fetch" errors)
    const dataURItoBlob = (dataURI: string) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setLoading(true);

        try {
            // STRATEGY: Create a clean clone in the DOM to avoid scaling/transform issues
            // FIX: Enforce fixed dimensions to prevent mobile layout shifts (overlapping)
            const node = cardRef.current;
            const clone = node.cloneNode(true) as HTMLElement;

            // Determine fixed export dimensions (Standardized width: 600px)
            // This ensures the layout is always calculated at this size, avoiding mobile cramping
            const EXPORT_WIDTH = 600;
            let exportHeight = 600; // Default square

            // Calculate height based on current aspect ratio class
            if (currentAspect.includes('aspect-[9/16]')) {
                exportHeight = Math.round(EXPORT_WIDTH * (16 / 9)); // Story
            } else if (currentAspect.includes('aspect-[4/5]')) {
                exportHeight = Math.round(EXPORT_WIDTH * (5 / 4)); // Portrait
            }

            // 2. Style the clone to be fixed size
            clone.style.position = 'absolute';
            clone.style.top = '0';
            clone.style.left = '0';
            clone.style.width = `${EXPORT_WIDTH}px`;   // FORCE WIDTH
            clone.style.height = `${exportHeight}px`; // FORCE HEIGHT
            clone.style.maxWidth = 'none';            // Override tailwind constraints
            clone.style.maxHeight = 'none';           // Override tailwind constraints
            clone.style.transform = 'none';
            clone.style.zIndex = '-50';
            clone.style.pointerEvents = 'none';
            clone.style.visibility = 'visible';

            // Attach to body but keep hidden from view
            document.body.appendChild(clone);

            // 3. Wait for fonts to be strictly ready
            await document.fonts.ready;
            // Small buffer to ensure layout settlement
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                // 4. Capture the CLONE with explicit dimensions
                const dataUrl = await toPng(clone, {
                    cacheBust: true,
                    pixelRatio: 2, // High quality export
                    width: EXPORT_WIDTH,
                    height: exportHeight,
                    skipAutoScale: true
                });

                // 5. Cleanup Clone
                if (clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                }

                // 6. Convert to Blob using HELPER
                const blob = dataURItoBlob(dataUrl);
                const file = new File([blob], 'versiculo.png', { type: 'image/png' });

                // 7. Share or Download
                let shared = false;
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Versículo do Dia',
                            text: `${verseText} - ${verseReference}`
                        });
                        shared = true;
                    } catch (shareError: any) {
                        if (shareError.name !== 'AbortError') {
                            console.warn("Share failed:", shareError);
                        } else {
                            shared = true; // Treated as handled
                        }
                    }
                }

                if (!shared) {
                    const link = document.createElement('a');
                    link.download = `versiculo-${verseReference.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }

            } catch (captureError: any) {
                if (clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                }
                throw captureError;
            }

        } catch (err: any) {
            console.error('Error generating image:', err);
            alert(`Erro ao criar imagem: ${err.message || err.toString()}. Tente novamente.`);
        } finally {
            setLoading(false);
        }
    };

    const IconComponent = selectedIcon.icon;

    // Dynamic Aspect Ratio Logic
    const isLongText = verseText.length > 130;
    const currentAspect = (selectedFormat.id === 'square' && isLongText)
        ? 'aspect-[4/5]'
        : selectedFormat.aspect;

    // Embedded Mode Logic
    const wrapperClasses = "fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn";

    const containerClasses = "bg-white dark:bg-stone-900 w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row";

    return (
        <div className={wrapperClasses}>
            <div className={containerClasses}>

                {/* Preview Area - Fixed height on mobile to ensure visibility */}
                <div
                    ref={containerRef}
                    className="flex items-center justify-center relative select-none bg-stone-100 dark:bg-stone-950 overflow-hidden p-4 md:p-8 h-[45%] md:h-auto md:flex-1"
                >
                    {/* Scalable Container */}
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    >
                        <div
                            ref={cardRef}
                            className={`${currentAspect} w-[320px] md:w-[400px] rounded-xl p-8 md:p-10 flex flex-col justify-center items-center text-center relative overflow-hidden transition-colors duration-500 ${selectedTheme.bg} shadow-2xl`}
                        >
                            {/* Decorative Elements (FIXED) */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 pointer-events-none"></div>

                            {/* Draggable Text Area */}
                            <div
                                className="z-10 cursor-move active:cursor-grabbing touch-none flex flex-col items-center justify-center w-full"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                                style={{
                                    transform: `translate(${textPos.x}px, ${textPos.y}px)`,
                                    touchAction: 'none'
                                }}
                            >
                                <div className={`mb-4 md:mb-6 opacity-80 ${selectedTheme.accent} pointer-events-none`}>
                                    <IconComponent size={32} strokeWidth={1.5} />
                                </div>

                                <p
                                    className={`leading-relaxed font-medium transition-all duration-300 ${selectedTheme.text} ${selectedTheme.font}`}
                                    style={{
                                        fontSize: `${fontSize}px`,
                                        pointerEvents: 'none' // Ensure clicks pass associated logic if any (mostly for selection prev)
                                    }}
                                >
                                    "{verseText}"
                                </p>

                                <div className={`w-16 h-px bg-current opacity-30 my-4 md:my-6 shrink-0 ${selectedTheme.text} pointer-events-none`}></div>

                                <p className={`text-sm font-bold tracking-widest uppercase ${selectedTheme.accent} pointer-events-none`}>
                                    {verseReference}
                                </p>
                            </div>

                            {/* Fixed Footer (NOT Draggable) */}
                            <p className={`absolute bottom-6 text-[10px] font-bold opacity-50 tracking-[0.2em] uppercase ${selectedTheme.text} z-20 pointer-events-none`}>
                                BibliaOnline.me
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls Area - Scrollable / Sidebar */}
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

                        {/* Font Size Control */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider">
                                <Type size={14} /> Tamanho do Texto
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-stone-400">A-</span>
                                <input
                                    type="range"
                                    min="12"
                                    max="48"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="flex-1 h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                                />
                                <span className="text-xs text-stone-400">A+</span>
                            </div>
                        </div>


                        {/* Format Selection - Hide if Embedded to simplify? User only asked for colors. I'll keep it for now as it's useful. */}
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
                            className="w-full py-3 rounded-xl bg-bible-gold text-white font-bold text-base shadow-lg hover:bg-yellow-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
