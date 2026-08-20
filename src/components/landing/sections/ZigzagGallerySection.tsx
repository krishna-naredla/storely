import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const ZigzagGallerySection: React.FC<Props> = ({ onOpenAuth }) => {
  const showcaseItems = [
    {
      title: "Powerful Dashboard & Live Order Management",
      subtitle: "REAL-TIME CONTROL",
      description: "Monitor your store activity, track live customer orders, update inventory instantly, and manage your WhatsApp inquiries seamlessly from a single unified dashboard.",
      image: "/storelly6.jpg.jpeg",
      badge: "Command Center",
      bullets: ["Live order tracking", "Instant WhatsApp alerts", "Revenue analytics"]
    },
    {
      title: "Designed for Everyday Business Owners",
      subtitle: "SIMPLE & INTUITIVE",
      description: "Whether you run a local retail shop, boutique, homemade food service, or artisan store, Storelly is built to be extremely user-friendly with zero technical hurdles.",
      image: "/storelly1.jpg.jpeg",
      badge: "Merchant Friendly",
      bullets: ["No coding required", "Mobile & desktop friendly", "Multi-staff support"]
    },
    {
      title: "Stunning Digital Storefronts & Catalogs",
      subtitle: "DIGITAL SHOWCASE",
      description: "Display your products and services with gorgeous photo galleries, categories, pricing, and variant options that customers love to browse and order from.",
      image: "/storelly2.jpg.jpeg",
      badge: "Catalog Engine",
      bullets: ["Unlimited products", "Category filters", "Instant checkout link"]
    },
    {
      title: "Artisan Crafts & Handmade Collections",
      subtitle: "SHOWCASE CREATIONS",
      description: "Perfect for artisans, handmade decor makers, and craft creators. Give your unique handmade products a professional digital showroom that attracts buyers nationwide.",
      image: "/storelly.jpg.jpeg",
      badge: "Artisan Hub",
      bullets: ["High-res photo galleries", "Custom variant pricing", "Direct customer chat"]
    },
    {
      title: "Organic Foods, Spices & Grocery Stores",
      subtitle: "FOOD & ESSENTIALS",
      description: "Manage grocery items, organic snacks, pickles, and food products with ease. Set weights, package sizes, and delivery slots effortlessly.",
      image: "/storelly4.jpg.jpeg",
      badge: "Grocery & Food",
      bullets: ["Weight & size variants", "Delivery scheduling", "Bulk order support"]
    },
    {
      title: "Fashion Boutiques & Apparel Stores",
      subtitle: "TRENDS & APPAREL",
      description: "Showcase fashion collections, sizes, and colors with stylish photo displays that make online shopping delightful for your fashion clientele.",
      image: "/storelly5.jpg.jpeg",
      badge: "Fashion & Style",
      bullets: ["Size & color matrices", "Lookbooks", "WhatsApp catalog sync"]
    },
    {
      title: "Electronics & Gadget Store Management",
      subtitle: "TECH & GADGETS",
      description: "Handle serial numbers, warranty details, technical specs, and fast inquiries for electronics, mobile accessories, and tech gear.",
      image: "/storelly7.jpg.jpeg",
      badge: "Electronics & Tech",
      bullets: ["Specification sheets", "Warranty tracking", "Fast inquiry buttons"]
    }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden space-y-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Complete Platform Showcase
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Explore All Features & Visuals of <span className="text-emerald-600">Storelly</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Every image and module crafted to provide the ultimate digital business operating system for your enterprise.
          </p>
        </div>

        <div className="space-y-24 lg:space-y-32">
          {showcaseItems.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <div 
                key={index} 
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Image Container with 100% full visibility and device-friendly padding */}
                <div className="w-full lg:w-1/2 relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100/60 to-teal-100/40 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-200/80 overflow-hidden flex items-center justify-center min-h-[320px] sm:min-h-[380px]">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[420px] object-contain rounded-2xl shadow-md transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" /> {item.badge}
                    </div>
                  </div>
                </div>

                {/* Text Description Container */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                    {item.subtitle}
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                    {item.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    {item.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => onOpenAuth('signup')}
                      className="inline-flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 rounded-full shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Try Storelly Free</span> <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
