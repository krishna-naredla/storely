import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Zap, MessageCircle, Send, Youtube, Instagram, Calendar, FileSpreadsheet, BarChart3, TrendingUp, Store, ShoppingBag, BookOpen, Coffee, Scissors } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const ZigzagGallerySection: React.FC<Props> = ({ onOpenAuth }) => {
  const showcaseItems = [
    {
      title: "Powerful Dashboard & Live Order Management",
      subtitle: "REAL-TIME CONTROL",
      description: "Monitor your store activity, track live customer orders, update inventory instantly, and manage your WhatsApp inquiries seamlessly from a single unified dashboard.",
      badge: "Command Center",
      bullets: ["Live order tracking", "Instant WhatsApp alerts", "Revenue analytics"],
      isCustomComponent: "dashboard"
    },
    {
      title: "Designed for Everyday Business Owners",
      subtitle: "SIMPLE & INTUITIVE",
      description: "Whether you run a local retail shop, boutique, homemade food service, or artisan store, Storelly is built to be extremely user-friendly with zero technical hurdles.",
      badge: "Merchant Friendly",
      bullets: ["No coding required", "Mobile & desktop friendly", "Multi-staff support"],
      isCustomComponent: "multibusiness"
    },
    {
      title: "Sell Notes, Courses & Consultations",
      subtitle: "CREATOR HUB",
      description: "Perfect for teachers, coaches, YouTubers, and consultants. Sell PDFs, courses, and 1:1 bookings — plus link your WhatsApp community, Telegram, and YouTube — all on one page.",
      badge: "Creator Hub",
      bullets: [
        "Instant WhatsApp file delivery",
        "1:1 paid consultation booking with auto Google Meet link",
        "Link your WhatsApp groups, Telegram, YouTube, Google Forms/Sheets"
      ],
      isCustomComponent: "creatorhub"
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
                {/* Visual Container with max-w-full and mobile overflow prevention */}
                <div className="w-full lg:w-1/2 relative group max-w-full overflow-hidden">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100/60 to-teal-100/40 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>
                  
                  {item.isCustomComponent === 'dashboard' ? (
                    <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-400">Live Command Center</div>
                            <div className="text-base font-black text-white">Store Analytics & Orders</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">Live Sync</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                          <div className="text-[11px] text-slate-400 font-medium">Today's Revenue</div>
                          <div className="text-xl font-black text-emerald-400 mt-1">₹24,850</div>
                          <div className="text-[10px] text-emerald-300 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +18% vs yesterday
                          </div>
                        </div>
                        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                          <div className="text-[11px] text-slate-400 font-medium">Active Orders</div>
                          <div className="text-xl font-black text-white mt-1">14 Pending</div>
                          <div className="text-[10px] text-amber-400 mt-1">WhatsApp synced</div>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Orders Feed</div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">#108</div>
                            <div>
                              <div className="font-bold text-white">Organic Honey & Tea Set</div>
                              <div className="text-[11px] text-slate-400">Paid via WhatsApp UPI</div>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-400">₹1,299</span>
                        </div>
                      </div>

                      <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> {item.badge}
                      </div>
                    </div>
                  ) : item.isCustomComponent === 'multibusiness' ? (
                    <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-400">Universal Platform</div>
                            <div className="text-base font-black text-white">Any Business, Any Industry</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">Retail Shops</div>
                            <div className="text-[10px] text-slate-400">Catalogs & inventory</div>
                          </div>
                        </div>

                        <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">Online Courses</div>
                            <div className="text-[10px] text-slate-400">PDFs & consultations</div>
                          </div>
                        </div>

                        <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <Coffee className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">Homemade Food</div>
                            <div className="text-[10px] text-slate-400">Pickles & snacks</div>
                          </div>
                        </div>

                        <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                            <Scissors className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">Boutiques</div>
                            <div className="text-[10px] text-slate-400">Apparel & sizing</div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> {item.badge}
                      </div>
                    </div>
                  ) : item.isCustomComponent === 'creatorhub' ? (
                    <div className="relative bg-slate-950 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 flex items-center justify-center">
                      <div className="relative w-full max-w-[280px] sm:max-w-[320px] bg-slate-900 rounded-[32px] p-4 shadow-2xl border-4 border-slate-700/80">
                        <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                        </div>
                        
                        <div className="text-center pb-3 border-b border-slate-800 space-y-1">
                          <div className="w-12 h-12 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                            RS
                          </div>
                          <h4 className="font-bold text-white text-xs">Ramesh Sir Academy</h4>
                          <p className="text-[10px] text-emerald-400">Courses, Notes & Consultations</p>
                        </div>

                        <div className="py-3 space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-bold text-white">Join WhatsApp VIP Group</div>
                                <div className="text-[9px] text-slate-400">Instant PDF Notes Delivery</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">1.2K+</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                                <Youtube className="w-3.5 h-3.5 fill-white" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-bold text-white">Free Masterclass Videos</div>
                                <div className="text-[9px] text-slate-400">Weekly live sessions</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">45K</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                                <Send className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-bold text-white">Telegram Study Channel</div>
                                <div className="text-[9px] text-slate-400">Daily practice sheets</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">8.5K</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                                <Instagram className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-bold text-white">Instagram Reels & Updates</div>
                                <div className="text-[9px] text-slate-400">Daily educational tips</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">22K</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                                <Calendar className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-bold text-white">1:1 Paid Consultation</div>
                                <div className="text-[9px] text-slate-400">Auto Google Meet slot</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Book</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-bold text-white">Resource Request Form</div>
                                <div className="text-[9px] text-slate-400">Google Forms / Sheets</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">Form</span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> {item.badge}
                      </div>
                    </div>
                  ) : (
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
                  )}
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

