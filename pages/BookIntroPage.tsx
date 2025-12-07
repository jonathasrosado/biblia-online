import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Book, Calendar, User, AlignLeft, ChevronRight, Hash, Quote, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import { bibleBooks, normalizeBookName, findBookByNormalizedName } from '../constants';
import { AdUnit } from '../components/AdUnit';

interface BookSummary {
    title: string;
    testament: string;
    author: string;
    date: string;
    theme: string;
    keyVerse: string;
    summary: string;
}

interface BookIntroPageProps {
    language: string;
    t: any;
}

const BookIntroPage: React.FC<BookIntroPageProps> = ({ language, t }) => {
    const { bookAbbrev } = useParams<{ bookAbbrev: string }>();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<BookSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Find book data
    const currentBook = findBookByNormalizedName(bookAbbrev || '');

    const fetchSummary = async (force = false) => {
        if (!currentBook) return;

        setLoading(true);
        setError(null);

        // Create a timeout promise to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido')), 90000)
        );

        try {
            const url = `/api/books/${currentBook.name}/summary?lang=${language}&t=${Date.now()}${force ? '&force=true' : ''}`;
            console.log("Fetching summary from:", url);

            const response = await Promise.race([
                fetch(url),
                timeoutPromise
            ]) as Response;

            if (!response.ok) throw new Error('Falha ao carregar resumo');
            const data = await response.json();
            console.log("Summary Data:", data); // Debug log
            setSummary(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error && err.message === 'Tempo limite excedido'
                ? "A geração do resumo está demorando muito. Tente novamente."
                : "Não foi possível carregar a introdução deste livro no momento.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentBook) {
            // Check session storage first to avoid re-fetching on simple nav
            const cacheKey = `book_summary_${currentBook.name}_${language}`;

            // Note: We bypass session cache on load if we suspect issues, but for now standard check
            fetchSummary();
        }
    }, [currentBook, language]);

    if (!currentBook) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <BookOpen size={64} className="text-stone-300 mb-4" />
                <h2 className="text-2xl font-bold text-stone-700 dark:text-stone-300">Livro não encontrado</h2>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                    Voltar para Início
                </button>
            </div>
        );
    }

    // Safe access helpers
    const getSummaryText = () => summary?.summary || '';
    const getKeyVerse = () => summary?.keyVerse || '';

    // SEO Logic
    const pageTitle = `Livro de ${currentBook.name} - Resumo, Capítulos e Estudo | Bíblia Online Inteligente`;
    const pageDescription = summary
        ? `Leia o estudo completo do livro de ${currentBook.name}. ${summary.theme}. Autor: ${summary.author}.`
        : `Explore o livro de ${currentBook.name} na Bíblia Online Inteligente. Acesse todos os capítulos, ouça em áudio fluido e leia o resumo detalhado.`;

    // Testament Label Logic
    const testamentLabel = currentBook.testament === 'Old'
        ? (language === 'en' ? 'Old Testament' : 'Antigo Testamento')
        : (language === 'en' ? 'New Testament' : 'Novo Testamento');

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-fadeIn">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <link rel="canonical" href={`https://biblia-online-inteligente.com/leitura/${normalizeBookName(currentBook.name)}`} />
            </Helmet>

            {/* Header Section */}
            <div className="text-center mb-12">
                <Link
                    to={currentBook.testament === 'Old' ? '/antigo-testamento' : '/novo-testamento'}
                    className="inline-block px-3 py-1 bg-bible-gold/10 text-bible-accent dark:text-bible-gold rounded-full text-xs font-bold uppercase tracking-wider mb-4 hover:bg-bible-gold/20 transition-colors"
                >
                    {testamentLabel}
                </Link>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-4">
                    {currentBook.name}
                </h1>
                <div className="flex items-center justify-center gap-6 text-sm text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-2">
                        <Hash size={16} />
                        <span>{currentBook.chapters} {t.chapter}s</span>
                    </div>
                </div>
            </div>

            {/* Chapters Grid - NOW AT TOP */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm mb-12">
                <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlignLeft size={20} className="text-bible-gold" />
                        {t.chapter}s
                    </span>
                    <span className="text-xs font-normal text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-full">
                        Total: {currentBook.chapters}
                    </span>
                </h3>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(num => (
                        <Link
                            key={num}
                            to={`/leitura/${normalizeBookName(currentBook.name)}/${num}`}
                            className="aspect-square flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 hover:border-bible-gold hover:bg-bible-gold/5 dark:hover:bg-bible-gold/10 text-stone-600 dark:text-stone-300 font-medium transition-all group"
                        >
                            <span className="group-hover:scale-110 transition-transform">{num}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Summary Section - NOW AT BOTTOM */}
            <div>
                {loading ? (
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-100 dark:border-stone-800 shadow-sm space-y-4 text-center">
                        <Loader2 className="animate-spin mx-auto text-bible-gold mb-4" size={32} />
                        <h3 className="text-lg font-medium text-stone-800 dark:text-stone-200">Gerando Introdução Exclusiva...</h3>
                        <p className="text-sm text-stone-500">Nossa IA está lendo e resumindo este livro para você. Isso leva apenas alguns segundos na primeira vez.</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 border border-red-100 dark:border-red-900/30 text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => fetchSummary(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors font-bold text-sm"
                        >
                            <RefreshCw size={16} />
                            Tentar Novamente (Forçar)
                        </button>
                    </div>
                ) : summary ? (
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm animate-slideUp">
                        {/* Key Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b border-stone-100 dark:border-stone-800">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                                    <User size={14} />
                                    {language === 'en' ? 'Author' : 'Autor'}
                                </div>
                                <p className="font-medium text-stone-800 dark:text-stone-200">{summary.author}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                                    <Calendar size={14} />
                                    {language === 'en' ? 'Date' : 'Data'}
                                </div>
                                <p className="font-medium text-stone-800 dark:text-stone-200">{summary.date}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                                    <AlignLeft size={14} />
                                    {language === 'en' ? 'Main Theme' : 'Tema Principal'}
                                </div>
                                <p className="font-medium text-stone-800 dark:text-stone-200">{summary.theme}</p>
                            </div>
                        </div>

                        {/* Summary Text */}
                        <div className="prose dark:prose-invert max-w-none mb-8">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <BookOpen size={20} className="text-bible-gold" />
                                {language === 'en' ? 'Overview' : 'Visão Geral'}
                            </h3>
                            <div className="text-stone-600 dark:text-stone-300 leading-relaxed space-y-4 text-justify">
                                {getSummaryText().split('\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        </div>

                        {/* Key Verse */}
                        <div className="bg-bible-gold/5 dark:bg-bible-gold/10 rounded-xl p-6 border border-bible-gold/20">
                            <div className="flex gap-3">
                                <Quote className="text-bible-gold flex-shrink-0" size={24} />
                                <div>
                                    <p className="font-serif italic text-lg text-stone-800 dark:text-stone-200 text-center md:text-left">
                                        "{getKeyVerse().replace(/"/g, '')}"
                                    </p>
                                    <p className="text-xs font-bold text-bible-accent dark:text-bible-gold mt-2 text-right uppercase tracking-wider opacity-80">
                                        Versículo Chave
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <AdUnit className="w-full mt-8" label="Publicidade" />
            </div>
        </div>
    );
};

export default BookIntroPage;
