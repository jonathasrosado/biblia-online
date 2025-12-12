import React, { useState, useEffect } from 'react';
import { ChevronDown, List, FileText, MessageCircle, X, Sparkles, Send, ImageIcon, Share2, MousePointer2, ArrowUp } from 'lucide-react';

export const ReaderDemo: React.FC = () => {
    // State
    const [isSelected, setIsSelected] = useState(false);
    const [activeAction, setActiveAction] = useState<'explain' | 'ask' | 'share' | 'summary' | null>(null);

    // Animation State
    const [cursorPos, setCursorPos] = useState({ x: '50%', y: '120%' }); // Start off-screen
    const [isClicking, setIsClicking] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);
    const [stepText, setStepText] = useState<string | null>(null); // For contextual tooltips

    // Animation Loop
    useEffect(() => {
        let mounted = true;

        const sequence = async () => {
            if (!mounted) return;

            const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            const moveCursor = async (x: string, y: string, text?: string) => {
                if (text) setStepText(text);
                setCursorPos({ x, y });
                return wait(800);
            };

            const click = async () => {
                setIsClicking(true);
                await wait(150);
                setIsClicking(false);
                await wait(150);
                setStepText(null); // Clear text after action
            };

            while (mounted) {
                // RESET STATE
                setIsSelected(false);
                setActiveAction(null);
                setCursorVisible(true);
                setStepText(null);
                await wait(1000);

                // STEP 1: Select Verse
                // Target: First verse, approx center of its text area
                // Verse 1 is at top of content area.
                await moveCursor('50%', '30%', "Selecione um versículo");
                await click();
                setIsSelected(true);
                await wait(600);

                // STEP 2: Open "Explain"
                // Target: First button in inline menu.
                // Inline menu appears below verse 1.
                // Left-aligned button 1 center.
                await moveCursor('20%', '42%', "Toque em Explicar");
                await click();
                setActiveAction('explain');
                await wait(3000); // Read overlay

                // STEP 3: Close "Explain"
                // Target: Top handle or close button.
                // "X" button position is top right of overlay.
                await moveCursor('90%', '10%', "Feche para continuar");
                await click();
                setActiveAction(null);
                await wait(800);

                // STEP 4: Switch to "Summary"
                // Target: "Resumo" tab in the control bar at top.
                // Second button in the pill.
                await moveCursor('70%', '15%', "Veja o resumo do capítulo");
                await click();
                setActiveAction('summary');
                await wait(3500); // Read summary

                // STEP 5: Switch back to "Verses" (implicit restart or explicit click)
                // Target: "Versículos" tab.
                await moveCursor('30%', '15%', "Volte para o texto");
                await click();
                setActiveAction(null);

                await wait(1500); // End of loop
            }
        };

        sequence();

        return () => { mounted = false; };
    }, []);

    return (
        <div className="w-full max-w-[340px] mx-auto bg-white rounded-[3rem] shadow-2xl border-8 border-stone-800 overflow-hidden relative font-sans text-left ring-1 ring-black/5 select-none pointer-events-none">

            {/* CURSOR & TOOLTIP LAYER */}
            <div
                className="absolute z-50 transition-all duration-700 ease-in-out pointer-events-none"
                style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    transform: `translate(-20%, -20%)`, // Offset so pointer tip hits target
                    opacity: cursorVisible ? 1 : 0
                }}
            >
                {/* Contextual Tooltip Bubble */}
                {stepText && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg animate-fadeIn flex flex-col items-center">
                        {stepText}
                        <div className="w-2 h-2 bg-stone-900 rotate-45 -mt-1 translate-y-1/2"></div>
                    </div>
                )}

                <div className={`relative transition-transform duration-150 ${isClicking ? 'scale-[0.8]' : 'scale-100'}`}>
                    <div className="absolute inset-0 bg-white/40 rounded-full blur-sm animate-pulse"></div>
                    {/* Smaller, more discreet cursor */}
                    <MousePointer2
                        size={22}
                        className="text-stone-900 fill-white relative z-10 drop-shadow-md"
                        strokeWidth={1.5}
                    />
                </div>
            </div>

            {/* 1. Status Bar / Notch Area */}
            <div className="bg-stone-50 h-7 w-full border-b border-stone-100 flex items-center justify-center">
                <div className="w-16 h-3 bg-stone-200 rounded-full"></div>
            </div>

            {/* 2. Header */}
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <button className="p-2 rounded-full text-stone-400">
                    <div className="w-5 h-5 flex flex-col justify-center gap-1">
                        <div className="w-full h-0.5 bg-current rounded-full"></div>
                        <div className="w-2/3 h-0.5 bg-current rounded-full"></div>
                    </div>
                </button>

                <div className="flex flex-col items-center">
                    <span className="font-serif font-bold text-lg leading-none text-stone-900 flex items-center gap-1">
                        Gênesis 1 <ChevronDown size={14} className="text-stone-400" />
                    </span>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium mt-0.5">A Criação</span>
                </div>

                <button className="text-sm font-serif font-bold text-stone-400 w-8 h-8 flex items-center justify-center">
                    AA
                </button>
            </div>

            {/* 3. Content Area */}
            <div className="h-[480px] overflow-hidden bg-white relative">

                {/* Controls Bar */}
                <div className="px-4 py-4">
                    <div className="bg-stone-100 p-1 rounded-xl flex gap-1 shadow-inner items-center">
                        <button
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all
                                ${activeAction !== 'summary' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}
                            `}
                        >
                            <List size={12} className={activeAction !== 'summary' ? "opacity-100" : "opacity-50"} /> Versículos
                        </button>
                        <button
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all
                                ${activeAction === 'summary' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}
                            `}
                        >
                            <FileText size={12} className={activeAction === 'summary' ? "opacity-100" : "opacity-50"} /> Resumo
                        </button>
                    </div>
                </div>

                {/* VIEW: SUMMARY */}
                {activeAction === 'summary' ? (
                    <div className="px-6 pb-20 animate-fadeIn">
                        <div className="prose prose-stone prose-sm">
                            <h3 className="font-serif font-bold text-stone-900 text-lg mb-3">A Criação do Mundo</h3>
                            <p className="text-stone-600 leading-relaxed mb-4">
                                Este capítulo narra a criação do universo por Deus em seis dias. Tudo começa com a criação dos céus e da terra, seguido pela organização do caos inicial.
                            </p>
                            <ul className="space-y-2 text-stone-600 list-disc pl-4 marker:text-stone-300 mb-4">
                                <li><strong>Dia 1:</strong> Luz e trevas.</li>
                                <li><strong>Dia 2:</strong> Céus e águas.</li>
                                <li><strong>Dia 3:</strong> Terra seca e plantas.</li>
                            </ul>
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-xs font-medium flex gap-2">
                                <Sparkles size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                                <span>Resumo gerado por IA para facilitar o entendimento do contexto geral.</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* VIEW: VERSES (Default) */
                    <div className="px-4 pb-20 space-y-2 animate-fadeIn">

                        {/* VERSE 1 (Interactive) */}
                        <div>
                            <div
                                className={`flex items-baseline gap-1 p-2 rounded-lg transition-all duration-200
                                    ${isSelected
                                        ? 'bg-stone-100 ring-1 ring-stone-200'
                                        : ''}
                                `}
                            >
                                <span className="text-[0.65em] font-bold select-none w-[1.4em] text-left shrink-0 leading-none text-stone-400">1</span>
                                <span className={`text-lg leading-loose text-stone-800 font-serif`}>
                                    No princípio, Deus criou os céus e a terra.
                                </span>
                            </div>

                            {/* INLINE MENU */}
                            {isSelected && (!activeAction || activeAction !== 'summary') && (
                                <div className="animate-slideDown mt-2 mb-4 mx-2">
                                    <div className="bg-stone-50/80 backdrop-blur-md rounded-2xl p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm border border-stone-200">

                                        {/* Action: Explain */}
                                        <button className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all
                                            ${activeAction === 'explain' ? 'bg-stone-200 scale-95' : 'bg-stone-100'} text-stone-700`}>
                                            <span className="w-4 h-4 flex items-center justify-center rounded-full border border-bible-gold text-bible-gold text-[10px] font-serif font-bold">!</span>
                                            <span className="text-xs font-medium">Explicar</span>
                                        </button>

                                        {/* Action: Ask */}
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all bg-stone-100 text-stone-700">
                                            <MessageCircle size={16} className="text-bible-gold" />
                                            <span className="text-xs font-medium">Perguntar</span>
                                        </button>

                                        {/* Action: Share */}
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all bg-stone-100 text-stone-700">
                                            <ImageIcon size={16} className="text-bible-gold" />
                                            <span className="text-xs font-medium">Compartilhar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* VERSE 2 (Static) */}
                        <div className="flex items-baseline gap-1 p-2 rounded-lg opacity-60">
                            <span className="text-[0.65em] font-bold select-none w-[1.4em] text-left shrink-0 leading-none text-stone-300">2</span>
                            <span className="text-lg leading-loose text-stone-800 font-serif">
                                A terra era sem forma e vazia; e havia trevas sobre a face do abismo...
                            </span>
                        </div>

                        {/* VERSE 3 (Static) */}
                        <div className="flex items-baseline gap-1 p-2 rounded-lg opacity-40">
                            <span className="text-[0.65em] font-bold select-none w-[1.4em] text-left shrink-0 leading-none text-stone-300">3</span>
                            <span className="text-lg leading-loose text-stone-800 font-serif">
                                E disse Deus: Haja luz; e houve luz.
                            </span>
                        </div>

                    </div>
                )}
            </div>

            {/* --- SIMULATED MODALS (Overlays) --- */}

            {/* 1. EXPLAIN OVERLAY */}
            <div className={`absolute inset-0 bg-stone-50/95 backdrop-blur-md z-30 transition-all duration-300 flex flex-col
                ${activeAction === 'explain' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}
            `}>
                {/* Handle */}
                <div className="w-full flex justify-center py-3">
                    <div className="w-12 h-1 bg-stone-300 rounded-full"></div>
                </div>

                <div className="flex-1 px-6 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-stone-100 rounded-full">
                            <Sparkles size={18} className="text-stone-600" />
                        </div>
                        <h3 className="font-bold text-stone-800">Explicação IA</h3>
                        <div className="ml-auto p-2 rounded-full">
                            <X size={18} className="text-stone-400" />
                        </div>
                    </div>

                    <div className="space-y-4 text-stone-600 leading-relaxed font-serif text-[15px]">
                        <p><strong className="text-stone-900">Contexto:</strong> Gênesis 1:1 estabelece a soberania de Deus antes de toda matéria e tempo.</p>
                        <p><strong className="text-stone-900">Significado:</strong> O termo hebraico <em>"Bereshit"</em> aponta para um começo absoluto. Deus não organiza matéria pré-existente, Ele cria <em>ex nihilo</em> (do nada).</p>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs font-sans">
                            💡 <strong>Curiosidade:</strong> A palavra "Elohim" (Deus) está no plural, sugerindo a grandiosidade divina já no primeiro verso.
                        </div>
                    </div>
                </div>
            </div>

            {/* Ask Overlay and Share Overlay would be here but simplified for demo */}

        </div>
    );
};
