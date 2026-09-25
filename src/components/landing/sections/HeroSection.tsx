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
      heroImageUrl: "/landingpage.jpeg"
    };
  })();

  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[var(--bg)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--r8)] bg-[var(--g100)] border border-[var(--g200)] text-[var(--g700)] text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[var(--g600)] animate-pulse"></span>
              {heroConfig.badge}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-[var(--t1)] leading-[1.12] tracking-tight">
              {heroConfig.headline.split('Storelly')[0]} <span className="text-[var(--g600)]">Storelly</span> {heroConfig.headline.split('Storelly')[1] || ''}
            </h1>
            
            <p className="text-lg sm:text-xl text-[var(--t2)] leading-relaxed max-w-2xl font-normal">
              {heroConfig.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button 
                onClick={() => onOpenAuth('signup')}
                className="ds-btn-primary px-7 py-3.5 font-bold text-base shadow-[var(--shadow-sm)] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="ds-btn-secondary px-7 py-3.5 font-bold text-base shadow-[var(--shadow-xs)] flex items-center justify-center cursor-pointer"
              >
                See How It Works
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--t2)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--g600)] shrink-0" /> No Credit Card Required
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--t2)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--g600)] shrink-0" /> Setup in under 5 minutes
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--t2)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--g600)] shrink-0" /> 14 Days Free Pro Trial
              </div>
            </div>
          </div>

          {/* Right Image/Illustration */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full rounded-[var(--r20)] bg-[var(--card)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-4 sm:p-5 overflow-hidden flex items-center justify-center">
              <img 
                src={"/landingpage.jpeg"} 
                alt="Storelly Business Showcase" 
                className="w-full h-auto max-h-[580px] lg:max-h-[640px] object-cover rounded-[var(--r12)] border border-[var(--border)] shadow-[var(--shadow-sm)] mx-auto"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
