import React, { useState, useEffect } from 'react';
import { Trash2, User, Search, RefreshCw, Plus, Edit2, X, Save, Shield } from 'lucide-react';

interface UserData {
    id: string;
    name: string;
    email: string;
    picture: string;
    role: 'admin' | 'editor' | 'user';
    createdAt: string;
}

const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'user' });
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                alert('Erro ao remover usuário');
            }
        } catch (error) {
            alert('Erro ao remover usuário');
        }
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, role: user.role });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'user' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email) return alert('Nome e Email são obrigatórios');

        setSaving(true);
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao salvar');
            }
        } catch (e) {
            alert('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col animate-fadeIn relative">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                    <User className="text-bible-gold" />
                    Gerenciar Usuários
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchUsers}
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Atualizar Lista"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-bible-gold/50"
                />
                <Search className="absolute left-3 top-3.5 text-stone-400" size={18} />
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 dark:bg-stone-950 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase text-stone-500 tracking-wider">Usuário</th>
                            <th className="p-4 text-xs font-bold uppercase text-stone-500 tracking-wider">Email</th>
                            <th className="p-4 text-xs font-bold uppercase text-stone-500 tracking-wider">Função</th>
                            <th className="p-4 text-xs font-bold uppercase text-stone-500 tracking-wider">Data</th>
                            <th className="p-4 text-xs font-bold uppercase text-stone-500 tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-stone-500">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {user.picture ? (
                                                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-bible-gold/20 flex items-center justify-center text-bible-gold font-bold text-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm opacity-80">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}
                                        `}>
                                            {user.role === 'admin' && <Shield size={12} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm opacity-60">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors text-stone-600 dark:text-stone-400"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 dark:border-stone-800">
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                            <h3 className="text-lg font-bold font-serif">
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-70">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-bible-gold/50 outline-none"
                                    placeholder="Nome completo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-70">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-bible-gold/50 outline-none"
                                    placeholder="email@exemplo.com"
                                    disabled={!!editingUser} // Prevent email change for existing users for simplicity
                                />
                                {editingUser && <p className="text-xs opacity-50 mt-1">O email não pode ser alterado.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-70">Função</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                    className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-bible-gold/50 outline-none"
                                >
                                    <option value="user">Usuário (Leitura)</option>
                                    <option value="editor">Editor (Blog & Conteúdo)</option>
                                    <option value="admin">Administrador (Acesso Total)</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
