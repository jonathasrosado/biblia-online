import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, MessageCircle, Sun, Search, ArrowRight, Clock, Star, Calendar } from 'lucide-react';
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


                {/* 3. BLOG SECTION (Moved Up) */}
                <div className="mb-12 animate-slideUp" style={{ animationDelay: '0.45s' }}>
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



                {/* 1. DAILY VERSE (Featured - Full Width) */}
                <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
                    <div id="daily-verse-card" className={`w-full p-8 rounded-3xl relative overflow-hidden group flex flex-col justify-center min-h-[200px] text-center items-center
                        ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-stone-100 shadow-xl'}
                    `}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-bible-gold/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex items-center gap-3 mb-6 opacity-60">
                            <Calendar size={18} className="text-bible-gold" />
                            <span className="text-xs font-bold uppercase tracking-widest">Versículo do Dia</span>
                        </div>

                        <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-6 text-bible-accent dark:text-stone-200 max-w-4xl mx-auto">
                            "{dailyVerse.text}"
                        </blockquote>

                        <cite className="not-italic font-bold text-bible-gold tracking-wider uppercase text-sm flex items-center gap-2">
                            <div className="h-px w-8 bg-bible-gold"></div>
                            {dailyVerse.ref}
                            <div className="h-px w-8 bg-bible-gold"></div>
                        </cite>
                    </div>
                </div>

                {/* 4. TOOLS / FEATURES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                    {[
                        { title: t.bibleReading, icon: BookOpen, path: `/leitura/${normalizeBookName('Gênesis')}/1`, desc: "Leitura imersiva e moderna." },
                        { title: t.devotional, icon: Sun, path: '/devocional', desc: "Inspiração diária para sua alma." },
                        { title: t.chat, icon: MessageCircle, path: '/chat', desc: "Tire dúvidas com nossa IA." }
                    ].map((feature, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(feature.path)}
                            className={`group p-6 rounded-2xl border text-left transition-all hover:shadow-lg relative overflow-hidden
                                ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}
                            `}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                                ${isDark ? 'bg-stone-800 text-stone-300 group-hover:bg-bible-gold group-hover:text-white' : 'bg-stone-100 text-stone-600 group-hover:bg-bible-gold group-hover:text-white'}
                            `}>
                                <feature.icon size={20} />
                            </div>
                            <h3 className="font-bold mb-1">{feature.title}</h3>
                            <p className="text-xs opacity-60">{feature.desc}</p>
                        </button>
                    ))}
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
