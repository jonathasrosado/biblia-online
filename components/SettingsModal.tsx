import React from 'react';
import { X, AlignLeft, AlignJustify, Moon, Sun, Coffee } from 'lucide-react';
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

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onUpdate, t }) => {
  if (!isOpen) return null;

  const update = (key: keyof ReadingPreferences, value: any) => {
    onUpdate({ ...preferences, [key]: value });
  };


  const getThemeClasses = () => {
    switch (preferences.theme) {
      case 'dark':
        return {
          modal: 'bg-stone-900 border-stone-800',
          header: 'border-stone-800 bg-stone-950 text-stone-100',
          text: 'text-stone-300',
          subtext: 'text-stone-500',
          sectionBg: 'bg-stone-800',
          closeBtn: 'hover:bg-stone-800 text-stone-400',
          footer: 'border-stone-800 bg-stone-950'
        };
      case 'sepia':
        return {
          modal: 'bg-[#f4ecd8] border-[#e6dcc6]',
          header: 'border-[#e6dcc6] bg-[#efebd6] text-[#5c4b37]',
          text: 'text-[#5c4b37]',
          subtext: 'text-[#8c7b64]',
          sectionBg: 'bg-[#efebd6]',
          closeBtn: 'hover:bg-[#e6dcc6] text-[#8c7b64]',
          footer: 'border-[#e6dcc6] bg-[#efebd6]'
        };
      case 'bw':
        return {
          modal: 'bg-white border-2 border-black',
          header: 'border-b-2 border-black bg-white text-black',
          text: 'text-black',
          subtext: 'text-black',
          sectionBg: 'bg-white border border-black',
          closeBtn: 'hover:bg-stone-100 text-black border border-transparent hover:border-black',
          footer: 'border-t-2 border-black bg-white'
        };
      default: // light
        return {
          modal: 'bg-white border-stone-100',
          header: 'border-stone-100 bg-stone-50 text-stone-800',
          text: 'text-stone-600',
          subtext: 'text-stone-400',
          sectionBg: 'bg-stone-100',
          closeBtn: 'hover:bg-stone-200 text-stone-500',
          footer: 'border-stone-100 bg-stone-50'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${themeClasses.modal} ${preferences.theme === 'bw' ? 'shadow-none' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-4 border-b ${themeClasses.header}`}>
          <h2 className="text-lg font-bold">{t.settings}</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${themeClasses.closeBtn}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">

          {/* Theme Section */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${themeClasses.subtext}`}>
              {t.theme}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => update('theme', 'light')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${preferences.theme === 'light'
                  ? 'border-bible-gold bg-bible-paper text-stone-900'
                  : 'border-transparent bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
              >
                <Sun size={20} />
                <span className="text-sm font-medium">{t.light}</span>
              </button>

              <button
                onClick={() => update('theme', 'bw')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${preferences.theme === 'bw'
                  ? 'border-stone-900 bg-white text-stone-900'
                  : 'border-transparent bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
              >
                <AlignJustify size={20} />
                <span className="text-sm font-medium">P&B</span>
              </button>

              <button
                onClick={() => update('theme', 'dark')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${preferences.theme === 'dark'
                  ? 'border-bible-gold bg-stone-950 text-stone-100'
                  : 'border-transparent bg-stone-800 text-stone-500 hover:bg-stone-700'
                  }`}
              >
                <Moon size={20} />
                <span className="text-sm font-medium">{t.dark}</span>
              </button>
            </div>
          </div>

          {/* Font Size Section */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${themeClasses.subtext}`}>
              {t.fontSize}
            </label>
            <div className={`p-3 rounded-lg ${themeClasses.sectionBg}`}>
              <div className={`flex items-center justify-between mb-2 text-sm font-serif ${themeClasses.subtext}`}>
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
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-bible-gold
                  ${preferences.theme === 'dark' ? 'bg-stone-700' : 'bg-stone-200'}
                  ${preferences.theme === 'bw' ? 'accent-black bg-stone-300' : ''}
                `}
              />
              <div className={`text-center mt-2 text-xs font-bold ${themeClasses.subtext}`}>
                {preferences.fontSize}%
              </div>
            </div>
          </div>

          {/* Font Family Section */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${themeClasses.subtext}`}>
              {t.fontFamily}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update('fontFamily', 'serif')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all font-serif text-base ${preferences.fontFamily === 'serif'
                  ? (preferences.theme === 'bw' ? 'border-black bg-white text-black' : 'border-bible-gold bg-stone-50 dark:bg-stone-800 text-bible-accent dark:text-bible-gold')
                  : (preferences.theme === 'bw' ? 'border-transparent hover:border-black text-stone-500' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 hover:border-bible-gold/50')
                  }`}
              >
                <span className="font-serif">{t.serif}</span>
              </button>
              <button
                onClick={() => update('fontFamily', 'sans')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all font-sans text-base ${preferences.fontFamily === 'sans'
                  ? (preferences.theme === 'bw' ? 'border-black bg-white text-black' : 'border-bible-gold bg-stone-50 dark:bg-stone-800 text-bible-accent dark:text-bible-gold')
                  : (preferences.theme === 'bw' ? 'border-transparent hover:border-black text-stone-500' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 hover:border-bible-gold/50')
                  }`}
              >
                <span className="font-sans">{t.sans}</span>
              </button>
            </div>
          </div>

          {/* Alignment Section */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${themeClasses.subtext}`}>
              {t.textAlign}
            </label>
            <div className={`flex p-1 rounded-lg ${themeClasses.sectionBg}`}>
              <button
                onClick={() => update('textAlign', 'left')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${preferences.textAlign === 'left'
                  ? (preferences.theme === 'bw' ? 'bg-black text-white shadow-sm' : 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm')
                  : (preferences.theme === 'bw' ? 'text-black' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300')
                  }`}
              >
                <AlignLeft size={20} />
              </button>
              <button
                onClick={() => update('textAlign', 'justify')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${preferences.textAlign === 'justify'
                  ? (preferences.theme === 'bw' ? 'bg-black text-white shadow-sm' : 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm')
                  : (preferences.theme === 'bw' ? 'text-black' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300')
                  }`}
              >
                <AlignJustify size={20} />
              </button>
            </div>
          </div>

          {/* Voice Selection Section */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${themeClasses.subtext}`}>
              Voz da Leitura
            </label>
            <div className={`flex p-1 rounded-lg ${themeClasses.sectionBg}`}>
              <button
                onClick={() => update('voice', 'male')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all gap-2 ${preferences.voice === 'male' || !preferences.voice
                  ? (preferences.theme === 'bw' ? 'bg-black text-white shadow-sm' : 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm')
                  : (preferences.theme === 'bw' ? 'text-black' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300')
                  }`}
              >
                <span className="text-sm font-medium">Masculina</span>
              </button>
              <button
                onClick={() => update('voice', 'female')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all gap-2 ${preferences.voice === 'female'
                  ? (preferences.theme === 'bw' ? 'bg-black text-white shadow-sm' : 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm')
                  : (preferences.theme === 'bw' ? 'text-black' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300')
                  }`}
              >
                <span className="text-sm font-medium">Feminina</span>
              </button>
            </div>
          </div>

        </div>

        <div className={`p-4 border-t flex justify-end ${themeClasses.footer}`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-lg transition-colors font-medium
            ${preferences.theme === 'bw'
              ? 'bg-black text-white hover:bg-stone-800'
              : 'bg-bible-gold hover:bg-yellow-600 text-white'
            }
          `}>
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;