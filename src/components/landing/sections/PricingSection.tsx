import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const PricingSection: React.FC<Props> = ({ onOpenAuth }) => {
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#2f9e5c]">Transparent Pricing</span>
          <h2 className="text-[32px] font-extrabold text-[#14201a]">Simple Plans for Every Business</h2>
          <p className="text-[#5c6b63] text-sm">Start free, upgrade as your business grows. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Pricing Tiers (9 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Basic Plan */}
            <div className="bg-white p-6 rounded-[16px] border border-[#e7e5df] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.18)] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#14201a] mb-1">Basic</h3>
                <p className="text-xs text-[#5c6b63] mb-4">For new local vendors.</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-[#14201a]">₹299</span>
                  <span className="text-xs text-[#5c6b63]">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-xs text-[#14201a]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> 1 Store</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> 100 Products</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Basic Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Community Access</li>
                </ul>
              </div>
              <button 
                onClick={() => onOpenAuth('signup')} 
                className="w-full py-2.5 rounded-[9px] border border-[#e7e5df] text-[#14201a] font-semibold text-[14.5px] hover:bg-[#faf9f5] transition"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan (Popular) */}
            <div className="bg-[#155330] text-white p-6 rounded-[16px] border border-[#123c25] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.18)] flex flex-col justify-between relative transform md:-translate-y-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2f9e5c] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
                Popular
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white mb-1">Pro</h3>
                <p className="text-xs text-emerald-100 mb-4">For growing storefronts.</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-white">₹599</span>
                  <span className="text-xs text-emerald-200">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-xs text-emerald-50">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> 5 Stores</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Unlimited Products</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Priority Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Marketing Tools</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Custom Domain</li>
                </ul>
              </div>
              <button 
                onClick={() => onOpenAuth('signup')} 
                className="w-full py-2.5 rounded-[9px] bg-white text-[#155330] font-semibold text-[14.5px] hover:bg-emerald-50 transition shadow-md"
              >
                Start Free Trial
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white p-6 rounded-[16px] border border-[#e7e5df] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.18)] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#14201a] mb-1">Premium</h3>
                <p className="text-xs text-[#5c6b63] mb-4">For large brands & chains.</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-[#14201a]">₹999</span>
                  <span className="text-xs text-[#5c6b63]">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-xs text-[#14201a]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Unlimited Stores</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Unlimited Products</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Advanced Analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Dedicated Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2f9e5c]" /> Custom Features</li>
                </ul>
              </div>
              <button 
                onClick={() => onOpenAuth('signup')} 
                className="w-full py-2.5 rounded-[9px] border border-[#e7e5df] text-[#14201a] font-semibold text-[14.5px] hover:bg-[#faf9f5] transition"
              >
                Contact Sales
              </button>
            </div>

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
      </div>
    </section>
  );
};
