import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, Heart, Shield, Sun, Cloud, Anchor, Users, Zap, Star, MessageCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '../components/SEO';
import { bibleBooks, normalizeBookName } from '../constants';

const themes = [
    { name: 'Amor', slug: 'amor', icon: Heart, color: 'text-red-500' },
    { name: 'Fé', slug: 'fé', icon: Shield, color: 'text-blue-500' },
    { name: 'Esperança', slug: 'esperança', icon: Anchor, color: 'text-teal-500' },
    { name: 'Paz', slug: 'paz', icon: Cloud, color: 'text-sky-400' },
    { name: 'Cura', slug: 'cura', icon: Sun, color: 'text-orange-500' },
    { name: 'Família', slug: 'família', icon: Users, color: 'text-indigo-500' },
    { name: 'Força', slug: 'força', icon: Zap, color: 'text-yellow-500' },
    { name: 'Sabedoria', slug: 'sabedoria', icon: Star, color: 'text-purple-500' },
];

const faqs = [
    {
        question: "Como encontrar um versículo específico?",
        answer: "Você pode usar nossa barra de busca inteligente no topo da página. Digite temas como 'amor' ou referências como 'João 3:16' para ir direto ao que procura."
    },
    {
        question: "Qual a importância de ler versículos diariamente?",
        answer: "A leiutra diária da Bíblia fortalece a fé, traz paz ao coração e oferece direção para as decisões da vida. É um momento de conexão direta com Deus."
    },
    {
        question: "Por onde começar a ler a Bíblia?",
        answer: "Recomendamos começar pelos Evangelhos, como João ou Marcos, para conhecer a vida de Jesus. O livro de Salmos também é ótimo para devocionais diários."
    },
    {
        question: "Posso compartilhar os versículos?",
        answer: "Sim! Ao acessar qualquer capítulo, você pode clicar nos versículos para copiar, criar imagens personalizadas e compartilhar com amigos e familiares."
    }
];

const VersesPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/busca?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const oldTestamentBooks = bibleBooks.filter(b => b.testament === 'Old');
    const newTestamentBooks = bibleBooks.filter(b => b.testament === 'New');

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20 transition-colors">
            <SEO
                title="Versículos da Bíblia por Tema e Livro - Estudo Bíblico Online"
                description="Explore nossa coleção completa de versículos bíblicos organizados por temas e livros. Encontre conforto, sabedoria e direção na Palavra de Deus hoje."
                url="https://bibliaonline.me/versiculos"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": faqs.map(faq => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": faq.answer
                        }
                    }))
                }}
            />

            {/* Header / Hero */}
            <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 pt-20 pb-16 px-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bible-gold via-yellow-400 to-bible-gold opacity-50"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-bible-gold/10 text-bible-accent dark:text-bible-gold text-xs font-bold uppercase tracking-widest mb-4">
                        Biblioteca Sagrada
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-bible-accent dark:text-bible-gold mb-6 leading-tight">
                        Encontre Inspiração na<br />Palavra de Deus
                    </h1>
                    <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Seja buscando conforto em momentos difíceis ou sabedoria para grandes decisões,
                        nossa coleção organizada de versículos está aqui para guiar sua jornada espiritual.
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto transform transition-all hover:-translate-y-1">
                        <input
                            type="text"
                            placeholder="O que você está buscando hoje? (ex: ansiedade, fé, Salmos 23)"
                            className="w-full pl-14 pr-4 py-5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-lg focus:outline-none focus:ring-4 focus:ring-bible-gold/20 focus:border-bible-gold transition-all shadow-lg placeholder-stone-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-bible-gold" size={24} />
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

                {/* Themes Section */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-4">
                            Explore por Temas
                        </h2>
                        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
                            Selecionamos as passagens mais poderosas para cada momento da sua vida.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {themes.map((theme) => (
                            <button
                                key={theme.slug}
                                onClick={() => navigate(`/busca?q=${encodeURIComponent(theme.name)}`)}
                                className="group bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 hover:shadow-xl hover:border-bible-gold/50 dark:hover:border-bible-gold/50 transition-all duration-300 flex flex-col items-center gap-4 text-center"
                            >
                                <div className={`p-4 rounded-full bg-stone-50 dark:bg-stone-800 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-stone-700 transition-all duration-300 shadow-sm ${theme.color}`}>
                                    <theme.icon size={32} />
                                </div>
                                <span className="font-bold text-lg text-stone-700 dark:text-stone-300 group-hover:text-bible-accent dark:group-hover:text-bible-gold transition-colors">
                                    {theme.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Why Read / Value Proposition */}
                <section className="bg-bible-paper dark:bg-stone-900 rounded-3xl p-8 md:p-12 border border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-serif font-bold text-bible-accent dark:text-bible-gold">
                                Por que estudar os versículos bíblicos?
                            </h2>
                            <div className="prose dark:prose-invert text-stone-600 dark:text-stone-400 text-lg leading-relaxed space-y-4">
                                <p>
                                    A Bíblia não é apenas um livro antigo, mas uma fonte viva de sabedoria que atravessa gerações.
                                    Ler as escrituras diariamente pode transformar sua perspectiva, trazendo <strong>paz interior</strong> e
                                    clareza mental em meio ao caos do cotidiano.
                                </p>
                                <p>
                                    Cada versículo carrega uma promessa ou um ensinamento. Ao memorizar e meditar nessas palavras,
                                    você constrói um alicerce espiritual sólido, capaz de resistir às tempestades da vida.
                                    É o alimento para a alma que nos lembra do amor incondicional de Deus.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                                <h3 className="font-bold text-bible-accent dark:text-bible-gold mb-2 flex items-center gap-2">
                                    <Shield size={20} /> Fortaleza Espiritual
                                </h3>
                                <p className="text-sm text-stone-600 dark:text-stone-400">Encontre força e coragem nas histórias de fé dos grandes heróis bíblicos.</p>
                            </div>
                            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                                <h3 className="font-bold text-bible-accent dark:text-bible-gold mb-2 flex items-center gap-2">
                                    <Sun size={20} /> Clareza e Direção
                                </h3>
                                <p className="text-sm text-stone-600 dark:text-stone-400">Versículos de sabedoria que iluminam o caminho para decisões sábias.</p>
                            </div>
                            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                                <h3 className="font-bold text-bible-accent dark:text-bible-gold mb-2 flex items-center gap-2">
                                    <Heart size={20} /> Consolo e Esperança
                                </h3>
                                <p className="text-sm text-stone-600 dark:text-stone-400">Palavras de conforto para os momentos de angústia e incerteza.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Study Tools */}
                <section>
                    <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-8 text-center">
                        Ferramentas de Estudo
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <button
                            onClick={() => navigate('/chat')}
                            className="group relative overflow-hidden bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 text-left shadow-lg"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <MessageCircle size={120} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-3 rounded-lg mb-4 text-bible-gold backdrop-blur-sm">
                                    <MessageCircle size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Chat Teológico</h3>
                                <p className="text-stone-300 mb-6 max-w-xs">
                                    Tire suas dúvidas sobre passagens complexas com nossa Inteligência Artificial especializada em teologia.
                                </p>
                                <span className="inline-flex items-center text-bible-gold font-bold group-hover:translate-x-2 transition-transform">
                                    Começar Conversa →
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/devocional')}
                            className="group relative overflow-hidden bg-gradient-to-br from-bible-gold to-yellow-600 rounded-2xl p-8 text-left shadow-lg"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Calendar size={120} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-3 rounded-lg mb-4 text-white backdrop-blur-sm">
                                    <Calendar size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Devocional Diário</h3>
                                <p className="text-white/90 mb-6 max-w-xs">
                                    Receba uma reflexão inspiradora todos os dias para começar sua manhã conectado com Deus.
                                </p>
                                <span className="inline-flex items-center text-white font-bold group-hover:translate-x-2 transition-transform">
                                    Ler Devocional →
                                </span>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Books Section */}
                <div className="grid md:grid-cols-2 gap-12 pt-8">
                    {/* Old Testament */}
                    <section>
                        <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-6 flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
                            <Book className="text-bible-type-old" size={24} />
                            Antigo Testamento
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {oldTestamentBooks.map((book) => (
                                <button
                                    key={book.name}
                                    onClick={() => navigate(`/leitura/${normalizeBookName(book.name)}`)}
                                    className="text-left px-4 py-3 rounded-lg hover:bg-white dark:hover:bg-stone-800 hover:shadow-md transition-all text-stone-600 dark:text-stone-400 hover:text-bible-accent dark:hover:text-bible-gold font-medium text-sm border border-transparent hover:border-stone-100 dark:hover:border-stone-700"
                                >
                                    {book.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* New Testament */}
                    <section>
                        <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-6 flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
                            <Book className="text-bible-type-new" size={24} />
                            Novo Testamento
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {newTestamentBooks.map((book) => (
                                <button
                                    key={book.name}
                                    onClick={() => navigate(`/leitura/${normalizeBookName(book.name)}`)}
                                    className="text-left px-4 py-3 rounded-lg hover:bg-white dark:hover:bg-stone-800 hover:shadow-md transition-all text-stone-600 dark:text-stone-400 hover:text-bible-accent dark:hover:text-bible-gold font-medium text-sm border border-transparent hover:border-stone-100 dark:hover:border-stone-700"
                                >
                                    {book.name}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* FAQ Section */}
                <section className="pt-8 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-8 text-center">
                        Perguntas Frequentes
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left p-6 flex items-center justify-between font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                                >
                                    {faq.question}
                                    {openFaqIndex === index ?
                                        <ChevronUp className="text-bible-gold" size={20} /> :
                                        <ChevronDown className="text-stone-400" size={20} />
                                    }
                                </button>
                                <div
                                    className={`px-6 text-stone-600 dark:text-stone-400 overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    {faq.answer}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default VersesPage;
