import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Map, Clock, MessageCircle, ArrowRight, CheckCircle2, Star, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '../components/SEO';

interface HowToReadBiblePageProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

const HowToReadBiblePage: React.FC<HowToReadBiblePageProps> = ({ theme }) => {
    const isBw = theme === 'bw';
    const navigate = useNavigate();
    const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const steps = [
        {
            title: "Escolha uma Versão Fácil",
            desc: "Se você é iniciante, comece com versões como NVI (Nova Versão Internacional) ou NTLH (Nova Tradução na Linguagem de Hoje). Elas usam um português mais moderno e compreensível.",
            icon: BookOpen,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            title: "Comece pelos Evangelhos",
            desc: "Não tente ler de Gênesis a Apocalipse direto. Comece pelo livro de Mateus, Marcos, Lucas ou João para conhecer a vida e os ensinamentos de Jesus.",
            icon: Map,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            title: "Defina um Tempo Diário",
            desc: "Consistência é mais importante que quantidade. Comece com 10 a 15 minutos por dia. Escolha um horário tranquilo onde você não será interrompido.",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/20"
        },
        {
            title: "Ore Antes de Ler",
            desc: "A Bíblia é um livro espiritual. Peça a Deus sabedoria e entendimento antes de começar. Isso ajuda a conectar seu coração com a mensagem.",
            icon: MessageCircle,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/20"
        }
    ];

    const plans = [
        {
            title: "Plano Iniciante",
            desc: "Focado na vida de Jesus e primeiros passos na fé.",
            items: ["Evangelho de João", "Evangelho de Marcos", "Carta aos Romanos", "Salmos (1 por dia)"]
        },
        {
            title: "Sabedoria Diária",
            desc: "Para quem busca direção e conselhos práticos.",
            items: ["Provérbios (1 cap por dia)", "Eclesiastes", "Tiago", "Sermão do Monte (Mateus 5-7)"]
        },
        {
            title: "Grandes Histórias",
            desc: "Conheça os heróis e os grandes eventos bíblicos.",
            items: ["Gênesis", "Êxodo", "1 e 2 Samuel (Davi)", "Daniel"]
        }
    ];

    const faqs = [
        {
            question: "Qual a melhor Bíblia para começar?",
            answer: "Recomendamos a NVI (Nova Versão Internacional) pela clareza. Evite versões muito antigas como a Almeida Corrigida Fiel (ACF) no início, pois a linguagem arcaica pode dificultar o entendimento."
        },
        {
            question: "Preciso ler a Bíblia na ordem?",
            answer: "Não! A Bíblia é uma biblioteca de 66 livros. Para cristãos iniciantes, a ordem cronológica ou começar pelo Novo Testamento faz muito mais sentido do que a ordem canônica (capa a capa)."
        },
        {
            question: "O que fazer se não entender algo?",
            answer: "Não trave. Continue lendo para pegar o contexto geral. Você também pode usar nosso Chat Teológico para perguntar o significado de passagens específicas."
        }
    ];

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20 transition-colors font-sans">
            <SEO
                title="Como Ler a Bíblia - Guia Completo para Iniciantes"
                description="Aprenda como ler a Bíblia do início ao fim. Dicas práticas de estudo bíblico, planos de leitura e orientações para começar sua jornada espiritual."
                url="https://bibliaonline.me/como-ler-biblia"
                keywords="como ler a biblia, como começar a ler a biblia, estudo biblico para iniciantes, plano de leitura biblica"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "HowTo",
                    "name": "Como Ler a Bíblia",
                    "step": steps.map((s, i) => ({
                        "@type": "HowToStep",
                        "position": i + 1,
                        "name": s.title,
                        "text": s.desc
                    }))
                }}
            />

            {/* Hero Section */}
            <div className={`pt-24 pb-20 px-4 border-b relative overflow-hidden
              ${isBw
                    ? 'bg-white border-black text-black'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
            `}>
                {!isBw && (
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-bible-gold/10 to-transparent pointer-events-none"></div>
                )}
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6
                      ${isBw ? 'bg-black text-white' : 'bg-bible-gold/10 text-bible-accent dark:text-bible-gold'}
                    `}>
                        <Star size={14} /> Guia Definitivo
                    </span>
                    <h1 className={`text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight
                      ${isBw ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}
                    `}>
                        Como Ler a Bíblia e<br />Entender Sua Mensagem
                    </h1>
                    <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Começar pode parecer intimidante, mas com o método certo, a leitura das escrituras se torna a parte mais transformadora do seu dia.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/leitura/mateus/1')}
                            className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2
                              ${isBw ? 'bg-black text-white hover:bg-stone-800' : 'bg-bible-gold hover:bg-yellow-600 text-white'}
                            `}
                        >
                            Começar por Mateus <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/chat')}
                            className="bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-bible-gold dark:hover:border-bible-gold px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={20} /> Tirar Dúvidas
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-16 space-y-24">

                {/* Steps Section */}
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-4">
                            4 Passos Para Começar Hoje
                        </h2>
                        <p className="text-stone-600 dark:text-stone-400">
                            Siga este roteiro simples para criar um hábito duradouro.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {steps.map((step, index) => (
                            <div key={index} className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow flex gap-6">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-full ${step.bg} ${step.color} flex items-center justify-center`}>
                                    <step.icon size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">
                                        {index + 1}. {step.title}
                                    </h3>
                                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-sm">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Plans Section */}
                <section className="bg-bible-paper dark:bg-stone-900 rounded-3xl p-8 md:p-12 border border-stone-200 dark:border-stone-800 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-serif font-bold text-bible-accent dark:text-bible-gold mb-8 text-center">
                            Sugestões de Leitura
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {plans.map((plan, i) => (
                                <div key={i} className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-6 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                                    <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200 mb-2">{plan.title}</h3>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 h-8">{plan.desc}</p>
                                    <ul className="space-y-2">
                                        {plan.items.map((item, j) => (
                                            <li key={j} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                                                <CheckCircle2 size={14} className="text-bible-gold" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section>
                    <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-200 mb-8 text-center">
                        Dúvidas Comuns
                    </h2>
                    <div className="space-y-4 max-w-3xl mx-auto">
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

                {/* Final CTA */}
                <div className="text-center bg-stone-900 text-white rounded-3xl p-12 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-serif font-bold mb-4">Pronto para começar?</h2>
                        <p className="text-stone-300 mb-8 max-w-xl mx-auto">
                            Não espere o momento perfeito. A melhor hora para ouvir a voz de Deus é agora.
                        </p>
                        <button
                            onClick={() => navigate('/leitura/joao/1')}
                            className="bg-white text-stone-900 px-8 py-3 rounded-full font-bold hover:bg-stone-100 transition-colors inline-flex items-center gap-2"
                        >
                            Ler Evangelho de João <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HowToReadBiblePage;
