import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, HelpCircle, ChevronDown, ChevronUp, BookOpen, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { bibleFaqs } from '../src/data/bibleFaqData';

const categories = ['Todas', 'Geral', 'Estudo', 'Personagens', 'Teologia', 'Curiosidades'];

const BibleFaqPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const toggleFaq = (id: string) => {
        setOpenIndex(openIndex === id ? null : id);
    };

    const filteredFaqs = useMemo(() => {
        return bibleFaqs.filter(faq => {
            const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    // JSON-LD Schema for extensive FAQ
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": filteredFaqs.slice(0, 20).map(faq => ({ // Limit schema to top 20 to avoid payload size issues
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20 transition-colors font-sans">
            <SEO
                title="Perguntas Frequentes sobre a Bíblia - Respostas Completas"
                description="Encontre respostas para mais de 50 perguntas comuns sobre a Bíblia Sagrada. Tire suas dúvidas sobre fé, teologia, personagens e curiosidades bíblicas."
                url="https://bibliaonline.me/faq-biblia"
                keywords="faq biblia, perguntas e respostas biblia, duvidas biblicas, curiosidades biblia"
                schema={faqSchema}
            />

            {/* Hero Section */}
            <div className="bg-white dark:bg-stone-900 pt-24 pb-16 px-4 border-b border-stone-200 dark:border-stone-800">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bible-gold/10 text-bible-accent dark:text-bible-gold text-xs font-bold uppercase tracking-widest mb-6">
                        <HelpCircle size={14} /> Central de Dúvidas
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-bible-accent dark:text-bible-gold mb-6">
                        Perguntas Frequentes<br />sobre a Bíblia
                    </h1>
                    <p className="text-lg text-stone-600 dark:text-stone-400 mb-10 max-w-2xl mx-auto">
                        Tire suas dúvidas sobre as Escrituras, personagens bíblicos, teologia e muito mais.
                        Nossa base de conhecimento cresce a cada dia.
                    </p>

                    <div className="relative max-w-xl mx-auto mb-10">
                        <input
                            type="text"
                            placeholder="Qual é a sua dúvida?"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-lg focus:outline-none focus:ring-2 focus:ring-bible-gold focus:border-transparent transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={24} />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all
                                    ${selectedCategory === cat
                                        ? 'bg-bible-gold text-white shadow-md'
                                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-bible-gold'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-12">

                {filteredFaqs.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-stone-500 text-lg mb-4">Nenhuma pergunta encontrada para sua busca.</p>
                        <button
                            onClick={() => navigate('/chat')}
                            className="text-bible-gold font-bold hover:underline flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={20} /> Pergunte para nossa IA
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFaqs.map((faq) => (
                            <div
                                key={faq.id}
                                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300 hover:shadow-sm"
                            >
                                <button
                                    onClick={() => toggleFaq(faq.id)}
                                    className="w-full text-left p-6 flex items-start justify-between gap-4 font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                                >
                                    <span className="text-lg leading-snug">{faq.question}</span>
                                    {openIndex === faq.id ?
                                        <ChevronUp className="text-bible-gold flex-shrink-0" size={24} /> :
                                        <ChevronDown className="text-stone-400 flex-shrink-0" size={24} />
                                    }
                                </button>
                                <div
                                    className={`px-6 text-stone-600 dark:text-stone-400 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === faq.id ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-4">
                                        {faq.answer}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                                            {faq.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer CTA */}
                <div className="mt-16 bg-bible-paper dark:bg-stone-900 rounded-2xl p-8 text-center border border-stone-200 dark:border-stone-800">
                    <BookOpen size={40} className="mx-auto text-bible-accent dark:text-bible-gold mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-bible-accent dark:text-bible-gold mb-2">Ainda tem dúvidas?</h3>
                    <p className="text-stone-600 dark:text-stone-400 mb-6">
                        Nossa Inteligência Artificial pode responder perguntas específicas ou complexas na hora.
                    </p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="bg-bible-gold hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-all inline-flex items-center gap-2"
                    >
                        <MessageCircle size={18} /> Conversar com IA
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BibleFaqPage;
