import React from 'react';
import { BookOpen, HelpCircle, FileText, Heart, MessageCircle, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

const Footer: React.FC<FooterProps> = ({ theme }) => {
    const isBw = theme === 'bw';

    return (
        <footer className={`
      mt-auto border-t transition-colors
      ${isBw
                ? 'bg-black border-stone-800 text-stone-300'
                : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'}
    `}>
            <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <div className={`flex items-center gap-2 font-serif font-bold text-[23px]
              ${isBw ? 'text-white' : 'text-stone-800 dark:text-stone-100'}
            `}>
                            <div className={`p-1.5 rounded-lg ${isBw ? 'bg-white text-black' : 'bg-bible-gold text-white'}`}>
                                <BookOpen size={18} />
                            </div>
                            <span className="tracking-tight">Bíblia Online</span>
                        </div>
                        <p className="text-xs leading-relaxed max-w-xs opacity-80">
                            Sua plataforma de estudos bíblicos inteligente.
                        </p>
                        <div className="flex gap-4 pt-1">
                            {/* Instagram */}
                            <a href="https://instagram.com/biblifly" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`} aria-label="Instagram">
                                <Instagram size={18} />
                            </a>

                            {/* Tiktok */}
                            <a href="https://tiktok.com/@biblifly" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`} aria-label="TikTok">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                            </a>

                            {/* X (Twitter) */}
                            <a href="https://x.com/biblifly" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`} aria-label="X">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>

                            {/* YouTube */}
                            <a href="https://youtube.com/@biblifly" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`} aria-label="YouTube">
                                <Youtube size={18} />
                            </a>

                            {/* Whatsapp */}
                            <a href="#" className={`transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`} aria-label="WhatsApp">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Links Grid - Mobile Optimized (2 cols) */}
                    <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">

                        {/* Navigation */}
                        <div>
                            <h3 className={`font-bold mb-3 ${isBw ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>Navegação</h3>
                            <ul className="space-y-2">
                                <li><Link to="/" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Início</Link></li>
                                <li><Link to="/antigo-testamento" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Antigo Testamento</Link></li>
                                <li><Link to="/novo-testamento" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Novo Testamento</Link></li>
                                <li><Link to="/devocional" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Devocional</Link></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className={`font-bold mb-3 ${isBw ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>Recursos</h3>
                            <ul className="space-y-2">
                                <li><Link to="/chat" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Chat Teológico</Link></li>
                                <li><Link to="/versiculos" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Versículos por Tema</Link></li>
                                <li><Link to="/blog" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Blog & Artigos</Link></li>
                                <li><Link to="/faq-biblia" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Perguntas Frequentes</Link></li>
                            </ul>
                        </div>

                        {/* Legal & Contact */}
                        <div className="col-span-2 md:col-span-1 mt-2 md:mt-0">
                            <h3 className={`font-bold mb-3 ${isBw ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>Institucional</h3>
                            <ul className="space-y-2">
                                <li><Link to="/contato" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Fale Conosco</Link></li>
                                <li><Link to="/privacidade" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Política de Privacidade</Link></li>
                                <li><Link to="/termos" className={`block py-0.5 transition-colors ${isBw ? 'hover:text-white' : 'hover:text-bible-gold'}`}>Termos de Uso</Link></li>
                            </ul>
                        </div>
                    </div>

                </div>
                <div className={`mt-8 pt-6 border-t text-xs md:text-sm text-center flex flex-col md:flex-row justify-between items-center gap-2
          ${isBw ? 'border-stone-800' : 'border-stone-200 dark:border-stone-800'}
        `}>
                    <p>© {new Date().getFullYear()} Bíblia Online. Todos os direitos reservados.</p>
                    <p className="flex items-center gap-1 opacity-70">
                        Feito com <Heart size={14} className={isBw ? 'text-white' : 'text-bible-gold'} fill="currentColor" />
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
