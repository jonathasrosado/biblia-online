import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Lock, Layout, LogOut, Menu, User, ChevronRight, FileText, Settings, Sparkles, Image as ImageIcon, Plus, List, Tags } from 'lucide-react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

interface AdminPageProps {
    t: any;
    isDark: boolean;
}

const AdminPage: React.FC<AdminPageProps> = ({ t, isDark }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Simple client-side auth
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_auth', 'true');
        } else {
            alert('Senha incorreta');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_auth');
    };

    useEffect(() => {
        if (localStorage.getItem('admin_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Helmet><title>Admin Login - {t.appTitle}</title></Helmet>
                <div className={"max-w-md w-full p-8 rounded-2xl border shadow-xl " + (isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200')}>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-bible-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-bible-gold">
                            <Lock size={32} />
                        </div>
                        <h1 className="text-2xl font-bold font-serif">Área Administrativa</h1>
                        <p className="opacity-60 mt-2">Digite a senha para continuar</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha"
                            className={"w-full p-4 rounded-xl border outline-none transition-all " + (isDark ? 'bg-stone-800 border-stone-700 focus:border-bible-gold' : 'bg-stone-50 border-stone-200 focus:border-bible-gold')}
                        />
                        <button
                            type="submit"
                            className="w-full py-4 bg-bible-gold text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-lg"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const isBlogActive = location.pathname.includes('/admin/posts') || location.pathname.includes('/admin/categories');
    const isAIActive = location.pathname.includes('/admin/ai-settings') || location.pathname.includes('/admin/prompts');

    return (
        <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
            <Helmet><title>Painel Admin - {t.appTitle}</title></Helmet>

            {/* Main Content (Left/Center) */}
            <main className="flex-1 p-6 md:p-8 overflow-hidden h-screen relative order-2 md:order-1 overflow-y-auto">
                <Outlet />
            </main>

            {/* Sidebar (Right) */}
            <aside
                className={`flex-shrink-0 border-l transition-all duration-300 flex flex-col order-1 md:order-2
                    ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}
                    ${isSidebarOpen ? 'w-full md:w-72 p-6' : 'w-0 md:w-0 p-0 overflow-hidden border-none'}
                `}
            >
                {/* User Profile Section */}
                <div className="mb-8 flex items-center gap-3 pb-6 border-b border-stone-200 dark:border-stone-800">
                    <div className="w-10 h-10 rounded-full bg-bible-gold text-white flex items-center justify-center font-bold">
                        A
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold text-sm truncate">Administrador</h3>
                        <p className="text-xs opacity-50 truncate">admin@biblia.online</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                            ${isActive
                                ? 'bg-bible-gold text-white shadow-md'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800 opacity-70 hover:opacity-100'}`}
                    >
                        <Layout size={20} />
                        Dashboard
                    </NavLink>

                    {/* Blog Submenu */}
                    <div className="space-y-1">
                        <button
                            onClick={() => navigate('/admin/posts')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                                ${isBlogActive
                                    ? 'bg-bible-gold text-white shadow-md'
                                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 opacity-70 hover:opacity-100'}`}
                        >
                            <FileText size={20} />
                            Artigos
                        </button>

                        {/* Sub-items - Only visible when Blog is active */}
                        {isBlogActive && (
                            <div className="pl-4 space-y-1 animate-fadeIn mt-1 border-l-2 border-stone-100 dark:border-stone-800 ml-6">
                                <NavLink
                                    to="/admin/posts"
                                    end
                                    className={({ isActive }) => `w-full text-left px-3 py-2 text-sm transition-all flex items-center gap-2 rounded-lg
                                        ${isActive ? 'text-bible-gold font-bold bg-bible-gold/10' : 'opacity-70 hover:opacity-100 hover:text-bible-gold hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                                >
                                    <List size={16} />
                                    Todos os Posts
                                </NavLink>
                                <NavLink
                                    to="/admin/posts/new"
                                    className={({ isActive }) => `w-full text-left px-3 py-2 text-sm transition-all flex items-center gap-2 rounded-lg
                                        ${isActive ? 'text-bible-gold font-bold bg-bible-gold/10' : 'opacity-70 hover:opacity-100 hover:text-bible-gold hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                                >
                                    <Plus size={16} />
                                    Adicionar Novo
                                </NavLink>
                                <NavLink
                                    to="/admin/categories"
                                    className={({ isActive }) => `w-full text-left px-3 py-2 text-sm transition-all flex items-center gap-2 rounded-lg
                                        ${isActive ? 'text-bible-gold font-bold bg-bible-gold/10' : 'opacity-70 hover:opacity-100 hover:text-bible-gold hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                                >
                                    <Tags size={16} />
                                    Categorias
                                </NavLink>
                            </div>
                        )}
                    </div>

                    <NavLink
                        to="/admin/media"
                        className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                            ${isActive
                                ? 'bg-bible-gold text-white shadow-md'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800 opacity-70 hover:opacity-100'}`}
                    >
                        <ImageIcon size={20} />
                        Mídia
                    </NavLink>

                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                            ${isActive
                                ? 'bg-bible-gold text-white shadow-md'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800 opacity-70 hover:opacity-100'}`}
                    >
                        <User size={20} />
                        Usuários
                    </NavLink>

                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                            ${isActive
                                ? 'bg-bible-gold text-white shadow-md'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800 opacity-70 hover:opacity-100'}`}
                    >
                        <Settings size={20} />
                        Configurações
                    </NavLink>

                    {/* AI Submenu */}
                    <div className="space-y-1">
                        <button
                            onClick={() => navigate('/admin/ai-settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                                ${isAIActive
                                    ? 'bg-bible-gold text-white shadow-md'
                                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 opacity-70 hover:opacity-100'}`}
                        >
                            <Sparkles size={20} />
                            Inteligência Artificial
                        </button>

                        {/* Sub-items - Only visible when AI is active */}
                        {isAIActive && (
                            <div className="pl-12 space-y-1 animate-fadeIn">
                                <NavLink
                                    to="/admin/ai-settings"
                                    end
                                    className={({ isActive }) => `w-full text-left px-2 py-2 text-sm transition-colors flex items-center gap-2
                                        ${isActive ? 'text-bible-gold font-bold' : 'opacity-70 hover:opacity-100 hover:text-bible-gold'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/admin/ai-settings' ? 'bg-bible-gold' : 'bg-current opacity-50'}`}></span>
                                    Configurações
                                </NavLink>
                                <NavLink
                                    to="/admin/prompts"
                                    className={({ isActive }) => `w-full text-left px-2 py-2 text-sm transition-colors flex items-center gap-2
                                        ${isActive ? 'text-bible-gold font-bold' : 'opacity-70 hover:opacity-100 hover:text-bible-gold'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/admin/prompts' ? 'bg-bible-gold' : 'bg-current opacity-50'}`}></span>
                                    Prompts
                                </NavLink>
                            </div>
                        )}
                    </div>
                </nav>

                <button
                    onClick={handleLogout}
                    className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </aside>

            {/* Toggle Button (Floating Top Right) */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`fixed top-4 right-4 z-50 p-2 rounded-full shadow-lg transition-all
                    ${isDark ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-white text-stone-800 hover:bg-stone-100'}
                    ${isSidebarOpen ? 'mr-72' : ''}
                `}
                style={{ right: isSidebarOpen ? '1rem' : '1rem' }}
            >
                {isSidebarOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
            </button>
        </div >
    );
};

export default AdminPage;
