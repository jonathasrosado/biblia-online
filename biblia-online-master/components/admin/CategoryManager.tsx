import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, CornerDownRight } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
}

interface CategoryManagerProps {
    selectedCategory: string;
    onChange: (categoryId: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ selectedCategory, onChange }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryParent, setNewCategoryParent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) {
            console.error('Failed to load categories', e);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setLoading(true);
        try {
            const slug = newCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-');
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategory,
                    slug,
                    parentId: newCategoryParent || null
                })
            });

            if (res.ok) {
                const added = await res.json();
                setCategories([...categories, added]);
                setNewCategory('');
                setNewCategoryParent('');
                onChange(added.id); // Auto-select new category
            }
        } catch (e) {
            console.error('Failed to add category', e);
        } finally {
            setLoading(false);
        }
    };

    const buildCategoryTree = (cats: Category[], parentId: string | null = null, level = 0): { category: Category, level: number }[] => {
        const result: { category: Category, level: number }[] = [];
        const children = cats.filter(c => (c.parentId || null) === parentId);

        for (const child of children) {
            result.push({ category: child, level });
            result.push(...buildCategoryTree(cats, child.id, level + 1));
        }

        return result;
    };

    const sortedCategories = buildCategoryTree(categories);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="opacity-50" />
                <span className="font-bold text-sm">Categorias</span>
            </div>

            <div className="max-h-40 overflow-y-auto border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 p-2 space-y-1">
                {sortedCategories.map(({ category: cat, level }) => (
                    <label key={cat.id} className="flex items-center gap-2 p-1 hover:bg-stone-50 dark:hover:bg-stone-800 rounded cursor-pointer" style={{ paddingLeft: `${(level * 12) + 4}px` }}>
                        {level > 0 && <CornerDownRight size={12} className="opacity-40" />}
                        <input
                            type="radio"
                            name="category"
                            value={cat.id}
                            checked={selectedCategory === cat.id}
                            onChange={() => onChange(cat.id)}
                            className="text-bible-gold focus:ring-bible-gold"
                        />
                        <span className="text-sm">{cat.name}</span>
                    </label>
                ))}
                {categories.length === 0 && (
                    <div className="text-xs opacity-50 text-center py-2">Nenhuma categoria</div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Nova Categoria"
                    className="w-full text-sm px-2 py-1 rounded border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:border-bible-gold"
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                />
                <div className="flex gap-2">
                    <select
                        value={newCategoryParent}
                        onChange={e => setNewCategoryParent(e.target.value)}
                        className="flex-1 text-xs px-2 py-1 rounded border border-stone-200 dark:border-stone-800 bg-transparent outline-none focus:border-bible-gold"
                    >
                        <option value="">Raiz</option>
                        {sortedCategories.map(({ category: cat, level }) => (
                            <option key={cat.id} value={cat.id}>
                                {'\u00A0'.repeat(level * 2)}{cat.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddCategory}
                        disabled={loading || !newCategory.trim()}
                        className="p-1 bg-bible-gold text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
