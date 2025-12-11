import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { getDevotional } from '../services/geminiService';
import { ReadingPreferences, DevotionalContent } from '../types';


interface DevotionalPageProps {
    language: string;
    t: any;
    preferences: ReadingPreferences;
}

const DevotionalPage: React.FC<DevotionalPageProps> = ({ language, t, preferences }) => {
    const [dailyDevotional, setDailyDevotional] = useState<DevotionalContent | null>(null);

    useEffect(() => {
        const loadDevotional = async () => {
            try {
                const content = await getDevotional(language);
                setDailyDevotional(content);
            } catch (e) {
                console.error(e);
            }
        };
        loadDevotional();
    }, [language]);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center">
            <SEO
                title={dailyDevotional ? `${dailyDevotional.title} - ${t.t?.dailyDevotionalTitle || t.dailyDevotionalTitle || "Devocional"}` : `${t.t?.dailyDevotionalTitle || t.dailyDevotionalTitle || "Devocional"}`}
                description="Devocional diário para inspiração e reflexão espiritual."
                url={window.location.href}
            />

            {/* Header / Eyebrow (Sun Icon Removed) */}
            <div className="text-center mb-8">
                <span className={`font-bold uppercase tracking-widest text-sm transition-colors
                    ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}
                `}>
                    {t.dailyDevotionalTitle}
                </span>

                {/* If we have a title, show it here as H1 */}
                {dailyDevotional && (
                    <h1 className={`text-3xl md:text-5xl font-serif mt-4 leading-tight animate-slideUp transition-colors
                        ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-stone-100'}
                    `}>
                        {dailyDevotional.title}
                    </h1>
                )}
            </div>

            {!dailyDevotional ? (
                <div className="space-y-6 animate-pulse w-full max-w-2xl">
                    <div className={`h-8 rounded w-3/4 mx-auto ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                    <div className={`h-64 rounded w-full mx-auto ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                    <div className={`h-40 rounded w-full mx-auto ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                </div>
            ) : (
                <div className={`w-full transition-colors font-serif
          ${preferences.theme === 'sepia' ? 'text-[#5c4b37]' : 'text-stone-800 dark:text-stone-200'}
        `}>

                    {/* Verse Text Display (Styled) */}
                    <div className="text-center mb-10 animate-slideUp">
                        <div className={`p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-lg transition-all
                            ${preferences.theme === 'sepia'
                                ? 'bg-gradient-to-br from-[#fdf6e3] to-[#eee8d5] shadow-[#d2c9a5]/50'
                                : preferences.theme === 'bw'
                                    ? 'bg-white border-2 border-black shadow-none'
                                    : 'bg-gradient-to-br from-white via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 shadow-xl border border-white/50 dark:border-white/5'}
                        `}>
                            {/* Decorative Background Icon */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10"></div>

                            <p className={`text-2xl md:text-3xl italic font-serif leading-relaxed mb-6 relative z-10
                                ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-800 dark:text-stone-100'}
                            `}>
                                "{dailyDevotional.verseText}"
                            </p>

                            <div className="flex items-center justify-center gap-4 mb-2 opacity-60">
                                <div className="h-px w-12 bg-current"></div>
                                <div className="h-1 w-1 rounded-full bg-current"></div>
                                <div className="h-px w-12 bg-current"></div>
                            </div>

                            <p className={`text-sm font-bold uppercase tracking-[0.2em] relative z-10
                                ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}
                            `}>
                                {dailyDevotional.verseReference}
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none mb-12 leading-8 dark:prose-invert">
                        {dailyDevotional.reflection.split('\n').map((paragraph, i) => (
                            <p key={i} className="mb-4 text-justify">{paragraph}</p>
                        ))}
                    </div>

                    <div className={`p-8 rounded-2xl border-l-4 transition-colors
              ${preferences.theme === 'sepia'
                            ? 'bg-[#e6dcc6]/30 border-[#8c7b64]'
                            : preferences.theme === 'bw'
                                ? 'bg-stone-50 border-black'
                                : 'bg-stone-100 dark:bg-stone-800/50 border-bible-gold'}
            `}>
                        <h3 className="font-bold text-sm uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-current"></span>
                            {t.prayer}
                        </h3>
                        <p className="italic text-lg leading-relaxed">
                            {dailyDevotional.prayer}
                        </p>
                    </div>

                </div>
            )}
        </div>
    );
};

export default DevotionalPage;
