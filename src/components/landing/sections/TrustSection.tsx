import React from 'react';
import { Star } from 'lucide-react';

export const TrustSection: React.FC = () => {
  return (
    <div className="bg-white py-12 border-b border-slate-100 relative z-20 -mt-8 mx-4 sm:mx-auto max-w-6xl rounded-3xl shadow-xl shadow-slate-200/40">
      <div className="text-center mb-8">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Trusted by 10,000+ Brands & Vendors</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 items-center justify-center text-center divide-x divide-slate-100">
        <div className="space-y-1">
          <p className="text-3xl font-black text-slate-800">10K+</p>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Happy Vendors</p>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-black text-slate-800">50K+</p>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Stores Created</p>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-black text-slate-800">1M+</p>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Orders Processed</p>
        </div>
        <div className="space-y-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-3xl font-black text-slate-800">4.8</p>
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Average Rating</p>
        </div>
      </div>
    </div>
  );
};
