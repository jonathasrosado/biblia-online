import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Copy, Image as ImageIcon, Check, X } from 'lucide-react';

interface MediaFile {
    name: string;
    url: string;
    size: number;
    date: string;
}

interface MediaManagerProps {
    onSelect?: (url: string) => void;
}

const MediaManager: React.FC<MediaManagerProps> = ({ onSelect }) => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/media');
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                await loadMedia();
            } else {
                alert('Erro ao fazer upload');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
        try {
            const res = await fetch(`/api/media/${filename}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Falha ao excluir');
            }
            setFiles(files.filter(f => f.name !== filename));
        } catch (e: any) {
            alert(`Erro ao excluir: ${e.message}`);
        }
    };

    const copyToClipboard = (url: string) => {
        const fullUrl = window.location.origin + url;
        navigator.clipboard.writeText(fullUrl);
        setCopied(url);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-stone-800 dark:text-stone-100">
                    <ImageIcon /> Galeria de Mídia
                </h2>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                    <Upload size={18} /> {uploading ? 'Enviando...' : 'Upload'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                />
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
                    ? 'border-bible-gold bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900'
                    }`}
            >
                <p className="text-stone-500 dark:text-stone-400">
                    Arraste e solte imagens aqui ou use o botão de Upload
                </p>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-stone-500">Carregando mídia...</div>
            ) : files.length === 0 ? (
                <div className="text-center py-12 text-stone-500">Nenhum arquivo encontrado.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {files.map(file => (
                        <div key={file.name} className="group relative bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden aspect-square">
                            <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <button
                                    onClick={() => copyToClipboard(file.url)}
                                    className="p-2 bg-white text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
                                    title="Copiar URL"
                                >
                                    {copied === file.url ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                                {onSelect && (
                                    <button
                                        onClick={() => onSelect(file.url)}
                                        className="p-2 bg-bible-gold text-white rounded-full hover:bg-yellow-600 transition-colors"
                                        title="Selecionar"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(file.name)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate px-2">
                                {file.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaManager;
