import React from 'react';
import { ShoppingBag, MessageCircle, ShieldCheck, Zap } from 'lucide-react';

export const TrustSection: React.FC = () => {
  return (
    <div className="bg-white py-10 border-b border-slate-100 relative z-20 -mt-8 mx-4 sm:mx-auto max-w-6xl rounded-3xl shadow-xl shadow-slate-200/40">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 sm:px-8 items-center justify-center text-center divide-x divide-slate-100">
        <div className="space-y-1 flex flex-col items-center">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mb-1">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-black text-slate-800">WhatsApp Commerce</p>
          <p className="text-[11px] font-medium text-slate-500">Direct order alerts</p>
        </div>
        <div className="space-y-1 flex flex-col items-center">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 mb-1">
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-sm font-black text-slate-800">0% Commission</p>
          <p className="text-[11px] font-medium text-slate-500">Keep 100% of sales</p>
        </div>
        <div className="space-y-1 flex flex-col items-center">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 mb-1">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <p className="text-sm font-black text-slate-800">Instant Storefront</p>
          <p className="text-[11px] font-medium text-slate-500">Live in 60 seconds</p>
        </div>
        <div className="space-y-1 flex flex-col items-center">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-sm font-black text-slate-800">Secure Direct UPI</p>
          <p className="text-[11px] font-medium text-slate-500">Instant settlements</p>
        </div>
      </div>
    </div>
  );
};
