import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Check, AlertCircle, Eye, EyeOff, Key, Settings, Trash2, Plus, CheckCircle, XCircle, Activity } from 'lucide-react';

interface AIModel {
    id: string;
    name: string;
    provider: 'gemini' | 'pollinations' | 'freepik' | 'openrouter';
    type?: 'text' | 'image';
    isFree?: boolean;
}

interface AIConfig {
    apiKeys: {
        gemini: string;
        freepik?: string;
        openrouter?: string;
    };
    features: {
        blog_post: { provider: string; model: string };
        blog_title: { provider: string; model: string };
        seo_metadata: { provider: string; model: string };
        images: { provider: string; model: string };
        chat: { provider: string; model: string };
    };
}

const FEATURE_LABELS: { [key: string]: string } = {
    blog_post: 'Geração de Artigos',
    blog_title: 'Sugestão de Títulos',
    seo_metadata: 'SEO & Metadados',
    images: 'Geração de Imagens',
    chat: 'Chatbot'
};

export default function AISettings() {
    const [config, setConfig] = useState<AIConfig | null>(null);
    const [models, setModels] = useState<AIModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showKeys, setShowKeys] = useState({ gemini: false, freepik: false, openrouter: false });

    const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
    const [testStatus, setTestStatus] = useState<{ [key: string]: { success: boolean; date: string } }>({});

    // UI States
    const [activeTab, setActiveTab] = useState<'apis' | 'models'>('apis');
    const [activeApiTab, setActiveApiTab] = useState<'openrouter' | 'gemini' | 'freepik'>('openrouter');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Config
            try {
                const configRes = await fetch('/api/ai/config');
                if (!configRes.ok) throw new Error(`Config Error: ${configRes.statusText}`);
                const configData = await configRes.json();
                setConfig(configData);
            } catch (e: any) {
                console.error('Failed to load config:', e);
                setMessage({ type: 'error', text: `Erro config: ${e.message}` });
            }

            // Fetch Status
            try {
                const statusRes = await fetch('/api/ai/status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    const mappedStatus: any = {};
                    Object.keys(statusData).forEach(key => {
                        mappedStatus[key] = {
                            success: statusData[key].valid,
                            date: statusData[key].lastChecked
                        };
                    });
                    setTestStatus(mappedStatus);
                }
            } catch (e) { console.error("Failed to load status", e); }

            // Fetch Models (independently)
            try {
                const modelsRes = await fetch('/api/ai/models');
                if (!modelsRes.ok) throw new Error(`Models Error: ${modelsRes.statusText}`);
                const modelsData = await modelsRes.json();

                // Flatten and add provider field
                const flatModels: AIModel[] = [
                    ...(modelsData.gemini?.map((m: any) => ({ ...m, provider: 'gemini' })) || []),
                    ...(modelsData.pollinations?.map((m: any) => ({ ...m, provider: 'pollinations' })) || []),
                    ...(modelsData.freepik?.map((m: any) => ({ ...m, provider: 'freepik' })) || []),
                    ...(modelsData.openrouter?.map((m: any) => ({ ...m, provider: 'openrouter' })) || [])
                ];

                setModels(flatModels);
            } catch (e: any) {
                console.error('Failed to load models:', e);
                // Don't block UI if models fail, just show warning
                setMessage(prev => ({ type: 'error', text: prev ? `${prev.text} | Erro models: ${e.message}` : `Erro models: ${e.message}` }));
            }

        } catch (error: any) {
            console.error('General error:', error);
            setMessage({ type: 'error', text: `Erro geral: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/ai/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
                // Refresh models in case API keys changed
                const modelsRes = await fetch('/api/ai/models');
                if (modelsRes.ok) {
                    const modelsData = await modelsRes.json();
                    // Flatten and add provider field (reuse logic from fetchData)
                    const flatModels: AIModel[] = [
                        ...(modelsData.gemini?.map((m: any) => ({ ...m, provider: 'gemini' })) || []),
                        ...(modelsData.pollinations?.map((m: any) => ({ ...m, provider: 'pollinations' })) || []),
                        ...(modelsData.freepik?.map((m: any) => ({ ...m, provider: 'freepik' })) || []),
                        ...(modelsData.openrouter?.map((m: any) => ({ ...m, provider: 'openrouter' })) || [])
                    ];
                    setModels(flatModels);
                }
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTestKey = async (provider: 'gemini' | 'freepik' | 'openrouter') => {
        if (!config?.apiKeys[provider]) {
            setMessage({ type: 'error', text: 'Insira uma chave para testar.' });
            return;
        }

        setTesting(prev => ({ ...prev, [provider]: true }));
        setMessage(null);

        try {
            const res = await fetch('/api/ai/test-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    apiKey: config.apiKeys[provider]
                })
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setTestStatus(prev => ({
                    ...prev,
                    [provider]: { success: true, date: new Date().toLocaleString() }
                }));
            } else {
                setMessage({ type: 'error', text: `Erro: ${data.message}` });
                setTestStatus(prev => ({
                    ...prev,
                    [provider]: { success: false, date: new Date().toLocaleString() }
                }));
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro ao testar: ${error.message}` });
        } finally {
            setTesting(prev => ({ ...prev, [provider]: false }));
        }
    };

    const updateApiKey = (provider: 'gemini' | 'freepik' | 'openrouter', value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            apiKeys: { ...config.apiKeys, [provider]: value }
        });
    };

    const toggleShowKey = (provider: 'gemini' | 'freepik' | 'openrouter') => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    const updateFeature = (feature: keyof AIConfig['features'], field: 'provider' | 'model', value: string) => {
        if (!config) return;

        // If changing provider, reset model to first available or empty
        let newModel = config.features[feature].model;
        if (field === 'provider') {
            const availableModels = models.filter(m => m.provider === value);
            newModel = availableModels.length > 0 ? availableModels[0].id : '';
        } else {
            newModel = value;
        }

        setConfig({
            ...config,
            features: {
                ...config.features,
                [feature]: {
                    ...config.features[feature],
                    [field]: value,
                    model: newModel
                }
            }
        });

        // Clear test result when changing provider or model
        if (modelTestResults[feature]) {
            setModelTestResults(prev => {
                const newState = { ...prev };
                delete newState[feature];
                return newState;
            });
        }
    };

    const [modelTesting, setModelTesting] = useState<{ [key: string]: boolean }>({});
    const [modelTestResults, setModelTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});

    const testModel = async (featureKey: string, provider: string, model: string) => {
        setModelTesting(prev => ({ ...prev, [featureKey]: true }));
        setModelTestResults(prev => ({ ...prev, [featureKey]: null as any }));

        try {
            const res = await fetch('/api/ai/test-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    model,
                    type: featureKey === 'images' ? 'image' : 'text'
                })
            });

            const data = await res.json();
            if (data.success) {
                setModelTestResults(prev => ({
                    ...prev,
                    [featureKey]: { success: true, message: 'Teste OK!' }
                }));
            } else {
                setModelTestResults(prev => ({
                    ...prev,
                    [featureKey]: { success: false, message: `Erro: ${data.message}` }
                }));
            }
        } catch (error: any) {
            setModelTestResults(prev => ({
                ...prev,
                [featureKey]: { success: false, message: `Erro: ${error.message}` }
            }));
        } finally {
            setModelTesting(prev => ({ ...prev, [featureKey]: false }));
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Carregando configurações...</div>;
    }

    if (!config) {
        return <div className="p-8 text-center text-red-400">Erro ao carregar configurações.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-bible-gold">Configurações de IA</h1>
                    <p className="text-sm text-stone-500">Gerencie suas chaves e modelos de inteligência artificial.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-bible-gold text-bible-black font-bold rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Main Navigation Tabs */}
            <div className="flex border-b border-stone-200 dark:border-stone-800">
                <button
                    onClick={() => setActiveTab('apis')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'apis'
                        ? 'border-bible-gold text-bible-gold'
                        : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                        }`}
                >
                    <Key size={16} />
                    Minhas APIs
                </button>
                <button
                    onClick={() => setActiveTab('models')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'models'
                        ? 'border-bible-gold text-bible-gold'
                        : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                        }`}
                >
                    <Settings size={16} />
                    Modelos de IA
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'apis' && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm min-h-[400px]">
                    {/* API Sub-tabs */}
                    <div className="flex border-b border-stone-100 dark:border-stone-800 px-6 pt-4">
                        {(['openrouter', 'gemini', 'freepik'] as const).map((provider) => (
                            <button
                                key={provider}
                                onClick={() => setActiveApiTab(provider)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors mr-2 ${activeApiTab === provider
                                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                                    }`}
                            >
                                {provider === 'openrouter' && 'OpenRouter'}
                                {provider === 'gemini' && 'Google Gemini'}
                                {provider === 'freepik' && 'Freepik'}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Header Actions */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                                Chaves de API - {activeApiTab === 'openrouter' ? 'OpenRouter' : activeApiTab === 'gemini' ? 'Google Gemini' : 'Freepik'}
                            </h2>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1">
                                    Importar
                                </button>
                                <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1">
                                    <Plus size={16} /> Nova API Key
                                </button>
                            </div>
                        </div>

                        {/* Pricing / Info Banner */}
                        <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-lg mb-6 border border-stone-100 dark:border-stone-800">
                            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2 mb-2">
                                <Activity size={16} />
                                Status do Serviço
                            </h3>
                            <p className="text-xs text-stone-500">
                                {activeApiTab === 'openrouter' && 'OpenRouter agrega diversos modelos. Verifique seus créditos em openrouter.ai.'}
                                {activeApiTab === 'gemini' && 'Google Gemini oferece tiers gratuitos e pagos. Verifique o console do Google Cloud.'}
                                {activeApiTab === 'freepik' && 'Freepik requer uma chave válida para geração de imagens premium.'}
                            </p>
                        </div>

                        {/* Keys Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-stone-500 uppercase bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                                    <tr>
                                        <th className="px-6 py-3">API Key</th>
                                        <th className="px-6 py-3">Criada em</th>
                                        <th className="px-6 py-3">Última Utilização</th>
                                        <th className="px-6 py-3">Válida</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-stone-600 dark:text-stone-400">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type={showKeys[activeApiTab] ? "text" : "password"}
                                                    value={config.apiKeys[activeApiTab] || ''}
                                                    onChange={(e) => updateApiKey(activeApiTab, e.target.value)}
                                                    className="bg-transparent border-none focus:ring-0 p-0 w-64"
                                                    placeholder="Insira sua chave aqui..."
                                                />
                                                <button onClick={() => toggleShowKey(activeApiTab)} className="text-stone-400 hover:text-stone-600">
                                                    {showKeys[activeApiTab] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-500">
                                            {/* Mock Date */}
                                            22/10/2025 22:11
                                        </td>
                                        <td className="px-6 py-4 text-stone-500">
                                            {/* Mock Date */}
                                            {testStatus[activeApiTab]?.date || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {testStatus[activeApiTab] ? (
                                                testStatus[activeApiTab].success ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle size={12} /> Sim
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                        <XCircle size={12} /> Não
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-stone-400 text-xs">Não testado</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleTestKey(activeApiTab)}
                                                disabled={testing[activeApiTab]}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                            >
                                                {testing[activeApiTab] ? 'Testando...' : 'Testar'}
                                            </button>
                                            <button className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area - Models */}
            {activeTab === 'models' && (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-2 font-serif">
                        <span className="w-1 h-6 bg-bible-gold rounded-full"></span>
                        Modelos por Funcionalidade
                    </h2>
                    <div className="space-y-6">
                        {(Object.entries(config.features) as [string, { provider: string, model: string }][]).map(([featureKey, featureConfig]) => (
                            <div key={featureKey} className="grid md:grid-cols-3 gap-4 items-end border-b border-stone-100 dark:border-stone-800 pb-6 last:border-0 last:pb-0">
                                <div>
                                    <label className="block text-sm font-bold text-bible-gold mb-1">
                                        {FEATURE_LABELS[featureKey] || featureKey}
                                    </label>
                                    <p className="text-xs text-stone-500 dark:text-stone-400">Selecione o provedor e modelo para esta função.</p>
                                </div>

                                <div>
                                    <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">Provedor</label>
                                    <select
                                        value={featureConfig.provider}
                                        onChange={(e) => updateFeature(featureKey as keyof AIConfig['features'], 'provider', e.target.value)}
                                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100 focus:border-bible-gold focus:outline-none transition-all text-sm"
                                    >
                                        {featureKey === 'images' ? (
                                            <>
                                                <option value="pollinations">Pollinations.ai</option>
                                                <option value="openrouter">OpenRouter (Recomendado)</option>
                                                <option value="freepik">Freepik</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="gemini">Google Gemini</option>
                                                <option value="openrouter">OpenRouter</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">Modelo</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={featureConfig.model}
                                            onChange={(e) => updateFeature(featureKey as keyof AIConfig['features'], 'model', e.target.value)}
                                            className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100 focus:border-bible-gold focus:outline-none transition-all text-sm"
                                        >
                                            {models
                                                .filter(m => {
                                                    // 1. Filter by provider
                                                    if (m.provider !== featureConfig.provider) return false;

                                                    // 2. Filter by capability (Text vs Image)
                                                    const isImageFeature = featureKey === 'images';

                                                    // Pollinations/Freepik are always image
                                                    if (['pollinations', 'freepik'].includes(m.provider)) {
                                                        return isImageFeature;
                                                    }

                                                    // OpenRouter and Gemini have both types, so check the model type
                                                    if (m.provider === 'openrouter' || m.provider === 'gemini') {
                                                        if (m.type) {
                                                            return isImageFeature ? m.type === 'image' : m.type === 'text';
                                                        }
                                                        // Fallback if type is missing (assume text for Gemini/OpenRouter unless specified)
                                                        return !isImageFeature;
                                                    }

                                                    return true;
                                                })
                                                .map(model => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name} {model.isFree ? '(GRATUITO)' : ''}
                                                    </option>
                                                ))
                                            }
                                            {models.filter(m => m.provider === featureConfig.provider).length === 0 && (
                                                <option value="" disabled>Nenhum modelo disponível</option>
                                            )}
                                        </select>
                                        <button
                                            onClick={() => testModel(featureKey, featureConfig.provider, featureConfig.model)}
                                            disabled={!featureConfig.model || modelTesting[featureKey]}
                                            className="px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                                            title="Testar Modelo"
                                        >
                                            {modelTesting[featureKey] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {modelTestResults[featureKey] && (
                                        <div className={`mt-2 text-xs flex items-center gap-1 ${modelTestResults[featureKey].success ? 'text-green-500' : 'text-red-500'}`}>
                                            {modelTestResults[featureKey].success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                            {modelTestResults[featureKey].message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
