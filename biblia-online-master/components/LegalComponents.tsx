import React, { useState, useEffect } from 'react';
import { X, Shield, FileText } from 'lucide-react';

// --- COOKIE BANNER ---
interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lumen_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lumen_cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 p-4 md:p-6 animate-slideUp">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-stone-600 dark:text-stone-300 text-center md:text-left">
          <p>
            Nós utilizamos cookies para personalizar conteúdo e anúncios, fornecer recursos de mídia social e analisar nosso tráfego. 
            Também compartilhamos informações sobre o uso do nosso site com nossos parceiros de mídia social, publicidade e análise.
            Ao continuar navegando, você concorda com nossa <button onClick={onOpenPrivacy} className="text-bible-accent dark:text-bible-gold underline hover:no-underline">Política de Privacidade</button>.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAccept}
            className="px-6 py-2.5 bg-bible-gold hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap"
          >
            Aceitar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LEGAL MODAL ---
interface LegalModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white dark:bg-stone-950 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
          <h2 className="text-xl font-serif font-bold text-bible-accent dark:text-bible-gold flex items-center gap-2">
            {type === 'privacy' ? <Shield size={20} /> : <FileText size={20} />}
            {type === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 md:p-8 text-stone-700 dark:text-stone-300 space-y-6 leading-relaxed text-sm md:text-base">
          {type === 'privacy' ? (
            <>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">1. Coleta de Dados e Cookies</h3>
              <p>O Lumen Bíblia Online utiliza cookies para armazenar informações sobre as preferências dos visitantes e registrar informações específicas sobre as páginas que o usuário acessa ou visita. Essas informações são usadas para otimizar a experiência do usuário, personalizando o conteúdo da nossa página da web com base no tipo de navegador dos visitantes ou outras informações que o visitante envia.</p>
              
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">2. Cookies DoubleClick DART</h3>
              <p>O Google é um fornecedor terceirizado em nosso site. Ele também usa cookies, conhecidos como cookies DART, para veicular anúncios aos visitantes do nosso site com base em sua visita a este e outros sites na internet. No entanto, os visitantes podem optar por recusar o uso de cookies DART visitando a Política de Privacidade da rede de conteúdo e anúncios do Google no seguinte URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://policies.google.com/technologies/ads</a></p>

              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">3. Parceiros de Publicidade</h3>
              <p>Alguns de nossos parceiros de publicidade podem usar cookies e web beacons em nosso site. Nossos parceiros de publicidade incluem o Google AdSense. Cada um desses parceiros de publicidade tem sua própria Política de Privacidade para suas políticas sobre dados de usuários.</p>

              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">4. Consentimento</h3>
              <p>Ao utilizar nosso site, você concorda com nossa Política de Privacidade e concorda com seus Termos.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">1. Aceitação dos Termos</h3>
              <p>Ao acessar e usar o Lumen Bíblia Online, você aceita e concorda em estar vinculado aos termos e provisões deste acordo.</p>

              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">2. Uso do Conteúdo</h3>
              <p>O conteúdo fornecido neste serviço é para fins educacionais, espirituais e informativos. O uso de textos bíblicos e interpretações geradas por IA deve ser verificado e utilizado com discernimento.</p>

              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">3. Isenção de Responsabilidade</h3>
              <p>As interpretações e respostas fornecidas pelo Chat Teológico são geradas por Inteligência Artificial e podem não refletir perfeitamente a doutrina de todas as denominações cristãs. Recomendamos a consulta a líderes espirituais para questões doutrinárias sensíveis.</p>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors font-medium">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP FOOTER ---
interface AppFooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="mt-auto py-8 px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
        <div className="font-serif">
          © {new Date().getFullYear()} Lumen Bíblia Online
        </div>
        <div className="flex gap-6">
          <button onClick={onOpenPrivacy} className="hover:text-bible-accent dark:hover:text-bible-gold transition-colors">
            Política de Privacidade
          </button>
          <button onClick={onOpenTerms} className="hover:text-bible-accent dark:hover:text-bible-gold transition-colors">
            Termos de Uso
          </button>
        </div>
      </div>
    </footer>
  );
};
