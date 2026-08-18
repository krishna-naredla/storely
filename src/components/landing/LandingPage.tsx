import React, { useEffect } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './sections/HeroSection';
import { TrustSection } from './sections/TrustSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { PricingSection } from './sections/PricingSection';
import { TestimonialSection } from './sections/TestimonialSection';
import { FAQSection } from './sections/FAQSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onExploreDemoStore: (slug: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <LandingNavbar onOpenAuth={onOpenAuth} />
      
      <main>
        <HeroSection onOpenAuth={onOpenAuth} />
        <TrustSection />
        <FeaturesSection />
        <TestimonialSection />
        <PricingSection onOpenAuth={onOpenAuth} />
        <FAQSection />
        
        {/* Final CTA */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
           <div className="absolute inset-0 z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>
           </div>
           <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Ready to Take Your Business Online?</h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Create your Storelly business and start building your digital presence today. No coding required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                   onClick={() => onOpenAuth('signup')}
                   className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4 rounded-full font-black text-lg shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                 >
                   Get Started For Free
                 </button>
                 <button 
                   onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                   className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 px-10 py-4 rounded-full font-bold text-lg transition-all"
                 >
                   View Pricing Plans
                 </button>
              </div>
           </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};
