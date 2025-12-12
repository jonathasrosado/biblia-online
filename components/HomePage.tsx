import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from './SEO';
import { toPng } from 'html-to-image';
import { BookOpen, MessageCircle, Sun, Search, ArrowRight, Clock, Star, Calendar, Share2, Loader2, RefreshCw, HelpCircle } from 'lucide-react';
import { normalizeBookName, bibleBooks } from '../constants';
import { ReadingHistoryItem } from '../types';
import versesRaw from '../src/data/daily_verses.json';

import { Theme } from '../types';
import { ReaderDemo } from './ReaderDemo';

interface HomePageProps {
    language: string;
    t: any;
    theme: Theme;
    history?: ReadingHistoryItem[];
}

interface SiteSettings {
    siteTitle: string;
    siteDescription: string;
}

// Curated list of verses for the "Daily Verse" feature
// Mapped from external JSON file
const DAILY_VERSES = versesRaw.map(v => ({
    text: v.texto,
    ref: v.referencia
}));

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    image?: string;
    date: string;
}

const HomePage: React.FC<HomePageProps> = ({ language, t, theme, history = [] }) => {
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const verseCardRef = useRef<HTMLDivElement>(null);
    const [localQuery, setLocalQuery] = useState('');
    const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);
    const [isSharing, setIsSharing] = useState(false);
    const [activeTestament, setActiveTestament] = useState<'OT' | 'NT'>('NT'); // Default to New Testament as it's often more popular for quick reading
    const [settings, setSettings] = useState<SiteSettings>({ siteTitle: '', siteDescription: '' });
    const [posts, setPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        // Deterministic daily verse based on day of year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        setDailyVerse(DAILY_VERSES[dayOfYear % DAILY_VERSES.length]);

        // Fetch settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error("Failed to load settings", err));

        // Fetch recent posts
        fetch('/api/blog/posts?status=published')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPosts(data);
                }
            })
            .catch(err => console.error("Failed to load posts", err));
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (localQuery.trim()) {
            navigate(`/busca?q=${encodeURIComponent(localQuery)}`);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return language === 'pt' ? 'Bom dia' : language === 'es' ? 'Buenos días' : 'Good morning';
        if (hour < 18) return language === 'pt' ? 'Boa tarde' : language === 'es' ? 'Buenas tardes' : 'Good afternoon';
        return language === 'pt' ? 'Boa noite' : language === 'es' ? 'Buenas noches' : 'Good evening';
    };

    // Helper to convert data URI to Blob
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
        if (!verseCardRef.current || isSharing) return;
        setIsSharing(true);

        try {
            // 1. Clone the node
            const node = verseCardRef.current;
            const clone = node.cloneNode(true) as HTMLElement;

            // 2. Setup clone styling
            // Create a wrapper to preserve "dark" mode context
            const wrapper = document.createElement('div');
            wrapper.className = isDark ? 'dark' : '';
            wrapper.style.position = 'fixed';
            wrapper.style.top = '-10000px';
            wrapper.style.left = '-10000px';
            wrapper.style.zIndex = '-1000';

            // Set clone dimensions and reset transforms
            clone.style.width = '600px';
            clone.style.height = 'auto';
            clone.style.minHeight = '600px';
            clone.style.transform = 'none';
            // Explicitly force text colors if needed, but wrapper should handle it via Tailwind

            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            // 3. Wait for content to settle
            await new Promise(resolve => setTimeout(resolve, 800));

            // 4. Capture settings
            const options = {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: isDark ? '#1c1917' : '#fafaf9',
                type: 'image/png',
            };

            // 5. WARMUP
            try {
                await toPng(clone, { ...options, pixelRatio: 1 });
            } catch (e) { console.warn("Warmup capture failed", e); }

            // 6. Final Capture
            const dataUrl = await toPng(clone, options);

            // Cleanup
            document.body.removeChild(wrapper);

            // 7. Share
            const blob = dataURItoBlob(dataUrl);
            const file = new File([blob], 'versiculo-do-dia.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Versículo do Dia',
                    text: `${dailyVerse.text} - ${dailyVerse.ref}`
                });
            } else {
                const link = document.createElement('a');
                link.download = 'versiculo-do-dia.png';
                link.href = dataUrl;
                link.click();
            }

        } catch (err) {
            console.error("Error sharing:", err);
            alert("Erro ao gerar imagem. Tente novamente.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleNextVerse = () => {
        // Ensure we pick a different verse
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * DAILY_VERSES.length);
        } while (DAILY_VERSES[randomIndex].text === dailyVerse.text && DAILY_VERSES.length > 1);

        setDailyVerse(DAILY_VERSES[randomIndex]);
    };


    const lastRead = history.length > 0 ? history[0] : null;

    return (
        <div className="min-h-full animate-fadeIn pb-20">
            <SEO
                title={settings.siteTitle || "Bíblia Online – Leia a Bíblia Sagrada Completa em Português"}
                description={settings.siteDescription || "Sua plataforma de estudo bíblico com Inteligência Artificial. Leia a Bíblia, faça devocionais e tire dúvidas com IA."}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Bíblia Online",
                    "url": "https://bibliaonline.me",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "https://bibliaonline.me/busca?q={search_term_string}",
                        "query-input": "required name=search_term_string"
                    }
                }}
            />

            {/* NEW LAYOUT STRUCTURE */}

            {/* 1. HERO BLOCK - Top of Page */}
            <div className={`relative pt-6 pb-12 px-6 md:px-12 text-center overflow-hidden
                ${theme === 'bw' ? 'bg-white text-black' : isDark ? 'bg-stone-950' : 'bg-stone-50'}
            `}>
                {/* Background Ambience */}
                {theme !== 'bw' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-bible-gold/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                )}

                <div className="max-w-4xl mx-auto relative z-10 animate-slideUp">
                    <h2 className={`text-4xl md:text-6xl font-black mb-4 tracking-tight leading-[1.1]
                        ${theme === 'bw' ? 'text-black' : isDark ? 'text-stone-100' : 'text-stone-900'}
                    `}>
                        Não basta ler a Bíblia,<br className="hidden md:block" />
                        é preciso <span className={`font-serif italic ${theme === 'bw' ? 'text-stone-400' : 'text-bible-gold'}`}>entende-la.</span>
                    </h2>

                    {/* Visual Onboarding (Reader Demo) - Inserted Here */}
                    <div className="my-2 md:my-10 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <div className="transform scale-[0.85] md:scale-100 origin-center">
                            <ReaderDemo />
                        </div>
                    </div>

                    <p className={`text-xl md:text-2xl font-serif max-w-2xl mx-auto mb-6 leading-relaxed opacity-90
                        ${theme === 'bw' ? 'text-stone-700' : 'text-stone-600 dark:text-stone-400'}
                    `}>
                        Obtenha explicações profundas e tire dúvidas enquanto lê — tudo com a ajuda de inteligência artificial.
                    </p>

                    <button
                        onClick={() => navigate('/leitura/genesis/1')}
                        className={`px-10 py-5 rounded-2xl font-bold text-lg md:text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3 mx-auto group
                            ${theme === 'bw'
                                ? 'bg-black text-white hover:bg-stone-800 ring-4 ring-stone-100'
                                : 'bg-stone-900 text-white hover:bg-black dark:bg-bible-gold dark:text-stone-900 dark:hover:bg-yellow-500 ring-4 ring-white/50 dark:ring-stone-800'}
                        `}
                    >
                        Começar Leitura
                        <ArrowRight size={24} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>

            {/* 2. MAIN INTERACTION CARD (Reading Card) */}
            <div className="max-w-4xl mx-auto px-4 md:px-6 mt-6 md:-mt-16 relative z-20 mb-16 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <div className={`p-8 md:p-12 rounded-[2.5rem] shadow-xl border
                    ${theme === 'bw'
                        ? 'bg-white border-stone-200 shadow-stone-200/50'
                        : isDark
                            ? 'bg-stone-900 border-stone-800 shadow-black/50'
                            : 'bg-white border-stone-100 shadow-stone-200/50'}
                `}>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h3 className={`text-3xl font-serif font-bold mb-3
                            ${theme === 'bw' ? 'text-black' : isDark ? 'text-stone-100' : 'text-stone-800'}
                        `}>
                            Por onde começar?
                        </h3>
                        <p className={`text-base md:text-lg
                            ${theme === 'bw' ? 'text-stone-500' : 'text-stone-500'}
                        `}>
                            Escolha um livro, testamento ou tema para começar
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="mb-10">
                        <form onSubmit={handleSearchSubmit} className="relative group">
                            <div className="relative flex items-center">
                                <Search className={`absolute left-5 w-5 h-5 transition-colors z-10
                                    ${theme === 'bw' ? 'text-stone-400' : 'text-stone-400 group-focus-within:text-bible-gold'}
                                `} />
                                <input
                                    type="text"
                                    value={localQuery}
                                    onChange={(e) => setLocalQuery(e.target.value)}
                                    placeholder="Buscar livro, capítulo ou tema (ex: Gênesis, / Fé)"
                                    className={`w-full p-4 pl-12 pr-4 rounded-2xl border outline-none transition-all text-base
                                        ${theme === 'bw'
                                            ? 'bg-white border-stone-300 text-black placeholder-stone-400 focus:border-black focus:ring-1 focus:ring-black'
                                            : isDark
                                                ? 'bg-stone-950 border-stone-800 text-stone-100 placeholder-stone-600 focus:border-bible-gold/50'
                                                : 'bg-white border-stone-200 text-stone-800 placeholder-stone-400 focus:border-bible-gold/50 shadow-sm'}
                                    `}
                                />
                            </div>
                        </form>
                    </div>

                    {/* Check if we need to show Testaments or Themes */}

                    {/* Testament Toggles */}
                    <div className={`flex p-1 rounded-xl mb-8 w-full md:w-fit mx-auto
                        ${isDark ? 'bg-stone-950 border border-stone-800' : 'bg-stone-50 border border-stone-100'}
                    `}>
                        <button
                            onClick={() => setActiveTestament('OT')}
                            className={`flex-1 md:flex-none px-8 py-3 rounded-lg text-sm font-bold transition-all
                                ${activeTestament === 'OT'
                                    ? (theme === 'bw' ? 'bg-white text-black shadow-sm border border-stone-200' : isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                    : 'text-stone-400 hover:text-stone-500'}
                            `}
                        >
                            Antigo Testamento
                        </button>
                        <button
                            onClick={() => setActiveTestament('NT')}
                            className={`flex-1 md:flex-none px-8 py-3 rounded-lg text-sm font-bold transition-all
                                ${activeTestament === 'NT'
                                    ? (theme === 'bw' ? 'bg-white text-black shadow-sm border border-stone-200' : isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                    : 'text-stone-400 hover:text-stone-500'}
                            `}
                        >
                            Novo Testamento
                        </button>
                    </div>

                    {/* Book Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
                        {bibleBooks
                            .filter(b => b.testament === (activeTestament === 'OT' ? 'Old' : 'New'))
                            .slice(0, 5)
                            .map((book) => (
                                <button
                                    key={book.name}
                                    onClick={() => navigate(`/leitura/${normalizeBookName(book.name)}`)}
                                    className={`p-4 rounded-2xl text-center transition-all border hover:-translate-y-1
                                    ${theme === 'bw'
                                            ? 'bg-white border-stone-200 text-black hover:bg-stone-50 hover:border-stone-400'
                                            : isDark
                                                ? 'bg-stone-950 border-stone-800 text-stone-400 hover:text-bible-gold hover:border-bible-gold/30'
                                                : 'bg-white border-stone-100 text-stone-600 hover:text-bible-gold hover:border-bible-gold/30 hover:shadow-sm'}
                                `}
                                >
                                    <div className="font-bold mb-1 text-sm">{book.name}</div>
                                    <div className="text-[10px] opacity-50 uppercase tracking-wider">{book.chapters} Caps</div>
                                </button>
                            ))}

                        <button
                            onClick={() => navigate(activeTestament === 'OT' ? '/antigo-testamento' : '/novo-testamento')}
                            className={`p-4 rounded-2xl text-center transition-all border group flex flex-col items-center justify-center gap-2
                                ${theme === 'bw'
                                    ? 'bg-stone-100 border-stone-200 text-black hover:bg-stone-200'
                                    : isDark
                                        ? 'bg-bible-gold/10 border-bible-gold/20 text-bible-gold hover:bg-bible-gold/20'
                                        : 'bg-bible-gold/5 border-bible-gold/20 text-bible-gold hover:bg-bible-gold/10'}
                            `}
                        >
                            <ArrowRight size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Ver Todos</span>
                        </button>
                    </div>

                    {/* Divider / Theme Label */}
                    <div className="text-center mb-6">
                        <span className={`text-sm font-medium
                            ${theme === 'bw' ? 'text-stone-400' : 'text-stone-400'}
                        `}>
                            Ou comece por um tema:
                        </span>
                    </div>

                    {/* Quick Chips (Themes) */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {['Fé', 'Amor', 'Ansiedade', 'Perdão', 'Esperança'].map((s) => (
                            <button
                                key={s}
                                onClick={() => navigate(`/busca?q=${encodeURIComponent(s)}`)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5
                                    ${theme === 'bw'
                                        ? 'bg-stone-100 text-black border border-stone-200 hover:bg-stone-200'
                                        : isDark
                                            ? 'bg-stone-950 text-stone-400 hover:text-bible-gold border border-stone-800'
                                            : 'bg-stone-50 text-stone-600 hover:text-bible-gold border border-stone-100 hover:bg-bible-gold/5'}
                                `}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                </div>
            </div>




            {/* 3. FEATURED SECTIONS - SEO Pages */}
            <div className="mb-16 animate-slideUp" style={{ animationDelay: '0.5s' }}>
                <div className="text-center mb-10 px-4">
                    <h3 className={`text-2xl font-serif font-bold mb-2
                        ${theme === 'bw' ? 'text-black' : isDark ? 'text-stone-100' : 'text-stone-800'}
                    `}>
                        Recursos de Estudo
                    </h3>
                    <p className={`text-base
                        ${theme === 'bw' ? 'text-stone-500' : 'text-stone-500'}
                    `}>
                        Ferramentas essenciais para aprofundar sua fé
                    </p>
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-6 pb-6 px-6 md:px-0 scrollbar-hide">

                    {/* Guide Card - FIRST POSITION */}
                    <button
                        onClick={() => navigate('/como-ler-biblia')}
                        className="group relative h-64 min-w-[75vw] md:min-w-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block w-full"
                    >
                        <div className="absolute inset-0 bg-stone-900"></div>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 animate-shine transition-all"></div>
                        <div className="absolute -right-8 -top-8 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <BookOpen size={180} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950/50 backdrop-blur-sm rounded-full border border-emerald-500/30">
                                Iniciantes
                            </span>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                                Como Ler a Bíblia<br />Guia Completo
                            </h3>
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-medium group-hover:text-white transition-colors">
                                Começar Jornada <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Verses Card - SECOND POSITION */}
                    <button
                        onClick={() => navigate('/versiculos')}
                        className="group relative h-64 min-w-[75vw] md:min-w-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block w-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950"></div>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 animate-shine transition-all"></div>
                        <div className="absolute -right-8 -top-8 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Search size={180} />
                        </div>

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-bible-gold uppercase bg-yellow-950/50 backdrop-blur-sm rounded-full border border-bible-gold/30">
                                Temas Bíblicos
                            </span>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                                Encontre Versiculos<br />por Tema
                            </h3>
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-medium group-hover:text-white transition-colors">
                                Explorar Coleção <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* FAQ Card - THIRD POSITION */}
                    <button
                        onClick={() => navigate('/faq-biblia')}
                        className="group relative h-64 min-w-[75vw] md:min-w-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block w-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 animate-shine transition-all"></div>
                        <div className="absolute -right-8 -top-8 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <HelpCircle size={180} />
                        </div>

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950/50 backdrop-blur-sm rounded-full border border-indigo-500/30">
                                Tire Dúvidas
                            </span>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                                Perguntas Frequentes<br />sobre a Fé
                            </h3>
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-medium group-hover:text-white transition-colors">
                                Ver Respostas <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Devotional Card - FOURTH POSITION (NEW) */}
                    <button
                        onClick={() => navigate('/devocional')}
                        className="group relative h-64 min-w-[75vw] md:min-w-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block w-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-yellow-700 to-amber-600"></div>
                        {/* Texture/Effect */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <div className="absolute -right-8 -top-8 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Calendar size={180} />
                        </div>

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-yellow-300 uppercase bg-yellow-950/50 backdrop-blur-sm rounded-full border border-yellow-500/30">
                                Diário
                            </span>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                                Devocional<br />do Dia
                            </h3>
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-medium group-hover:text-white transition-colors">
                                Ler Reflexão <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Chat Card - FIFTH POSITION (NEW) */}
                    <button
                        onClick={() => navigate('/chat')}
                        className="group relative h-64 min-w-[75vw] md:min-w-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block w-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-800"></div>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 animate-shine transition-all"></div>
                        <div className="absolute -right-8 -top-8 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <MessageCircle size={180} />
                        </div>

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-950/50 backdrop-blur-sm rounded-full border border-blue-500/30">
                                Converse
                            </span>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                                Chat<br />Teológico
                            </h3>
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-medium group-hover:text-white transition-colors">
                                Tirar Dúvidas <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* 1. DAILY VERSE (Featured - Moved Up) */}
            <div className="animate-slideUp" style={{ animationDelay: '0.45s' }}>
                <div id="daily-verse-card" ref={verseCardRef} className={`w-full p-10 rounded-3xl relative overflow-hidden group flex flex-col justify-center min-h-[240px] text-center items-center shadow-md transition-all hover:scale-[1.01]
                        ${theme === 'bw'
                        ? 'bg-white border border-stone-200'
                        : isDark
                            ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-bible-gold/20 border border-bible-gold/20'
                            : 'bg-gradient-to-br from-white via-stone-50 to-bible-gold/10 border border-white'}
                    `}>

                    {/* Background Ambience */}
                    {theme !== 'bw' && (
                        <>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-bible-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-bible-accent/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                        </>
                    )}

                    {/* Quote Icons */}
                    <div className={`absolute top-6 left-6 opacity-20 pointer-events-none ${theme === 'bw' ? 'text-black' : 'text-bible-gold'}`}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.896 14.321 15.923 14.929 15.081C15.539 14.238 16.417 13.565 17.564 13.06L17.564 12.637C16.956 12.637 16.488 12.483 16.157 12.176C15.828 11.87 15.663 11.464 15.663 10.959C15.663 10.457 15.845 10.051 16.208 9.74001C16.572 9.42901 17.065 9.27401 17.689 9.27401C18.423 9.27401 18.995 9.53701 19.408 10.062C19.821 10.589 20.027 11.233 20.027 11.996C20.027 13.433 19.488 14.82 18.411 16.157C17.334 17.495 15.868 18.775 14.016 19.998L14.017 21ZM5.00201 21L5.00201 18C5.00201 16.896 5.30601 15.923 5.91401 15.081C6.52401 14.238 7.40001 13.565 8.54801 13.06L8.54801 12.637C7.94001 12.637 7.47201 12.483 7.14101 12.176C6.81201 11.87 6.64701 11.464 6.64701 10.959C6.64701 10.457 6.82901 10.051 7.19201 9.74001C7.55601 9.42901 8.05001 9.27401 8.67301 9.27401C9.40701 9.27401 9.97901 9.53701 10.392 10.062C10.805 10.589 11.011 11.233 11.011 11.996C11.011 13.433 10.472 14.82 9.39501 16.157C8.31801 17.495 6.85301 18.775 5.00201 19.998L5.00201 21Z"></path></svg>
                    </div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className={`p-2 rounded-full ${theme === 'bw' ? 'bg-stone-100 text-black' : 'bg-bible-gold/10 text-bible-gold'}`}>
                            <Calendar size={20} />
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'bw' ? 'text-black' : 'text-bible-gold'}`}>Versículo do Dia</span>
                    </div>

                    <blockquote className={`text-3xl md:text-4xl font-serif italic leading-tight mb-8 max-w-4xl mx-auto relative z-10 drop-shadow-sm
                            ${theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-stone-100'}`}>
                        "{dailyVerse.text}"
                    </blockquote>

                    <cite className={`not-italic font-bold tracking-wider uppercase text-sm flex items-center gap-4 relative z-10 mb-8
                            ${theme === 'bw' ? 'text-stone-600' : 'text-stone-500 dark:text-stone-400'}`}>
                        <span className={`h-px w-12 ${theme === 'bw' ? 'bg-black/20' : 'bg-gradient-to-r from-transparent to-bible-gold'}`}></span>
                        {dailyVerse.ref}
                        <span className={`h-px w-12 ${theme === 'bw' ? 'bg-black/20' : 'bg-gradient-to-l from-transparent to-bible-gold'}`}></span>
                    </cite>

                    {/* Visible Watermark Footer */}
                    <div className="relative z-10 font-serif font-bold tracking-[0.2em] opacity-80 uppercase text-sm mb-2" style={{ color: isDark ? '#e7c674' : '#b45309' }}>
                        BIBLIAONLINE.ME
                    </div>
                </div>

                {/* Share Button (Outside Card) */}
                <div className="flex justify-center mt-6 gap-4">
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide shadow-sm hover:shadow-md disabled:opacity-50 transition-all
                                ${theme === 'bw'
                                ? 'bg-stone-100 text-stone-900 hover:bg-black hover:text-white'
                                : 'bg-bible-gold/10 text-bible-gold hover:bg-bible-gold hover:text-white'}
                            `}
                    >
                        {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                        {isSharing ? 'Gerando...' : 'Compartilhar'}
                    </button>

                    <button
                        onClick={handleNextVerse}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full border font-bold text-sm uppercase tracking-wide shadow-sm hover:shadow-md transition-all
                                ${theme === 'bw'
                                ? 'border-stone-200 text-stone-600 hover:bg-stone-50'
                                : 'border-bible-gold/30 text-bible-gold hover:bg-bible-gold/10'}
                            `}
                    >
                        <RefreshCw size={18} />
                        Outro
                    </button>
                </div>
            </div>

            {/* Old Tools Section Removed */}
        </div>
    );
};

// Sub-component to handle fetching logic cleanly
const BlogPreviewSection = ({ navigate, isDark }: { navigate: any, isDark: boolean }) => {
    const [posts, setPosts] = React.useState<any[]>([]);

    React.useEffect(() => {
        fetch('/api/blog/posts')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPosts(data.slice(0, 3));
                }
            })
            .catch(err => console.error("Failed to fetch blog posts:", err));
    }, []);

    if (posts.length === 0) return null; // Hide if empty

    return (
        <>
            {posts.map((post) => (
                <div
                    key={post.id || post._id}
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    className={`group cursor-pointer rounded-3xl overflow-hidden border transition-all hover:shadow-xl
                        ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}
                    `}
                >
                    <div className="h-48 overflow-hidden relative">
                        <img
                            src={post.coverImage || post.image || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1000&auto=format&fit=crop'}
                            alt={`Imagem de capa do artigo: ${post.title} - Bíblia Online`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-bible-gold/20 text-bible-gold rounded-full text-xs font-bold uppercase tracking-wide">
                                {post.category || 'Geral'}
                            </span>
                            <span className="text-stone-400 text-xs">{new Date(post.createdAt || Date.now()).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isDark ? 'text-stone-200 group-hover:text-bible-gold' : 'text-bible-accent group-hover:text-bible-gold'} transition-colors`}>
                            {post.title}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-4">
                            {post.excerpt}
                        </p>
                    </div>
                </div>
            ))}
        </>
    );
};

export default HomePage;
