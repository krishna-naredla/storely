import React, { useState, useEffect } from 'react';
import { Store, Menu, X } from 'lucide-react';

interface Props {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingNavbar: React.FC<Props> = ({ onOpenAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-10 h-10 rounded-xl bg-[#ff6b00] flex items-center justify-center overflow-hidden border border-[#ff6b00]/30 shadow-sm">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Storelly</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-semibold text-slate-600 hover:text-[#ff6b00] transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <button onClick={() => onOpenAuth('login')} className="text-sm font-bold text-slate-700 hover:text-[#ff6b00] transition-colors px-4 py-2">
            Login
          </button>
          <button onClick={() => onOpenAuth('signup')} className="text-sm font-bold bg-[#ff6b00] hover:bg-[#e65c00] text-white px-6 py-2.5 rounded-full transition-all shadow-md shadow-[#ff6b00]/25 active:scale-95">
            Get Started Free
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-700 hover:text-emerald-600 p-2 rounded-lg hover:bg-slate-50">
              {link.label}
            </a>
          ))}
          <div className="h-px bg-slate-100 my-2"></div>
          <button onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }} className="w-full text-left p-2 text-sm font-bold text-slate-700">
            Login
          </button>
          <button onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup'); }} className="w-full text-center text-sm font-bold bg-emerald-600 text-white px-4 py-3 rounded-xl mt-2">
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};
