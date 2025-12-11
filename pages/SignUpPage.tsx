import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Reusing the ID from LoginButton for consistency
const GOOGLE_CLIENT_ID = "831743160144-0plrd3o0o4a7kth481ks1vjth1o0c1ns.apps.googleusercontent.com";

interface SignUpPageProps {
    theme: 'light' | 'dark' | 'sepia' | 'bw';
    t: any;
    onLoginSuccess?: (user: any) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ theme, t, onLoginSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const isDark = theme === 'dark';
    const isBW = theme === 'bw';
    const isSepia = theme === 'sepia';

    const getBgClass = () => {
        if (isBW) return 'bg-white';
        if (isSepia) return 'bg-[#fdfbf6]';
        if (isDark) return 'bg-stone-950';
        return 'bg-stone-50';
    };

    const getCardClass = () => {
        if (isBW) return 'bg-white border-black text-black';
        if (isSepia) return 'bg-[#fffbf0] border-[#d6cba6] text-[#5c4b37]';
        if (isDark) return 'bg-stone-900 border-stone-800 text-stone-200';
        return 'bg-white border-stone-200 text-stone-800';
    };

    const getInputClass = () => {
        if (isBW) return 'bg-white border-black text-black placeholder-stone-500 focus:ring-black';
        if (isSepia) return 'bg-white border-[#d6cba6] text-[#5c4b37] placeholder-[#8c7b64] focus:ring-[#8c7b64]';
        if (isDark) return 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500 focus:ring-bible-gold';
        return 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-bible-gold';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao criar conta.');

            // Auto login or redirect?
            // Usually simpler to just redirect to login or auto-login
            // Let's mimic auto-login by calling onLoginSuccess if provided, or redirecting
            if (onLoginSuccess) onLoginSuccess(data.user);
            navigate('/');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: decoded })
            });

            if (res.ok) {
                const data = await res.json();
                if (onLoginSuccess) onLoginSuccess(data.user);
                navigate('/');
            }
        } catch (error) {
            console.error("Google Login Failed", error);
            setError("Falha ao entrar com Google.");
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${getBgClass()} transition-colors`}>

            <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${getCardClass()} animate-scaleIn`}>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-xl 
                        ${isBW ? 'bg-black text-white' : 'bg-bible-gold text-white shadow-lg'}`}>
                        <BookOpen size={24} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold mb-2">Bem-vindo(a) ao Bíblia Online</h1>
                    <p className="text-sm opacity-70">
                        Já tem uma conta? <span onClick={() => navigate('/')} className="cursor-pointer font-bold underline decoration-2 underline-offset-2 hover:opacity-80">Iniciar sessão</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-70">E-mail</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${getInputClass()}`}
                            placeholder="m@exemplo.com"
                        />
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-70">Nome de usuário</label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${getInputClass()}`}
                            placeholder="nome de usuário"
                        />
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-70">Nome</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${getInputClass()}`}
                            placeholder="João Ninguém"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-70">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all pr-12 ${getInputClass()}`}
                                placeholder="********"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-70">Confirme sua senha</label>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${getInputClass()}`}
                            placeholder="********"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-6 flex items-center justify-center gap-2
                            ${isBW
                                ? 'bg-black text-white hover:bg-stone-800'
                                : isSepia
                                    ? 'bg-[#5c4b37] text-[#f4ecd8] hover:bg-[#4a3b2a]'
                                    : 'bg-stone-900 text-white dark:bg-bible-gold dark:text-white hover:bg-stone-800'}`
                        }
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Inscrever-se'}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200 dark:border-stone-700 opacity-50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className={`px-2 ${getCardClass().split(' ')[0]} opacity-70`}>Ou</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <div className="w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Falha no login Google")}
                                width="350"
                                text="continue_with"
                                shape="pill"
                            />
                        </div>
                    </GoogleOAuthProvider>
                </div>

                <p className="text-center text-[10px] mt-8 opacity-50 leading-tight">
                    Este site está protegido pelo reCAPTCHA e pelo Google.<br />
                    Ao clicar em continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
                </p>

            </div>
        </div>
    );
};

export default SignUpPage;
