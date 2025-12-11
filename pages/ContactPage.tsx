import React, { useState } from 'react';
import { Mail, Send, MapPin, Phone } from 'lucide-react';

interface ContactPageProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

const ContactPage: React.FC<ContactPageProps> = ({ theme }) => {
    const isBw = theme === 'bw';
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would implement the email sending logic
        alert('Obrigado pelo contato! Em breve retornaremos.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className={`max-w-4xl mx-auto px-6 py-12 space-y-12 
      ${isBw ? 'text-black' : 'text-stone-900 dark:text-stone-100'}
    `}>
            <div className="text-center space-y-4">
                <h1 className={`text-3xl md:text-4xl font-bold font-serif
          ${isBw ? 'text-black uppercase tracking-wider' : 'text-bible-gold'}
        `}>Entre em Contato</h1>
                <p className={`text-lg max-w-2xl mx-auto
           ${isBw ? 'text-black/70' : 'text-stone-600 dark:text-stone-400'}
        `}>
                    Tem alguma dúvida, sugestão ou testemunho para compartilhar? Adoraríamos ouvir você.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div className="space-y-8">
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold font-serif">Nossos Canais</h2>

                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg 
                ${isBw ? 'bg-black text-white' : 'bg-stone-100 dark:bg-stone-900 text-bible-gold'}
              `}>
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <p className={`${isBw ? 'text-black' : 'text-stone-600 dark:text-stone-400'}`}>contato@bibliaonline.com.br</p>
                                <p className="text-sm text-stone-500">Respondemos em até 24h</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg 
                ${isBw ? 'bg-black text-white' : 'bg-stone-100 dark:bg-stone-900 text-bible-gold'}
              `}>
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Localização</h3>
                                <p className={`${isBw ? 'text-black' : 'text-stone-600 dark:text-stone-400'}`}>São Paulo, SP - Brasil</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-xl border
            ${isBw ? 'bg-white border-black text-black' : 'bg-bible-gold/10 border-bible-gold/20'}
          `}>
                        <h3 className="font-bold mb-2">Nota sobre Suporte</h3>
                        <p className="text-sm leading-relaxed">
                            Nossa equipe de suporte trabalha de segunda a sexta, das 9h às 18h. Mensagens enviadas aos fins de semana serão respondidas no próximo dia útil.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className={`p-6 md:p-8 rounded-2xl shadow-sm border
           ${isBw
                        ? 'bg-white border-black text-black'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
        `}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">Nome</label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border outline-none transition-all
                  ${isBw
                                        ? 'bg-white border-black focus:ring-2 focus:ring-black/20 text-black placeholder-black/50'
                                        : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-bible-gold/50'}
                `}
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border outline-none transition-all
                  ${isBw
                                        ? 'bg-white border-black focus:ring-2 focus:ring-black/20 text-black placeholder-black/50'
                                        : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-bible-gold/50'}
                `}
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium mb-1">Mensagem</label>
                            <textarea
                                id="message"
                                required
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className={`w-full px-4 py-2 rounded-lg border outline-none transition-all resize-none
                  ${isBw
                                        ? 'bg-white border-black focus:ring-2 focus:ring-black/20 text-black placeholder-black/50'
                                        : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-bible-gold/50'}
                `}
                                placeholder="Como podemos ajudar?"
                            />
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-3 font-bold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                 ${isBw
                                    ? 'bg-black hover:bg-stone-800 text-white'
                                    : 'bg-bible-gold hover:bg-yellow-600 text-white'}
              `}
                        >
                            <Send size={18} />
                            Enviar Mensagem
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
