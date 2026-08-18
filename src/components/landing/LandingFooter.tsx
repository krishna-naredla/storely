import React from 'react';
import { Store, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, ShieldCheck } from 'lucide-react';

interface LandingFooterProps {
  onOpenMasterAdmin?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenMasterAdmin }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 py-16 sm:py-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Store className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Storelly</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering local businesses, homemade brands, and service providers to grow online with powerful digital storefronts and management tools.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
              <li><a href="#storefront" className="hover:text-emerald-400 transition-colors">Digital Storefront</a></li>
              <li><a href="#card" className="hover:text-emerald-400 transition-colors">Digital Card</a></li>
              <li><a href="#crm" className="hover:text-emerald-400 transition-colors">CRM & Analytics</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-wider">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition-colors">Help Center / FAQ</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Video Guides</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">About Us</a></li>
              <li><a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Storelly. All rights reserved.</p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@storelly.com</span>
            {onOpenMasterAdmin && (
              <button
                type="button"
                onClick={onOpenMasterAdmin}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Master Admin Portal
              </button>
            )}
            <span>Made with ❤️ for Local Businesses</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
