import React from 'react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HeroSection: React.FC<Props> = ({ onOpenAuth }) => {
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
              India's #1 Digital Business Operating System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.12] tracking-tight">
              Launch Your Online Store & Grow With <span className="text-emerald-600">Storelly</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
              Empower your local shop, boutique, homemade brand, or service business with a professional storefront, product catalog, instant orders, and custom digital cards — in minutes, no coding needed.
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
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-linear-to-b from-emerald-50 to-teal-100/50 shadow-2xl shadow-emerald-900/10 border border-emerald-200/60 p-4 overflow-hidden flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80" 
                alt="Storelly 2D Business Illustration" 
                className="w-full h-[380px] sm:h-[420px] object-cover rounded-2xl mix-blend-multiply opacity-95"
              />
              <div className="absolute inset-0 bg-linear-to-t from-emerald-950/40 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
              
              {/* Floating Sales Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/30">
                    ₹
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Live Store Revenue</p>
                    <p className="text-lg font-black text-slate-900">₹2,45,000</p>
                    <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">↑ +18.5% this week</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  Active
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
