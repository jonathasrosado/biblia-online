import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Shield, Sun, Cloud, Calendar, MessageCircle, DollarSign, Brain, Hourglass } from 'lucide-react';
import SEO from '../components/SEO';

const themes = [
    { name: 'Ansiedade', slug: 'ansiedade', icon: Brain, color: 'text-purple-500' },
    { name: 'Dinheiro', slug: 'dinheiro', icon: DollarSign, color: 'text-green-500' },
    { name: 'Amor', slug: 'amor', icon: Heart, color: 'text-red-500' },
    { name: 'Saúde', slug: 'saude', icon: Sun, color: 'text-orange-500' },
    { name: 'Medo', slug: 'medo', icon: Shield, color: 'text-blue-500' },
    { name: 'Futuro', slug: 'futuro', icon: Hourglass, color: 'text-teal-500' },
];

const VersesPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/chat?p=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20 transition-colors">
            <SEO
                title="Versículos da Bíblia por Tema - Estudo Bíblico Online"
                description="Encontre palavras da Bíblia para o que você está vivendo agora. Versículos sobre ansiedade, dinheiro, amor, saúde, medo e futuro."
                url="https://bibliaonline.me/versiculos"
            />

            {/* Header / Hero */}
            <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 pt-20 pb-16 px-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bible-gold via-yellow-400 to-bible-gold opacity-50"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-bible-gold/10 text-bible-accent dark:text-bible-gold text-xs font-bold uppercase tracking-widest mb-4">
                        Biblioteca Sagrada
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-bible-accent dark:text-bible-gold mb-4 leading-tight">
                        Versículos por Tema
                    </h1>
                    <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Encontre palavras da Bíblia para o que você está vivendo agora
                    </p>

                    {/* Themes Grid - ABOVE Search */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8 max-w-3xl mx-auto">
                        {themes.map((theme) => (
                            <button
                                key={theme.slug}
                                onClick={() => navigate(`/chat?p=versiculos-que-falam-sobre-${theme.slug}`)}
                                className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 border border-stone-100 dark:border-stone-700 hover:border-bible-gold/30 hover:shadow-md transition-all duration-300"
                            >
                                <div className={`p-2 rounded-full bg-white dark:bg-stone-900 shadow-sm ${theme.color} group-hover:scale-110 transition-transform`}>
                                    <theme.icon size={20} />
                                </div>
                                <span className="text-sm font-medium text-stone-600 dark:text-stone-300 group-hover:text-bible-accent dark:group-hover:text-bible-gold">
                                    {theme.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Input - BELOW Themes */}
                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto transform transition-all hover:-translate-y-1">
                        <input
                            type="text"
                            placeholder="Buscar outros temas (ex: paz, gratidão, sabedoria)"
                            className="w-full pl-14 pr-4 py-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-base focus:outline-none focus:ring-2 focus:ring-bible-gold/20 focus:border-bible-gold transition-all shadow-sm focus:shadow-md placeholder-stone-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

                {/* Emotional States - "How are you feeling?" */}
                <section>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-2">
                            Como você está se sentindo hoje?
                        </h2>
                        <p className="text-stone-600 dark:text-stone-400">
                            Escolha uma opção e veja versículos relacionados
                        </p>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 overflow-x-auto pb-4 px-4 -mx-4 md:mx-0 md:pb-0 scrollbar-hide">
                        {[
                            { label: '😖 Ansioso', slug: 'ansiedade' },
                            { label: '😨 Com medo', slug: 'medo' },
                            { label: '😢 Triste', slug: 'tristeza' },
                            { label: '😫 Cansado', slug: 'cansaco' },
                            { label: '🤔 Perdido', slug: 'direcao' },
                            { label: '🥰 Grato', slug: 'gratidao' },
                        ].map((feeling) => (
                            <button
                                key={feeling.label}
                                onClick={() => navigate(`/chat?p=versiculos-que-falam-sobre-${feeling.slug}`)}
                                className="whitespace-nowrap px-6 py-3 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-bible-gold hover:text-white dark:hover:text-stone-900 hover:border-bible-gold active:scale-95 transition-all shadow-sm hover:shadow-md flex-shrink-0 font-medium"
                            >
                                {feeling.label}
                            </button>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default VersesPage;
