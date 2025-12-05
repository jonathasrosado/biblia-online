import React, { useEffect, useRef } from 'react';
import { X, PlayCircle, StopCircle, CheckCircle, AlertTriangle, Sparkles, FileText, SkipForward } from 'lucide-react';

interface MassGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStop: () => void;
    isGenerating: boolean;
    bookName: string;
    progress: {
        current: number;
        total: number;
        generated: number;
        skipped: number;
        errors: number;
    };
    logs: string[];
}

const MassGenerationModal: React.FC<MassGenerationModalProps> = ({
    isOpen,
    onClose,
    onStop,
    isGenerating,
    bookName,
    progress,
    logs
}) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!isOpen) return null;

    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    const isFinished = !isGenerating && progress.current >= progress.total && progress.total > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800 dark:text-stone-100">
                            <Sparkles className="text-purple-500" />
                            Geração em Massa: {bookName}
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                            Gerando e salvando capítulos automaticamente.
                        </p>
                    </div>
                    {!isGenerating && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Progresso Geral</span>
                            <span>{percentage}% ({progress.current}/{progress.total})</span>
                        </div>
                        <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${isFinished ? 'bg-green-500' : 'bg-purple-500 relative'}`}
                                style={{ width: `${percentage}%` }}
                            >
                                {isGenerating && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex flex-col items-center justify-center text-center">
                            <CheckCircle className="text-green-500 mb-2" size={24} />
                            <span className="text-2xl font-bold text-green-700 dark:text-green-400">{progress.generated}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-green-600/70 dark:text-green-400/70">Gerados</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex flex-col items-center justify-center text-center">
                            <SkipForward className="text-blue-500 mb-2" size={24} />
                            <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{progress.skipped}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70">Já Existiam</span>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center text-center">
                            <AlertTriangle className="text-red-500 mb-2" size={24} />
                            <span className="text-2xl font-bold text-red-700 dark:text-red-400">{progress.errors}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-red-600/70 dark:text-red-400/70">Erros</span>
                        </div>
                    </div>

                    {/* Logs Console */}
                    <div className="bg-stone-900 rounded-xl p-4 font-mono text-xs text-stone-300 h-48 overflow-y-auto border border-stone-800 shadow-inner">
                        {logs.length === 0 && (
                            <div className="h-full flex items-center justify-center opacity-30 italic">
                                Aguardando início...
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 rounded-b-2xl flex justify-end gap-3">
                    {isGenerating ? (
                        <button
                            onClick={onStop}
                            className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        >
                            <StopCircle size={18} />
                            Parar Geração
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold transition-colors"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MassGenerationModal;
