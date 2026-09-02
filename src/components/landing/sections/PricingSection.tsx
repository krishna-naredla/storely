import React, { useState, useEffect } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { PlatformPricingPlan, PlatformPricingCMS } from '../../../types/admin';
import { 
  adminGetPricingPlans, 
  adminGetPricingCMS, 
  DEFAULT_PRICING_PLANS, 
  DEFAULT_PRICING_CMS 
} from '../../../services/adminService';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const PricingSection: React.FC<Props> = ({ onOpenAuth }) => {
  const [plans, setPlans] = useState<PlatformPricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [cms, setCms] = useState<PlatformPricingCMS>(DEFAULT_PRICING_CMS);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const [loadedPlans, loadedCms] = await Promise.all([
          adminGetPricingPlans(),
          adminGetPricingCMS()
        ]);
        if (loadedPlans && loadedPlans.length > 0) {
          setPlans(loadedPlans.filter(p => p.isActive !== false));
        }
        if (loadedCms && loadedCms.title) {
          setCms(loadedCms);
        }
      } catch (e) {
        console.warn('Error loading dynamic pricing in PricingSection:', e);
      }
    };

    loadPricing();

    const handlePlansChange = (e: CustomEvent) => {
      if (e.detail?.plans) {
        setPlans(e.detail.plans.filter((p: PlatformPricingPlan) => p.isActive !== false));
      }
    };

    const handleCmsChange = (e: CustomEvent) => {
      if (e.detail) {
        setCms(e.detail);
      }
    };

    window.addEventListener('storelly_pricing_changed' as any, handlePlansChange as EventListener);
    window.addEventListener('storelly_pricing_cms_changed' as any, handleCmsChange as EventListener);

    return () => {
      window.removeEventListener('storelly_pricing_changed' as any, handlePlansChange as EventListener);
      window.removeEventListener('storelly_pricing_cms_changed' as any, handleCmsChange as EventListener);
    };
  }, []);

  const testimonials = [
    { quote: "Storelly made our boutique online in minutes!", author: "Priya S.", rating: 5 },
    { quote: "Sold 500+ copies of my coding notes and booked 1:1 sessions effortlessly!", author: "Prof. Rajesh (Coding Coach)", rating: 5 },
    { quote: "The order notifications and WhatsApp sharing are incredible.", author: "Rahul M.", rating: 5 },
    { quote: "Best pricing and zero hassle to manage inventory.", author: "Anitha R.", rating: 5 },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#faf9f5] border-b border-[#e7e5df]">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2f9e5c]">{cms.badge || 'Transparent Pricing'}</span>
          <h2 className="text-[32px] font-extrabold text-[#14201a]">{cms.title || 'Start Free. Upgrade When You Grow.'}</h2>
          <p className="text-[#5c6b63] text-sm">{cms.subtitle || 'Start free, upgrade as your business grows. No hidden fees.'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Dynamic Pricing Tiers (8 cols) */}
          <div className={`lg:col-span-8 grid grid-cols-1 ${plans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
            {plans.map((plan) => {
              const isRecommended = plan.isRecommended || plan.badge === 'Recommended';
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-[16px] flex flex-col justify-between relative transition-all ${
                    isRecommended
                      ? 'bg-[#155330] text-white border-2 border-[#2f9e5c] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.25)] transform md:-translate-y-2'
                      : 'bg-white border border-[#e7e5df] text-[#14201a] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.1)]'
                  }`}
                >
                  {(plan.badge || isRecommended) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2f9e5c] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-white" /> {plan.badge || 'Recommended'}
                    </div>
                  )}

                  <div>
                    <h3 className={`text-lg font-extrabold mb-1 ${isRecommended ? 'text-white' : 'text-[#14201a]'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-4 ${isRecommended ? 'text-emerald-100' : 'text-[#5c6b63]'}`}>
                      {plan.tagline}
                    </p>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold ${isRecommended ? 'text-white' : 'text-[#14201a]'}`}>
                        {plan.currency || '₹'}{plan.monthlyPrice}
                      </span>
                      {plan.billingCycle && (
                        <span className={`text-xs ${isRecommended ? 'text-emerald-200' : 'text-[#5c6b63]'}`}>
                          {plan.billingCycle}
                        </span>
                      )}
                    </div>

                    <ul className={`space-y-3 mb-6 text-xs ${isRecommended ? 'text-emerald-50' : 'text-[#14201a]'}`}>
                      {plan.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isRecommended ? 'text-[#2f9e5c]' : 'text-[#2f9e5c]'}`} />
                          <span className="font-medium">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => {
                      if (plan.ctaAction === 'login') onOpenAuth('login');
                      else onOpenAuth('signup');
                    }} 
                    className={`w-full py-2.5 rounded-[9px] font-semibold text-[14.5px] transition shadow-md active:scale-95 cursor-pointer ${
                      isRecommended
                        ? 'bg-white text-[#155330] hover:bg-emerald-50'
                        : 'border border-[#e7e5df] text-[#14201a] hover:bg-[#faf9f5]'
                    }`}
                  >
                    {plan.ctaText || (plan.monthlyPrice === 0 ? 'Start Free' : 'Get Started')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Beside Pricing: Stacked Testimonials with 5-star ratings (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-extrabold text-[#14201a] text-sm uppercase tracking-wider mb-4">What Our Users Say</h3>
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white p-5 rounded-[12px] border border-[#e7e5df] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.18)] space-y-2">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#f5a623] fill-[#f5a623]" />
                  ))}
                </div>
                <p className="text-xs text-[#14201a] font-medium leading-snug">"{t.quote}"</p>
                <p className="text-[11px] text-[#5c6b63] font-bold">— {t.author}</p>
              </div>
            ))}
          </div>

        </div>

        {cms.footerNote && (
          <p className="text-center text-[#5c6b63] font-medium text-xs mt-10">
            {cms.footerNote}
          </p>
        )}
      </div>
    </section>
  );
};
