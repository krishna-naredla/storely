import React from 'react';
import { Store, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, ShieldCheck, Apple, Play } from 'lucide-react';

interface LandingFooterProps {
  onOpenMasterAdmin?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenMasterAdmin }) => {
  return (
    <footer className="bg-[#123c25] text-slate-300 py-16 sm:py-24 border-t border-[#155330]">
      <div className="max-w-[1180px] mx-auto px-6">
        
        {/* 6 Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          
          {/* Col 1: Brand + Socials */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2f9e5c] flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">Storelly</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
              All-in-one platform helping local businesses create an online store, manage products, receive orders, and grow their brand.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2f9e5c] text-white transition"><Facebook className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2f9e5c] text-white transition"><Instagram className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2f9e5c] text-white transition"><Twitter className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2f9e5c] text-white transition"><Linkedin className="w-3.5 h-3.5" /></a>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase text-xs tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#features" className="hover:text-emerald-400 transition">Storefronts</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition">Catalog</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition">Orders</a></li>
              <li><a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase text-xs tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#faq" className="hover:text-emerald-400 transition">Help Center</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition">Guides</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">API Docs</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Community</a></li>
            </ul>
          </div>

          {/* Col 4: Company */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase text-xs tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#about" className="hover:text-emerald-400 transition">About Us</a></li>
              <li><a href="#contact" className="hover:text-emerald-400 transition">Contact</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Careers</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Press</a></li>
            </ul>
          </div>

          {/* Col 5: Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold uppercase text-xs tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Security</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Refunds</a></li>
            </ul>
          </div>

        </div>

        {/* App Store / Google Play buttons row */}
        <div className="py-8 border-t border-[#155330] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-white font-bold text-sm">Download the Storelly Vendor App</h4>
            <p className="text-xs text-slate-300">Manage orders and customers on the go with Android & iOS apps.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 bg-black/40 hover:bg-black/60 text-white px-5 py-2.5 rounded-xl border border-white/10 transition">
              <Apple className="w-5 h-5 text-white" />
              <div className="text-left">
                <p className="text-[9px] uppercase text-slate-300">Download on the</p>
                <p className="text-xs font-bold">App Store</p>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-black/40 hover:bg-black/60 text-white px-5 py-2.5 rounded-xl border border-white/10 transition">
              <Play className="w-5 h-5 text-white fill-white" />
              <div className="text-left">
                <p className="text-[9px] uppercase text-slate-300">Get it on</p>
                <p className="text-xs font-bold">Google Play</p>
              </div>
            </button>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-8 border-t border-[#155330] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Storelly Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@storelly.com</span>
            {onOpenMasterAdmin && (
              <button
                type="button"
                onClick={onOpenMasterAdmin}
                className="text-emerald-300 hover:text-white font-bold flex items-center gap-1 transition cursor-pointer bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Master Admin Portal
              </button>
            )}
            <span>Made with ❤️ for Local Vendors</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
