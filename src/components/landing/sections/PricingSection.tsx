import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const PricingSection: React.FC<Props> = ({ onOpenAuth }) => {
  return (
    <section id="pricing" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">Simple Pricing</h4>
          <h2 className="text-4xl font-black text-slate-900 mb-4">Choose the Plan That Grows with You</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Start for free and upgrade when you need more power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Basic</h3>
            <p className="text-sm text-slate-500 mb-6">Perfect for startups and small shops.</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">₹299</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 1 Store</li>
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Up to 100 Products</li>
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Basic Support</li>
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Digital Card</li>
            </ul>
            <button onClick={() => onOpenAuth('signup')} className="w-full py-3 rounded-full border-2 border-slate-200 text-slate-700 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors">
              Start Free Trial
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-t-3xl"></div>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-sm text-slate-400 mb-6">Best for growing businesses.</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">₹599</span>
              <span className="text-slate-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> 5 Stores</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Unlimited Products</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Priority Support</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Custom Domain</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Marketing Tools</li>
            </ul>
            <button onClick={() => onOpenAuth('signup')} className="w-full py-3 rounded-full bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all">
              Start Free Trial
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Premium</h3>
            <p className="text-sm text-slate-500 mb-6">For large scale brands and chains.</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">₹999</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Unlimited Stores</li>
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Unlimited Products</li>
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dedicated Manager</li>
              <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Advanced Analytics</li>
            </ul>
            <button onClick={() => onOpenAuth('signup')} className="w-full py-3 rounded-full border-2 border-slate-200 text-slate-700 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
        
        <div className="text-center mt-8 text-sm text-slate-500">
          14 Days Free Trial • No Credit Card Required • Cancel Anytime
        </div>
      </div>
    </section>
  );
};
