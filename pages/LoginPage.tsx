import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Same ID as other components
const GOOGLE_CLIENT_ID = "924407172436-a94imuk0d7lkb4m9pk80p0u1607q9oj6.apps.googleusercontent.com";

interface LoginPageProps {
    theme: 'light' | 'dark' | 'sepia' | 'bw';
    onLoginSuccess?: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ theme, onLoginSuccess }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
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

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao entrar.');

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
            } else {
                setError("Falha ao autenticar com Google.");
            }
        } catch (error) {
            console.error("Google Login Failed", error);
            setError("Falha ao entrar com Google.");
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${getBgClass()} transition-colors`}>

            <div className="w-full max-w-sm animate-scaleIn relative">

                <div className="text-center mb-6">
                    <h1 className={`text-2xl md:text-3xl font-serif font-bold mb-2 tracking-tight
                        ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        Bem-vindo de volta
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Não tem uma conta? <Link to="/cadastro" className={`font-semibold underline decoration-2 underline-offset-4 hover:opacity-80 ${isDark ? 'text-white' : 'text-stone-900'}`}>Cadastre-se</Link>
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className={`text-sm font-semibold tracking-wide ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>E-mail</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all placeholder-stone-400
                                ${isDark
                                    ? 'bg-stone-900 border-stone-800 focus:border-white text-white'
                                    : 'bg-white border-stone-200 focus:border-black text-stone-900 shadow-sm'}`}
                            placeholder="m@exemplo.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className={`text-sm font-semibold tracking-wide ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Senha</label>
                            <span className={`text-xs font-medium cursor-pointer hover:underline ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Esqueceu a senha?</span>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all pr-12 placeholder-stone-400
                                    ${isDark
                                        ? 'bg-stone-900 border-stone-800 focus:border-white text-white'
                                        : 'bg-white border-stone-200 focus:border-black text-stone-900 shadow-sm'}`}
                                placeholder="********"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-100 transition-opacity ${isDark ? 'text-stone-500 opacity-50' : 'text-stone-400 opacity-50'}`}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-full font-bold text-sm tracking-wide transform active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2 shadow-lg
                            ${isBW
                                ? 'bg-black text-white hover:bg-stone-800'
                                : 'bg-stone-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-stone-200'
                            }`
                        }
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Conecte-se'}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                        <span className={`px-4 ${isDark ? 'bg-stone-950 text-stone-600' : 'bg-stone-50 text-stone-400'}`}>Ou continue com</span>
                    </div>
                </div>

                {/* Google Button */}
                <div className="flex justify-center">
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <div className="w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Falha no login Google")}
                                width="100%"
                                text="continue_with"
                                shape="pill"
                                size="large"
                                logo_alignment="center"
                                theme={isDark ? 'filled_black' : 'outline'}
                            />
                        </div>
                    </GoogleOAuthProvider>
                </div>

                {/* DEV LOGIN BUTTON (Only visible in development) */}
                {import.meta.env.DEV && (
                    <div className="mt-4 flex justify-center w-full">
                        <button
                            type="button"
                            onClick={() => {
                                // Simulate a user object
                                const devUser = {
                                    name: "Dev User",
                                    email: "dev@bibliaonline.me",
                                    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev"
                                };
                                if (onLoginSuccess) onLoginSuccess(devUser);
                                navigate('/');
                            }}
                            className={`w-full py-2 rounded-full border border-dashed border-red-300 text-red-400 text-xs font-mono uppercase hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors`}
                        >
                            [DEV MODE] Force Login
                        </button>
                    </div>
                )}

                {/* Footer Terms */}
                <p className={`text-center text-[10px] mt-8 leading-tight max-w-xs mx-auto ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                    Este site está protegido pelo reCAPTCHA e pelo Google.
                    Ao fazer login, você concorda com nossos <span className="underline cursor-pointer">Termos de Uso</span> e <span className="underline cursor-pointer">Política de Privacidade</span>.
                </p>

            </div>
        </div>
    );
};

export default LoginPage;
