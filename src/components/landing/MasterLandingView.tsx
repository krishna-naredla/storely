import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { FaWhatsapp, FaTelegram, FaYoutube, FaInstagram } from 'react-icons/fa';
import { SiGooglepay, SiPhonepe, SiPaytm, SiGoogleforms } from 'react-icons/si';
import { Link, CalendarCheck, LineChart, FileDown, Wand2 } from 'lucide-react';

import { 
  Store, CheckCircle2, Star, FileText, Calendar, Link2, 
  MessageCircle, TrendingUp, ChevronDown, Check, Play, QrCode, 
  ArrowRight, Smartphone, ShieldCheck, Zap, Instagram, Youtube, User, Plus, Search, HelpCircle, MapPin, Send
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
  { icon: <FaWhatsapp size={34} color="white" />, iconGradient: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-500/30', title: 'WhatsApp Orders', desc: 'Receive order details directly on WhatsApp, no dashboard needed.' },
  { icon: (
      <div className="flex gap-1.5 text-white items-center justify-center">
        <SiGooglepay size={22} color="white" />
        <SiPhonepe size={18} color="white" />
        <SiPaytm size={24} color="white" />
      </div>
    ), iconGradient: 'from-violet-400 to-purple-600', shadow: 'shadow-purple-500/30', title: 'UPI Payments', desc: 'Let customers pay instantly using Google Pay, PhonePe, and Paytm.' },
  { icon: <Link size={32} className="text-white" />, iconGradient: 'from-blue-400 to-cyan-500', shadow: 'shadow-cyan-500/30', title: 'Your Own Store Link', desc: 'Share one memorable, professional link across all your platforms.' },
  { icon: <CalendarCheck size={32} className="text-white" />, iconGradient: 'from-pink-400 to-rose-500', shadow: 'shadow-rose-500/30', title: 'Booking & Consultations', desc: 'Let customers book available slots and pay for 1:1 sessions online.' },
  { icon: (
      <div className="flex flex-wrap justify-center items-center gap-1.5 w-12 text-white">
        <FaWhatsapp size={14} color="white" />
        <FaTelegram size={14} color="white" />
        <FaYoutube size={14} color="white" />
        <FaInstagram size={14} color="white" />
        <SiGoogleforms size={14} color="white" />
      </div>
    ), iconGradient: 'from-orange-400 to-amber-500', shadow: 'shadow-amber-500/30', title: 'All Your Links in One Place', desc: 'Connect WhatsApp, Telegram, YouTube, Instagram, and Forms.' },
  { icon: <LineChart size={32} className="text-white" />, iconGradient: 'from-sky-400 to-blue-500', shadow: 'shadow-blue-500/30', title: 'Simple Analytics', desc: 'Understand visits, clicks and how customers interact with your page.' },
  { icon: <FileDown size={32} className="text-white" />, iconGradient: 'from-red-400 to-rose-600', shadow: 'shadow-red-500/30', title: 'Digital Products', desc: 'Sell PDFs, notes, templates, and courses with secure auto-delivery.' },
  { icon: <Store size={32} className="text-white" />, iconGradient: 'from-yellow-400 to-orange-500', shadow: 'shadow-orange-500/30', title: 'Customizable Storefront', desc: 'Choose themes and colors to match your personal or brand identity.' },
  { icon: <Wand2 size={32} className="text-white" />, iconGradient: 'from-teal-400 to-emerald-500', shadow: 'shadow-teal-500/30', title: 'Zero Coding Required', desc: 'Launch your store in less than 2 minutes. No technical skills needed.' }
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
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden scroll-smooth">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Storelly</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition">Home</a>
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">How It Works</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">Pricing</a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">FAQ</a>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => onOpenAuth('signup')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-md transition-all active:scale-95"
            >
              Get Started Free
            </button>
          </div>
          
          <div className="lg:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
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
            className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6"
          >
            <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-900">Home</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-600">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-600">How It Works</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-600">Pricing</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-600">FAQ</a>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('signup'); }}
              className="mt-6 bg-emerald-600 text-white text-lg font-bold px-6 py-4 rounded-xl w-full"
            >
              Get Started Free
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-8 z-10 text-center lg:text-left"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-black text-slate-900 tracking-tight leading-[1.1]">
                Your Business. <br />
                <span className="text-emerald-600">One Link.</span> <br />
                More Sales.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Create your Storelly page, showcase products or services, accept UPI payments, share everything from one link, and sell through WhatsApp — without building an app.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Create Your Free Store <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="#how-it-works"
                  className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-lg px-8 py-4 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  See How It Works
                </a>
              </div>
              
              <p className="text-sm text-slate-500 font-medium flex items-center justify-center lg:justify-start gap-2 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> No app for your customers. No commission on your sales.
              </p>

              {/* Vendor & Creator Character Pointers */}
              <div className="pt-10 flex flex-row items-center justify-center lg:justify-start gap-12 relative">
                <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-600/20 flex items-center justify-center overflow-hidden shadow-sm">
                    {/* Flat 2D Vendor Avatar */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="50" fill="#fff9ed" />
                      <circle cx="50" cy="40" r="18" fill="#d4a373" />
                      <path d="M25 100 Q 50 60 75 100" fill="#e76f51" />
                      <circle cx="43" cy="38" r="2" fill="#264653" />
                      <circle cx="57" cy="38" r="2" fill="#264653" />
                      <path d="M45 45 Q50 48 55 45" fill="transparent" stroke="#264653" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Local Vendor</div>
                  <svg className="absolute hidden lg:block text-emerald-600 w-24 h-12 left-20 top-4 opacity-40" style={{ transform: 'rotate(-15deg)' }} viewBox="0 0 100 50">
                    <path d="M0,40 Q50,0 95,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                    <polygon points="95,20 85,15 90,28" fill="currentColor" />
                  </svg>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500/20 flex items-center justify-center overflow-hidden shadow-sm">
                    {/* Flat 2D Creator Avatar */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="50" fill="#f0f7ff" />
                      <circle cx="50" cy="40" r="18" fill="#e9c46a" />
                      <path d="M25 100 Q 50 60 75 100" fill="#2a9d8f" />
                      <rect x="42" y="22" width="16" height="6" fill="#264653" rx="3" />
                      <circle cx="43" cy="38" r="2" fill="#264653" />
                      <circle cx="57" cy="38" r="2" fill="#264653" />
                      <path d="M45 45 Q50 48 55 45" fill="transparent" stroke="#264653" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Creator</div>
                  <svg className="absolute hidden lg:block text-emerald-500 left-20 top-4 opacity-40" style={{ width: 'clamp(150px, 22vw, 350px)', overflow: 'visible' }} viewBox="0 0 200 50">
                    <path d="M0,10 Q100,80 190,30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                    <polygon points="195,29 183,23 186,37" fill="currentColor" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:w-1/2 flex justify-center lg:justify-end relative mt-8 lg:mt-0"
            >
               <div className="relative w-full max-w-[500px] lg:max-w-[800px] lg:w-[125%] xl:w-[140%] mx-auto lg:-mr-10 xl:-mr-20 z-20 flex flex-col gap-6">
                  <div className="w-full flex items-center justify-center relative">
                      <div className="w-full relative overflow-hidden transform hover:scale-105 transition-transform duration-700 rounded-2xl">
                        <img src="/landingpage.jpeg" alt="Hero Storefront" className="w-full h-auto object-contain drop-shadow-2xl" style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }} />
                      </div>
                  </div>
                  
                  <div className="w-full flex items-center justify-center relative mt-4">
                      <div className="w-full relative overflow-hidden transform hover:scale-105 transition-transform duration-700 rounded-2xl">
                        <img src="/cteatorlink.jpeg" alt="Creator Link Showcase" className="w-full h-auto object-contain drop-shadow-2xl" style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }} />
                      </div>
                  </div>
               </div>
              
              {/* Decorative dotted pattern */}
              <div className="absolute top-20 -right-8 w-32 h-32 bg-repeat opacity-20 -z-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
              <div className="absolute bottom-20 -left-12 w-24 h-24 bg-repeat opacity-20 -z-10" style={{ backgroundImage: 'radial-gradient(#059669 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
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
            <section id="vendors" className="py-20 md:py-28 bg-emerald-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  
                  {/* Left: Image for Vendor */}
                  <div className="lg:w-[60%] flex justify-center items-center relative max-w-full mx-auto">
                     <div className="w-full max-w-full flex items-center justify-center relative">
                        <img 
                          src="/storelly6.jpg" 
                          alt="Storelly for Vendors" 
                          className="w-full max-w-[120%] lg:max-w-[130%] h-auto object-contain hover:scale-105 transition-transform duration-700 drop-shadow-xl"
                          style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                        />
                     </div>
                  </div>

                  {/* Right: Content */}
                  <div className="lg:w-[40%] space-y-8">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                        Take Your Local Business Online — Without the Complexity.
                      </h2>
                      <p className="text-lg text-slate-600 font-medium">
                        Show your products, collect UPI payments and receive orders directly on WhatsApp. Storelly gives your business one simple digital home.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Create Your Store in Minutes</h3>
                          <p className="text-slate-600 text-sm mt-1">Add your products, prices and photos and publish your storefront with one simple link.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Orders on WhatsApp</h3>
                          <p className="text-slate-600 text-sm mt-1">Get customer order details where you already work — WhatsApp.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Get Paid Directly</h3>
                          <p className="text-slate-600 text-sm mt-1">Accept UPI payments and keep your sales. Storelly doesn't take a commission from every order.</p>
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
                         className="bg-white rounded-2xl p-5 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.4)] border-2 border-emerald-100 flex items-center gap-4 relative overflow-hidden group hover:border-emerald-300 transition-colors"
                      >
                         <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-400 to-emerald-600 animate-pulse"></div>
                         
                         <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-100 to-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 shadow-inner relative group-hover:scale-110 transition-transform duration-500">
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                               <Check className="w-3 h-3 text-white font-bold" />
                            </div>
                            <span className="text-2xl" role="img" aria-label="pickle">🥘</span>
                         </div>

                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">New Order</span>
                               <span className="text-[10px] font-bold text-slate-400">Just now</span>
                            </div>
                            <div className="text-[15px] font-black text-slate-900 leading-tight">Chicken Pickle <span className="text-emerald-600">1kg</span></div>
                            <div className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                               <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-black">₹249</span> 
                               <span>Paid via <span className="text-emerald-600 font-black tracking-wide">UPI</span></span>
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
                         className="bg-white rounded-2xl p-5 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.3)] border-2 border-emerald-50 flex items-center gap-4 relative overflow-hidden group hover:border-emerald-200 transition-colors ml-4 lg:ml-8"
                      >
                         <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-300 to-emerald-500 animate-pulse"></div>
                         
                         <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-100 to-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-inner relative group-hover:scale-110 transition-transform duration-500">
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                               <Check className="w-3 h-3 text-white font-bold" />
                            </div>
                            <span className="text-2xl" role="img" aria-label="sweet">🍪</span>
                         </div>

                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">New Order</span>
                               <span className="text-[10px] font-bold text-slate-400">2 mins ago</span>
                            </div>
                            <div className="text-[15px] font-black text-slate-900 leading-tight">Ghee Sweets <span className="text-emerald-600">500g</span></div>
                            <div className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                               <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-black">₹399</span> 
                               <span>Paid via <span className="text-emerald-600 font-black tracking-wide">UPI</span></span>
                            </div>
                         </div>
                      </motion.div>
                    </motion.div>

                    <button onClick={() => onOpenAuth('signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-md transition-all active:scale-95 w-full sm:w-auto">
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
            <section id="creators" className="py-20 md:py-28 bg-emerald-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
                  
                  {/* Left: Content */}
                  <div className="lg:w-1/2 space-y-8">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                        Sell What You Know.<br/>Share What You Create.
                      </h2>
                      <p className="text-lg text-slate-600 font-medium">
                        Turn your audience into customers with one simple page for digital products, consultations and all your important links.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Sell Digital Products</h3>
                          <p className="text-slate-600 text-sm mt-1">Sell PDFs, notes, guides, files and other digital products with secure delivery.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">Book Paid Consultations</h3>
                          <p className="text-slate-600 text-sm mt-1">Let customers choose an available slot and book a paid 1:1 session.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Link2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">One Link for Everything</h3>
                          <p className="text-slate-600 text-sm mt-1">Bring your WhatsApp groups, Telegram, YouTube, Instagram, Forms and more into one place.</p>
                        </div>
                      </div>
                    </div>

                    {/* Example Digital Product Card */}
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                       whileInView={{ scale: 1, opacity: 1, y: 0 }} 
                       animate={{ y: [-5, 5, -5] }}
                       transition={{ y: { repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }, opacity: { duration: 0.5 }, scale: { duration: 0.5 } }}
                       className="bg-white rounded-2xl p-5 shadow-[0_20px_50px_-12px_rgba(59,130,246,0.25)] border-2 border-blue-50 flex items-center gap-4 mt-8 relative overflow-hidden group hover:border-blue-200 transition-colors"
                    >
                       <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>

                       {/* Colorful PDF Image Icon */}
                       <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-red-500/30 transform group-hover:-rotate-6 transition-transform duration-300 border-2 border-white relative z-10">
                          <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-lg"></div>
                          <FileText className="w-6 h-6 mb-0.5 drop-shadow-md" />
                          <span className="font-black text-[9px] tracking-wider drop-shadow-md">PDF</span>
                       </div>

                       <div className="flex-1 relative z-10">
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Digital File
                          </div>
                          <div className="text-[15px] font-black text-slate-900 leading-tight">TSPSC Complete Notes</div>
                          <div className="text-[13px] font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                             ₹49 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded line-through">₹199</span>
                          </div>
                       </div>
                       
                       <button className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-[0_8px_16px_-4px_rgba(16,185,129,0.4)] active:scale-95 hover:shadow-lg transition-all z-10 group/btn">
                          Buy Now
                       </button>
                    </motion.div>

                    <button onClick={() => onOpenAuth('signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-md transition-all active:scale-95 w-full sm:w-auto">
                      Create Your Creator Page
                    </button>
                  </div>

                  {/* Right: Image for Creator */}
                  <div className="lg:w-[60%] flex justify-center items-center relative max-w-full mx-auto">
                     <div className="w-full max-w-full flex items-center justify-center relative">
                        <img 
                          src="/cteatorlink.jpeg" 
                          alt="Storelly for Creators" 
                          className="w-full max-w-[120%] lg:max-w-[130%] h-auto object-contain hover:scale-105 transition-transform duration-700 drop-shadow-xl"
                          style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                        />
                     </div>
                  </div>

                </div>
              </div>
            </section>
          </motion.div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-20">Go From Offline to Online in 3 Simple Steps</h2>

          <div className="flex flex-col md:flex-row items-start justify-between relative max-w-5xl mx-auto">
            {/* Dotted connecting line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-slate-300 -z-10"></div>

            {howItWorksData.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center w-full md:w-1/3 mb-16 md:mb-0 relative bg-white px-6">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-100 shadow-md relative mb-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-lg">{step.step}</div>
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-inner">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-3">{step.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 bg-slate-50 border-y border-slate-100 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] opacity-40 -z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-100 rounded-full blur-[120px] opacity-40 -z-10 pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything You Need to Sell From <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">One Link</span></h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">We've built all the tools you need to run your online business, right into your Storelly page.</p>
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
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group overflow-hidden relative"
              >
                {/* Glow effect on hover */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feat.iconGradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-30 group-hover:animate-pulse-subtle transition-opacity duration-500 pointer-events-none transform translate-x-1/2 -translate-y-1/2`}></div>
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feat.iconGradient} flex items-center justify-center shrink-0 mb-6 shadow-lg ${feat.shadow} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 border-2 border-white relative z-10`}>
                  <div className="drop-shadow-md flex items-center justify-center w-full h-full">{feat.icon}</div>
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-3 relative z-10">{feat.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed relative z-10">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QR / OFFLINE TO ONLINE SECTION */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1e293b] rounded-[40px] p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
            
            <div className="lg:w-1/2 z-10 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">Your Shop Has a <br/><span className="text-emerald-600">Digital Address.</span></h2>
              <p className="text-lg text-slate-300 font-medium mb-8 max-w-lg mx-auto lg:mx-0">
                Put your Storelly QR code on your counter, packaging, business card or storefront. Customers scan, browse and order instantly.
              </p>
              <button onClick={() => onOpenAuth('signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all active:scale-95">
                Create My Store
              </button>
            </div>

            <div className="lg:w-1/2 relative flex justify-center z-10">
               <div className="relative w-64 h-64 bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center rotate-3 border-4 border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                     <Store className="w-6 h-6 text-emerald-600" />
                     <span className="font-black text-xl text-slate-900">Storelly</span>
                  </div>
                  <QrCode className="w-32 h-32 text-slate-900" />
                  <div className="mt-4 bg-emerald-600 text-white font-bold text-sm px-6 py-2 rounded-full">Scan to Shop</div>
               </div>
               
               {/* Background glowing circle */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600 opacity-20 blur-[100px] rounded-full -z-10"></div>
            </div>
            
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Built for the Way Indian Businesses Actually Sell</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {trustData.map((item, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-3">{item.title}</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Vendor Testimonial */}
            <div className="bg-emerald-50 rounded-[32px] p-10 relative overflow-hidden border border-[#ffedd5]">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xl font-bold text-slate-800 leading-relaxed mb-8">
                "I used to send product photos and prices one by one on WhatsApp. Now I just send my Storelly link. It saves me hours every day and looks so professional."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#d4a373] flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                   <svg viewBox="0 0 100 100" className="w-full h-full mt-4"><circle cx="50" cy="40" r="25" fill="#fff9ed"/><path d="M10 100 Q50 50 90 100" fill="#e76f51"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Priya</h4>
                  <p className="text-sm font-medium text-slate-500">Homemade Food Seller</p>
                </div>
              </div>
            </div>

            {/* Creator Testimonial */}
            <div className="bg-emerald-50 rounded-[32px] p-10 relative overflow-hidden border border-emerald-100">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xl font-bold text-slate-800 leading-relaxed mb-8">
                "My students can find my notes, booking link and YouTube channel in one place. Storelly makes selling PDFs via UPI completely effortless."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#e9c46a] flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                   <svg viewBox="0 0 100 100" className="w-full h-full mt-4"><circle cx="50" cy="40" r="25" fill="#fff9ed"/><path d="M10 100 Q50 50 90 100" fill="#2a9d8f"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Rahul</h4>
                  <p className="text-sm font-medium text-slate-500">Teacher & Creator</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            {pricingCMS.badge && (
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {pricingCMS.badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              {pricingCMS.title || 'Start Free. Upgrade When You Grow.'}
            </h2>
            {pricingCMS.subtitle && (
              <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm sm:text-base">
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
                  className={`bg-white rounded-[32px] p-8 sm:p-10 border flex flex-col relative transition-all duration-200 ${
                    isRecommended
                      ? 'border-2 border-emerald-600 shadow-xl md:-translate-y-3'
                      : 'border-slate-200 shadow-sm'
                  }`}
                >
                  {(plan.badge || isRecommended) && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full flex items-center gap-1.5 shadow-md">
                      <Star className="w-4 h-4 fill-white" /> {plan.badge || 'Recommended'}
                    </div>
                  )}

                  <h3 className={`text-2xl font-black text-slate-900 mb-2 ${isRecommended ? 'mt-2' : ''}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-5xl font-black text-slate-900">
                      {plan.currency || '₹'}{plan.monthlyPrice}
                    </span>
                    {plan.billingCycle && (
                      <span className="text-slate-500 font-medium mb-1">{plan.billingCycle}</span>
                    )}
                  </div>

                  <p className="text-slate-500 font-medium mb-8 text-sm sm:text-base">{plan.tagline}</p>

                  <div className="space-y-4 mb-10 flex-1">
                    {plan.features?.map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isRecommended ? 'bg-emerald-600/10' : 'bg-emerald-100'}`}>
                          <Check className="w-4 h-4 text-emerald-600 font-bold" />
                        </div>
                        <span className={`text-sm sm:text-base ${isRecommended ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
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
                    className={`w-full py-4 rounded-full font-bold transition-all text-base sm:text-lg cursor-pointer active:scale-95 ${
                      isRecommended
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                        : 'border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    {plan.ctaText || (plan.monthlyPrice === 0 ? 'Start Free' : 'Get Started')}
                  </button>
                </div>
              );
            })}
          </div>

          {pricingCMS.footerNote && (
            <p className="text-center text-slate-500 font-medium mt-10 text-sm sm:text-base">
              {pricingCMS.footerNote}
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqData.map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-emerald-600/30 transition-colors">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-white text-left focus:outline-none"
                >
                  <span className="font-bold text-slate-900 text-lg">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-slate-600 font-medium leading-relaxed"
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
      <section className="py-24 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">Ready to Give Your Business <br/>One Link?</h2>
          <p className="text-xl text-white/90 font-medium mb-10 max-w-2xl mx-auto">
            Create your Storelly page, share it with your customers and start selling.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button onClick={() => onOpenAuth('signup')} className="bg-white text-emerald-600 font-black text-lg px-10 py-5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
               Create Your Free Store
             </button>
             <a href="#features" className="bg-emerald-700 text-white font-bold text-lg px-10 py-5 rounded-full transition-all hover:bg-emerald-800 w-full sm:w-auto">
               Explore Features
             </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1e293b] text-slate-300 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            
            {/* Brand */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">Storelly</span>
              </div>
              <p className="text-slate-400 font-medium max-w-sm text-lg">One link for your business.</p>
              <div className="flex gap-4 pt-4">
                 <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition"><Instagram className="w-5 h-5" /></a>
                 <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition"><Youtube className="w-5 h-5" /></a>
                 <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition"><MessageCircle className="w-5 h-5" /></a>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold tracking-wider uppercase text-sm">Product</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#vendors" className="hover:text-white transition">For Vendors</a></li>
                <li><a href="#creators" className="hover:text-white transition">For Creators</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold tracking-wider uppercase text-sm">Company</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold tracking-wider uppercase text-sm">Legal</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 font-medium flex flex-col md:flex-row justify-between items-center gap-4">
             <p>&copy; {new Date().getFullYear()} Storelly. All rights reserved.</p>
             <p className="flex items-center gap-1">Made with <span className="text-red-500">♥</span> for Indian Businesses</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
