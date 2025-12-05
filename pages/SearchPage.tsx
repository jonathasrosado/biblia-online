import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { searchBible } from '../services/geminiService';
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
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) return;

            setIsSearching(true);
            try {
                const results = await searchBible(query, language);
                setSearchResults(results);
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
                <div className="space-y-6">
                    {searchResults.length === 0 ? (
                        <p className="opacity-70">{t.noResults}</p>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
