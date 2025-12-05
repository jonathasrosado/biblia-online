import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { searchBible, getDetailedAnswer } from '../services/geminiService';
import { normalizeBookName } from '../constants';
import { ReadingPreferences } from '../types';
import { AdUnit } from '../components/AdUnit';

interface SearchPageProps {
    language: string;
    t: any;
    preferences: ReadingPreferences;
}

const SearchPage: React.FC<SearchPageProps> = ({ language, t, preferences }) => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) return;

            setIsSearching(true);
            setAiSummary(''); // Clear previous summary

            try {
                // Run in parallel
                const [results, answer] = await Promise.all([
                    searchBible(query, language),
                    getDetailedAnswer(query, language)
                ]);

                setAiSummary(answer);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [query, language]);

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-12">
            <Helmet>
                <title>{`${t.resultsFor} "${query}" - ${t.appTitle}`}</title>
                <meta name="description" content={`Resultados da busca por "${query}" na Bíblia Sagrada.`} />
            </Helmet>

            <h2 className="text-3xl font-serif mb-6 text-bible-accent dark:text-bible-gold transition-colors">
                {t.resultsFor} "{query}"
            </h2>

            {isSearching ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* AI Smart Summary Section */}
                    {aiSummary && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                <span className="text-xl">✨</span> Resposta Inteligente
                            </h3>
                            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300">
                                {aiSummary}
                            </div>
                        </div>
                    )}

                    {searchResults.length === 0 ? (
                        <p className="opacity-70">{t.noResults}</p>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-xl font-serif text-stone-500 dark:text-stone-400">Versículos Encontrados ({searchResults.length})</h3>
                            {searchResults.map((res, idx) => {
                                const parseReference = (ref: string) => {
                                    try {
                                        const lastColon = ref.lastIndexOf(':');
                                        if (lastColon === -1) return null;
                                        const verse = ref.substring(lastColon + 1);
                                        const rest = ref.substring(0, lastColon);
                                        const lastSpace = rest.lastIndexOf(' ');
                                        if (lastSpace === -1) return null;
                                        const chapter = rest.substring(lastSpace + 1);
                                        const book = rest.substring(0, lastSpace);
                                        return { book, chapter, verse };
                                    } catch (e) {
                                        return null;
                                    }
                                };

                                const parsed = parseReference(res.reference);
                                const linkTarget = parsed
                                    ? `/leitura/${normalizeBookName(parsed.book)}/${parsed.chapter}?verses=${parsed.verse}`
                                    : '#';

                                return (
                                    <Link
                                        to={linkTarget}
                                        key={idx}
                                        className={`block p-6 rounded-xl border shadow-sm hover:shadow-md transition-all group
                                            ${preferences.theme === 'sepia'
                                                ? 'bg-[#fcf9ee] border-[#e6dcc6] hover:border-[#d6cba6]'
                                                : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-bible-gold/30'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-serif text-xl text-bible-accent dark:text-bible-gold mb-2 group-hover:underline decoration-bible-gold/50 underline-offset-4">
                                                {res.reference}
                                            </h3>
                                            <span className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                                                Ver Versículo
                                            </span>
                                        </div>
                                        <p className="opacity-90 leading-relaxed">{res.text}</p>
                                        <p className="text-xs opacity-50 mt-4 uppercase tracking-wide">{t.context}: {res.context}</p>
                                    </Link>
                                );
                            })}
                            <AdUnit />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
