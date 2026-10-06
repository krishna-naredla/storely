import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { adminGetLandingHero, DEFAULT_LANDING_HERO } from '../../../services/adminService';
import { PlatformLandingHeroConfig } from '../../../types/admin';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HeroSection: React.FC<Props> = ({ onOpenAuth }) => {
  const [heroConfig, setHeroConfig] = useState<PlatformLandingHeroConfig>(() => {
    try {
      const saved = localStorage.getItem('storelly_landing_hero_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LANDING_HERO;
  });

  useEffect(() => {
    let isMounted = true;
    adminGetLandingHero().then((data) => {
      if (isMounted && data) {
        setHeroConfig(data);
      }
    });

    const handleHeroChanged = (e: any) => {
      if (e?.detail) setHeroConfig(e.detail);
    };

    window.addEventListener('storelly_hero_changed', handleHeroChanged);
    return () => {
      isMounted = false;
      window.removeEventListener('storelly_hero_changed', handleHeroChanged);
    };
  }, []);

  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[var(--bg)] border-b border-[var(--border)]">
      {/* Full 45-Degree Diagonal Triangle Creator Theme Background specifically on Right Side */}
      <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[60%] pointer-events-none z-0 overflow-hidden">
        <div 
          className="hidden lg:block absolute inset-0 bg-gradient-to-bl from-indigo-700 via-purple-700 to-violet-950 opacity-95 shadow-2xl"
          style={{
            clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)'
          }}
        />
        <div 
          className="lg:hidden absolute bottom-0 right-0 left-0 h-[65%] bg-gradient-to-t from-indigo-950 via-purple-800 to-transparent opacity-90"
          style={{
            clipPath: 'polygon(0% 18%, 100% 0%, 100% 100%, 0% 100%)'
          }}
        />
        <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-7">
            {/* Pre-Headline Kicker */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Go From Offline to Online in 3 Simple Steps
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-[var(--t1)] leading-[1.12] tracking-tight">
              {heroConfig.headline && heroConfig.headline.includes('Storelly') ? (
                <>
                  {heroConfig.headline.split('Storelly')[0]}
                  <span className="text-[var(--g600)]">Storelly</span>
                  {heroConfig.headline.split('Storelly')[1] || ''}
                </>
              ) : (
                heroConfig.headline
              )}
            </h1>

            {/* 0% Commission Big Bold Highlight with Stylized Big Pencil-Drawn Circle around the 0 */}
            <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-4 py-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--t1)] tracking-tight">
                Sell with
              </span>
              
              <div className="inline-flex items-center">
                {/* The '0' with realistic BIG hand-drawn pencil circle */}
                <div className="relative inline-flex items-center justify-center mx-2 px-1 py-0.5">
                  <span className="relative z-10 px-4 sm:px-5 py-1 text-emerald-600 dark:text-emerald-400 font-heading font-black text-6xl sm:text-7xl lg:text-8xl tracking-tighter select-none">
                    0
                  </span>
                  
                  {/* Big Stylized Hand-Drawn Pencil Circle SVG */}
                  <svg 
                    className="absolute -inset-4 sm:-inset-6 lg:-inset-7 w-[calc(100%+32px)] sm:w-[calc(100%+48px)] lg:w-[calc(100%+56px)] h-[calc(100%+32px)] sm:h-[calc(100%+48px)] lg:h-[calc(100%+56px)] pointer-events-none z-20 text-emerald-500 dark:text-emerald-400 overflow-visible"
                    viewBox="0 0 160 160"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Large primary sketched loop with natural overlapping pencil jitter */}
                    <path 
                      d="M 80 12 C 122 9, 154 36, 150 82 C 146 126, 112 152, 68 154 C 24 156, 6 122, 8 80 C 10 38, 44 12, 92 10 C 136 8, 156 38, 152 82 C 147 120, 114 148, 76 150" 
                      stroke="currentColor" 
                      strokeWidth="4.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeDasharray="700"
                      style={{ filter: 'drop-shadow(0px 2px 5px rgba(16, 185, 129, 0.45))' }}
                    />
                    {/* Secondary texture pass to emulate real pencil stroke shading */}
                    <path 
                      d="M 74 18 C 114 16, 144 42, 142 80 C 140 114, 108 142, 64 144 C 32 146, 14 116, 16 78 C 18 42, 50 18, 86 16 C 118 14, 146 34, 144 74" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="opacity-70"
                    />
                    {/* Artistic sketch tail stroke */}
                    <path 
                      d="M 142 72 C 148 90, 150 112, 136 130" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      className="opacity-80"
                    />
                  </svg>
                </div>

                <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
                  %
                </span>
              </div>

              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--t1)] tracking-tight">
                Commission
              </span>
            </div>
            
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

          {/* Right Image/Illustration Directly on Creator Theme 45-Degree Diagonal Backdrop */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full rounded-[var(--r20)] bg-[var(--card)] shadow-[var(--shadow-xl)] border border-white/40 p-2 sm:p-3 overflow-hidden flex items-center justify-center z-10">
              <img 
                src={heroConfig.heroImageUrl || "/landingpage.jpeg"} 
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
