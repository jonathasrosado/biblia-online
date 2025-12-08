import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, MessageCircle, Sun, Search, ArrowRight, Clock, Star, Calendar, Share2 } from 'lucide-react';
import { normalizeBookName, bibleBooks } from '../constants';
import { ReadingHistoryItem } from '../types';

interface HomePageProps {
    language: string;
    t: any;
    isDark: boolean;
    history?: ReadingHistoryItem[];
}

interface SiteSettings {
    siteTitle: string;
    siteDescription: string;
}

// Curated list of verses for the "Daily Verse" feature
const DAILY_VERSES = [
    { text: "O Senhor é o meu pastor, nada me faltará.", ref: "Salmos 23:1" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", ref: "João 3:16" },
    { text: "Mil cairão ao teu lado, e dez mil à tua direita, mas não chegarás a ti.", ref: "Salmos 91:7" },
    { text: "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
    { text: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1" },
    { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", ref: "Mateus 11:28" },
    { text: "Se Deus é por nós, quem será contra nós?", ref: "Romanos 8:31" },
    { text: "Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos.", ref: "Filipenses 4:4" },
    { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" }
];

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    image?: string;
    date: string;
}

const HomePage: React.FC<HomePageProps> = ({ language, t, isDark, history = [] }) => {
    const navigate = useNavigate();
    const [localQuery, setLocalQuery] = useState('');
    const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);
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

    const lastRead = history.length > 0 ? history[0] : null;

    return (
        <div className="min-h-full animate-fadeIn pb-20">
            <Helmet>
                <title>{settings.siteTitle || t.appTitle}</title>
                <meta name="description" content={settings.siteDescription || "Sua plataforma de estudo bíblico com Inteligência Artificial."} />
            </Helmet>

            {/* Hero Section - Clean & Focused */}
            <div className={`relative pt-12 pb-24 px-6 md:px-12 text-center overflow-hidden
                ${isDark ? 'bg-stone-950' : 'bg-stone-50'}
            `}>
                {/* Background Ambience */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-bible-gold/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bible-gold/10 text-bible-gold font-bold text-[10px] uppercase tracking-widest mb-6 animate-slideUp">
                        <Star size={12} className="fill-current" />
                        <span>Bíblia Online Inteligente</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 text-bible-accent dark:text-bible-gold tracking-tight animate-slideUp" style={{ animationDelay: '0.1s' }}>
                        {getGreeting()}
                    </h1>

                    <p className="text-lg opacity-60 font-serif mb-10 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        Que a paz de Deus esteja com você hoje.
                    </p>

                    {/* Search Bar - Centered & Premium */}
                    <div className="max-w-xl mx-auto mb-8 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                        <form onSubmit={handleSearchSubmit} className="relative group">
                            <div className={`absolute inset-0 rounded-2xl blur opacity-20 transition-opacity group-focus-within:opacity-40 bg-bible-gold`}></div>
                            <div className="relative flex items-center">
                                <Search className={`absolute left-5 w-5 h-5 transition-colors z-10
                                    ${isDark ? 'text-stone-500 group-focus-within:text-bible-gold' : 'text-stone-400 group-focus-within:text-bible-gold'}
                                `} />
                                <input
                                    type="text"
                                    value={localQuery}
                                    onChange={(e) => setLocalQuery(e.target.value)}
                                    placeholder={t.searchPlaceholder}
                                    className={`w-full p-4 pl-12 pr-4 rounded-2xl border outline-none transition-all shadow-lg text-base
                                        ${isDark
                                            ? 'bg-stone-900/80 backdrop-blur-xl border-stone-800 focus:border-bible-gold/50 text-stone-100 placeholder-stone-600'
                                            : 'bg-white/90 backdrop-blur-xl border-stone-200 focus:border-bible-gold/50 text-stone-800 placeholder-stone-400'}
                                    `}
                                />
                            </div>
                        </form>

                        {/* Quick Chips */}
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {['Salmos 91', 'Amor', 'Fé', 'Esperança', 'Paz'].map((s, i) => (
                                <button
                                    key={s}
                                    onClick={() => navigate(`/busca?q=${encodeURIComponent(s)}`)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:-translate-y-0.5
                                        ${isDark
                                            ? 'bg-stone-900 text-stone-400 hover:text-bible-gold border border-stone-800'
                                            : 'bg-white text-stone-500 hover:text-bible-gold border border-stone-200 shadow-sm'}
                                    `}
                                    style={{ animationDelay: `${0.4 + (i * 0.05)}s` }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 md:px-12 -mt-16 relative z-20 space-y-12">

                {/* 2. QUICK ACCESS BOOKS (Moved Up) */}
                <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl font-serif font-bold">Acesso Rápido</h2>

                        {/* Tabs Interface */}
                        <div className={`flex p-1 rounded-xl w-full md:w-auto
                            ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-stone-100 border border-stone-200'}
                        `}>
                            <button
                                onClick={() => setActiveTestament('OT')}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all
                                    ${activeTestament === 'OT'
                                        ? (isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                        : 'text-stone-400 hover:text-stone-500'}
                                `}
                            >
                                Antigo Testamento
                            </button>
                            <button
                                onClick={() => setActiveTestament('NT')}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all
                                    ${activeTestament === 'NT'
                                        ? (isDark ? 'bg-stone-800 text-bible-gold shadow-sm' : 'bg-white text-bible-gold shadow-sm')
                                        : 'text-stone-400 hover:text-stone-500'}
                                `}
                            >
                                Novo Testamento
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {bibleBooks
                            .filter(b => b.testament === (activeTestament === 'OT' ? 'Old' : 'New'))
                            .slice(0, 11) // Show 11 books to leave room for the "Ver Tudo" button
                            .map((book) => (
                                <button
                                    key={book.name}
                                    onClick={() => navigate(`/leitura/${normalizeBookName(book.name)}`)}
                                    className={`p-4 rounded-2xl text-center transition-all border hover:-translate-y-1
                                    ${isDark
                                            ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-bible-gold hover:border-bible-gold/30'
                                            : 'bg-white border-stone-100 text-stone-600 hover:text-bible-gold hover:shadow-md'}
                                `}
                                >
                                    <div className="font-bold mb-1">{book.name}</div>
                                    <div className="text-[10px] opacity-50 uppercase tracking-wider">{book.chapters} Caps</div>
                                </button>
                            ))}

                        {/* "Ver Tudo" Button */}
                        <button
                            onClick={() => navigate(activeTestament === 'OT' ? '/antigo-testamento' : '/novo-testamento')}
                            className={`p-4 rounded-2xl text-center transition-all border group flex flex-col items-center justify-center gap-2
                                ${isDark
                                    ? 'bg-bible-gold/10 border-bible-gold/20 text-bible-gold hover:bg-bible-gold/20'
                                    : 'bg-bible-gold/5 border-bible-gold/20 text-bible-gold hover:bg-bible-gold/10'}
                            `}
                        >
                            <div className="p-2 rounded-full bg-bible-gold/20 group-hover:bg-bible-gold/30 transition-colors">
                                <ArrowRight size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Ver Tudo</span>
                        </button>
                    </div>
                </div>


                {/* 1. DAILY VERSE (Featured - Moved Up) */}
                <div className="animate-slideUp" style={{ animationDelay: '0.45s' }}>
                    <div id="daily-verse-card" className={`w-full p-10 rounded-3xl relative overflow-hidden group flex flex-col justify-center min-h-[240px] text-center items-center shadow-2xl transition-all hover:scale-[1.01]
                        ${isDark
                            ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-bible-gold/20 border border-bible-gold/20'
                            : 'bg-gradient-to-br from-white via-stone-50 to-bible-gold/10 border border-white'}
                    `}>
                        {/* Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[4rem] md:text-[6rem] font-black opacity-[0.03] whitespace-nowrap pointer-events-none select-none font-serif tracking-tighter">
                            BIBLIAONLINE.ME
                        </div>

                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-bible-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-bible-accent/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                        {/* Quote Icons */}
                        <div className="absolute top-6 left-6 opacity-20 text-bible-gold pointer-events-none">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.896 14.321 15.923 14.929 15.081C15.539 14.238 16.417 13.565 17.564 13.06L17.564 12.637C16.956 12.637 16.488 12.483 16.157 12.176C15.828 11.87 15.663 11.464 15.663 10.959C15.663 10.457 15.845 10.051 16.208 9.74001C16.572 9.42901 17.065 9.27401 17.689 9.27401C18.423 9.27401 18.995 9.53701 19.408 10.062C19.821 10.589 20.027 11.233 20.027 11.996C20.027 13.433 19.488 14.82 18.411 16.157C17.334 17.495 15.868 18.775 14.016 19.998L14.017 21ZM5.00201 21L5.00201 18C5.00201 16.896 5.30601 15.923 5.91401 15.081C6.52401 14.238 7.40001 13.565 8.54801 13.06L8.54801 12.637C7.94001 12.637 7.47201 12.483 7.14101 12.176C6.81201 11.87 6.64701 11.464 6.64701 10.959C6.64701 10.457 6.82901 10.051 7.19201 9.74001C7.55601 9.42901 8.05001 9.27401 8.67301 9.27401C9.40701 9.27401 9.97901 9.53701 10.392 10.062C10.805 10.589 11.011 11.233 11.011 11.996C11.011 13.433 10.472 14.82 9.39501 16.157C8.31801 17.495 6.85301 18.775 5.00201 19.998L5.00201 21Z"></path></svg>
                        </div>

                        {/* Top Bar for Share */}
                        <div className="absolute top-6 right-6 z-20">
                            <button
                                onClick={() => {
                                    const text = `"${dailyVerse.text}" - ${dailyVerse.ref}\n\nLeia mais em: bibliaonline.me`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Versículo do Dia',
                                            text: text,
                                            url: 'https://bibliaonline.me'
                                        }).catch(console.error);
                                    } else {
                                        navigator.clipboard.writeText(text);
                                        // Optional: Show toast
                                        alert('Versículo copiado para a área de transferência!');
                                    }
                                }}
                                className="p-2 rounded-full bg-bible-gold/10 text-bible-gold hover:bg-bible-gold hover:text-white transition-all shadow-sm"
                                title="Compartilhar"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 rounded-full bg-bible-gold/10 text-bible-gold">
                                <Calendar size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-bible-gold">Versículo do Dia</span>
                        </div>

                        <blockquote className="text-3xl md:text-4xl font-serif italic leading-tight mb-8 text-bible-accent dark:text-stone-100 max-w-4xl mx-auto relative z-10 drop-shadow-sm">
                            "{dailyVerse.text}"
                        </blockquote>

                        <cite className="not-italic font-bold text-stone-500 dark:text-stone-400 tracking-wider uppercase text-sm flex items-center gap-4 relative z-10">
                            <span className="h-px w-12 bg-gradient-to-r from-transparent to-bible-gold"></span>
                            {dailyVerse.ref}
                            <span className="h-px w-12 bg-gradient-to-l from-transparent to-bible-gold"></span>
                        </cite>
                    </div>
                </div>

                {/* 3. BLOG SECTION (Moved Down) */}
                <div className="mb-12 animate-slideUp" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-serif font-bold">Recursos Bíblicos</h2>
                        <button
                            onClick={() => navigate('/blog')}
                            className="text-sm font-bold text-bible-gold hover:text-bible-accent transition-colors flex items-center gap-1"
                        >
                            Ver Todos <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <BlogPreviewSection navigate={navigate} isDark={isDark} />
                    </div>
                </div>

                {/* 4. TOOLS / FEATURES - Vibrant CTAs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                    {/* Reading CTA */}
                    <button
                        onClick={() => navigate(`/leitura/${normalizeBookName('Gênesis')}/1`)}
                        className={`group relative p-8 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden
                            ${isDark ? 'bg-stone-900' : 'bg-white'}
                        `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                <BookOpen size={28} />
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>Iniciar Leitura</h3>
                            <p className={`text-sm opacity-70 mb-6 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>Leitura imersiva e moderna da Bíblia Sagrada.</p>

                            <div className="mt-auto flex items-center gap-2 text-blue-500 font-bold text-sm tracking-wide group-hover:gap-3 transition-all">
                                Começar Agora <ArrowRight size={16} />
                            </div>
                        </div>
                    </button>

                    {/* Devotional CTA */}
                    <button
                        onClick={() => navigate('/devocional')}
                        className={`group relative p-8 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden
                            ${isDark ? 'bg-stone-900' : 'bg-white'}
                        `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Sun size={28} />
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>Ler Devocional</h3>
                            <p className={`text-sm opacity-70 mb-6 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>Uma palavra de inspiração diária para sua alma.</p>

                            <div className="mt-auto flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wide group-hover:gap-3 transition-all">
                                Ler Mensagem <ArrowRight size={16} />
                            </div>
                        </div>
                    </button>

                    {/* AI Chat CTA */}
                    <button
                        onClick={() => navigate('/chat')}
                        className={`group relative p-8 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden
                            ${isDark ? 'bg-stone-900' : 'bg-white'}
                        `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/20 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                                <MessageCircle size={28} />
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>Estudar com IA</h3>
                            <p className={`text-sm opacity-70 mb-6 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>Tire dúvidas teológicas com nossa Inteligência Artificial.</p>

                            <div className="mt-auto flex items-center gap-2 text-purple-500 font-bold text-sm tracking-wide group-hover:gap-3 transition-all">
                                Conversar <ArrowRight size={16} />
                            </div>
                        </div>
                    </button>
                </div>


            </div>
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
                            alt={post.title}
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
