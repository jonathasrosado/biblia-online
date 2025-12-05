import React from 'react';

interface AdUnitProps {
  className?: string;
  label?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ className = '', label = 'Publicidade' }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center my-6 ${className}`} role="complementary" aria-label="Publicidade">
      <div className="text-[10px] text-stone-400 dark:text-stone-600 uppercase tracking-widest mb-1 select-none">
        {label}
      </div>
      <div className="w-full max-w-[728px] h-[90px] bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-lg flex items-center justify-center text-stone-400 dark:text-stone-600 text-xs">
        {/* Este é um placeholder visual. O código do AdSense seria injetado aqui. */}
        <span>Espaço para Google AdSense</span>
      </div>
    </div>
  );
};
