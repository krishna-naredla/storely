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
    <section id="pricing" className="py-24 bg-[var(--bg)] border-b border-[var(--border)]">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--g700)]">{cms.badge || 'Transparent Pricing'}</span>
          <h2 className="text-[32px] font-heading font-black text-[var(--t1)]">{cms.title || 'Start Free. Upgrade When You Grow.'}</h2>
          <p className="text-[var(--t2)] text-sm">{cms.subtitle || 'Start free, upgrade as your business grows. No hidden fees.'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Dynamic Pricing Tiers (8 cols) */}
          <div className={`lg:col-span-8 grid grid-cols-1 ${plans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
            {plans.map((plan) => {
              const isRecommended = plan.isRecommended || plan.badge === 'Recommended';
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-[var(--r16)] flex flex-col justify-between relative transition-all ${
                    isRecommended
                      ? 'bg-[var(--g900)] text-white border-2 border-[var(--g500)] shadow-[var(--shadow-lg)] transform md:-translate-y-2'
                      : 'bg-[var(--card)] border border-[var(--border)] text-[var(--t1)] shadow-[var(--shadow-sm)]'
                  }`}
                >
                  {(plan.badge || isRecommended) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--g600)] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-[var(--r4)] tracking-wider flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-white" /> {plan.badge || 'Recommended'}
                    </div>
                  )}

                  <div>
                    <h3 className={`text-lg font-heading font-extrabold mb-1 ${isRecommended ? 'text-white' : 'text-[var(--t1)]'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-4 ${isRecommended ? 'text-[var(--g200)]' : 'text-[var(--t2)]'}`}>
                      {plan.tagline}
                    </p>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className={`text-3xl font-heading font-extrabold tabular-nums ${isRecommended ? 'text-white' : 'text-[var(--t1)]'}`}>
                        {plan.currency || '₹'}{plan.monthlyPrice}
                      </span>
                      {plan.billingCycle && (
                        <span className={`text-xs ${isRecommended ? 'text-[var(--g300)]' : 'text-[var(--t2)]'}`}>
                          {plan.billingCycle}
                        </span>
                      )}
                    </div>

                    <ul className={`space-y-3 mb-6 text-xs ${isRecommended ? 'text-emerald-50' : 'text-[var(--t1)]'}`}>
                      {plan.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isRecommended ? 'text-[var(--g300)]' : 'text-[var(--g600)]'}`} />
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
                    className={`w-full py-2.5 rounded-[var(--r8)] font-semibold text-sm transition shadow-[var(--shadow-xs)] active:scale-95 cursor-pointer ${
                      isRecommended
                        ? 'bg-white text-[var(--g900)] hover:bg-[var(--g100)]'
                        : 'border border-[var(--border)] bg-[var(--card)] text-[var(--t1)] hover:bg-[var(--g100)]'
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
            <h3 className="font-heading font-black text-[var(--t1)] text-sm uppercase tracking-wider mb-4">What Our Users Say</h3>
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-[var(--card)] p-5 rounded-[var(--r12)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-2">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-[var(--t1)] font-medium leading-snug">"{t.quote}"</p>
                <p className="text-[11px] text-[var(--g700)] font-bold">— {t.author}</p>
              </div>
            ))}
          </div>

        </div>

        {cms.footerNote && (
          <p className="text-center text-[var(--t2)] font-medium text-xs mt-10">
            {cms.footerNote}
          </p>
        )}
      </div>
    </section>
  );
};
