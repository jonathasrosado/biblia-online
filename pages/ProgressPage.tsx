import React, { useState, useMemo } from 'react';
import { bibleBooks } from '../constants';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, BookOpen, ChevronDown, ChevronUp, CheckCircle, BarChart2 } from 'lucide-react';
import { BibleBook } from '../types';

interface ProgressPageProps {
    user: any;
    theme: 'light' | 'dark' | 'sepia' | 'bw';
}

const ProgressPage: React.FC<ProgressPageProps> = ({ user, theme }) => {
    const [expandedBook, setExpandedBook] = useState<string | null>(null);

    // --- CALCULATIONS ---
    const totalChaptersInBible = 1189;

    const completedChaptersSet = useMemo(() => {
        const set = new Set<string>();
        if (user?.completedChapters) {
            user.completedChapters.forEach((c: any) => {
                set.add(`${c.book}-${c.chapter}`);
            });
        }
        return set;
    }, [user]);

    const totalRead = completedChaptersSet.size;
    const progressPercentage = Math.round((totalRead / totalChaptersInBible) * 1000) / 10; // 1 decimal place

    // Mock Streak Calculation (needs real logic based on dates in history/completed)
    // For now, if we have any history, let's say 1 day, else 0.
    // Real implementation would look at consecutive dates in user.history.
    const currentStreak = user?.history?.length > 0 ? 1 : 0;

    const getBookProgress = (book: BibleBook) => {
        let readCount = 0;
        for (let i = 1; i <= book.chapters; i++) {
            if (completedChaptersSet.has(`${book.name}-${i}`)) {
                readCount++;
            }
        }
        return {
            count: readCount,
            percent: Math.round((readCount / book.chapters) * 100)
        };
    };

    const toggleBook = (bookName: string) => {
        if (expandedBook === bookName) {
            setExpandedBook(null);
        } else {
            setExpandedBook(bookName);
        }
    };

    if (!user) {
        return (
            <div className="relative min-h-[80vh] overflow-hidden">
                {/* --- MOCK BACKGROUND (Blurred) --- */}
                <div className="filter blur-sm opacity-50 pointer-events-none p-4 md:p-8 select-none">
                    {/* Header Mock */}
                    <header className="mb-8 md:mb-12">
                        <h1 className={`text-3xl md:text-4xl font-serif font-bold mb-3 ${theme === 'dark' ? 'text-stone-700' : 'text-stone-300'}`}>
                            Meu Progresso
                        </h1>
                        <p className={`text-lg opacity-50 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                            Descubra quanto da Bíblia você já leu.
                        </p>
                    </header>

                    {/* Stats Mock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
                        {/* Mock Streak */}
                        <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between
                            ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
                            <div>
                                <div className="text-sm uppercase tracking-wider opacity-60 font-semibold mb-1">Sequência Diária</div>
                                <div className="text-4xl font-bold flex items-baseline gap-2">
                                    12 <span className="text-lg font-normal opacity-60">dias</span>
                                </div>
                                <p className="text-xs mt-2 opacity-50">Sua sequência atual de leitura</p>
                            </div>
                            <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-orange-500/10 text-orange-900' : 'bg-orange-50 text-orange-200'}`}>
                                <Calendar size={32} />
                            </div>
                        </div>
                        {/* Mock Total */}
                        <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between
                            ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
                            <div className="w-full">
                                <div className="text-sm uppercase tracking-wider opacity-60 font-semibold mb-1">Leitura Total</div>
                                <div className="text-4xl font-bold mb-3">42%</div>
                                <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[42%]"></div>
                                </div>
                            </div>
                            <div className={`ml-4 p-4 rounded-full ${theme === 'dark' ? 'bg-green-500/10 text-green-900' : 'bg-green-50 text-green-200'}`}>
                                <Trophy size={32} />
                            </div>
                        </div>
                    </div>

                    {/* Mock Books List */}
                    <div className="space-y-4 opacity-50">
                        <div className={`rounded-xl border p-6 flex items-center gap-4 ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center"><CheckCircle size={20} /></div>
                            <div className="flex-1">
                                <h4 className="font-serif font-bold text-lg">Gênesis</h4>
                                <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full mt-2"><div className="h-full bg-green-500 w-full rounded-full" /></div>
                            </div>
                        </div>
                        <div className={`rounded-xl border p-6 flex items-center gap-4 ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
                            <div className="w-10 h-10 rounded-full bg-bible-gold text-white flex items-center justify-center text-xs font-bold">35%</div>
                            <div className="flex-1">
                                <h4 className="font-serif font-bold text-lg">Êxodo</h4>
                                <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full mt-2"><div className="h-full bg-bible-gold w-[35%] rounded-full" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CTA OVERLAY --- */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 bg-gradient-to-b from-transparent via-white/90 to-white dark:via-stone-950/90 dark:to-stone-950">
                    <div className={`max-w-md w-full p-8 rounded-3xl shadow-xl text-center transform transition-all
                        ${theme === 'dark' ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-stone-100'}`}>

                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6
                            ${theme === 'dark' ? 'bg-bible-gold/10 text-bible-gold' : 'bg-bible-gold/10 text-bible-gold'}`}>
                            <BarChart2 size={40} />
                        </div>

                        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Acompanhe sua Evolução</h2>
                        <p className={`mb-8 leading-relaxed ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                            Mantenha o foco na sua jornada espiritual. Visualize gráficos, ganhe medalhas e veja sua sequência diária de leitura.
                        </p>

                        <div className="space-y-4">
                            <Link to="/login" className="block w-full py-4 rounded-xl bg-bible-gold text-white font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg shadow-bible-gold/20">
                                Fazer Login
                            </Link>
                            <Link to="/signup" className={`block w-full py-4 rounded-xl font-bold border transition-colors
                                ${theme === 'dark'
                                    ? 'border-stone-700 hover:bg-stone-800 text-stone-300'
                                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'}`}>
                                Criar Conta Grátis
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-fadeIn">
            {/* Header */}
            <header className="mb-8 md:mb-12">
                <h1 className={`text-3xl md:text-4xl font-serif font-bold mb-3
                    ${theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>
                    Meu Progresso
                </h1>
                <p className={`text-lg opacity-80 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                    Descubra quanto da Bíblia você já leu e mantenha sua constância.
                </p>
            </header>

            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">

                {/* Streak Card */}
                <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between
                    ${theme === 'dark'
                        ? 'bg-stone-900 border-stone-800'
                        : 'bg-white border-stone-100'}`}>
                    <div>
                        <div className="text-sm uppercase tracking-wider opacity-60 font-semibold mb-1">Sequência Diária</div>
                        <div className="text-4xl font-bold flex items-baseline gap-2">
                            {currentStreak}
                            <span className="text-lg font-normal opacity-60">dias</span>
                        </div>
                        <p className="text-xs mt-2 opacity-50">Sua sequência atual de leitura diária</p>
                    </div>
                    <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                        <Calendar size={32} />
                    </div>
                </div>

                {/* Total Progress Card */}
                <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between
                    ${theme === 'dark'
                        ? 'bg-stone-900 border-stone-800'
                        : 'bg-white border-stone-100'}`}>
                    <div>
                        <div className="text-sm uppercase tracking-wider opacity-60 font-semibold mb-1">Leitura Total</div>
                        <div className="text-4xl font-bold flex items-baseline gap-2">
                            {progressPercentage}%
                            <span className="text-lg font-normal opacity-60">da Bíblia</span>
                        </div>
                        <div className="w-32 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                    <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        <Trophy size={32} />
                    </div>
                </div>
            </div>

            {/* Books List Header */}
            <div className="flex items-center gap-3 mb-6 opacity-80">
                <BookOpen size={20} />
                <h3 className="font-bold uppercase tracking-widest text-sm">Progresso por Livro</h3>
            </div>

            {/* Books Grid/List */}
            <div className="space-y-4">
                {bibleBooks.map((book) => {
                    const stats = getBookProgress(book);
                    const expanded = expandedBook === book.name;
                    const isComplete = stats.percent === 100;

                    return (
                        <div
                            key={book.name}
                            className={`rounded-xl border transition-all duration-300 overflow-hidden
                                ${theme === 'dark'
                                    ? 'bg-stone-900 border-stone-800 hover:border-stone-700'
                                    : 'bg-white border-stone-100 hover:border-bible-gold/30 shadow-sm'}
                            `}
                        >
                            {/* Book Row Header */}
                            <div
                                onClick={() => toggleBook(book.name)}
                                className="p-4 md:p-6 flex items-center gap-4 cursor-pointer select-none"
                            >
                                {/* Progress Circular (Mini) or Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                    ${isComplete
                                        ? 'bg-green-500 text-white'
                                        : theme === 'dark' ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'}`}
                                >
                                    {isComplete ? <CheckCircle size={20} /> : `${stats.percent}%`}
                                </div>

                                {/* Title & Bar */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="font-serif font-bold text-lg truncate">{book.name}</h4>
                                        <span className="text-xs opacity-50 tabular-nums">
                                            {stats.count} / {book.chapters} cap.
                                        </span>
                                    </div>

                                    {/* Bar Track */}
                                    <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-bible-gold'}`}
                                            style={{ width: `${stats.percent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-stone-400">
                                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {/* Expanded Chapters Grid */}
                            {expanded && (
                                <div className={`p-6 pt-0 border-t ${theme === 'dark' ? 'border-stone-800 bg-black/20' : 'border-stone-50 bg-stone-50/50'}`}>
                                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 mt-4 animate-fadeIn">
                                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                                            const isRead = completedChaptersSet.has(`${book.name}-${chapter}`);
                                            return (
                                                <div
                                                    key={chapter}
                                                    className={`aspect-square rounded flex items-center justify-center text-xs font-medium cursor-default transition-colors
                                                        ${isRead
                                                            ? 'bg-green-500 text-white shadow-sm'
                                                            : theme === 'dark' ? 'bg-stone-800 text-stone-600' : 'bg-white border text-stone-400'}
                                                    `}
                                                    title={`Capítulo ${chapter}`}
                                                >
                                                    {chapter}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressPage;
