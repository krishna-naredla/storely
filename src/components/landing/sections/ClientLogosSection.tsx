import React, { useState, useEffect } from 'react';
import { Store, ShoppingBag, Cpu, Home, PackageCheck, Sparkles } from 'lucide-react';

export const ClientLogosSection: React.FC = () => {
  const [clients, setClients] = useState([
    { name: 'Organic Store', icon: 'Store' },
    { name: 'Fashion Hub', icon: 'ShoppingBag' },
    { name: 'Tech World', icon: 'Cpu' },
    { name: 'Home Decor', icon: 'Home' },
    { name: 'Fresh Basket', icon: 'PackageCheck' },
    { name: 'Beauty Bliss', icon: 'Sparkles' },
    { name: 'Krishna Pickles', icon: 'Store' },
    { name: 'Artisan Crafts', icon: 'ShoppingBag' }
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('storelly_admin_brands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClients(parsed);
        }
      }
    } catch {}
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-emerald-700" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-emerald-700" />;
      case 'Home': return <Home className="w-5 h-5 text-emerald-700" />;
      case 'PackageCheck': return <PackageCheck className="w-5 h-5 text-emerald-700" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-emerald-700" />;
      default: return <Store className="w-5 h-5 text-emerald-700" />;
    }
  };

  // Duplicate list to make infinite marquee loop smooth
  const marqueeItems = [...clients, ...clients, ...clients];

  return (
    <section className="py-16 bg-[#faf9f5] border-b border-[#e7e5df] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#5c6b63]">
          Trusted by Top-Performing Local Brands & Storefronts Across India
        </p>

        {/* Right-to-Left Smooth Auto-Scrolling Marquee */}
        <div className="relative w-full overflow-hidden py-2">
          {/* Gradient masks for smooth fading edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#faf9f5] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#faf9f5] to-transparent z-10 pointer-events-none"></div>

          <div className="flex w-max animate-marquee gap-6 items-center">
            {marqueeItems.map((client, idx) => (
              <div 
                key={idx} 
                className="bg-white px-6 py-4 rounded-2xl border border-[#e7e5df] shadow-xs flex items-center gap-3 shrink-0 hover:border-emerald-500 hover:shadow-md transition-all duration-300"
              >
                <div className="p-2 rounded-xl bg-emerald-50">
                  {getIcon(client.icon)}
                </div>
                <span className="font-bold text-sm text-slate-900 tracking-tight whitespace-nowrap">{client.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

