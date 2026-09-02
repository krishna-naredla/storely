import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Sparkles, TrendingUp, ExternalLink } from 'lucide-react';
import { PlatformClientBrand } from '../../types/admin';
import { adminGetHappyClients, DEFAULT_HAPPY_CLIENTS } from '../../services/adminService';

export const HappyClientsMarquee: React.FC = () => {
  const [clients, setClients] = useState<PlatformClientBrand[]>(DEFAULT_HAPPY_CLIENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadClients = async () => {
    try {
      const data = await adminGetHappyClients();
      const active = data.filter((c) => c.isActive !== false);
      setClients(active.length > 0 ? active : DEFAULT_HAPPY_CLIENTS);
    } catch (err) {
      console.warn('Error loading happy clients for marquee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();

    const handleUpdate = () => loadClients();
    window.addEventListener('storelly_clients_changed', handleUpdate);
    return () => window.removeEventListener('storelly_clients_changed', handleUpdate);
  }, []);

  // Double the list for infinite seamless looping
  const marqueeItems = [...clients, ...clients, ...clients];

  return (
    <section className="py-14 bg-gradient-to-b from-white via-slate-50/50 to-white border-y border-slate-100 overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black tracking-wide uppercase shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          Trusted by 10,000+ Fast-Growing Brands & Creators Across India
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Powering India’s Next Generation of D2C Stores & Micro-Enterprises
        </h3>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2">
          From boutique handlooms and specialty roasters to tech educators and organic farms, see who grows with Storelly.
        </p>
      </div>

      {/* Marquee Wrapper with soft edge gradients */}
      <div className="relative w-full overflow-hidden">
        {/* Left and Right Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

        {/* Continuous Scrolling Strip */}
        <div className="flex gap-5 w-max animate-marquee hover:[animation-play-state:paused] py-2">
          {marqueeItems.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="flex items-center gap-3.5 bg-white/95 backdrop-blur-xs px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 shrink-0 group cursor-default"
            >
              {/* Brand Logo */}
              <div className="relative shrink-0">
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-100 group-hover:scale-105 transition-transform duration-200 shadow-2xs"
                  onError={(e) => {
                    (e.target as any).src =
                      'https://images.unsplash.com/photo-1544441893-675973e31985?w=150&auto=format&fit=crop&q=80';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-2xs">
                  ✓
                </span>
              </div>

              {/* Brand Meta */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {brand.name}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {brand.rating || 5.0}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  {brand.category}
                </span>

                {brand.highlightMetric && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 w-max">
                    {brand.highlightMetric}
                  </span>
                )}

                {brand.reviewText && (
                  <p className="text-[10px] text-slate-600 mt-2 italic border-l-2 border-emerald-200 pl-2 leading-relaxed">
                    "{brand.reviewText}"
                    {brand.reviewAuthor && (
                      <span className="block text-slate-400 font-medium not-italic mt-0.5 text-[9px]">- {brand.reviewAuthor}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
