import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Sparkles, TrendingUp, ExternalLink, Store, Zap } from 'lucide-react';
import { PlatformClientBrand } from '../../types/admin';
import { adminGetHappyClients, DEFAULT_HAPPY_CLIENTS } from '../../services/adminService';

export const HappyClientsMarquee: React.FC = () => {
  const [clients, setClients] = useState<PlatformClientBrand[]>(DEFAULT_HAPPY_CLIENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

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

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  // Double the list for seamless infinite marquee scroll
  const marqueeItems = [...clients, ...clients, ...clients];

  return (
    <section className="py-20 bg-[var(--bg)] border-y border-[var(--border)] overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[var(--g500)]/8 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--g100)] border border-[var(--g200)] text-[var(--g800)] text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-xs mb-4">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          Powering Digital Stores & Creators Across India
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-[var(--t1)] tracking-tight leading-tight max-w-4xl mx-auto">
          Powering India’s Next Generation of D2C Stores & Micro-Enterprises
        </h2>
        <p className="text-base sm:text-lg text-[var(--t2)] max-w-3xl mx-auto mt-3 font-medium">
          From boutique handlooms and specialty roasters to tech educators and organic farms, see who grows with Storelly.
        </p>
      </div>

      {/* Marquee Wrapper with soft edge gradients */}
      <div className="relative w-full overflow-hidden">
        {/* Left and Right Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-[var(--bg)] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-[var(--bg)] to-transparent z-20 pointer-events-none" />

        {/* Continuous Scrolling Strip */}
        <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] py-4 px-2">
          {marqueeItems.map((brand, index) => {
            const isBroken = brokenImages[brand.id];
            const fallbackInitial = (brand.name || 'S').trim().charAt(0).toUpperCase();

            return (
              <div
                key={`${brand.id}-${index}`}
                className="w-[340px] sm:w-[400px] bg-[var(--card)] p-6 sm:p-7 rounded-[var(--r20)] border border-[var(--border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--g500)] transition-all duration-300 shrink-0 group flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Row: Logo, Name, Category & Rating */}
                <div>
                  <div className="flex items-start gap-4">
                    {/* Brand Image / Monogram */}
                    <div className="relative shrink-0">
                      {!isBroken && brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(brand.id)}
                          className="w-16 h-16 rounded-[var(--r16)] object-cover border-2 border-[var(--border)] shadow-sm group-hover:scale-105 transition-transform duration-300 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-[var(--r16)] bg-gradient-to-br from-[var(--g500)] to-[var(--g700)] text-white font-black text-2xl flex items-center justify-center border-2 border-white shadow-sm">
                          {fallbackInitial}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm border border-white">
                        ✓
                      </span>
                    </div>

                    {/* Brand Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-heading font-black text-lg sm:text-xl text-[var(--t1)] group-hover:text-[var(--g600)] transition-colors truncate">
                          {brand.name}
                        </h4>
                      </div>

                      <span className="inline-block text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full mt-1">
                        {brand.category}
                      </span>

                      {/* Stars */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {brand.rating || 5.0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlight Metric Banner */}
                  {brand.highlightMetric && (
                    <div className="mt-4 p-3 rounded-xl bg-[var(--g100)] border border-[var(--g200)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--g700)] shrink-0" />
                        <span className="text-xs font-bold text-[var(--t2)]">Growth:</span>
                        <span className="text-xs font-black text-[var(--g800)] font-heading">
                          {brand.highlightMetric}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Verified
                      </span>
                    </div>
                  )}

                  {/* Tagline / Description */}
                  {brand.tagline && (
                    <p className="text-xs sm:text-sm text-[var(--t2)] font-medium leading-relaxed mt-3 line-clamp-2">
                      {brand.tagline}
                    </p>
                  )}

                  {/* Testimonial Quote */}
                  {brand.reviewText && (
                    <div className="mt-3 p-3 rounded-xl bg-[var(--bg)] border-l-4 border-[var(--g500)] text-xs italic text-[var(--t2)] leading-relaxed">
                      "{brand.reviewText}"
                      {brand.reviewAuthor && (
                        <span className="block not-italic font-bold text-[var(--t1)] mt-1 text-[11px]">
                          — {brand.reviewAuthor}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Store URL Link */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-semibold text-[var(--t3)] truncate">
                    {brand.storeUrl ? brand.storeUrl.replace('https://', '') : `storelly.com/${brand.id}`}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 group-hover:translate-x-1 transition-transform">
                    Visit Store <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

