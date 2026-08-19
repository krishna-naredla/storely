import React from 'react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'es', label: 'Spanish', native: 'Español' },
    { code: 'fr', label: 'French', native: 'Français' },
  ];

  return (
    <div className="relative inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 transition">
      <Globe className="w-3.5 h-3.5 text-emerald-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer capitalize"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native} ({l.label})
          </option>
        ))}
      </select>
    </div>
  );
};
