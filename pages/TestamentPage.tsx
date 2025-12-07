import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Book, Scroll, Star } from 'lucide-react';
import { bibleBooks, normalizeBookName } from '../constants';

interface TestamentPageProps {
    testament: 'Old' | 'New';
    language: string;
    t: any;
}

// Helper to define categories
const CATEGORIES: Record<string, string[]> = {
    // ANTIGO TESTAMENTO
    'Pentateuco': ['Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio'],
    'Históricos': ['Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester'],
    'Poéticos': ['Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cânticos'],
    'Profetas Maiores': ['Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel'],
    'Profetas Menores': ['Oseias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias'],

    // NOVO TESTAMENTO
    'Evangelhos': ['Mateus', 'Marcos', 'Lucas', 'João'],
    'Histórico': ['Atos'],
    'Cartas de Paulo': ['Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom'],
    'Cartas Gerais': ['Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas'],
    'Profético': ['Apocalipse']
};

const TestamentPage: React.FC<TestamentPageProps> = ({ testament, language, t }) => {
    const navigate = useNavigate();
    const isOld = testament === 'Old';

    const title = isOld ? t.oldTestament + ' Testamento' : t.newTestament + ' Testamento'; // Basic concat fail-safe

    // Refined Titles
    const displayTitle = language === 'pt'
        ? (isOld ? 'Antigo Testamento' : 'Novo Testamento')
        : (isOld ? 'Old Testament' : 'New Testament');

    const seoTitle = `${displayTitle} - Bíblia Online Inteligente`;

    const description = isOld
        ? "A fundação da fé, narrando a criação, a lei e a história do povo de Israel antes de Cristo."
        : "A revelação da graça, narrando a vida de Jesus, o início da igreja e a promessa da vida eterna.";

    // Filter books
    const filteredBooks = bibleBooks.filter(b => b.testament === testament);

    // Group books by defined categories (preserving order)
    // We need to know which categories belong to this testament
    const testamentCategories = isOld
        ? ['Pentateuco', 'Históricos', 'Poéticos', 'Profetas Maiores', 'Profetas Menores']
        : ['Evangelhos', 'Histórico', 'Cartas de Paulo', 'Cartas Gerais', 'Profético'];

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 animate-fadeIn text-stone-900 dark:text-stone-100 pb-20">
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={description} />
            </Helmet>

            {/* Header */}
            <div className="bg-bible-paper dark:bg-stone-900 pt-24 pb-16 px-6 relative overflow-hidden text-center border-b border-stone-200 dark:border-stone-800">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-bible-gold/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                <button
                    onClick={() => navigate('/')}
                    className="absolute top-24 left-6 md:left-12 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bible-gold/10 text-bible-gold font-bold text-[10px] uppercase tracking-widest mb-6">
                    <Book size={12} className="fill-current" />
                    <span>{isOld ? '39 Livros' : '27 Livros'}</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-serif font-bold text-bible-accent dark:text-bible-gold mb-6 tracking-tight">
                    {displayTitle}
                </h1>

                <p className="max-w-2xl mx-auto text-lg opacity-70 font-serif leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">

                {testamentCategories.map(category => {
                    // Find books for this category
                    const booksInCategory = CATEGORIES[category];
                    // Filter the actual bibleBooks objects that match names in this category
                    const categoryBooks = filteredBooks.filter(b => booksInCategory.includes(b.name));

                    if (categoryBooks.length === 0) return null;

                    return (
                        <div key={category} className="mb-16 last:mb-0 animate-slideUp">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800"></div>
                                <h2 className="text-xl font-serif font-bold text-bible-gold uppercase tracking-widest border px-4 py-1 rounded-full border-bible-gold/20">
                                    {category}
                                </h2>
                                <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800"></div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {categoryBooks.map((book) => (
                                    <button
                                        key={book.name}
                                        onClick={() => navigate(`/leitura/${normalizeBookName(book.name)}`)}
                                        className="group relative p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-bible-gold dark:hover:border-bible-gold hover:shadow-lg transition-all text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Scroll size={40} className="text-bible-gold" />
                                        </div>

                                        <div className="relative z-10">
                                            <span className="block text-2xl font-bold font-serif mb-2 group-hover:text-bible-gold transition-colors">
                                                {book.name}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
                                                <span className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md group-hover:bg-bible-gold/10 group-hover:text-bible-gold transition-colors">
                                                    {book.chapters} Caps
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div>
    );
};

export default TestamentPage;
