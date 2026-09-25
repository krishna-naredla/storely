import React, { useState, useEffect } from 'react';
import { getAppLogo } from '../../utils/branding';
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--card)]/95 backdrop-blur-md shadow-[var(--shadow-xs)] border-b border-[var(--border)] py-3' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-10 h-10 rounded-[var(--r8)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-xs)] flex items-center justify-center bg-[var(--card)]">
            <img src={getAppLogo()} alt="Storelly Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-heading font-extrabold text-[var(--t1)] tracking-tight">Storelly</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-semibold text-[var(--t2)] hover:text-[var(--g700)] transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <button onClick={() => onOpenAuth('login')} className="text-sm font-bold text-[var(--t1)] hover:text-[var(--g700)] hover:bg-[var(--g100)] transition-colors px-4 py-2 rounded-[var(--r8)] cursor-pointer">
            Login
          </button>
          <button onClick={() => onOpenAuth('signup')} className="ds-btn-primary text-sm font-bold px-5 py-2.5 shadow-[var(--shadow-xs)] cursor-pointer">
            Get Started Free
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden p-2 text-[var(--t2)] hover:text-[var(--t1)] cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[var(--card)] border-b border-[var(--border)] shadow-[var(--shadow-lg)] py-4 px-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-[var(--t1)] hover:text-[var(--g700)] p-2 rounded-[var(--r8)] hover:bg-[var(--g100)]">
              {link.label}
            </a>
          ))}
          <div className="h-px bg-[var(--border)] my-1"></div>
          <button onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }} className="w-full text-left p-2.5 text-sm font-bold text-[var(--t1)] rounded-[var(--r8)] hover:bg-[var(--g100)] cursor-pointer">
            Login
          </button>
          <button onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup'); }} className="ds-btn-primary w-full text-center text-sm font-bold py-3 mt-1 shadow-[var(--shadow-xs)] cursor-pointer">
            Get Started Free
          </button>
        </div>
      )}
    </nav>
  );
};
