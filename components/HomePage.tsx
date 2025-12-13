import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from './SEO';
import { toPng } from 'html-to-image';
import { BookOpen, MessageCircle, Sun, Search, ArrowRight, Clock, Star, Calendar, Share2, Loader2, RefreshCw, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeBookName, bibleBooks } from '../constants';
import { ReadingHistoryItem } from '../types';
import versesRaw from '../src/data/daily_verses.json';

import { Theme } from '../types';
import { ReaderDemo } from './ReaderDemo';
import SmartSearch from './SmartSearch';

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
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const scrollAmount = 350; // Approximates card width + gap
            carouselRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };


    const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);
    const [isSharing, setIsSharing] = useState(false);
    const [activeTab, setActiveTab] = useState<'RECOMMENDED' | 'OT' | 'NT'>('RECOMMENDED');

    const recommendedBooks = ['Gênesis', 'Mateus', 'Salmos', 'Provérbios', 'João', 'Romanos'];

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
            <div className={`relative pt-12 pb-12 px-6 md:pt-20 md:px-12 text-center overflow-hidden
                ${theme === 'bw' ? 'bg-white text-black' : isDark ? 'bg-stone-950' : 'bg-stone-50'}
            `}>
                {/* Background Ambience */}
                {theme !== 'bw' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-bible-gold/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                )}

                <div className="max-w-4xl mx-auto relative z-10 animate-slideUp">
                    <h2 className={`text-3xl md:text-5xl font-black mb-6 tracking-tight leading-[1.1]
                        ${theme === 'bw' ? 'text-black' : isDark ? 'text-stone-100' : 'text-stone-900'}
                    `}>
                        Não basta ler a Bíblia,<br />
                        é preciso <span className={`font-serif italic ${theme === 'bw' ? 'text-stone-400' : 'text-bible-gold'}`}>compreendê-la.</span>
                    </h2>

                    <p className={`text-base md:text-lg font-sans max-w-2xl mx-auto mb-2 leading-relaxed opacity-90
                        ${theme === 'bw' ? 'text-stone-700' : 'text-stone-600 dark:text-stone-400'}
                    `}>
                        Obtenha explicações profundas e tire dúvidas enquanto lê. Conheça <span className={`font-bold ${theme === 'bw' ? 'text-stone-900' : 'text-bible-gold'}`}>BIBLIFLY</span>, a Bíblia Inteligente.
                    </p>

                    {/* Visual Onboarding (Reader Demo) - Inserted Here */}
                    <div className="mt-0 mb-4 md:my-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <div className="transform scale-[0.85] md:scale-100 origin-center">
                            <ReaderDemo />
                        </div>
                    </div>

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
            <div className="max-w-5xl mx-auto px-4 md:px-0 mt-6 md:mt-12 relative z-20 mb-16 animate-slideUp" style={{ animationDelay: '0.2s' }}>
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
                    <div className="mb-10 w-full max-w-2xl mx-auto">
                        <SmartSearch theme={theme} placeholder="Buscar livro, capítulo ou tema (ex: Gênesis, / Fé)" simpleMode={true} />
                    </div>

                    {/* Book Tabs */}
                    <div className={`flex flex-wrap p-1 rounded-xl mb-8 w-full md:w-fit mx-auto gap-1
                        ${isDark ? 'bg-stone-950 border border-stone-800' : 'bg-stone-50 border border-stone-100'}
                    `}>
                        <button
                            onClick={() => setActiveTab('RECOMMENDED')}
                            className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                ${activeTab === 'RECOMMENDED'
                                    ? (theme === 'bw' ? 'bg-white text-black shadow-sm border border-stone-200' : isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                    : 'text-stone-400 hover:text-stone-500'}
                            `}
                        >
                            Recomendados
                        </button>
                        <button
                            onClick={() => setActiveTab('OT')}
                            className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                ${activeTab === 'OT'
                                    ? (theme === 'bw' ? 'bg-white text-black shadow-sm border border-stone-200' : isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                    : 'text-stone-400 hover:text-stone-500'}
                            `}
                        >
                            Antigo Testamento
                        </button>
                        <button
                            onClick={() => setActiveTab('NT')}
                            className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                ${activeTab === 'NT'
                                    ? (theme === 'bw' ? 'bg-white text-black shadow-sm border border-stone-200' : isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                    : 'text-stone-400 hover:text-stone-500'}
                            `}
                        >
                            Novo Testamento
                        </button>
                    </div>

                    {/* Book Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
                        {/* Logic: 
                            If RECOMMENDED: map recommendedBooks finding data in bibleBooks.
                            If OT/NT: filter bibleBooks by testament, slice(0, 5).
                        */}
                        {(activeTab === 'RECOMMENDED'
                            ? recommendedBooks.map(name => bibleBooks.find(b => b.name === name)).filter(Boolean) as typeof bibleBooks
                            : bibleBooks
                                .filter(b => b.testament === (activeTab === 'OT' ? 'Old' : 'New'))
                                .slice(0, 5)
                        ).map((book) => (
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

                        {/* "Ver Todos" button - ONLY for OT/NT */}
                        {activeTab !== 'RECOMMENDED' && (
                            <button
                                onClick={() => navigate(activeTab === 'OT' ? '/antigo-testamento' : '/novo-testamento')}
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
                        )}
                    </div>



                </div >
            </div >




            {/* 3. FEATURED SECTIONS - SEO Pages */}
            < div className="mb-8 animate-slideUp" style={{ animationDelay: '0.5s' }}>
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

                {/* CAROUSEL CONTAINER WRAPPER for Arrows */}
                <div className="relative max-w-5xl mx-auto group/carousel">

                    {/* Left Arrow */}
                    <button
                        onClick={() => scrollCarousel('left')}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:block
                            ${theme === 'bw' ? 'bg-white text-black hover:bg-stone-100' : 'bg-stone-800 text-white hover:bg-stone-700'}
                        `}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scrollCarousel('right')}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:block
                            ${theme === 'bw' ? 'bg-white text-black hover:bg-stone-100' : 'bg-stone-800 text-white hover:bg-stone-700'}
                        `}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div
                        ref={carouselRef}
                        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 px-6 md:px-0 max-w-5xl mx-auto scrollbar-hide scroll-smooth"
                    >
                        {/* Daily Verse Card - FIRST POSITION */}
                        <div className="group relative h-64 min-w-[85vw] md:min-w-[320px] md:w-[320px] flex-shrink-0 snap-center rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 block">
                            <button
                                ref={verseCardRef}
                                onClick={handleShare}
                                disabled={isSharing}
                                className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center px-6 outline-none text-center
                                    ${theme === 'bw'
                                        ? 'bg-white border border-stone-200'
                                        : isDark
                                            ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-bible-gold/20 border border-bible-gold/20'
                                            : 'bg-gradient-to-br from-white via-stone-50 to-bible-gold/10 border border-white'}
                                `}
                            >
                                {/* Backgrounds */}
                                {theme !== 'bw' && (
                                    <>
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-bible-gold/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none mix-blend-overlay"></div>
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-bible-accent/5 rounded-full blur-3xl -ml-5 -mb-5 pointer-events-none"></div>
                                    </>
                                )}

                                {/* Header */}
                                <div className="flex items-center gap-2 mb-3 relative z-10 opacity-80">
                                    <div className={`p-1.5 rounded-full ${theme === 'bw' ? 'bg-stone-100 text-black' : 'bg-bible-gold/10 text-bible-gold'}`}>
                                        <Calendar size={14} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'bw' ? 'text-black' : 'text-bible-gold'}`}>Versículo do Dia</span>
                                </div>

                                {/* Text */}
                                <blockquote className={`text-lg leading-relaxed mb-3 relative z-10 drop-shadow-sm line-clamp-4 font-serif italic
                                        ${theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-stone-100'}`}>
                                    "{dailyVerse.text}"
                                </blockquote>

                                {/* Ref */}
                                <cite className={`not-italic font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-2 relative z-10
                                        ${theme === 'bw' ? 'text-stone-600' : 'text-stone-500 dark:text-stone-400'}`}>
                                    {dailyVerse.ref}
                                </cite>

                                {/* Share Label */}
                                <div className={`mt-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity
                                    ${theme === 'bw' ? 'text-black' : 'text-bible-gold'}
                                 `}>
                                    {isSharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
                                    {isSharing ? 'Gerando...' : 'Compartilhar'}
                                </div>
                            </button>

                            {/* Reset Button (Absolute Top Right) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextVerse(); }}
                                className={`absolute top-3 right-3 p-2 rounded-full z-20 transition-colors
                                    ${theme === 'bw' ? 'bg-stone-100 hover:bg-stone-200 text-stone-500' : 'bg-black/20 hover:bg-black/30 text-white/70'}
                                `}
                                title="Trocar Versículo"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Guide Card - SECOND POSITION */}
                        <button
                            onClick={() => navigate('/como-ler-biblia')}
                            className="group relative h-64 min-w-[85vw] md:min-w-[320px] md:w-[320px] flex-shrink-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block"
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

                        {/* Verses Card - THIRD POSITION */}
                        <button
                            onClick={() => navigate('/versiculos')}
                            className="group relative h-64 min-w-[85vw] md:min-w-[320px] md:w-[320px] flex-shrink-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block"
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

                        {/* FAQ Card - FOURTH POSITION */}
                        <button
                            onClick={() => navigate('/faq-biblia')}
                            className="group relative h-64 min-w-[85vw] md:min-w-[320px] md:w-[320px] flex-shrink-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block"
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
                        {/* End of Carousel Container Inner */}



                        {/* Devotional Card - FOURTH POSITION (NEW) */}
                        <button
                            onClick={() => navigate('/devocional')}
                            className="group relative h-64 min-w-[85vw] md:min-w-[320px] md:w-[320px] flex-shrink-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block"
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
                            className="group relative h-64 min-w-[85vw] md:min-w-[320px] md:w-[320px] flex-shrink-0 snap-center rounded-3xl overflow-hidden text-left shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block"
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



            </div >
        </div >
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
