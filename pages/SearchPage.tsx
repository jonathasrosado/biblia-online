import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { searchBible, searchBlogPosts, getDetailedAnswer } from '../services/geminiService';
import { normalizeBookName } from '../constants';
import { ReadingPreferences, BlogPost } from '../types';
import { AdUnit } from '../components/AdUnit';
import { Sparkles, BookOpen, FileText, ArrowRight, MessageCircle } from 'lucide-react';

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
    const [aiAnswer, setAiAnswer] = useState<string>('');

    const [isSearching, setIsSearching] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) return;

            setIsSearching(true);
            setLoadingAi(true);
            setVerseResults([]);
            setPostResults([]);
            setAiAnswer('');

            try {
                // 1. Parallel Fetch of Content
                const [verses, posts] = await Promise.all([
                    searchBible(query, language),
                    searchBlogPosts(query)
                ]);

                setVerseResults(verses);
                setPostResults(posts);

                // 2. Determine if AI Answer is needed (Intelligent Intent)
                try {
                    const answer = await getDetailedAnswer(query, language);
                    setAiAnswer(answer);
                } catch (e) {
                    console.error("AI Answer failed", e);
                }

            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
                setLoadingAi(false);
            }
        };

        performSearch();
    }, [query, language]);

    const hasResults = verseResults.length > 0 || postResults.length > 0 || aiAnswer;

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
                    <p className="text-stone-500 animate-pulse">Buscando na sabedoria antiga...</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Chat Suggestion - ALWAYS VISIBLE now per user request */}
                    <div className="animate-slideUp">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageCircle size={18} className="text-bible-gold" />
                            <h3 className="font-bold text-sm uppercase tracking-widest text-stone-500">Aprofunde no Chat</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate(`/chat?p=${encodeURIComponent(query)}`)}
                                className="px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-bible-gold hover:text-white transition-all text-sm border border-stone-200 dark:border-stone-700"
                            >
                                💬 Conversar sobre "{query}"
                            </button>
                            <button
                                onClick={() => navigate(`/chat?p=${encodeURIComponent("O que a Bíblia diz sobre " + query + "?")}`)}
                                className="px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-bible-gold hover:text-white transition-all text-sm border border-stone-200 dark:border-stone-700"
                            >
                                📖 O que a Bíblia diz?
                            </button>
                            <button
                                onClick={() => navigate(`/chat?p=${encodeURIComponent("Versículos sobre " + query)}`)}
                                className="px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-bible-gold hover:text-white transition-all text-sm border border-stone-200 dark:border-stone-700"
                            >
                                ✨ Versículos sobre {query}
                            </button>
                        </div>
                    </div>

                    {!hasResults && !aiAnswer ? (
                        <div className="text-center py-12 opacity-60">
                            <p className="text-xl mb-4">{t.noResults}</p>
                            <button onClick={() => navigate('/')} className="text-bible-gold hover:underline">Voltar ao Início</button>
                        </div>
                    ) : (
                        <>
                            {/* 1. AI Intelligent Answer (Top Priority) */}
                            {aiAnswer && (
                                <div className="animate-slideUp">
                                    <div className={`rounded-2xl p-8 border shadow-sm relative overflow-hidden
                                ${preferences.theme === 'sepia'
                                            ? 'bg-gradient-to-br from-[#fcf9ee] to-[#f4ecd8] border-[#e6dcc6]'
                                            : preferences.theme === 'bw'
                                                ? 'bg-white border-2 border-black shadow-none'
                                                : 'bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-900 border-bible-gold/30 dark:border-bible-gold/20'}
                            `}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Sparkles size={64} className={`
                                                ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}
                                            `} />
                                        </div>

                                        <div className={`flex items-center gap-3 mb-4
                                            ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}
                                        `}>
                                            <Sparkles size={20} className="animate-pulse" />
                                            <h3 className="font-bold uppercase tracking-widest text-xs">Resumo do Tema</h3>
                                        </div>

                                        <div className={`prose dark:prose-invert max-w-none leading-relaxed
                                    ${preferences.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
                                    ${preferences.theme === 'bw' ? 'text-black prose-p:text-black prose-strong:text-black' : ''}
                                `}>
                                            {aiAnswer.split('\n').map((para, i) => (
                                                <p key={i} className="mb-3" dangerouslySetInnerHTML={{
                                                    __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                }}></p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Blog Posts Results */}
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

                            {/* 3. Bible Verses Results */}
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
                                                // Handle Book Link
                                                linkTarget = `/leitura/${normalizeBookName(res.reference)}`;
                                            } else {
                                                // Handle Verse Link
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
                                                        // Fallback for just "Book Chapter" references (no colon)
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

                            <AdUnit />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
