import React from 'react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HeroSection: React.FC<Props> = ({ onOpenAuth }) => {
  const heroConfig = (() => {
    try {
      const saved = localStorage.getItem('storelly_landing_hero_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      badge: "India's #1 Digital Business Operating System",
      headline: "Launch Your Online Store & Grow With Storelly",
      subtitle: "Empower your local shop, boutique, homemade brand, or service business with a professional storefront, product catalog, instant orders, and custom digital cards — in minutes, no coding needed.",
      heroImageUrl: "/storelly6.jpg.jpeg"
    };
  })();

  return (
    <div className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden bg-slate-50 border-b border-slate-100">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-50/70 blur-3xl pointer-events-none"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              {heroConfig.badge}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.12] tracking-tight">
              {heroConfig.headline.split('Storelly')[0]} <span className="text-emerald-600">Storelly</span> {heroConfig.headline.split('Storelly')[1] || ''}
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
              {heroConfig.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button 
                onClick={() => onOpenAuth('signup')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-emerald-600/25 transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-8 py-4 rounded-full font-bold text-base transition-all flex items-center justify-center cursor-pointer shadow-xs"
              >
                See How It Works
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> No Credit Card Required
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Setup in under 5 minutes
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 14 Days Free Pro Trial
              </div>
            </div>
          </div>

          {/* Right Image/Illustration */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full rounded-3xl bg-linear-to-b from-emerald-50 to-teal-100/50 shadow-2xl shadow-emerald-900/10 border border-emerald-200/60 p-5 overflow-hidden flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-300">
              <img 
                src={heroConfig.heroImageUrl} 
                alt="Storelly Business Showcase" 
                className="w-full h-auto max-h-[580px] lg:max-h-[640px] object-cover rounded-2xl shadow-xl mx-auto"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
