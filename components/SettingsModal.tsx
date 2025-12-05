import React from 'react';
import { X, Type, AlignLeft, AlignJustify, Moon, Sun, Coffee, Maximize, Minimize } from 'lucide-react';
import { ReadingPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ReadingPreferences;
  onUpdate: (newPrefs: ReadingPreferences) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  t: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onUpdate, isFullScreen, onToggleFullScreen, t }) => {
  if (!isOpen) return null;

  const update = (key: keyof ReadingPreferences, value: any) => {
    onUpdate({ ...preferences, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">{t.settings}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh]">

          {/* View Mode Section */}
          {onToggleFullScreen && (
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                {t.viewMode}
              </label>
              <button
                onClick={() => { onToggleFullScreen(); onClose(); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all
                   ${isFullScreen
                    ? 'border-bible-gold bg-bible-gold/10 text-bible-accent dark:text-bible-gold'
                    : 'border-stone-200 dark:border-stone-700 hover:border-bible-gold/50'}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  {isFullScreen ? t.exitFullScreen : t.fullScreen}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 ${isFullScreen ? 'bg-bible-gold border-bible-gold' : 'border-stone-300'}`}></div>
              </button>
            </div>
          )}

          {/* Theme Section */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              {t.theme}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => update('theme', 'light')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${preferences.theme === 'light'
                  ? 'border-bible-gold bg-bible-paper text-stone-900'
                  : 'border-transparent bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
              >
                <Sun size={24} />
                <span className="text-sm font-medium">{t.light}</span>
              </button>

              <button
                onClick={() => update('theme', 'sepia')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${preferences.theme === 'sepia'
                  ? 'border-bible-gold bg-[#f4ecd8] text-[#5c4b37]'
                  : 'border-transparent bg-[#f4ecd8]/50 text-stone-500 hover:bg-[#f4ecd8]'
                  }`}
              >
                <Coffee size={24} />
                <span className="text-sm font-medium">{t.sepia}</span>
              </button>

              <button
                onClick={() => update('theme', 'dark')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${preferences.theme === 'dark'
                  ? 'border-bible-gold bg-stone-950 text-stone-100'
                  : 'border-transparent bg-stone-800 text-stone-500 hover:bg-stone-700'
                  }`}
              >
                <Moon size={24} />
                <span className="text-sm font-medium">{t.dark}</span>
              </button>
            </div>
          </div>

          {/* Font Size Section */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              {t.fontSize}
            </label>
            <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2 text-sm text-stone-500 dark:text-stone-400 font-serif">
                <span className="text-xs">A</span>
                <span className="text-xl">A</span>
              </div>
              <input
                type="range"
                min="80"
                max="180"
                step="5"
                value={preferences.fontSize}
                onChange={(e) => update('fontSize', parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-bible-gold"
              />
              <div className="text-center mt-2 text-xs font-bold text-stone-400">
                {preferences.fontSize}%
              </div>
            </div>
          </div>

          {/* Font Family Section */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              {t.fontFamily}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update('fontFamily', 'serif')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-serif text-lg ${preferences.fontFamily === 'serif'
                  ? 'border-bible-gold bg-stone-50 dark:bg-stone-800 text-bible-accent dark:text-bible-gold'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 hover:border-bible-gold/50'
                  }`}
              >
                <span className="font-serif">{t.serif}</span>
              </button>
              <button
                onClick={() => update('fontFamily', 'sans')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-sans text-lg ${preferences.fontFamily === 'sans'
                  ? 'border-bible-gold bg-stone-50 dark:bg-stone-800 text-bible-accent dark:text-bible-gold'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 hover:border-bible-gold/50'
                  }`}
              >
                <span className="font-sans">{t.sans}</span>
              </button>
            </div>
          </div>

          {/* Alignment Section */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              {t.textAlign}
            </label>
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
              <button
                onClick={() => update('textAlign', 'left')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${preferences.textAlign === 'left'
                  ? 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
              >
                <AlignLeft size={20} />
              </button>
              <button
                onClick={() => update('textAlign', 'justify')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${preferences.textAlign === 'justify'
                  ? 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
              >
                <AlignJustify size={20} />
              </button>
            </div>
          </div>
          {/* Voice Selection Section */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              Voz da Leitura
            </label>
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
              <button
                onClick={() => update('voice', 'male')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all gap-2 ${preferences.voice === 'male' || !preferences.voice
                  ? 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
              >
                <span className="text-sm font-medium">Masculina</span>
              </button>
              <button
                onClick={() => update('voice', 'female')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all gap-2 ${preferences.voice === 'female'
                  ? 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
              >
                <span className="text-sm font-medium">Feminina</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-bible-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium">
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;