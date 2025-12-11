import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { Sun, Quote } from 'lucide-react';
import { getDevotional } from '../services/geminiService';
import { ReadingPreferences, DevotionalContent } from '../types';
import { AdUnit } from '../components/AdUnit';

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
        <div className="max-w-3xl mx-auto p-6 md:p-12 flex flex-col items-center">
            <SEO
                title={dailyDevotional ? `${dailyDevotional.title} - ${t.t?.dailyDevotionalTitle || t.dailyDevotionalTitle || "Devocional"}` : `${t.t?.dailyDevotionalTitle || t.dailyDevotionalTitle || "Devocional"}`}
                description="Devocional diário para inspiração e reflexão espiritual."
                url={window.location.href}
            />

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors
                ${preferences.theme === 'bw'
                    ? 'bg-stone-100 text-black'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}
            `}>
                <Sun size={32} />
            </div>
            {/* Header / Eyebrow */}
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
                    <div className={`h-32 rounded w-full mx-auto ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                    <div className={`h-40 rounded w-full mx-auto ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                </div>
            ) : (
                <div className={`w-full transition-colors font-serif
          ${preferences.theme === 'sepia' ? 'text-[#5c4b37]' : 'text-stone-800 dark:text-stone-200'}
        `}>


                    <div className={`relative p-8 md:p-10 rounded-xl mb-10 border mt-8
               ${preferences.theme === 'sepia'
                            ? 'bg-[#fcf9ee] border-[#e6dcc6]'
                            : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-sm'}
            `}>
                        <Quote className="absolute top-6 left-6 opacity-10 w-12 h-12 text-bible-gold" />
                        <blockquote className="relative z-10 text-xl md:text-2xl text-center leading-relaxed italic">
                            "{dailyDevotional.verseText}"
                        </blockquote>
                        <div className="text-center mt-6 font-bold uppercase tracking-widest text-xs opacity-70">
                            {dailyDevotional.verseReference}
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

                    <AdUnit className="mt-12 border-t border-stone-100 dark:border-stone-800 pt-8" />
                </div>
            )}
        </div>
    );
};

export default DevotionalPage;
