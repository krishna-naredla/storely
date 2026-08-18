import React from 'react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HeroSection: React.FC<Props> = ({ onOpenAuth }) => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-50/60 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="space-y-8 max-w-2xl">
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Create. Manage.<br/>Grow Your Business with <span className="text-emerald-600">Storelly</span>
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              Your all-in-one platform to build your online store, manage products, receive orders, and grow your brand – all in one place without coding.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => onOpenAuth('signup')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center"
              >
                See How It Works
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Credit Card Required</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Easy Setup in Minutes</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14 Days Free Pro Trial</div>
            </div>
          </div>

          {/* Right Image/Mockup */}
          <div className="relative">
            {/* SaaS UI Mockup Box */}
            <div className="relative rounded-3xl bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 overflow-hidden transform lg:translate-x-10">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" 
                alt="Storelly Dashboard Preview" 
                className="w-full h-[400px] object-cover rounded-2xl opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-3xl"></div>
              
              {/* Floating Sales Card */}
              <div className="absolute bottom-6 left-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-black text-slate-900">₹2,45,000</p>
                  <p className="text-xs text-emerald-600 font-bold">+18.5% this week</p>
                </div>
              </div>

              {/* Floating Mobile Phone Mockup */}
              <div className="absolute -right-6 -bottom-10 w-48 h-96 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl overflow-hidden hidden sm:block transform rotate-[-5deg]">
                <div className="absolute top-0 inset-x-0 h-6 bg-black z-10 flex justify-center rounded-t-[2.5rem]">
                  <div className="w-16 h-4 bg-black rounded-b-xl mt-1"></div>
                </div>
                <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80" alt="Mobile View" />
                <div className="absolute inset-0 bg-emerald-900/40 mix-blend-multiply"></div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl">
                  <div className="w-full h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">Buy Now</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
