import React from 'react';
import { CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-[#faf9f5] border-b border-[#e7e5df]">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Column 1: Heading, description, 3 mini feature blocks */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2f9e5c]">About Storelly</span>
              <h2 className="text-[32px] font-extrabold text-[#14201a] mt-2 leading-tight">
                Empowering Local Businesses Digitally
              </h2>
            </div>
            
            <p className="text-[#5c6b63] text-[15px] leading-relaxed">
              Storelly provides an all-in-one platform built specifically for local shops, boutiques, and creators to establish their online presence, manage inventory, and accept orders instantly.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf6ee] flex items-center justify-center text-[#155330] shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-bold text-[#14201a] text-sm">Easy to Use</h4>
                  <p className="text-xs text-[#5c6b63]">Set up your store in minutes without writing a single line of code.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf6ee] flex items-center justify-center text-[#155330] shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-bold text-[#14201a] text-sm">All-in-One</h4>
                  <p className="text-xs text-[#5c6b63]">Catalog, orders, customers, and payments in one unified dashboard.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf6ee] flex items-center justify-center text-[#155330] shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-bold text-[#14201a] text-sm">Grow Faster</h4>
                  <p className="text-xs text-[#5c6b63]">Built-in marketing tools, analytics, and custom digital visiting cards.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Center photo */}
          <div className="relative flex items-center justify-center p-2 sm:p-4">
            <div className="relative w-full rounded-2xl bg-white p-3 sm:p-4 shadow-xl border border-[#e7e5df] flex items-center justify-center overflow-hidden">
              <img 
                src="/storelly1.jpg.jpeg" 
                alt="Store Owner Managing Business" 
                className="w-full h-auto max-h-[420px] object-contain rounded-xl mx-auto"
              />
            </div>
          </div>

          {/* Column 3: Testimonial quote card */}
          <div className="bg-white rounded-2xl p-8 border border-[#e7e5df] shadow-[0_20px_50px_-20px_rgba(20,40,30,0.18)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex gap-1 text-[#f5a623]">
                {'★'.repeat(5)}
              </div>
              <p className="text-[#14201a] font-medium text-sm leading-relaxed italic">
                "Storelly completely transformed how we sell our homemade pickles and snacks. Customers love ordering directly through our WhatsApp store link. Our revenue doubled in 3 months!"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-[#e7e5df]">
              <div className="w-12 h-12 rounded-full bg-[#155330] text-white flex items-center justify-center font-bold text-base">
                NK
              </div>
              <div>
                <h4 className="font-bold text-[#14201a] text-sm">Naredla Krishna</h4>
                <p className="text-xs text-[#5c6b63]">Founder, Krishna Pickles</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
