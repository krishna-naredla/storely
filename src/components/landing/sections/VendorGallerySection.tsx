import React from 'react';
import { Sparkles, ShoppingBag, Store, Award } from 'lucide-react';

export const VendorGallerySection: React.FC = () => {
  const showcaseItems = [
    {
      title: "Handmade Crafts & Decor",
      vendor: "Artisan Hub Hyderabad",
      image: "/storelly.jpg.jpeg",
      sales: "₹1.4L+ monthly"
    },
    {
      title: "Ramesh Sir Academy",
      vendor: "Online Courses & Coaching",
      image: "/storelly3.jpg.jpeg",
      sales: "₹95K+ monthly"
    },
    {
      title: "Organic Spices & Foods",
      vendor: "Nature's Basket",
      image: "/storelly4.jpg.jpeg",
      sales: "₹2.8L+ monthly"
    },
    {
      title: "Fashion & Apparel Boutique",
      vendor: "Trendsetters India",
      image: "/storelly5.jpg.jpeg",
      sales: "₹3.5L+ monthly"
    },
    {
      title: "Electronics & Gadgets",
      vendor: "Smart Tech Store",
      image: "/storelly7.jpg.jpeg",
      sales: "₹5.2L+ monthly"
    }
  ];

  return (
    <section className="py-20 bg-white border-b border-[#e7e5df]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2f9e5c]">Success Stories</span>
          <h2 className="text-[32px] font-extrabold text-[#14201a]">Real Stores & Creators Thriving with Storelly</h2>
          <p className="text-[#5c6b63] text-sm">Explore live vendor stores and creator hubs powered by our all-in-one digital commerce platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {showcaseItems.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-[#faf9f5] rounded-2xl border border-[#e7e5df] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#155330] flex items-center gap-1 shadow-sm">
                  <Award className="w-3 h-3 text-[#2f9e5c]" /> {item.sales}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-[#2f9e5c] uppercase tracking-wider">{item.vendor}</p>
                  <h3 className="font-extrabold text-[#14201a] text-base mt-0.5">{item.title}</h3>
                </div>
                <div className="pt-3 border-t border-[#e7e5df] flex items-center justify-between text-xs text-[#5c6b63]">
                  <span>Storefront</span>
                  <span className="font-bold text-[#155330] flex items-center gap-1">Active Now</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
