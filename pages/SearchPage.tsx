import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { searchBlogPosts } from '../services/geminiService';
import { searchBibleLocal } from '../services/localBibleService';
import { parseSearchIntent, SearchIntent, getSearchSuggestions, SearchSuggestion } from '../services/searchIntent';
import { normalizeBookName } from '../constants';
import { ReadingPreferences, BlogPost } from '../types';
import { AdUnit } from '../components/AdUnit';
import { Sparkles, BookOpen, FileText, ArrowRight, MessageCircle, User, Scroll, Heart, HelpCircle, Hash, Search } from 'lucide-react';

interface SearchPageProps {
    language: string;
    t: any;
    preferences: ReadingPreferences;
}

const SearchPage: React.FC<SearchPageProps> = ({ language, t, preferences }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [verseResults, setVerseResults] = useState<any[]>([]);
    const [postResults, setPostResults] = useState<BlogPost[]>([]);

    // Aggregated Results State
    const [bookResults, setBookResults] = useState<SearchSuggestion[]>([]);
    const [characterResults, setCharacterResults] = useState<SearchSuggestion[]>([]);
    const [storyResults, setStoryResults] = useState<SearchSuggestion[]>([]);
    const [emotionResults, setEmotionResults] = useState<SearchSuggestion[]>([]);
    const [themeResults, setThemeResults] = useState<SearchSuggestion[]>([]);

    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) return;

            setIsSearching(true);
            setVerseResults([]);
            setPostResults([]);
            setBookResults([]);
            setCharacterResults([]);
            setStoryResults([]);
            setEmotionResults([]);
            setThemeResults([]);

            try {
                // 1. Get Smart Suggestions (Books, Characters, Stories, Emotions)
                const suggestions = getSearchSuggestions(query);

                // Group suggestions by type
                const books = suggestions.filter(s => s.type === 'BOOK');
                const chars = suggestions.filter(s => s.type === 'CHARACTER');
                const stories = suggestions.filter(s => s.type === 'STORY');
                const emotions = suggestions.filter(s => s.type === 'EMOTION');
                const themes = suggestions.filter(s => s.type === 'THEME');

                setBookResults(books);
                setCharacterResults(chars);
                setStoryResults(stories);
                setEmotionResults(emotions);
                setThemeResults(themes);

                // 2. Parallel Fetch of Content (Verses & Posts)
                const [verses, posts] = await Promise.all([
                    searchBibleLocal(query),
                    searchBlogPosts(query)
                ]);

                setVerseResults(verses);
                setPostResults(posts);

            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [query, language]);

    const hasResults = verseResults.length > 0 || postResults.length > 0 ||
        bookResults.length > 0 || characterResults.length > 0 ||
        storyResults.length > 0 || emotionResults.length > 0;

    // Helper to render a generic result card
    const renderCard = (
        title: string,
        subtitle: string,
        icon: any,
        onClick: () => void,
        colorClass = "bg-white",
        iconClass = "text-stone-500",
        additionalContent?: React.ReactNode
    ) => (
        <div
            onClick={onClick}
            className={`
                group p-5 rounded-xl border cursor-pointer transition-all hover:-translate-y-1
                ${preferences.theme === 'bw'
                    ? 'bg-white border-black border-2 shadow-none hover:bg-stone-50'
                    : `border-stone-200 dark:border-stone-800 hover:shadow-lg ${preferences.theme === 'dark' ? 'bg-stone-900 hover:border-bible-gold/30' : 'bg-white hover:border-bible-gold/50'}`}
            `}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${iconClass} ${preferences.theme === 'dark' ? 'bg-stone-800' : 'bg-stone-100'}`}>
                    {React.createElement(icon, { size: 24 })}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-serif font-bold truncate mb-1 ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-800 dark:text-stone-100'}`}>
                        {title}
                    </h3>
                    <p className={`text-sm opacity-70 line-clamp-2 ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-600 dark:text-stone-400'}`}>
                        {subtitle}
                    </p>
                    {additionalContent}
                </div>
                <div className={`self-center opacity-0 group-hover:opacity-100 transition-opacity ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}`}>
                    <ArrowRight size={20} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24">
            <Helmet>
                <title>{`${t.resultsFor} "${query}" - ${t.appTitle}`}</title>
                <meta name="description" content={`Resultados da busca por "${query}" na Bíblia Sagrada e artigos.`} />
            </Helmet>

            <h2 className="text-3xl font-serif mb-8 text-bible-accent dark:text-bible-gold transition-colors text-center">
                {t.resultsFor} <span className="italic">"{query}"</span>
            </h2>

            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-stone-500 animate-pulse">Buscando...</p>
                </div>
            ) : (
                <div className="space-y-12">

                    {!hasResults ? (
                        <div className="text-center py-12 opacity-60">
                            <p className="text-xl mb-4">{t.noResults}</p>
                            <button onClick={() => navigate('/')} className="text-bible-gold hover:underline">Voltar ao Início</button>
                        </div>
                    ) : (
                        <>
                            {/* 1. Books Section */}
                            {bookResults.length > 0 && (
                                <div className="animate-slideUp">
                                    <div className="flex items-center gap-3 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                        <BookOpen size={20} className="text-bible-gold" />
                                        <h3 className="text-xl font-bold dark:text-stone-200">Livros</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {bookResults.map((item, idx) => (
                                            renderCard(
                                                item.label,
                                                `${item.data.book.testament === 'Old' ? 'Antigo' : 'Novo'} Testamento`,
                                                BookOpen,
                                                () => navigate(`/leitura/${normalizeBookName(item.label)}`),
                                                "",
                                                "text-blue-500"
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Character Section */}
                            {characterResults.length > 0 && (
                                <div className="animate-slideUp" style={{ animationDelay: '0.05s' }}>
                                    <div className="flex items-center gap-3 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                        <User size={20} className="text-bible-gold" />
                                        <h3 className="text-xl font-bold dark:text-stone-200">Personagens</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {characterResults.map((item, idx) => (
                                            renderCard(
                                                item.label,
                                                item.subLabel || "Personagem Bíblico",
                                                User,
                                                () => navigate(`/chat?p=${encodeURIComponent(`Quem foi ${item.label}?`)}`),
                                                "",
                                                "text-purple-500",
                                                <div className="mt-2 text-xs flex gap-2">
                                                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded text-stone-500">💬 Chat Hall</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Story Section */}
                            {storyResults.length > 0 && (
                                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center gap-3 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                        <Scroll size={20} className="text-bible-gold" />
                                        <h3 className="text-xl font-bold dark:text-stone-200">Histórias</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {storyResults.map((item, idx) => (
                                            renderCard(
                                                item.label,
                                                item.data.story.ref,
                                                Scroll,
                                                () => navigate(`/chat?p=${encodeURIComponent(`Conte-me a história: ${item.label}`)}`),
                                                "",
                                                "text-amber-500"
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Emotions Section */}
                            {emotionResults.length > 0 && (
                                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center gap-3 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                        <Heart size={20} className="text-bible-gold" />
                                        <h3 className="text-xl font-bold dark:text-stone-200">Sentimentos</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {emotionResults.map((item, idx) => (
                                            renderCard(
                                                item.label,
                                                "Encontre conforto na palavra",
                                                Heart,
                                                () => navigate(`/chat?p=${encodeURIComponent(`Versículos sobre ${item.label}`)}`),
                                                "",
                                                "text-pink-500"
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 5. Bible Verses Results (Existing Layout) */}
                            {verseResults.length > 0 && (
                                <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 dark:border-stone-800 pb-2">
                                        <BookOpen size={20} className={`${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}`} />
                                        <h3 className={`text-xl font-bold ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-700 dark:text-stone-300'}`}>Versículos Bíblicos</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {verseResults.map((res, idx) => {
                                            // Parse reference logic
                                            let linkTarget = '#';

                                            if (res.context === 'Livro Completo') {
                                                linkTarget = `/leitura/${normalizeBookName(res.reference)}`;
                                            } else {
                                                try {
                                                    const lastColon = res.reference.lastIndexOf(':');
                                                    if (lastColon !== -1) {
                                                        const verse = res.reference.substring(lastColon + 1);
                                                        const rest = res.reference.substring(0, lastColon);
                                                        const lastSpace = rest.lastIndexOf(' ');
                                                        const chapter = rest.substring(lastSpace + 1);
                                                        const book = rest.substring(0, lastSpace);
                                                        linkTarget = `/leitura/${normalizeBookName(book)}/${chapter}?verses=${verse}`;
                                                    } else {
                                                        const match = res.reference.match(/^(.+)\s+(\d+)$/);
                                                        if (match) {
                                                            const book = match[1];
                                                            const chapter = match[2];
                                                            linkTarget = `/leitura/${normalizeBookName(book)}/${chapter}`;
                                                        }
                                                    }
                                                } catch (e) {
                                                    console.error("Error parsing reference link", e);
                                                }
                                            }

                                            return (
                                                <Link
                                                    to={linkTarget}
                                                    key={idx}
                                                    className={`block p-6 rounded-xl border group transition-all
                                                ${preferences.theme === 'sepia'
                                                            ? 'bg-[#fcf9ee] border-[#e6dcc6] hover:border-bible-gold' // Sepia
                                                            : preferences.theme === 'bw'
                                                                ? 'bg-white border-black border-2 shadow-none hover:bg-stone-50' // BW
                                                                : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-bible-gold/50'} 
                                            `}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className={`font-serif font-bold text-lg group-hover:underline underline-offset-4
                                                            ${preferences.theme === 'bw'
                                                                ? 'text-black decoration-black'
                                                                : 'text-bible-accent dark:text-bible-gold decoration-bible-gold/50'}
                                                        `}>
                                                            {res.reference}
                                                        </h4>
                                                        <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity
                                                            ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}
                                                        `} />
                                                    </div>
                                                    <p className={`text-lg leading-relaxed mb-3
                                                ${preferences.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
                                                ${preferences.theme === 'bw' ? 'text-black' : ''}
                                            `}>
                                                        "{res.text}"
                                                    </p>
                                                    {res.context && (
                                                        <div className={`text-xs inline-block px-2 py-1 rounded
                                                            ${preferences.theme === 'bw'
                                                                ? 'bg-black text-white'
                                                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}
                                                        `}>
                                                            <span className="font-bold mr-1">Contexto:</span> {res.context}
                                                        </div>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 6. Blog Posts Results */}
                            {postResults.length > 0 && (
                                <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 dark:border-stone-800 pb-2">
                                        <FileText size={20} className={`${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}`} />
                                        <h3 className={`text-xl font-bold ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-700 dark:text-stone-300'}`}>Artigos e Estudos</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {postResults.map(post => (
                                            <Link key={post.id} to={`/blog/${post.slug}`}
                                                className={`block p-5 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg
                                        ${preferences.theme === 'sepia'
                                                        ? 'bg-white border-[#e6dcc6]'
                                                        : preferences.theme === 'bw'
                                                            ? 'bg-white border-black border-2 shadow-none hover:bg-stone-50'
                                                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
                                    `}>
                                                <h4 className={`font-bold text-lg mb-2 line-clamp-1
                                                    ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}
                                                `}>{post.title}</h4>
                                                <p className={`text-sm opacity-70 line-clamp-2
                                                    ${preferences.theme === 'bw' ? 'text-black' : ''}
                                                `}>{post.excerpt}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AdUnit />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
