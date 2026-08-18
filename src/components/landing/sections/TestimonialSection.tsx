import React from 'react';
import { Star, Quote, ArrowRight } from 'lucide-react';

export const TestimonialSection: React.FC = () => {
  const reviews = [
    {
      name: "Sneha Kapoor",
      business: "Fashion Boutique",
      text: "Storelly helped me take my local business online in just 10 minutes! The digital card feature is amazing for sharing on WhatsApp.",
      rating: 5
    },
    {
      name: "Amit Verma",
      business: "Electronics Store",
      text: "Very easy to use and customer support is amazing. I manage all my orders directly from my phone now.",
      rating: 5
    },
    {
      name: "Pooja Singh",
      business: "Home Decor Store",
      text: "Best platform for small businesses. Highly recommended! The storefront looks so professional and premium.",
      rating: 5
    }
  ];

  return (
    <section id="reviews" className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-8">
          <div>
            <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">What Our Vendors Say</h4>
            <h2 className="text-4xl font-black text-slate-900 max-w-xl leading-tight">
              Loved by Thousands of <span className="text-emerald-600">Business Owners</span>
            </h2>
          </div>
          <button className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold px-6 py-3 border border-slate-200 rounded-full hover:border-emerald-200 bg-white transition-all">
            View All Reviews <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
              <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-100" />
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-8 relative z-10 text-sm">
                "{review.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{review.name}</h4>
                  <p className="text-xs text-slate-500">{review.business}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center lg:hidden">
           <button className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold px-6 py-3 border border-slate-200 rounded-full bg-white transition-all">
            View All Reviews <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
