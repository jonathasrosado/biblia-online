import React from 'react';
import { X, User, Check } from 'lucide-react';
import LoginButton from './LoginButton';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
    t: any;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-scaleIn">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-10"
                >
                    <X size={20} className="text-stone-500" />
                </button>

                {/* Header Image/Icon */}
                <div className="bg-bible-gold/10 p-8 flex justify-center">
                    <div className="w-20 h-20 bg-bible-gold rounded-full flex items-center justify-center text-white shadow-lg">
                        <User size={40} />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-serif font-bold mb-2 text-bible-accent dark:text-bible-gold">
                        Bem-vindo(a)!
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
                        Crie sua conta ou faça login para salvar seu progresso de leitura, favoritos e anotações em qualquer dispositivo.
                    </p>

                    {/* Benefits List */}
                    <div className="text-left space-y-3 mb-8 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl">
                        <div className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                            <Check size={16} className="text-green-500" />
                            <span>Sincronize seu histórico de leitura</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                            <Check size={16} className="text-green-500" />
                            <span>Salve seus versículos favoritos</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                            <Check size={16} className="text-green-500" />
                            <span>Acesso exclusivo a novos recursos</span>
                        </div>
                    </div>

                    {/* Login Button Wrapper */}
                    <div className="flex justify-center">
                        <LoginButton onLoginSuccess={(u) => {
                            onLoginSuccess(u);
                            onClose();
                        }} />
                    </div>

                    <p className="mt-6 text-xs text-stone-400">
                        Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
