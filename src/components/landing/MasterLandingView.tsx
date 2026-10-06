import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAppLogo, getAppName } from '../../utils/branding';

import { FaWhatsapp, FaTelegram, FaYoutube, FaInstagram } from 'react-icons/fa';
import { SiGooglepay, SiPhonepe, SiPaytm, SiGoogleforms } from 'react-icons/si';
import { Link, CalendarCheck, LineChart, FileDown, Wand2 } from 'lucide-react';

import { 
  Store, CheckCircle2, Star, FileText, Calendar, Link2, 
  MessageCircle, TrendingUp, ChevronDown, Check, Play, QrCode, 
  ArrowRight, Smartphone, ShieldCheck, Zap, Instagram, Youtube, User, Plus, Search, HelpCircle, MapPin, Send, Sparkles,
  Menu, X
} from 'lucide-react';
import { PlatformPricingPlan, PlatformPricingCMS } from '../../types/admin';
import { 
  adminGetPricingPlans, 
  adminGetPricingCMS, 
  DEFAULT_PRICING_PLANS, 
  DEFAULT_PRICING_CMS 
} from '../../services/adminService';
import { HappyClientsMarquee } from './HappyClientsMarquee';

interface MasterLandingViewProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenMasterAdmin?: () => void;
}

const featuresData = [
  { 
    icon: <span className="text-white flex items-center justify-center"><FaWhatsapp size={32} color="white" /></span>, 
    iconGradient: 'from-emerald-500 to-green-600', 
    shadow: 'shadow-emerald-500/25', 
    title: 'WhatsApp Orders', 
    desc: 'Receive order details directly on WhatsApp, no dashboard needed.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center"><FaWhatsapp size={14} /></span>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">WhatsApp Notification</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Just now</span>
        </div>
        <div className="text-[12px] font-medium text-slate-800 dark:text-slate-200 leading-snug bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
          📦 <span className="font-bold">New Order #1042:</span> 1x Chicken Pickle 1kg (₹249) • <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid via UPI ✓✓</span>
        </div>
      </div>
    )
  },
  { 
    icon: (
      <div className="flex gap-1.5 text-white items-center justify-center">
        <SiGooglepay size={20} color="white" />
        <SiPhonepe size={18} color="white" />
        <SiPaytm size={22} color="white" />
      </div>
    ), 
    iconGradient: 'from-violet-500 to-indigo-600', 
    shadow: 'shadow-indigo-500/25', 
    title: 'UPI Payments', 
    desc: 'Let customers pay instantly using Google Pay, PhonePe, and Paytm.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">Accepted UPI Apps</span>
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">0% Fee</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> GPay
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
            <SiPhonepe size={12} color="#7c3aed" /> PhonePe
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
            <SiPaytm size={14} color="#0284c7" /> Paytm
          </div>
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">BHIM</span>
        </div>
      </div>
    )
  },
  { 
    icon: <Link size={30} className="text-white" />, 
    iconGradient: 'from-blue-500 to-cyan-600', 
    shadow: 'shadow-blue-500/25', 
    title: 'Your Own Store Link', 
    desc: 'Share one memorable, professional link across all your platforms.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Custom Business URL</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> SSL Verified
          </span>
        </div>
        <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 px-2.5 py-2 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-xs">
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 truncate">storelly.com/<span className="text-blue-600 dark:text-blue-400">yourbrand</span></span>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded shrink-0">Copy</span>
        </div>
      </div>
    )
  },
  { 
    icon: <CalendarCheck size={30} className="text-white" />, 
    iconGradient: 'from-pink-500 to-rose-600', 
    shadow: 'shadow-rose-500/25', 
    title: 'Booking & Consultations', 
    desc: 'Let customers book available slots and pay for 1:1 sessions online.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">Slot Scheduling</span>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">1:1 Video Call</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-rose-100 dark:border-rose-900/50 shadow-xs">
          <div className="flex-1 text-center py-1 rounded bg-rose-500 text-white text-[10px] font-bold">10:00 AM</div>
          <div className="flex-1 text-center py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">02:30 PM</div>
          <div className="flex-1 text-center py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">05:00 PM</div>
        </div>
      </div>
    )
  },
  { 
    icon: (
      <div className="flex flex-wrap justify-center items-center gap-1.5 w-12 text-white">
        <FaWhatsapp size={14} color="white" />
        <FaInstagram size={14} color="white" />
        <FaYoutube size={14} color="white" />
        <FaTelegram size={14} color="white" />
      </div>
    ), 
    iconGradient: 'from-amber-500 to-orange-600', 
    shadow: 'shadow-amber-500/25', 
    title: 'All Your Links in One Place', 
    desc: 'Connect WhatsApp, Telegram, YouTube, Instagram, and Forms.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Bio Link Hub</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">5+ Channels</span>
        </div>
        <div className="flex items-center justify-around bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-xs">
          <span className="text-emerald-500 flex items-center"><FaWhatsapp size={16} color="#10b981" /></span>
          <span className="text-pink-500 flex items-center"><FaInstagram size={16} color="#ec4899" /></span>
          <span className="text-red-500 flex items-center"><FaYoutube size={16} color="#ef4444" /></span>
          <span className="text-sky-500 flex items-center"><FaTelegram size={16} color="#0ea5e9" /></span>
          <span className="text-purple-500 flex items-center"><SiGoogleforms size={16} color="#8b5cf6" /></span>
        </div>
      </div>
    )
  },
  { 
    icon: <LineChart size={30} className="text-white" />, 
    iconGradient: 'from-sky-500 to-blue-600', 
    shadow: 'shadow-sky-500/25', 
    title: 'Simple Analytics', 
    desc: 'Understand visits, clicks and how customers interact with your page.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300">Live Traffic & Sales</span>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">+42.8%</span>
        </div>
        <div className="flex items-end justify-between gap-1 h-8 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-sky-100 dark:border-sky-900/50 shadow-xs">
          <div className="w-3 bg-sky-300 dark:bg-sky-700 rounded-t h-[40%]"></div>
          <div className="w-3 bg-sky-400 dark:bg-sky-600 rounded-t h-[65%]"></div>
          <div className="w-3 bg-sky-500 dark:bg-sky-500 rounded-t h-[50%]"></div>
          <div className="w-3 bg-sky-600 dark:bg-sky-400 rounded-t h-[85%]"></div>
          <div className="w-3 bg-blue-600 dark:bg-blue-400 rounded-t h-[100%]"></div>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 ml-1">1.4k Views</span>
        </div>
      </div>
    )
  },
  { 
    icon: <FileDown size={30} className="text-white" />, 
    iconGradient: 'from-red-500 to-rose-600', 
    shadow: 'shadow-red-500/25', 
    title: 'Digital Products', 
    desc: 'Sell PDFs, notes, templates, and courses with secure auto-delivery.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-red-800 dark:text-red-300">Instant File Delivery</span>
          <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Auto WhatsApp PDF</span>
        </div>
        <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-red-100 dark:border-red-900/50 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white font-black text-[9px]">PDF</span>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">Course_Notes.pdf</span>
          </div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">₹99</span>
        </div>
      </div>
    )
  },
  { 
    icon: <Store size={30} className="text-white" />, 
    iconGradient: 'from-amber-500 to-yellow-600', 
    shadow: 'shadow-amber-500/25', 
    title: 'Customizable Storefront', 
    desc: 'Choose themes and colors to match your personal or brand identity.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Brand Themes</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Live Preview</span>
        </div>
        <div className="flex items-center justify-around bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-xs">
          <span className="w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 cursor-pointer"></span>
          <span className="w-5 h-5 rounded-full bg-purple-600 ring-2 ring-purple-300 cursor-pointer"></span>
          <span className="w-5 h-5 rounded-full bg-blue-600 ring-2 ring-blue-300 cursor-pointer"></span>
          <span className="w-5 h-5 rounded-full bg-rose-500 ring-2 ring-rose-300 cursor-pointer"></span>
          <span className="text-[10px] font-bold text-slate-500">Dark/Light</span>
        </div>
      </div>
    )
  },
  { 
    icon: <Wand2 size={30} className="text-white" />, 
    iconGradient: 'from-teal-500 to-emerald-600', 
    shadow: 'shadow-teal-500/25', 
    title: 'Zero Coding Required', 
    desc: 'Launch your store in less than 2 minutes. No technical skills needed.',
    preview: (
      <div className="mt-4 p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300">No-Code Launch</span>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">2 Mins</span>
        </div>
        <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-teal-100 dark:border-teal-900/50 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Store Status: <span className="text-emerald-600 dark:text-emerald-400">ONLINE</span></span>
          </div>
          <span className="text-[10px] font-bold text-slate-500">100% Mobile</span>
        </div>
      </div>
    )
  }
];

const howItWorksData = [
  { step: 1, icon: User, title: 'Create Your Store', desc: 'Choose your Storelly username and set up your profile.' },
  { step: 2, icon: Store, title: 'Add Products & Links', desc: 'Add products, services, digital files, bookings and important links.' },
  { step: 3, icon: MessageCircle, title: 'Share. Sell. Get Paid.', desc: 'Share your Storelly link or QR code and receive orders and payments.' }
];

const faqData = [
  { q: 'What is Storelly?', a: 'Storelly is a WhatsApp-first local commerce platform that gives you one single link for your business to showcase products, sell digital files, and accept UPI payments directly.' },
  { q: 'Do my customers need to install an app?', a: 'No. Customers simply click your Storelly link to browse your storefront and place orders instantly on their browser or via WhatsApp.' },
  { q: 'Can I accept UPI payments?', a: 'Yes! Storelly integrates with UPI so your customers can pay you directly using GPay, PhonePe, Paytm, or any UPI app.' },
  { q: 'Will Storelly take a commission from my sales?', a: 'No. We charge a flat subscription fee. Your sales belong to you, with zero platform commissions on your orders.' },
  { q: 'Can I sell digital products?', a: 'Absolutely. You can upload and sell PDFs, courses, notes, and files with automated secure delivery after payment.' },
  { q: 'Can I use Storelly for bookings?', a: 'Yes, you can let customers pick available slots and book paid 1:1 consultations directly through your Storelly page.' },
  { q: 'Can I add my WhatsApp, Instagram and YouTube links?', a: 'Yes! Storelly acts as a central hub for all your important business and social links.' },
  { q: 'Can I share my Storelly page using a QR code?', a: 'Yes, every Storelly account comes with a custom QR code that you can print and display at your physical shop or on packaging.' }
];

const trustData = [
  { title: 'No App Required', desc: 'Your customers can open your Storelly page instantly.' },
  { title: 'WhatsApp First', desc: 'Keep conversations and order updates where your customers already are.' },
  { title: 'UPI Ready', desc: 'Accept digital payments without complicated checkout experiences.' },
  { title: 'Zero Sales Commission', desc: 'Your sales belong to you.' }
];

export const MasterLandingView: React.FC<MasterLandingViewProps> = ({ onOpenAuth }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PlatformPricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [pricingCMS, setPricingCMS] = useState<PlatformPricingCMS>(DEFAULT_PRICING_CMS);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const [loadedPlans, loadedCms] = await Promise.all([
          adminGetPricingPlans(),
          adminGetPricingCMS(),
        ]);
        if (loadedPlans && loadedPlans.length > 0) {
          setPricingPlans(loadedPlans.filter(p => p.isActive !== false));
        }
        if (loadedCms && loadedCms.title) {
          setPricingCMS(loadedCms);
        }
      } catch (err) {
        console.warn('Error loading dynamic pricing in MasterLandingView:', err);
      }
    };

    loadPricing();

    const handlePlansChange = (e: CustomEvent) => {
      if (e.detail?.plans) {
        setPricingPlans(e.detail.plans.filter((p: PlatformPricingPlan) => p.isActive !== false));
      }
    };

    const handleCmsChange = (e: CustomEvent) => {
      if (e.detail) {
        setPricingCMS(e.detail);
      }
    };

    window.addEventListener('storelly_pricing_changed' as any, handlePlansChange as EventListener);
    window.addEventListener('storelly_pricing_cms_changed' as any, handleCmsChange as EventListener);

    return () => {
      window.removeEventListener('storelly_pricing_changed' as any, handlePlansChange as EventListener);
      window.removeEventListener('storelly_pricing_cms_changed' as any, handleCmsChange as EventListener);
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--t1)] selection:bg-[var(--g100)] selection:text-[var(--g900)] overflow-x-hidden scroll-smooth">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)] py-4 shadow-[var(--shadow-sm)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 rounded-[var(--r8)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-xs)] flex items-center justify-center bg-[var(--card)]">
              <img src={getAppLogo()} alt={`${getAppName()} Logo`} className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-heading font-black text-[var(--t1)] tracking-tight">{getAppName()}</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-sm font-semibold text-[var(--t1)] hover:text-[var(--g600)] transition">Home</a>
            <a href="#features" className="text-sm font-semibold text-[var(--t2)] hover:text-[var(--g600)] transition">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-[var(--t2)] hover:text-[var(--g600)] transition">How It Works</a>
            <a href="#pricing" className="text-sm font-semibold text-[var(--t2)] hover:text-[var(--g600)] transition">Pricing</a>
            <a href="#faq" className="text-sm font-semibold text-[var(--t2)] hover:text-[var(--g600)] transition">FAQ</a>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => onOpenAuth('signup')}
              className="bg-[var(--g600)] hover:bg-[var(--g700)] text-white text-sm font-bold px-6 py-2.5 rounded-[var(--r8)] shadow-[var(--shadow-sm)] transition-all active:scale-95"
            >
              Get Started Free
            </button>
          </div>
          
          <div className="lg:hidden flex items-center">
             <button
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="p-2 text-[var(--t2)] hover:text-[var(--t1)] rounded-[var(--r8)]"
               aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
             >
               {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[var(--card)] pt-24 px-6 flex flex-col gap-6"
          >
            <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading font-bold text-[var(--t1)]">Home</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading font-bold text-[var(--t2)]">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading font-bold text-[var(--t2)]">How It Works</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading font-bold text-[var(--t2)]">Pricing</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-heading font-bold text-[var(--t2)]">FAQ</a>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup'); }}
              className="mt-6 bg-[var(--g600)] hover:bg-[var(--g700)] text-white text-lg font-bold px-6 py-4 rounded-[var(--r8)] w-full transition"
            >
              Get Started Free
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 lg:pt-36 lg:pb-24 bg-[var(--card)] relative overflow-hidden">
        {/* Full 45-Degree Diagonal Triangle Creator Theme Background specifically on Right Side */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[60%] pointer-events-none z-0 overflow-hidden">
          {/* Desktop 45-degree angle diagonal triangle cut */}
          <div 
            className="hidden lg:block absolute inset-0 bg-gradient-to-bl from-indigo-700 via-purple-700 to-violet-950 opacity-95 shadow-2xl"
            style={{
              clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)'
            }}
          />
          {/* Mobile/Tablet angled diagonal background */}
          <div 
            className="lg:hidden absolute bottom-0 right-0 left-0 h-[65%] bg-gradient-to-t from-indigo-950 via-purple-800 to-transparent opacity-90"
            style={{
              clipPath: 'polygon(0% 18%, 100% 0%, 100% 100%, 0% 100%)'
            }}
          />
          {/* Vibrant Ambient Glow Orbs */}
          <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-7 z-10 text-center lg:text-left"
            >
              {/* Pre-Headline Kicker */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Go From Offline to Online in 3 Simple Steps
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-heading font-black text-[var(--t1)] tracking-tight leading-[1.12]">
                Your Business. <br />
                <span className="text-[var(--g600)]">One Smart Link.</span>
              </h1>

              {/* 0% Commission Big Bold Highlight with Stylized Big Pencil-Drawn Circle around the 0 */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 py-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--t1)] tracking-tight">
                  Sell with
                </span>
                
                <div className="inline-flex items-center">
                  {/* The '0' with realistic BIG hand-drawn pencil circle */}
                  <div className="relative inline-flex items-center justify-center mx-2 px-1 py-0.5">
                    <span className="relative z-10 px-4 sm:px-5 py-1 text-emerald-600 dark:text-emerald-400 font-heading font-black text-6xl sm:text-7xl lg:text-8xl tracking-tighter select-none">
                      0
                    </span>
                    
                    {/* Big Stylized Hand-Drawn Pencil Circle SVG */}
                    <svg 
                      className="absolute -inset-4 sm:-inset-6 lg:-inset-7 w-[calc(100%+32px)] sm:w-[calc(100%+48px)] lg:w-[calc(100%+56px)] h-[calc(100%+32px)] sm:h-[calc(100%+48px)] lg:h-[calc(100%+56px)] pointer-events-none z-20 text-emerald-500 dark:text-emerald-400 overflow-visible"
                      viewBox="0 0 160 160"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Large primary sketched loop with natural overlapping pencil jitter */}
                      <path 
                        d="M 80 12 C 122 9, 154 36, 150 82 C 146 126, 112 152, 68 154 C 24 156, 6 122, 8 80 C 10 38, 44 12, 92 10 C 136 8, 156 38, 152 82 C 147 120, 114 148, 76 150" 
                        stroke="currentColor" 
                        strokeWidth="4.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeDasharray="700"
                        style={{ filter: 'drop-shadow(0px 2px 5px rgba(16, 185, 129, 0.45))' }}
                      />
                      {/* Secondary texture pass to emulate real pencil stroke shading */}
                      <path 
                        d="M 74 18 C 114 16, 144 42, 142 80 C 140 114, 108 142, 64 144 C 32 146, 14 116, 16 78 C 18 42, 50 18, 86 16 C 118 14, 146 34, 144 74" 
                        stroke="currentColor" 
                        strokeWidth="2.2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="opacity-70"
                      />
                      {/* Artistic sketch tail stroke */}
                      <path 
                        d="M 142 72 C 148 90, 150 112, 136 130" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        className="opacity-80"
                      />
                    </svg>
                  </div>

                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
                    %
                  </span>
                </div>

                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--t1)] tracking-tight">
                  Commission
                </span>
              </div>

              <p className="text-lg sm:text-xl text-[var(--t2)] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Create your Storelly page, showcase products or services, accept UPI payments, share everything from one link, and sell through WhatsApp — without building an app.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto bg-[var(--g600)] hover:bg-[var(--g700)] text-white font-bold text-lg px-8 py-4 rounded-[var(--r8)] shadow-[var(--shadow-sm)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Create Your Free Store <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="#how-it-works"
                  className="w-full sm:w-auto bg-[var(--g100)] hover:bg-[var(--g200)] text-[var(--g800)] font-bold text-lg px-8 py-4 rounded-[var(--r8)] transition-all flex items-center justify-center gap-2 border border-[var(--g200)]"
                >
                  See How It Works
                </a>
              </div>
              
              <p className="text-sm text-[var(--t3)] font-medium flex items-center justify-center lg:justify-start gap-2 pt-2">
                <ShieldCheck className="w-4 h-4 text-[var(--g500)]" /> No app for your customers. No commission on your sales.
              </p>

              {/* Vendor & Creator Profile Types Indicator */}
              <div className="pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--r12)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
                  <div className="w-10 h-10 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center font-bold shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-heading font-black text-[var(--t1)]">Local Merchant & Stores</div>
                    <div className="text-[11px] text-[var(--t2)] font-medium">Retail, dining & local services</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--r12)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
                  <div className="w-10 h-10 rounded-[var(--r8)] bg-[var(--p100)] text-[var(--p500)] flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-heading font-black text-[var(--t1)]">Creators & Professionals</div>
                    <div className="text-[11px] text-[var(--t2)] font-medium">Portfolios, bio links & digital sales</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:w-1/2 flex justify-center lg:justify-end relative mt-8 lg:mt-0"
            >
               {/* Clean Images Container Directly Over 45-Degree Creator Theme Diagonal Backdrop */}
               <div className="relative w-full max-w-2xl mx-auto z-10 flex flex-col gap-5 p-2 sm:p-4">
                  <div className="w-full flex items-center justify-center relative">
                      <div className="w-full relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500 rounded-[var(--r16)] shadow-[var(--shadow-xl)] border border-white/40 bg-[var(--card)] p-2">
                        <img src="/landingpage.jpeg" alt="Hero Storefront" className="w-full h-auto object-contain rounded-[var(--r12)]" style={{ imageRendering: "high-quality" }} />
                      </div>
                  </div>
                  
                  <div className="w-full flex items-center justify-center relative mt-2">
                      <div className="w-full relative overflow-hidden transform hover:scale-105 transition-transform duration-700 rounded-[var(--r16)] shadow-[var(--shadow-xl)] border border-white/40 bg-[var(--card)] p-2">
                        <img src="/cteatorlink.jpeg" alt="Creator Link Showcase" className="w-full h-auto object-contain rounded-[var(--r12)]" style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }} />
                      </div>
                  </div>
               </div>
              
              {/* Decorative dotted pattern */}
              <div className="absolute top-20 -right-8 w-32 h-32 bg-repeat opacity-20 -z-10" style={{ backgroundImage: 'radial-gradient(#8aaa90 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
              <div className="absolute bottom-20 -left-12 w-24 h-24 bg-repeat opacity-20 -z-10" style={{ backgroundImage: 'radial-gradient(#2d8a45 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HAPPY CLIENTS & FAST-GROWING BRANDS SCROLLING MARQUEE */}
      <HappyClientsMarquee />

      {/* VENDOR SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
      >
            <section id="vendors" className="py-20 md:py-28 bg-[var(--g100)]/40 border-y border-[var(--border)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  
                  {/* Left: Image for Vendor */}
                  <div className="lg:w-[55%] flex justify-center items-center relative w-full mx-auto">
                     <div className="w-full relative rounded-[var(--r20)] overflow-hidden border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3 shadow-[var(--shadow-lg)]">
                        <img 
                          src="/storelly6.jpg" 
                          alt="Storelly for Vendors" 
                          className="w-full h-auto object-contain rounded-[var(--r16)] transition-transform duration-500 hover:scale-[1.02]"
                          style={{ imageRendering: "high-quality" }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/storelly6.jpg.jpeg';
                          }}
                        />
                     </div>
                  </div>

                  {/* Right: Content */}
                  <div className="lg:w-[45%] space-y-8">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-heading font-black text-[var(--t1)] tracking-tight leading-tight mb-4">
                        Take Your Local Business Online — Without the Complexity.
                      </h2>
                      <p className="text-lg text-[var(--t2)] font-medium">
                        Show your products, collect UPI payments and receive orders directly on WhatsApp. Storelly gives your business one simple digital home.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-[var(--card)] rounded-[var(--r12)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-start gap-4 hover:shadow-[var(--shadow)] transition">
                        <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[var(--t1)]">Create Your Store in Minutes</h3>
                          <p className="text-[var(--t2)] text-sm mt-1">Add your products, prices and photos and publish your storefront with one simple link.</p>
                        </div>
                      </div>

                      <div className="bg-[var(--card)] rounded-[var(--r12)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-start gap-4 hover:shadow-[var(--shadow)] transition">
                        <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center shrink-0">
                          <MessageCircle className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[var(--t1)]">Orders on WhatsApp</h3>
                          <p className="text-[var(--t2)] text-sm mt-1">Get customer order details where you already work — WhatsApp.</p>
                        </div>
                      </div>

                      <div className="bg-[var(--card)] rounded-[var(--r12)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-start gap-4 hover:shadow-[var(--shadow)] transition">
                        <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--p100)] text-[var(--p500)] flex items-center justify-center shrink-0">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[var(--t1)]">Get Paid Directly</h3>
                          <p className="text-[var(--t2)] text-sm mt-1">Accept UPI payments and keep your sales. Storelly doesn't take a commission from every order.</p>
                        </div>
                      </div>
                    </div>

                    {/* Example Notifications (Staggered) */}
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={{
                        visible: { transition: { staggerChildren: 0.2 } },
                        hidden: {}
                      }}
                      className="space-y-4 mt-8"
                    >
                      <motion.div 
                         variants={{
                           hidden: { opacity: 0, y: 20, scale: 0.9 },
                           visible: { opacity: 1, y: 0, scale: 1 }
                         }}
                         animate={{ y: [-5, 5, -5] }}
                         transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
                         className="bg-[var(--card)] rounded-[var(--r12)] p-5 shadow-[var(--shadow-lg)] border border-[var(--border)] flex items-center gap-4 relative overflow-hidden group hover:border-[var(--g400)] transition-colors"
                      >
                         <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[var(--g400)] to-[var(--g600)] animate-pulse"></div>
                         
                         <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md shrink-0 relative group-hover:scale-110 transition-transform duration-500 bg-amber-50">
                            <img 
                              src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80" 
                              alt="Chicken Pickle" 
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--g500)] rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                               <Check className="w-3 h-3 text-white font-bold" />
                            </div>
                         </div>

                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black text-white bg-[var(--g600)] px-2 py-0.5 rounded-[var(--r4)] uppercase tracking-wider shadow-sm">New Order</span>
                               <span className="text-[10px] font-bold text-[var(--t3)]">Just now</span>
                            </div>
                            <div className="text-[15px] font-heading font-black text-[var(--t1)] leading-tight">Chicken Pickle <span className="text-[var(--g600)]">1kg</span></div>
                            <div className="text-[11px] font-bold text-[var(--t2)] mt-1 flex items-center gap-1.5">
                               <span className="bg-[var(--g100)] text-[var(--t1)] px-1.5 py-0.5 rounded-[var(--r4)] font-black">₹249</span> 
                               <span>Paid via <span className="text-[var(--g600)] font-black tracking-wide">UPI</span></span>
                            </div>
                         </div>
                      </motion.div>

                      <motion.div 
                         variants={{
                           hidden: { opacity: 0, y: 20, scale: 0.9 },
                           visible: { opacity: 1, y: 0, scale: 1 }
                         }}
                         animate={{ y: [5, -5, 5] }}
                         transition={{ y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } }}
                         className="bg-[var(--card)] rounded-[var(--r12)] p-5 shadow-[var(--shadow-lg)] border border-[var(--border)] flex items-center gap-4 relative overflow-hidden group hover:border-[var(--g400)] transition-colors ml-4 lg:ml-8"
                      >
                         <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[var(--g300)] to-[var(--g500)] animate-pulse"></div>
                         
                         <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-400/80 shadow-md shrink-0 relative group-hover:scale-110 transition-transform duration-500 bg-pink-50">
                            <img 
                              src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&auto=format&fit=crop&q=80" 
                              alt="Ghee Sweets" 
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--g500)] rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                               <Check className="w-3 h-3 text-white font-bold" />
                            </div>
                         </div>

                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black text-white bg-[var(--g600)] px-2 py-0.5 rounded-[var(--r4)] uppercase tracking-wider shadow-sm">New Order</span>
                               <span className="text-[10px] font-bold text-[var(--t3)]">2 mins ago</span>
                            </div>
                            <div className="text-[15px] font-heading font-black text-[var(--t1)] leading-tight">Ghee Sweets <span className="text-[var(--g600)]">500g</span></div>
                            <div className="text-[11px] font-bold text-[var(--t2)] mt-1 flex items-center gap-1.5">
                               <span className="bg-[var(--g100)] text-[var(--t1)] px-1.5 py-0.5 rounded-[var(--r4)] font-black">₹399</span> 
                               <span>Paid via <span className="text-[var(--g600)] font-black tracking-wide">UPI</span></span>
                            </div>
                         </div>
                      </motion.div>
                    </motion.div>

                    <button onClick={() => onOpenAuth('signup')} className="bg-[var(--g600)] hover:bg-[var(--g700)] text-white font-bold text-lg px-8 py-4 rounded-[var(--r8)] shadow-[var(--shadow-sm)] transition-all active:scale-95 w-full sm:w-auto">
                      Create Your Store
                    </button>

                  </div>
                </div>
              </div>
            </section>
          </motion.div>
      
      {/* CREATOR SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
      >
            <section id="creators" className="py-20 md:py-28 bg-[var(--card)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
                  
                  {/* Left: Content */}
                  <div className="lg:w-1/2 space-y-8">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-heading font-black text-[var(--t1)] tracking-tight leading-tight mb-4">
                        Sell What You Know.<br/>Share What You Create.
                      </h2>
                      <p className="text-lg text-[var(--t2)] font-medium">
                        Turn your audience into customers with one simple page for digital products, consultations and all your important links.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-[var(--card)] rounded-[var(--r12)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-start gap-4 hover:shadow-[var(--shadow)] transition">
                        <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[var(--t1)]">Sell Digital Products</h3>
                          <p className="text-[var(--t2)] text-sm mt-1">Sell PDFs, notes, guides, files and other digital products with secure delivery.</p>
                        </div>
                      </div>

                      <div className="bg-[var(--card)] rounded-[var(--r12)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-start gap-4 hover:shadow-[var(--shadow)] transition">
                        <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--b100)] text-[var(--b500)] flex items-center justify-center shrink-0">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[var(--t1)]">Book Paid Consultations</h3>
                          <p className="text-[var(--t2)] text-sm mt-1">Let customers choose an available slot and book a paid 1:1 session.</p>
                        </div>
                      </div>

                      <div className="bg-[var(--card)] rounded-[var(--r12)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-start gap-4 hover:shadow-[var(--shadow)] transition">
                        <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center shrink-0">
                          <Link2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[var(--t1)]">One Link for Everything</h3>
                          <p className="text-[var(--t2)] text-sm mt-1">Bring your WhatsApp groups, Telegram, YouTube, Instagram, Forms and more into one place.</p>
                        </div>
                      </div>
                    </div>

                    {/* Example Digital Product Card */}
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                       whileInView={{ scale: 1, opacity: 1, y: 0 }} 
                       animate={{ y: [-5, 5, -5] }}
                       transition={{ y: { repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }, opacity: { duration: 0.5 }, scale: { duration: 0.5 } }}
                       className="bg-[var(--card)] rounded-[var(--r12)] p-5 shadow-[var(--shadow-lg)] border border-[var(--border)] flex items-center gap-4 mt-8 relative overflow-hidden group hover:border-[var(--b500)] transition-colors"
                    >
                       {/* Colorful PDF Image Icon */}
                       <div className="w-14 h-14 rounded-[var(--r8)] bg-gradient-to-br from-[var(--r500)] to-rose-600 text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-red-500/30 transform group-hover:-rotate-6 transition-transform duration-300 border-2 border-white relative z-10">
                          <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-lg"></div>
                          <FileText className="w-6 h-6 mb-0.5 drop-shadow-md" />
                          <span className="font-black text-[9px] tracking-wider drop-shadow-md">PDF</span>
                       </div>

                       <div className="flex-1 relative z-10">
                          <div className="text-[10px] font-black text-[var(--b500)] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-[var(--b500)] animate-pulse"></span> Digital File
                          </div>
                          <div className="text-[15px] font-heading font-black text-[var(--t1)] leading-tight">TSPSC Complete Notes</div>
                          <div className="text-[13px] font-black text-[var(--g600)] mt-1 flex items-center gap-1.5">
                             ₹49 <span className="text-[10px] font-bold text-[var(--t3)] bg-[var(--g100)] px-1.5 py-0.5 rounded line-through">₹199</span>
                          </div>
                       </div>
                       
                       <button className="relative overflow-hidden bg-[var(--g600)] hover:bg-[var(--g700)] text-white text-sm font-bold px-6 py-3 rounded-[var(--r8)] shadow-[var(--shadow-sm)] active:scale-95 transition-all z-10">
                          Buy Now
                       </button>
                    </motion.div>

                    <button onClick={() => onOpenAuth('signup')} className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg px-8 py-4 rounded-[var(--r8)] shadow-lg shadow-purple-600/25 transition-all active:scale-95 w-full sm:w-auto cursor-pointer">
                      Create Your Creator Page
                    </button>
                  </div>

                  {/* Right: Image for Creator */}
                  <div className="lg:w-1/2 flex justify-center items-center relative w-full mx-auto">
                     <div className="w-full relative rounded-[var(--r20)] overflow-hidden border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3 shadow-[var(--shadow-lg)]">
                        <img 
                          src="/cteatorlink.jpeg" 
                          alt="Storelly for Creators" 
                          className="w-full h-auto object-contain rounded-[var(--r16)] transition-transform duration-500 hover:scale-[1.02]"
                          style={{ imageRendering: "high-quality" }}
                        />
                     </div>
                  </div>

                </div>
              </div>
            </section>
          </motion.div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-[var(--card)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Big Highlighted "0 Commission" with Hand-Drawn Pencil Doodle Circle */}
          <div className="mb-16 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--g100)] border border-[var(--g200)] text-[var(--g800)] text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--g600)] animate-pulse" />
              Keep 100% of Your Sales Revenue
            </div>

            <div className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black text-[var(--t1)] tracking-tight flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <span className="relative inline-flex items-center justify-center px-4 py-2 mx-1 my-1">
                {/* Large, prominent hand-drawn pencil sketch doodle loop */}
                <svg
                  className="absolute -inset-x-5 sm:-inset-x-8 -inset-y-3 sm:-inset-y-4 w-[calc(100%+2.5rem)] sm:w-[calc(100%+4rem)] h-[calc(100%+1.5rem)] sm:h-[calc(100%+2rem)] -left-5 sm:-left-8 -top-1.5 sm:-top-2 -rotate-2 text-emerald-500 dark:text-emerald-400 pointer-events-none stroke-current overflow-visible drop-shadow-md"
                  viewBox="0 0 220 95"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer primary bold pencil loop */}
                  <path
                    d="M 28,48 C 22,22 65,8 120,7 C 180,6 208,24 208,48 C 208,74 170,89 110,90 C 50,91 10,72 12,44 C 14,24 48,12 105,11 C 165,10 205,27 206,52 C 207,76 162,88 115,88"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-95"
                  />
                  {/* Secondary overlapping hand-sketch stroke */}
                  <path
                    d="M 35,52 C 30,28 72,15 124,14 C 176,13 200,28 200,50 C 200,71 165,84 112,84 C 58,84 20,69 22,46 C 24,29 58,19 108,18"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-75 text-emerald-400"
                  />
                  {/* Quick pencil accent scribble */}
                  <path
                    d="M 16,38 C 11,54 28,80 60,86 C 94,91 155,88 192,78 C 208,73 214,54 202,34"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-55 text-teal-300"
                  />
                </svg>

                <span className="text-emerald-600 dark:text-emerald-400 relative z-10 font-black tracking-tight text-5xl sm:text-7xl lg:text-8xl">
                  0%
                </span>
              </span>
              <span className="text-[var(--t1)]">
                Commission
              </span>
              <span className="text-[var(--t1)]">Forever.</span>
            </div>

            <p className="text-base sm:text-xl text-[var(--t2)] font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
              No middleman cuts, no surprise deductions. Your sales and UPI payments go <span className="font-bold text-[var(--t1)]">100% directly into your own bank account</span>.
            </p>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[var(--t1)] mb-20">Go From Offline to Online in 3 Simple Steps</h2>

          <div className="flex flex-col md:flex-row items-start justify-between relative max-w-5xl mx-auto">
            {/* Dotted connecting line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-[var(--border)] -z-10"></div>

            {howItWorksData.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center w-full md:w-1/3 mb-16 md:mb-0 relative bg-[var(--card)] px-6">
                <div className="w-24 h-24 rounded-full bg-[var(--bg)] flex items-center justify-center border-2 border-[var(--border)] shadow-[var(--shadow-xs)] relative mb-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[var(--g600)] text-white font-bold flex items-center justify-center text-sm shadow-[var(--shadow-sm)]">{step.step}</div>
                  <div className="w-12 h-12 bg-[var(--g900)] rounded-[var(--r12)] flex items-center justify-center shadow-inner">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-heading font-bold text-[var(--t1)] text-xl mb-3">{step.title}</h3>
                <p className="text-[var(--t2)] font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 bg-[var(--bg)] border-y border-[var(--border)] relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--g200)] rounded-full blur-[100px] opacity-30 -z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--p100)] rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-[var(--t1)] mb-6 tracking-tight">Everything You Need to Sell From <span className="text-[var(--g600)]">One Link</span></h2>
            <p className="text-lg text-[var(--t2)] font-medium max-w-2xl mx-auto">We've built all the tools you need to run your online business, right into your Storelly page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {featuresData.map((feat, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }} 
                className="bg-[var(--card)] rounded-[var(--r16)] p-8 shadow-[var(--shadow-sm)] border border-[var(--border)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 group overflow-hidden relative"
              >
                {/* Glow effect on hover */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feat.iconGradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-30 group-hover:animate-pulse-subtle transition-opacity duration-500 pointer-events-none transform translate-x-1/2 -translate-y-1/2`}></div>
                
                <div className={`w-16 h-16 rounded-[var(--r12)] bg-gradient-to-br ${feat.iconGradient} flex items-center justify-center shrink-0 mb-6 shadow-md ${feat.shadow} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 border-2 border-white relative z-10`}>
                  <div className="drop-shadow-md flex items-center justify-center w-full h-full">{feat.icon}</div>
                </div>
                <h3 className="font-heading font-bold text-[var(--t1)] text-xl mb-2 relative z-10">{feat.title}</h3>
                <p className="text-[var(--t2)] text-sm font-medium leading-relaxed relative z-10">{feat.desc}</p>
                {feat.preview && (
                  <div className="relative z-10">
                    {feat.preview}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QR / OFFLINE TO ONLINE SECTION */}
      <section className="py-24 bg-[var(--card)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--g900)] rounded-[var(--r24)] p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-[var(--shadow-xl)]">
            
            <div className="lg:w-1/2 z-10 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-white mb-6 leading-tight">Your Shop Has a <br/><span className="text-[var(--g400)]">Digital Address.</span></h2>
              <p className="text-lg text-[var(--g200)] font-medium mb-8 max-w-lg mx-auto lg:mx-0">
                Put your Storelly QR code on your counter, packaging, business card or storefront. Customers scan, browse and order instantly.
              </p>
              <button onClick={() => onOpenAuth('signup')} className="bg-[var(--g500)] hover:bg-[var(--g600)] text-white font-bold text-lg px-8 py-4 rounded-[var(--r8)] shadow-[var(--shadow-sm)] transition-all active:scale-95">
                Create My Store
              </button>
            </div>

            <div className="lg:w-1/2 relative flex justify-center z-10">
               <div className="relative w-64 h-64 bg-white rounded-[var(--r20)] p-6 shadow-2xl flex flex-col items-center rotate-3 border-4 border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-4">
                     <Store className="w-6 h-6 text-[var(--g600)]" />
                     <span className="font-heading font-black text-xl text-[var(--g900)]">Storelly</span>
                  </div>
                  <QrCode className="w-32 h-32 text-slate-900" />
                  <div className="mt-4 bg-[var(--g600)] text-white font-bold text-sm px-6 py-2 rounded-[var(--r8)]">Scan to Shop</div>
               </div>
               
               {/* Background glowing circle */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--g500)] opacity-20 blur-[100px] rounded-full -z-10"></div>
            </div>
            
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-24 bg-[var(--bg)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[var(--t1)] mb-4">Built for the Way Indian Businesses Actually Sell</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {trustData.map((item, index) => (
              <div key={index} className="bg-[var(--card)] rounded-[var(--r16)] p-8 border border-[var(--border)] shadow-[var(--shadow-xs)] text-center flex flex-col items-center hover:shadow-[var(--shadow-sm)] transition">
                <div className="w-12 h-12 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g600)] flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-[var(--t1)] text-lg mb-3">{item.title}</h3>
                <p className="text-[var(--t2)] font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Vendor Testimonial */}
            <div className="bg-[var(--g100)]/40 rounded-[var(--r20)] p-10 relative overflow-hidden border border-[var(--border)] shadow-[var(--shadow-xs)]">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xl font-bold text-[var(--t1)] leading-relaxed mb-8">
                "I used to send product photos and prices one by one on WhatsApp. Now I just send my Storelly link. It saves me hours every day and looks so professional."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white shadow-sm text-amber-800 font-bold text-xl">
                  P
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[var(--t1)]">Priya</h4>
                  <p className="text-sm font-medium text-[var(--t2)]">Homemade Food Seller</p>
                </div>
              </div>
            </div>

            {/* Creator Testimonial */}
            <div className="bg-[var(--g100)]/40 rounded-[var(--r20)] p-10 relative overflow-hidden border border-[var(--border)] shadow-[var(--shadow-xs)]">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xl font-bold text-[var(--t1)] leading-relaxed mb-8">
                "My students can find my notes, booking link and YouTube channel in one place. Storelly makes selling PDFs via UPI completely effortless."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center border-2 border-white shadow-sm text-teal-800 font-bold text-xl">
                  R
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[var(--t1)]">Rahul</h4>
                  <p className="text-sm font-medium text-[var(--t2)]">Teacher & Creator</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-[var(--bg)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            {pricingCMS.badge && (
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--g700)] bg-[var(--g100)] px-3 py-1 rounded-[var(--r8)] border border-[var(--g200)]">
                {pricingCMS.badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[var(--t1)] mt-2">
              {pricingCMS.title || 'Start Free. Upgrade When You Grow.'}
            </h2>
            {pricingCMS.subtitle && (
              <p className="text-[var(--t2)] font-medium max-w-xl mx-auto text-sm sm:text-base">
                {pricingCMS.subtitle}
              </p>
            )}
          </div>

          <div className={`grid grid-cols-1 ${pricingPlans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : pricingPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3 max-w-6xl mx-auto'} gap-8`}>
            {pricingPlans.map((plan) => {
              const isRecommended = plan.isRecommended || plan.badge === 'Recommended';
              return (
                <div
                  key={plan.id}
                  className={`bg-[var(--card)] rounded-[var(--r20)] p-8 sm:p-10 border flex flex-col relative transition-all duration-200 ${
                    isRecommended
                      ? 'border-2 border-[var(--g600)] shadow-[var(--shadow-lg)] md:-translate-y-3'
                      : 'border-[var(--border)] shadow-[var(--shadow-sm)]'
                  }`}
                >
                  {(plan.badge || isRecommended) && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--g600)] text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-[var(--r8)] flex items-center gap-1.5 shadow-[var(--shadow-sm)]">
                      <Star className="w-4 h-4 fill-white" /> {plan.badge || 'Recommended'}
                    </div>
                  )}

                  <h3 className={`text-2xl font-heading font-black text-[var(--t1)] mb-2 ${isRecommended ? 'mt-2' : ''}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-5xl font-black text-[var(--t1)]">
                      {plan.currency || '₹'}{plan.monthlyPrice}
                    </span>
                    {plan.billingCycle && (
                      <span className="text-[var(--t2)] font-medium mb-1">{plan.billingCycle}</span>
                    )}
                  </div>

                  <p className="text-[var(--t2)] font-medium mb-8 text-sm sm:text-base">{plan.tagline}</p>

                  <div className="space-y-4 mb-10 flex-1">
                    {plan.features?.map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isRecommended ? 'bg-[var(--g100)]' : 'bg-[var(--g100)]'}`}>
                          <Check className="w-4 h-4 text-[var(--g600)] font-bold" />
                        </div>
                        <span className={`text-sm sm:text-base ${isRecommended ? 'font-bold text-[var(--t1)]' : 'font-medium text-[var(--t2)]'}`}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (plan.ctaAction === 'login') onOpenAuth('login');
                      else onOpenAuth('signup');
                    }}
                    className={`w-full py-4 rounded-[var(--r8)] font-bold transition-all text-base sm:text-lg cursor-pointer active:scale-95 ${
                      isRecommended
                        ? 'bg-[var(--g600)] text-white hover:bg-[var(--g700)] shadow-[var(--shadow-sm)]'
                        : 'border-2 border-[var(--border)] text-[var(--g700)] bg-[var(--g100)] hover:bg-[var(--g200)]'
                    }`}
                  >
                    {plan.ctaText || (plan.monthlyPrice === 0 ? 'Start Free' : 'Get Started')}
                  </button>
                </div>
              );
            })}
          </div>

          {pricingCMS.footerNote && (
            <p className="text-center text-[var(--t3)] font-medium mt-10 text-sm sm:text-base">
              {pricingCMS.footerNote}
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-[var(--card)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[var(--t1)] mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqData.map((item, i) => (
              <div key={i} className="border border-[var(--border)] rounded-[var(--r12)] overflow-hidden bg-[var(--card)] hover:border-[var(--g400)] transition-colors">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-[var(--card)] text-left focus:outline-none"
                >
                  <span className="font-heading font-bold text-[var(--t1)] text-lg">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[var(--t3)] transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[var(--g600)]' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-[var(--t2)] font-medium leading-relaxed"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-[var(--g700)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-heading font-black text-white mb-6 leading-tight">Ready to Give Your Business <br/>One Link?</h2>
          <p className="text-xl text-white/90 font-medium mb-10 max-w-2xl mx-auto">
            Create your Storelly page, share it with your customers and start selling.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button onClick={() => onOpenAuth('signup')} className="bg-white text-[var(--g800)] font-black text-lg px-10 py-5 rounded-[var(--r8)] shadow-[var(--shadow-xl)] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
               Create Your Free Store
             </button>
             <a href="#features" className="bg-[var(--g800)] text-white font-bold text-lg px-10 py-5 rounded-[var(--r8)] transition-all hover:bg-[var(--g900)] border border-white/20 w-full sm:w-auto">
               Explore Features
             </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--g900)] text-[var(--g200)] py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            
            {/* Brand */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--r8)] overflow-hidden border border-white/20 bg-white shadow-sm flex items-center justify-center shrink-0">
                  <img src={getAppLogo()} alt={`${getAppName()} Logo`} className="w-full h-full object-cover" />
                </div>
                <span className="text-2xl font-heading font-black text-white tracking-tight">{getAppName()}</span>
              </div>
              <p className="text-[var(--g300)] font-medium max-w-sm text-lg">One link for your business.</p>
              <div className="flex gap-4 pt-4">
                 <a href="#" className="w-10 h-10 rounded-full bg-[var(--g800)] flex items-center justify-center hover:bg-[var(--g600)] transition text-white"><Instagram className="w-5 h-5" /></a>
                 <a href="#" className="w-10 h-10 rounded-full bg-[var(--g800)] flex items-center justify-center hover:bg-[var(--g600)] transition text-white"><Youtube className="w-5 h-5" /></a>
                 <a href="#" className="w-10 h-10 rounded-full bg-[var(--g800)] flex items-center justify-center hover:bg-[var(--g600)] transition text-white"><MessageCircle className="w-5 h-5" /></a>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-heading font-bold tracking-wider uppercase text-sm">Product</h4>
              <ul className="space-y-4 text-[var(--g300)] font-medium">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#vendors" className="hover:text-white transition">For Vendors</a></li>
                <li><a href="#creators" className="hover:text-white transition">For Creators</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-heading font-bold tracking-wider uppercase text-sm">Company</h4>
              <ul className="space-y-4 text-[var(--g300)] font-medium">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-heading font-bold tracking-wider uppercase text-sm">Legal</h4>
              <ul className="space-y-4 text-[var(--g300)] font-medium">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-[var(--g800)] text-center text-[var(--g300)] font-medium flex flex-col md:flex-row justify-between items-center gap-4">
             <p>&copy; {new Date().getFullYear()} Storelly. All rights reserved.</p>
             <p className="flex items-center gap-1">Made with <span className="text-[var(--r500)]">♥</span> for Indian Businesses</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
