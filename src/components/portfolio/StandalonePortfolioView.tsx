import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Star,
  MessageCircle,
  Calendar,
  Sparkles,
  Award,
  BarChart2,
  TrendingUp,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Github,
  Globe,
  Share2,
  ExternalLink,
  MapPin,
  Check,
  ChevronRight,
  Play,
  ArrowRight,
  Layers,
  Tag,
  Clock,
  User,
  Eye,
  Camera,
  PenTool,
  Code2,
  Feather,
  HeartHandshake,
  Brush,
  PartyPopper,
  Smile,
  QrCode,
  SlidersHorizontal,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Quote,
  Send,
  Download,
  CheckCircle,
} from 'lucide-react';
import {
  BusinessProfile,
  PortfolioItem,
  Testimonial,
  PlatformStat,
  BrandCollab,
  CatalogItem,
  PortfolioThemeColor,
  PortfolioFontStyle,
  PortfolioLayoutMode,
  PortfolioServicePackage,
} from '../../types';
import {
  getPortfolioItems,
  getTestimonials,
  recordAnalyticsEvent,
} from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';
import { PortfolioProjectPageView } from './PortfolioProjectPageView';
import { PortfolioShareModal } from './PortfolioShareModal';
import { PORTFOLIO_PRESETS, PortfolioPreset } from '../../data/portfolioPresets';
import {
  getEffectivePortfolioTheme,
  getCardStyleClasses,
  getFontFamilyClass,
  getBorderRadiusClass,
} from '../../utils/portfolioTheme';

interface StandalonePortfolioViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  onBookConsultation?: (item?: CatalogItem) => void;
  isOwner?: boolean;
}

const PROFESSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  photographer: Camera,
  designer: PenTool,
  developer: Code2,
  youtuber: Youtube,
  writer: Feather,
  coach: HeartHandshake,
  artist: Brush,
  event_planner: PartyPopper,
  beauty: Smile,
  custom: Sparkles,
};

export const StandalonePortfolioView: React.FC<StandalonePortfolioViewProps> = ({
  business,
  onBackToDashboard,
  onBookConsultation,
  isOwner,
}) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Active navigation tab state
  const [activeTab, setActiveTab] = useState<string>('portfolio');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const settings = business.portfolioSettings || { ctaMode: 'whatsapp' };
  const professionKey = settings.profession || 'custom';
  const preset: PortfolioPreset = PORTFOLIO_PRESETS[professionKey] || PORTFOLIO_PRESETS.custom;

  const themeConfig = getEffectivePortfolioTheme(business);
  const isDark = themeConfig.colorMode === 'dark';
  const themeColor: PortfolioThemeColor =
    settings.themeColor || (isDark ? 'dark' : 'default');
  const layoutMode: PortfolioLayoutMode = settings.layoutMode || preset?.layoutMode || 'grid';

  // Load items and testimonials from Firebase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedItems, fetchedTestimonials] = await Promise.all([
          getPortfolioItems(business.id),
          getTestimonials(business.id),
        ]);
        setItems(fetchedItems.filter((i) => i.isActive !== false));
        setTestimonials(fetchedTestimonials.filter((t) => t.isActive !== false));

        // Record page view analytics
        recordAnalyticsEvent(business.id, 'portfolio_views', {
          timestamp: Date.now(),
        }).catch(() => {});
      } catch (err) {
        console.error('Error loading portfolio:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [business.id]);

  // Categories resolution
  const categoriesFromItems = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);
  const customCategories = settings.customCategories || [];
  const presetCategories = preset?.categories || [];
  const allAvailableCategories = Array.from(
    new Set([...presetCategories, ...customCategories, ...categoriesFromItems])
  ).filter((c) => c !== 'All');

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  // Deep-link initial item selection from URL (?item=id or /project/id)
  useEffect(() => {
    if (items.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item') || urlParams.get('project');
    const pathname = window.location.pathname;
    const projectMatch = pathname.match(/\/project\/([^/?#]+)/i);
    const targetId = itemParam || (projectMatch ? projectMatch[1] : null);

    if (targetId) {
      const found = items.find((i) => i.id === targetId);
      if (found) {
        setSelectedItem(found);
      }
    }
  }, [items]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const itemParam = urlParams.get('item') || urlParams.get('project');
      if (!itemParam) {
        setSelectedItem(null);
      } else if (items.length > 0) {
        const found = items.find((i) => i.id === itemParam);
        if (found) setSelectedItem(found);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [items]);

  const handleOpenItem = (item: PortfolioItem) => {
    setSelectedItem(item);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('item', item.id);
      window.history.pushState({ itemId: item.id }, '', url.toString());
    }
  };

  const handleBackFromItem = () => {
    setSelectedItem(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('item');
      url.searchParams.delete('project');
      window.history.pushState({}, '', url.toString());
    }
  };

  // WhatsApp and CTA Handlers
  const handlePrimaryCta = () => {
    if (settings.primaryCtaAction === 'booking' || settings.ctaMode === 'booking') {
      if (onBookConsultation) {
        onBookConsultation();
        return;
      }
      setActiveTab('services');
      return;
    }
    if (settings.primaryCtaUrl) {
      window.open(settings.primaryCtaUrl, '_blank');
      return;
    }
    const phone = business.whatsapp || business.phone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const defaultMsg =
      preset?.whatsappMessage ||
      `Hi ${business.name}, I checked your portfolio on Storelly and would love to enquire about working together!`;
    const msg = settings.whatsappMessage || defaultMsg;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSecondaryCta = () => {
    if (settings.secondaryCtaUrl) {
      window.open(settings.secondaryCtaUrl, '_blank');
      return;
    }
    // Default action: open services / packages or whatsapp
    setActiveTab('services');
  };

  const handleTertiaryCta = () => {
    if (settings.tertiaryCtaUrl) {
      window.open(settings.tertiaryCtaUrl, '_blank');
      return;
    }
    // Default action: scroll to media kit or services
    if (professionKey === 'youtuber' || professionKey === 'photographer') {
      setActiveTab('mediakit');
    } else {
      setActiveTab('pricing');
    }
  };

  const handleDirectWhatsApp = (customMsg?: string) => {
    const phone = business.whatsapp || business.phone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const defaultMsg = `Hi ${business.name}, I was checking your portfolio on Storelly and would love to get in touch!`;
    const msg = customMsg || settings.whatsappMessage || defaultMsg;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendContactMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = business.whatsapp || business.phone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const formattedMsg = `*New Inquiry from Storelly Portfolio*\n*Name:* ${contactName || 'Visitor'}\n*Contact:* ${contactPhone || 'Not provided'}\n*Message:* ${contactMessage}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMsg)}`, '_blank');
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactPhone('');
      setContactMessage('');
    }, 4000);
  };

  // Theme Styling Classes
  const getThemeWrapperClass = () => {
    const fontClass = getFontFamilyClass(themeConfig.fontFamily);

    switch (themeColor) {
      case 'dark':
        return `bg-slate-950 text-slate-100 ${fontClass} selection:bg-indigo-500 selection:text-white`;
      case 'minimal':
        return `bg-[#F9F9F8] text-[#1A1A1A] ${fontClass} selection:bg-stone-300`;
      case 'photo':
        return `bg-white text-slate-900 ${fontClass} selection:bg-black selection:text-white`;
      case 'rose':
        return `bg-[#FFF7F7] text-rose-950 ${fontClass} selection:bg-rose-200`;
      case 'indigo':
        return `bg-[#F5F3FF] text-slate-900 ${fontClass} selection:bg-indigo-200`;
      case 'emerald':
        return `bg-[#F0FDF4] text-emerald-950 ${fontClass} selection:bg-emerald-200`;
      case 'amber':
        return `bg-[#FFFBEB] text-amber-950 ${fontClass} selection:bg-amber-200`;
      default:
        return `bg-slate-50 text-slate-900 ${fontClass} selection:bg-indigo-100`;
    }
  };

  const getCardClass = () => {
    return getCardStyleClasses(themeConfig.cardStyle, isDark);
  };

  const getCardRadiusClass = () => {
    return getBorderRadiusClass(themeConfig.borderRadius);
  };

  // Nav Tabs configuration matching the poster
  const navTabs = settings.customNavTabs || preset.navTabs || ['Portfolio', 'About', 'Services', 'Pricing', 'Reviews', 'Contact'];

  // Media kit data
  const mediaKit = settings.mediaKit;
  const platformStats: PlatformStat[] =
    (mediaKit?.platformStats && mediaKit.platformStats.length > 0)
      ? mediaKit.platformStats
      : preset.suggestedStats || [];

  const brandCollabs: BrandCollab[] =
    (mediaKit?.brandCollabs && mediaKit.brandCollabs.length > 0)
      ? mediaKit.brandCollabs
      : preset.suggestedCollabs || [];

  // Services list
  const servicesList: PortfolioServicePackage[] =
    (settings.services && settings.services.length > 0)
      ? settings.services
      : preset.suggestedServices || [];

  // Profile data
  const professionTitle =
    settings.professionTitle ||
    preset.professionTitle ||
    (settings.profession ? settings.profession.replace('_', ' ').toUpperCase() : 'Creator');

  const locationText = settings.location || preset.location || 'India';
  const specializations = settings.specializations || preset.specializations || [];
  const sloganText = settings.slogan || preset.slogan || settings.headline || preset.headline || '';
  const aboutStory = settings.aboutStory || preset.aboutStory || business.description || settings.subheadline || preset.subheadline;
  const skillsList = settings.skillsList || preset.skillsList || [];
  const toolsList = settings.toolsList || preset.toolsList || [];
  const experienceYears = settings.experienceYears || preset.experienceYears || '5+ Years';

  const primaryBtnLabel = settings.primaryCtaText || preset.primaryCtaText || 'WhatsApp';
  const secondaryBtnLabel = settings.secondaryCtaText || preset.secondaryCtaText || 'Hire Me';
  const tertiaryBtnLabel = settings.tertiaryCtaText || preset.tertiaryCtaText || 'View Packages';

  const social = settings.socialLinks || business.socials;

  const ProfessionIcon = PROFESSION_ICONS[professionKey] || Sparkles;

  // Dedicated Full-Page Project View
  if (selectedItem) {
    return (
      <PortfolioProjectPageView
        item={selectedItem}
        business={business}
        allItems={items}
        onBack={handleBackFromItem}
        onSelectOtherItem={handleOpenItem}
        isOwner={isOwner}
      />
    );
  }

  return (
    <div
      className={`min-h-screen pb-20 ${getThemeWrapperClass()}`}
      style={{ backgroundColor: themeConfig.backgroundColor }}
    >
      {/* ===================================================== */}
      {/* OWNER PREVIEW STICKY BANNER */}
      {/* ===================================================== */}
      {isOwner && onBackToDashboard && (
        <div className="bg-slate-950 text-white px-4 py-2.5 sticky top-0 z-50 border-b border-slate-800 flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Live Portfolio Mode</span>
            <span className="hidden sm:inline text-slate-400 font-mono">
              (/portfolio/{business.slug || business.id})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-1 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer hover:opacity-95 shadow-xs"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share & QR</span>
            </button>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3.5 py-1 bg-white text-slate-950 hover:bg-slate-200 rounded-lg font-bold transition cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MAIN PORTFOLIO CARD CONTAINER (MATCHING POSTER LAYOUT) */}
      {/* ===================================================== */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">

        {/* TOP POSTER PROFESSION HEADER BADGE */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <ProfessionIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black tracking-wider uppercase font-heading">
                {preset.name.toUpperCase()}
              </span>
              <span className="mx-2 opacity-40">•</span>
              <span className="text-xs sm:text-sm opacity-70 italic font-medium">
                {preset.headline}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs shrink-0"
            title="Share Portfolio"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* ===================================================== */}
        {/* CREATOR IDENTITY BLOCK (AVATAR + DETAILS + 3 CTA BUTTONS) */}
        {/* ===================================================== */}
        <div
          className={`p-6 sm:p-8 border shadow-xs space-y-6 ${getCardRadiusClass()} ${getCardClass()}`}
        >
          {/* Top Profile Info Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
            {/* Circular Profile Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
              {business.logo || business.profileImage ? (
                <img
                  src={business.logo || business.profileImage}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full text-white flex items-center justify-center font-black text-3xl font-heading shadow-inner"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  {business.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Creator Text Info */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
                  {business.name}
                </h1>
                {/* Verified Blue Tick */}
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-xs" title="Verified Creator">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Profession & Location */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs font-bold opacity-90 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {professionTitle}
                </span>
                {locationText && (
                  <span className="flex items-center gap-1 opacity-75">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{locationText}</span>
                  </span>
                )}
              </div>

              {/* Specializations Pills / Bullets */}
              {specializations.length > 0 && (
                <p className="text-xs opacity-75 font-semibold leading-relaxed">
                  {specializations.join(' • ')}
                </p>
              )}

              {/* One Line Slogan in Italics */}
              {sloganText && (
                <p className="text-xs sm:text-sm italic font-serif opacity-90 pt-0.5">
                  "{sloganText}"
                </p>
              )}
            </div>
          </div>

          {/* ===================================================== */}
          {/* 3 ACTION BUTTONS ROW (AS SHOWN ON POSTER) */}
          {/* ===================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Button 1 (WhatsApp / Subscribe / Book) */}
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="py-3 px-4 rounded-xl text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor:
                  professionKey === 'youtuber'
                    ? '#dc2626'
                    : '#25D366',
              }}
            >
              {professionKey === 'youtuber' ? (
                <Youtube className="w-4 h-4 fill-current" />
              ) : (
                <MessageCircle className="w-4 h-4 fill-current" />
              )}
              <span>{primaryBtnLabel}</span>
            </button>

            {/* Button 2 (Hire Me / Book a Shoot / Watch Videos) */}
            <button
              type="button"
              onClick={handleSecondaryCta}
              className="py-3 px-4 rounded-xl text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <Briefcase className="w-4 h-4" />
              <span>{secondaryBtnLabel}</span>
            </button>

            {/* Button 3 (View Packages / Download Media Kit / Collab) */}
            <button
              type="button"
              onClick={handleTertiaryCta}
              className="py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Layers className="w-4 h-4" />
              <span>{tertiaryBtnLabel}</span>
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* SECTION NAVIGATION BAR (HORIZONTAL TABS) */}
        {/* ===================================================== */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max pb-1">
            {navTabs.map((tabName) => {
              const tabKey = tabName.toLowerCase().replace(/[^a-z]/g, '');
              const isTabActive =
                activeTab === tabKey ||
                (activeTab === 'portfolio' && (tabKey === 'portfolio' || tabKey === 'videos' || tabKey === 'gallery')) ||
                (activeTab === 'pricing' && (tabKey === 'pricing' || tabKey === 'packages' || tabKey === 'programs')) ||
                (activeTab === 'reviews' && (tabKey === 'reviews' || tabKey === 'testimonials'));

              return (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => {
                    if (tabKey === 'videos' || tabKey === 'gallery') setActiveTab('portfolio');
                    else if (tabKey === 'packages' || tabKey === 'programs') setActiveTab('pricing');
                    else if (tabKey === 'testimonials') setActiveTab('reviews');
                    else setActiveTab(tabKey);
                  }}
                  className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                    isTabActive
                      ? 'text-slate-950 dark:text-white font-black'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{tabName}</span>
                  {isTabActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.75 rounded-t-full shadow-xs"
                      style={{ backgroundColor: themeConfig.primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================================================== */}
        {/* TAB 1: PORTFOLIO / GALLERY / VIDEOS */}
        {/* ===================================================== */}
        {(activeTab === 'portfolio' || activeTab === 'videos' || activeTab === 'gallery') && (
          <div className="space-y-6">
            {/* Category Filter Pills (Horizontal Bar) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                style={
                  selectedCategory === 'all'
                    ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' }
                    : undefined
                }
                className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'shadow-md text-white'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({items.length})
              </button>

              {allAvailableCategories.map((cat) => {
                const count = items.filter((i) => i.category === cat).length;
                const isCatActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={
                      isCatActive
                        ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                      isCatActive
                        ? 'shadow-md text-white'
                        : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat} {count > 0 && <span className="opacity-75 ml-1 font-mono">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Grid Showcase of Projects */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-black font-heading">
                  No Projects Published in this Category Yet
                </h3>
                <p className="text-xs opacity-70 max-w-sm mx-auto">
                  Select "All" to browse all published works or contact the creator directly.
                </p>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    View All Projects
                  </button>
                )}
              </div>
            ) : filteredItems.length === 1 && layoutMode !== 'feed' ? (
              /* Single Project Showcase - High-Impact Full-Width Card (eliminates awkward empty gaps) */
              <div
                onClick={() => handleOpenItem(filteredItems[0])}
                className={`group border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col md:flex-row ${getCardRadiusClass()} ${getCardClass()}`}
              >
                {/* Large cover image */}
                <div className="relative md:w-1/2 aspect-video md:aspect-auto min-h-[240px] md:min-h-[320px] bg-slate-950 overflow-hidden shrink-0">
                  <SafeImage
                    src={filteredItems[0].coverImage}
                    alt={filteredItems[0].title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                    <span className="text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2">
                      <Eye className="w-4 h-4" /> View Full Case Study
                    </span>
                  </div>
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-slate-950/85 text-white backdrop-blur-xs shadow-md">
                      {filteredItems[0].category}
                    </span>
                  </div>
                  {filteredItems[0].mediaType === 'external_video' && (
                    <div className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-red-600 text-white shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                  {filteredItems[0].mediaType === 'gallery' && (
                    <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-xl bg-slate-950/85 text-white text-[11px] font-bold backdrop-blur-xs">
                      +{filteredItems[0].mediaUrls?.length || 1} Photos
                    </div>
                  )}
                </div>

                {/* Rich Details */}
                <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-bold opacity-60">
                      {filteredItems[0].clientName && <span>Client: {filteredItems[0].clientName}</span>}
                      {filteredItems[0].clientName && (filteredItems[0].year || filteredItems[0].projectYear) && <span>•</span>}
                      {(filteredItems[0].year || filteredItems[0].projectYear) && <span>{filteredItems[0].year || filteredItems[0].projectYear}</span>}
                      {filteredItems[0].role && <span>• {filteredItems[0].role}</span>}
                    </div>

                    <h3 className="text-lg sm:text-xl md:text-2xl font-black font-heading tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                      {filteredItems[0].title}
                    </h3>

                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed line-clamp-3">
                      {filteredItems[0].description}
                    </p>

                    {filteredItems[0].tags && filteredItems[0].tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {filteredItems[0].tags.slice(0, 5).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {filteredItems[0].projectOutcome && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>{filteredItems[0].projectOutcome}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span
                        className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-1.5 group-hover:shadow-md"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Case Study</span>
                      </span>
                      <span className="text-xs font-bold opacity-60 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Explore <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`grid gap-5 ${
                  layoutMode === 'feed'
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : filteredItems.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className={`group border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between ${getCardRadiusClass()} ${getCardClass()}`}
                  >
                    {/* Media Cover Image */}
                    <div className="relative aspect-video sm:aspect-4/3 w-full bg-slate-950 overflow-hidden">
                      <SafeImage
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-bold inline-flex items-center gap-1.5">
                          <Eye className="w-4 h-4" /> View Full Case Study
                        </span>
                      </div>

                      {/* Category Pill */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-950/80 text-white backdrop-blur-xs shadow-sm">
                          {item.category}
                        </span>
                      </div>

                      {/* Media indicators */}
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        {item.mediaType === 'external_video' && (
                          <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-md">
                            <Play className="w-3 h-3 fill-current" />
                          </span>
                        )}
                        {item.mediaType === 'gallery' && (
                          <span className="px-2 py-1 rounded-lg bg-slate-950/80 text-white text-[10px] font-bold backdrop-blur-xs">
                            +{item.mediaUrls?.length || 1} Photos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 sm:p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h3 className="text-sm sm:text-base font-black font-heading tracking-tight leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {item.title}
                        </h3>

                        <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Outcome badge & action row */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {item.projectOutcome && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Award className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.projectOutcome}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 text-xs opacity-70">
                          <span className="truncate">{item.clientName || item.projectYear || 'Featured'}</span>
                          <span
                            className="font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0"
                            style={{ color: themeConfig.primaryColor }}
                          >
                            Explore <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 2: ABOUT / STORY / SKILLS */}
        {/* ===================================================== */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Story Card */}
            <div className={`p-6 sm:p-8 border shadow-xs space-y-5 ${getCardRadiusClass()} ${getCardClass()}`}>
              <div className="space-y-2">
                <span className="text-xs font-bold opacity-60 uppercase tracking-wider">About the Creator</span>
                <h2 className="text-xl sm:text-2xl font-black font-heading">
                  Story, Background & Philosophy
                </h2>
              </div>

              <p className="text-xs sm:text-sm opacity-85 leading-relaxed whitespace-pre-line">
                {aboutStory}
              </p>

              {/* Key Milestones Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div className="text-lg sm:text-xl font-black font-heading">{experienceYears}</div>
                  <div className="text-[11px] font-bold opacity-70">Experience</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div className="text-lg sm:text-xl font-black font-heading">{items.length > 0 ? `${items.length}+` : '60+'}</div>
                  <div className="text-[11px] font-bold opacity-70">Projects Shipped</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div className="text-lg sm:text-xl font-black font-heading">99%</div>
                  <div className="text-[11px] font-bold opacity-70">Client Satisfaction</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div className="text-lg sm:text-xl font-black font-heading">5.0 ★</div>
                  <div className="text-[11px] font-bold opacity-70">Average Rating</div>
                </div>
              </div>
            </div>

            {/* Core Skills & Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {skillsList.length > 0 && (
                <div className={`p-6 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <h3 className="text-base font-black font-heading flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Specializations & Skills</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {toolsList.length > 0 && (
                <div className={`p-6 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <h3 className="text-base font-black font-heading flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Tools & Tech Stack</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {toolsList.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 3 & 4: SERVICES & PRICING PACKAGES */}
        {/* ===================================================== */}
        {(activeTab === 'services' || activeTab === 'pricing' || activeTab === 'packages' || activeTab === 'programs' || activeTab === 'commissions') && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Services & Offerings</span>
              <h2 className="text-xl sm:text-2xl font-black font-heading">
                Packages & Retainers
              </h2>
              <p className="text-xs opacity-75">
                Transparent pricing with verified deliverables and turnaround timelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {servicesList.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-6 border shadow-xs flex flex-col justify-between space-y-5 relative ${getCardRadiusClass()} ${getCardClass()} ${
                    pkg.popular ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 right-4">
                      <span
                        className="px-3 py-0.5 rounded-full text-[10px] font-black text-white shadow-xs"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-base font-black font-heading">{pkg.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-heading">{pkg.price}</span>
                      {pkg.duration && (
                        <span className="text-xs opacity-60 font-medium">/ {pkg.duration}</span>
                      )}
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">{pkg.description}</p>

                    {/* Deliverables Checklist */}
                    {pkg.deliverables && pkg.deliverables.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold opacity-60 uppercase tracking-wider">
                          What's Included:
                        </span>
                        <ul className="space-y-1.5 text-xs">
                          {pkg.deliverables.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="opacity-85">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDirectWhatsApp(`Hi ${business.name}, I am interested in booking your "${pkg.title}" package (${pkg.price}). Can we discuss details?`)}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Book on WhatsApp</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 5: REVIEWS / TESTIMONIALS */}
        {/* ===================================================== */}
        {(activeTab === 'reviews' || activeTab === 'testimonials') && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Client Feedback</span>
              <h2 className="text-xl sm:text-2xl font-black font-heading">
                What Clients Say
              </h2>
            </div>

            {testimonials.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Fallback authentic reviews */}
                <div className={`p-6 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm italic opacity-85 leading-relaxed">
                    "Outstanding work quality and delivered ahead of schedule. The designs helped us stand out and scale our product effortlessly."
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                      RS
                    </div>
                    <div>
                      <div className="text-xs font-bold">Rohit Sharma</div>
                      <div className="text-[11px] opacity-60">Founder & CEO, TechScale</div>
                    </div>
                  </div>
                </div>

                <div className={`p-6 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm italic opacity-85 leading-relaxed">
                    "A true creative professional! Communicated clearly through every iteration and delivered extraordinary results for our brand."
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs">
                      AV
                    </div>
                    <div>
                      <div className="text-xs font-bold">Anjali Verma</div>
                      <div className="text-[11px] opacity-60">Brand Marketing Lead</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className={`p-6 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}
                  >
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= (t.rating || 5) ? 'fill-current' : 'opacity-30'}`} />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm italic opacity-85 leading-relaxed">
                      "{t.quote}"
                    </p>
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {t.clientPhoto ? (
                        <img src={t.clientPhoto} alt={t.clientName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 font-black flex items-center justify-center text-xs">
                          {t.clientName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold">{t.clientName}</div>
                        {t.clientRole && <div className="text-[11px] opacity-60">{t.clientRole}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB: MEDIA KIT & AUDIENCE STATS */}
        {/* ===================================================== */}
        {activeTab === 'mediakit' && (
          <div className="space-y-6">
            {/* Dark Media Kit Card as shown in the Poster */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden shrink-0">
                    {business.logo ? (
                      <img src={business.logo} alt={business.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-xl font-bold">
                        {business.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-heading">{business.name}</h3>
                    <p className="text-xs text-slate-400">{professionTitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectWhatsApp(`Hi ${business.name}, we would like to request your full Media Kit and discuss a brand collaboration.`)}
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Request Media Kit</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {platformStats.map((stat) => (
                  <div
                    key={stat.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center space-y-1"
                  >
                    <div className="text-2xl sm:text-3xl font-black font-heading text-white">
                      {stat.count}
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                      {stat.label || stat.platform}
                    </div>
                    {stat.engagementRate && (
                      <div className="text-[11px] font-semibold text-emerald-400">
                        {stat.engagementRate} Engagement
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Brand Collabs */}
              {brandCollabs.length > 0 && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Featured Brand Collaborations
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
                    {brandCollabs.map((collab) => (
                      <div
                        key={collab.id}
                        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-bold text-slate-300 flex items-center gap-2"
                      >
                        <span>{collab.brandName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* TAB 6: CONTACT & INQUIRY */}
        {/* ===================================================== */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Direct Info Card */}
              <div className={`p-6 sm:p-8 border shadow-xs space-y-6 ${getCardRadiusClass()} ${getCardClass()}`}>
                <div className="space-y-1">
                  <span className="text-xs font-bold opacity-60 uppercase tracking-wider">Get in Touch</span>
                  <h2 className="text-xl font-black font-heading">Direct Contact</h2>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">WhatsApp Direct</div>
                      <div className="opacity-70">{business.whatsapp || business.phone || 'Available'}</div>
                    </div>
                  </div>

                  {business.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Email</div>
                        <div className="opacity-70">{business.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Location</div>
                      <div className="opacity-70">{locationText}</div>
                    </div>
                  </div>
                </div>

                {/* Social Profiles Grid */}
                {social && Object.values(social).some(Boolean) && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold opacity-60">Social Profiles</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {social.instagram && (
                        <a
                          href={social.instagram.startsWith('http') ? social.instagram : `https://instagram.com/${social.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 border border-pink-200 dark:border-pink-900 transition hover:scale-105"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {social.youtube && (
                        <a
                          href={social.youtube.startsWith('http') ? social.youtube : `https://${social.youtube}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900 transition hover:scale-105"
                          title="YouTube"
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      )}
                      {social.twitter && (
                        <a
                          href={social.twitter.startsWith('http') ? social.twitter : `https://twitter.com/${social.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-500 border border-sky-200 dark:border-sky-900 transition hover:scale-105"
                          title="Twitter / X"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {social.linkedin && (
                        <a
                          href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-200 dark:border-blue-900 transition hover:scale-105"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {social.github && (
                        <a
                          href={social.github.startsWith('http') ? social.github : `https://${social.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition hover:scale-105"
                          title="GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {social.website && (
                        <a
                          href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition hover:scale-105"
                          title="Website"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Inquiry Form */}
              <div className={`p-6 sm:p-8 border shadow-xs space-y-5 ${getCardRadiusClass()} ${getCardClass()}`}>
                <div className="space-y-1">
                  <span className="text-xs font-bold opacity-60 uppercase tracking-wider">Quick Inquiry</span>
                  <h2 className="text-xl font-black font-heading">Send a Message</h2>
                </div>

                {contactSent ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Message Prepared!</div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Opening WhatsApp to connect with {business.name}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendContactMessage} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold opacity-80 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold opacity-80 mb-1">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold opacity-80 mb-1">Project Requirements / Dates</label>
                      <textarea
                        required
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell us about your project scope, dates, or specific questions..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 hover:opacity-95"
                      style={{ backgroundColor: themeConfig.primaryColor }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Creator on WhatsApp</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* BOTTOM READY TO WORK TOGETHER CONVERSION FOOTER */}
        {/* ===================================================== */}
        <div
          className={`p-6 sm:p-8 border shadow-xs text-center space-y-4 mt-8 ${getCardRadiusClass()} ${getCardClass()}`}
        >
          <h3 className="text-lg sm:text-xl font-black font-heading">
            Ready to Work Together?
          </h3>
          <p className="text-xs opacity-75 max-w-md mx-auto">
            Have a project, brand sponsorship, or consultation in mind? Let's discuss requirements and dates!
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="px-6 py-3 rounded-xl text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Chat on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Portfolio</span>
            </button>
          </div>
        </div>

        {/* FOOTER BRANDING */}
        <div className="text-center pt-4 pb-8 space-y-1">
          <p className="text-[11px] opacity-60 font-semibold">
            Powered by <span className="font-black">Storelly</span> • One Link. Every Portfolio.
          </p>
        </div>
      </div>

      {/* Share & QR Code Modal */}
      {isShareModalOpen && (
        <PortfolioShareModal
          business={business}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
