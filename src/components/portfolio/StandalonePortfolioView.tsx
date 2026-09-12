import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Star,
  MessageCircle,
  Calendar,
  Sparkles,
  Award,
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
  ArrowUpRight,
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
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  Send,
  Download,
  Plus,
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
import {
  PORTFOLIO_PRESETS,
  PortfolioPreset,
  getStarterPortfolioItems,
} from '../../data/portfolioPresets';
import {
  getEffectivePortfolioTheme,
  getCardStyleClasses,
  getFontFamilyClass,
  getBorderRadiusClass,
  getDefaultPortfolioBlocks,
} from '../../utils/portfolioTheme';
import { normalizeSocialLinksToObject } from '../../utils/profileHelper';
import { PortfolioBlock, PortfolioTemplateId } from '../../types';

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
  const [fullPageItem, setFullPageItem] = useState<PortfolioItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Active section for header indicator
  const [activeSection, setActiveSection] = useState<string>('projects');

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

  // Guaranteed showcase items: If creator has not added custom items yet, load rich starter projects
  const effectiveItems: PortfolioItem[] =
    items.length > 0
      ? items
      : getStarterPortfolioItems(professionKey, business.name, business.id);

  // Categories resolution
  const categoriesFromItems = Array.from(new Set(effectiveItems.map((i) => i.category))).filter(Boolean);
  const customCategories = settings.customCategories || [];
  const presetCategories = preset?.categories || [];
  const allAvailableCategories = Array.from(
    new Set([...presetCategories, ...customCategories, ...categoriesFromItems])
  ).filter((c) => c && c.toLowerCase() !== 'all');

  const filteredItems = effectiveItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Deep-link initial item selection from URL (?item=id or /project/id)
  useEffect(() => {
    if (effectiveItems.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item') || urlParams.get('project');
    const pathname = window.location.pathname;
    const projectMatch = pathname.match(/\/project\/([^/?#]+)/i);
    const targetId = itemParam || (projectMatch ? projectMatch[1] : null);

    if (targetId) {
      const found = effectiveItems.find((i) => i.id === targetId);
      if (found) {
        setFullPageItem(found);
      }
    }
  }, [effectiveItems]);

  const handleOpenItem = (item: PortfolioItem) => {
    setFullPageItem(item);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('project', item.id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleOpenFullPageItem = (item: PortfolioItem) => {
    setFullPageItem(item);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('project', item.id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleBackFromFullPage = () => {
    setFullPageItem(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('item');
      url.searchParams.delete('project');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Smooth scroll to section helper
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // WhatsApp and CTA Handlers
  const handlePrimaryCta = () => {
    if (settings.primaryCtaAction === 'booking' || settings.ctaMode === 'booking') {
      if (onBookConsultation) {
        onBookConsultation();
        return;
      }
      scrollToSection('services');
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
    scrollToSection('contact');
  };

  const handleTertiaryCta = () => {
    if (settings.tertiaryCtaUrl) {
      window.open(settings.tertiaryCtaUrl, '_blank');
      return;
    }
    scrollToSection('services');
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

  // Services list
  const servicesList: PortfolioServicePackage[] =
    settings.services && settings.services.length > 0
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
  const aboutStory =
    settings.aboutStory ||
    preset.aboutStory ||
    business.description ||
    settings.subheadline ||
    preset.subheadline;
  const skillsList = settings.skillsList || preset.skillsList || [];
  const toolsList = settings.toolsList || preset.toolsList || [];
  const experienceYears = settings.experienceYears || preset.experienceYears || '5+ Years';

  const primaryBtnLabel = settings.primaryCtaText || preset.primaryCtaText || 'WhatsApp';
  const secondaryBtnLabel = settings.secondaryCtaText || preset.secondaryCtaText || 'Hire Me';
  const tertiaryBtnLabel = settings.tertiaryCtaText || preset.tertiaryCtaText || 'View Packages';

  const baseBusinessSocials = normalizeSocialLinksToObject(business.socialLinks, business.socials);
  const social = {
    ...baseBusinessSocials,
    ...(settings.socialLinks || {}),
  };
  const ProfessionIcon = PROFESSION_ICONS[professionKey] || Sparkles;

  // Fallback authentic reviews if none added in Firestore yet
  const effectiveTestimonials: Testimonial[] =
    testimonials.length > 0
      ? testimonials
      : [
          {
            id: 'sample_t1',
            businessId: business.id,
            clientName: 'Rohit Sharma',
            clientRole: 'Founder & CEO, TechScale',
            quote:
              'Outstanding work quality and delivered ahead of schedule. The execution helped our team launch seamlessly with 100% confidence.',
            rating: 5,
            order: 1,
            isActive: true,
            createdAt: Date.now() - 30 * 86400000,
          },
          {
            id: 'sample_t2',
            businessId: business.id,
            clientName: 'Anjali Verma',
            clientRole: 'Brand Marketing Lead, Apex Studio',
            quote:
              'A true creative professional! Communicated clearly through every phase and delivered extraordinary results that exceeded expectations.',
            rating: 5,
            order: 2,
            isActive: true,
            createdAt: Date.now() - 60 * 86400000,
          },
        ];

  // Platform Stats and Brand Collabs
  const platformStats: PlatformStat[] = settings.platformStats || [];
  const brandCollabs: BrandCollab[] = settings.brandCollabs || [];

  // Template and Modular Page Blocks
  const templateId: PortfolioTemplateId = settings.templateId || 'modern_showcase';
  const configuredBlocks: PortfolioBlock[] =
    settings.blocks && settings.blocks.length > 0
      ? settings.blocks
      : getDefaultPortfolioBlocks(business);
  const activeBlocks = [...configuredBlocks]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter((b) => b.enabled !== false);

  // Dedicated Full-Page Project View (if user triggers full standalone case study)
  if (fullPageItem) {
    return (
      <PortfolioProjectPageView
        item={fullPageItem}
        business={business}
        allItems={effectiveItems}
        onBack={handleBackFromFullPage}
        onSelectOtherItem={handleOpenFullPageItem}
        isOwner={isOwner}
      />
    );
  }

  return (
    <div
      className={`min-h-screen pb-24 ${getThemeWrapperClass()}`}
      style={{ backgroundColor: themeConfig.backgroundColor }}
    >
      {/* ===================================================== */}
      {/* OWNER PREVIEW STICKY BANNER */}
      {/* ===================================================== */}
      {isOwner && onBackToDashboard && (
        <div className="bg-slate-950 text-white px-4 py-2.5 sticky top-0 z-50 border-b border-slate-800 flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Live Portfolio Website</span>
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
      {/* MODERN STICKY WEBSITE HEADER NAVIGATION */}
      {/* ===================================================== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3.5 xs:px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => scrollToSection('hero')}
            role="button"
            tabIndex={0}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 min-h-[44px] touch-manipulation"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
              {business.logo || business.profileImage ? (
                <img
                  src={business.logo || business.profileImage}
                  alt={business.name}
                  className="w-full h-full object-cover high-dpi-crisp"
                />
              ) : (
                <div
                  className="w-full h-full text-white flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  {business.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs xs:text-sm font-black tracking-tight font-heading group-hover:text-indigo-600 transition-colors truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                  {business.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Available for Work" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold opacity-60 truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px]">
                {professionTitle}
              </span>
            </div>
          </div>

          {/* Desktop Dynamic Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold opacity-80">
            {activeBlocks.map((blk) => {
              const targetId = blk.type === 'works' ? 'projects' : blk.type;
              const isBlockActive = activeSection === targetId;
              let label = blk.title;
              if (blk.type === 'hero') return null; // Hero reached via brand logo
              if (blk.type === 'works') label = 'Works';
              if (blk.type === 'about') label = 'About';
              if (blk.type === 'skills') label = 'Skills';
              if (blk.type === 'services') label = 'Services';
              if (blk.type === 'testimonials') label = 'Reviews';
              if (blk.type === 'mediakit') label = 'Media Kit';
              if (blk.type === 'contact') label = 'Contact';

              return (
                <button
                  key={blk.id}
                  type="button"
                  onClick={() => scrollToSection(targetId)}
                  className={`px-3.5 py-2.5 min-h-[44px] rounded-lg transition cursor-pointer hover:opacity-100 touch-manipulation ${
                    isBlockActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-black'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Quick Header Actions (WCAG compliant touch targets >= 44x44px) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer touch-manipulation"
              title="Share Portfolio"
              aria-label="Share Portfolio"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="px-3.5 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-white font-black text-xs sm:text-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 touch-manipulation"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================== */}
      {/* MAIN CONTAINER (MODULAR ALL-IN-ONE WEBSITE FLOW) */}
      {/* ===================================================== */}
      <main className={`max-w-6xl mx-auto px-3.5 xs:px-4 sm:px-6 md:px-8 lg:px-10 pt-4 sm:pt-6 md:pt-8 pb-16 sm:pb-20 space-y-8 sm:space-y-12 md:space-y-16 bio-viewport-container ${
        templateId === 'minimalist_studio' ? 'max-w-4xl space-y-16' : ''
      }`}>
        {activeBlocks.map((block) => {
          // ----------------------------------------------------
          // 1. HERO BLOCK
          // ----------------------------------------------------
          if (block.type === 'hero') {
            return (
              <section
                key={block.id}
                id="hero"
                className={`p-4 xs:p-6 sm:p-8 md:p-10 border shadow-xs space-y-5 sm:space-y-6 portfolio-hero-container ${getCardRadiusClass()} ${getCardClass()} ${
                  templateId === 'bento_grid' ? 'rounded-3xl border-2' : ''
                } ${templateId === 'dark_luxury' ? 'bg-slate-900/90 border-slate-800 shadow-2xl' : ''}`}
              >
                {/* Top Profile Info Row */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 xs:gap-6 sm:gap-8 text-center sm:text-left">
                  {/* Circular Profile Avatar */}
                  <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                    {business.logo || business.profileImage ? (
                      <img
                        src={business.logo || business.profileImage}
                        alt={business.name}
                        className="w-full h-full object-cover high-dpi-crisp"
                      />
                    ) : (
                      <div
                        className="w-full h-full text-white flex items-center justify-center font-black text-2xl xs:text-3xl font-heading shadow-inner"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        {business.name.charAt(0)}
                      </div>
                    )}
                    {/* Online indicator */}
                    <div
                      className="absolute bottom-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
                      title="Available for Projects"
                    />
                  </div>

                  {/* Creator Text Info */}
                  <div className="space-y-2 xs:space-y-2.5 flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight leading-tight bio-title-fluid">
                        {business.name}
                      </h1>
                      {/* Verified Blue Tick */}
                      <div
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-xs"
                        title="Verified Creator"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Profession & Location */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold opacity-90 flex-wrap">
                      <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {professionTitle}
                      </span>
                      {locationText && (
                        <span className="flex items-center gap-1 opacity-75">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>{locationText}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Available for Hire</span>
                      </span>
                    </div>

                    {/* Specializations Pills / Bullets */}
                    {specializations.length > 0 && (
                      <p className="text-xs sm:text-sm opacity-80 font-medium leading-relaxed">
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

                {/* 3 High Impact Action Buttons (WCAG compliant touch targets >= 48px height) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                  {/* Button 1 (WhatsApp Direct) */}
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="py-3.5 px-4 min-h-[48px] rounded-xl text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                    style={{
                      backgroundColor:
                        professionKey === 'youtuber' ? '#dc2626' : '#25D366',
                    }}
                  >
                    {professionKey === 'youtuber' ? (
                      <Youtube className="w-4 h-4 fill-current" />
                    ) : (
                      <MessageCircle className="w-4 h-4 fill-current" />
                    )}
                    <span>{primaryBtnLabel}</span>
                  </button>

                  {/* Button 2 (Hire Me / Inquire) */}
                  <button
                    type="button"
                    onClick={handleSecondaryCta}
                    className="py-3.5 px-4 min-h-[48px] rounded-xl text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>{secondaryBtnLabel}</span>
                  </button>

                  {/* Button 3 (View Packages / Retainers) */}
                  <button
                    type="button"
                    onClick={handleTertiaryCta}
                    className="py-3.5 px-4 min-h-[48px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{tertiaryBtnLabel}</span>
                  </button>
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 2. WORKS / CASE STUDIES BLOCK
          // ----------------------------------------------------
          if (block.type === 'works') {
            return (
              <section key={block.id} id="projects" className="space-y-6 scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      />
                      <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                        {block.title || 'Featured Portfolio'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black font-heading tracking-tight">
                      Projects, Works & Case Studies
                    </h2>
                    <p className="text-xs sm:text-sm opacity-75">
                      {block.subtitle || 'Explore recent client deliverables, technical systems, and creative solutions.'}
                    </p>
                  </div>

                  {/* Category Filter Pills (WCAG compliant touch targets >= 44x44px) */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      style={
                        selectedCategory === 'all'
                          ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' }
                          : undefined
                      }
                      className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs sm:text-sm font-bold inline-flex items-center justify-center transition shrink-0 cursor-pointer touch-manipulation ${
                        selectedCategory === 'all'
                          ? 'shadow-md text-white'
                          : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      All ({effectiveItems.length})
                    </button>

                    {allAvailableCategories.map((cat) => {
                      const count = effectiveItems.filter(
                        (i) => i.category.toLowerCase() === cat.toLowerCase()
                      ).length;
                      const isCatActive = selectedCategory.toLowerCase() === cat.toLowerCase();
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
                          className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs sm:text-sm font-bold inline-flex items-center justify-center transition shrink-0 cursor-pointer touch-manipulation ${
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
                </div>

                {/* Grid Showcase of Projects: Refactored with CSS Grid auto-fit and minmax */}
                <div
                  className={`grid gap-4 sm:gap-6 ${
                    layoutMode === 'feed'
                      ? 'grid-cols-1 max-w-2xl mx-auto'
                      : 'grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]'
                  } portfolio-grid-adaptive`}
                  style={layoutMode !== 'feed' ? {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                    gap: 'clamp(1rem, 2vw, 1.5rem)',
                  } : undefined}
                >
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenItem(item)}
                      className={`group border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer flex flex-col justify-between ${getCardRadiusClass()} ${getCardClass()}`}
                    >
                      {/* Media Cover Image */}
                      <div className="relative aspect-video sm:aspect-4/3 w-full bg-slate-950 overflow-hidden">
                        <SafeImage
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
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
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] font-semibold opacity-60">
                            {item.clientName && <span>Client: {item.clientName}</span>}
                            {item.clientName && (item.projectYear || item.year) && <span>•</span>}
                            {(item.projectYear || item.year) && <span>{item.projectYear || item.year}</span>}
                            {item.role && <span>• {item.role}</span>}
                          </div>

                          <h3 className="text-base font-black font-heading tracking-tight leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {item.title}
                          </h3>

                          <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.tags.slice(0, 4).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Outcome badge & action row */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {item.projectOutcome && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                              <Award className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.projectOutcome}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                            <span className="font-bold text-[11px] opacity-60">
                              {item.clientName || 'Showcase Project'}
                            </span>
                            <span
                              className="font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                              style={{ color: themeConfig.primaryColor }}
                            >
                              <span>View Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 3. ABOUT STORY BLOCK
          // ----------------------------------------------------
          if (block.type === 'about') {
            return (
              <section key={block.id} id="about" className="space-y-6 scroll-mt-20">
                <div className={`p-4 xs:p-6 sm:p-8 md:p-10 border shadow-xs space-y-6 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <div className="space-y-1">
                    <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                      {block.title || 'About the Creator'}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black font-heading">
                      Story, Background & Philosophy
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm opacity-85 leading-relaxed whitespace-pre-line max-w-3xl">
                    {aboutStory}
                  </p>

                  {/* Key Milestones Performance Strip (CSS Grid auto-fit / minmax) */}
                  <div
                    className="grid gap-2.5 xs:gap-3 sm:gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 [grid-template-columns:repeat(auto-fit,minmax(min(100%,130px),1fr))]"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
                      gap: 'clamp(0.625rem, 1.5vw, 1rem)',
                    }}
                  >
                    <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <div className="text-xl sm:text-2xl font-black font-heading">{experienceYears}</div>
                      <div className="text-xs font-bold opacity-70">Experience</div>
                    </div>
                    <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <div className="text-xl sm:text-2xl font-black font-heading">
                        {effectiveItems.length > 0 ? `${effectiveItems.length}+` : '50+'}
                      </div>
                      <div className="text-xs font-bold opacity-70">Projects Shipped</div>
                    </div>
                    <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <div className="text-xl sm:text-2xl font-black font-heading">99%</div>
                      <div className="text-xs font-bold opacity-70">Client Satisfaction</div>
                    </div>
                    <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <div className="text-xl sm:text-2xl font-black font-heading">5.0 ★</div>
                      <div className="text-xs font-bold opacity-70">Average Rating</div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 4. SKILLS & TOOLS BLOCK
          // ----------------------------------------------------
          if (block.type === 'skills') {
            return (
              <section key={block.id} id="skills" className="space-y-6 scroll-mt-20">
                <div className={`p-4 xs:p-6 sm:p-8 md:p-10 border shadow-xs space-y-6 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <div className="space-y-1">
                    <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                      {block.title || 'Technical & Creative Skills'}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black font-heading">
                      Specializations & Technology Stack
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {skillsList.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-black font-heading flex items-center gap-2">
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
                      <div className="space-y-3">
                        <h3 className="text-sm font-black font-heading flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span>Tools & Technology Stack</span>
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
              </section>
            );
          }

          // ----------------------------------------------------
          // 5. SERVICES & PRICING PACKAGES BLOCK
          // ----------------------------------------------------
          if (block.type === 'services') {
            return (
              <section key={block.id} id="services" className="space-y-6 scroll-mt-20">
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                    {block.title || 'Services & Offerings'}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black font-heading">
                    Packages, Retainers & Pricing
                  </h2>
                  <p className="text-xs sm:text-sm opacity-75">
                    {block.subtitle || 'Transparent pricing with verified deliverables and rapid turnaround timelines.'}
                  </p>
                </div>

                {/* Refactored Services Grid with auto-fit and minmax */}
                <div
                  className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))] portfolio-grid-adaptive"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 'clamp(1rem, 2vw, 1.5rem)',
                  }}
                >
                  {servicesList.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-5 xs:p-6 sm:p-7 border shadow-xs flex flex-col justify-between space-y-6 relative ${getCardRadiusClass()} ${getCardClass()} ${
                        pkg.popular ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                      }`}
                    >
                      {pkg.badge && (
                        <div className="absolute -top-3 right-5">
                          <span
                            className="px-3 py-1 rounded-full text-[10px] font-black text-white shadow-xs uppercase tracking-wider"
                            style={{ backgroundColor: themeConfig.primaryColor }}
                          >
                            {pkg.badge}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3.5">
                        <h3 className="text-lg font-black font-heading">{pkg.title}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black font-heading">
                            {pkg.price}
                          </span>
                          {pkg.duration && (
                            <span className="text-xs opacity-60 font-medium">/ {pkg.duration}</span>
                          )}
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed">{pkg.description}</p>

                        {/* Deliverables Checklist */}
                        {pkg.deliverables && pkg.deliverables.length > 0 && (
                          <div className="space-y-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold opacity-60 uppercase tracking-wider">
                              What's Included:
                            </span>
                            <ul className="space-y-2 text-xs">
                              {pkg.deliverables.map((deliv, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="opacity-90">{deliv}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDirectWhatsApp(
                            `Hi ${business.name}, I am interested in booking your "${pkg.title}" package (${pkg.price}). Can we discuss scope and schedule?`
                          )
                        }
                        className="w-full py-3.5 px-4 min-h-[48px] rounded-xl text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Book on WhatsApp</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 6. TESTIMONIALS & REVIEWS BLOCK
          // ----------------------------------------------------
          if (block.type === 'testimonials') {
            return (
              <section key={block.id} id="reviews" className="space-y-6 scroll-mt-20">
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                    {block.title || 'Social Proof'}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black font-heading">
                    Verified Client Reviews
                  </h2>
                </div>

                {/* Refactored Testimonials Grid with auto-fit and minmax */}
                <div
                  className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))] portfolio-grid-adaptive"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                    gap: 'clamp(1rem, 2vw, 1.5rem)',
                  }}
                >
                  {effectiveTestimonials.map((t) => (
                    <div
                      key={t.id}
                      className={`p-5 xs:p-6 sm:p-7 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}
                    >
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= (t.rating || 5) ? 'fill-current' : 'opacity-30'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm italic opacity-85 leading-relaxed">
                        "{t.quote}"
                      </p>
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {t.clientPhoto ? (
                          <img
                            src={t.clientPhoto}
                            alt={t.clientName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 font-black flex items-center justify-center text-xs shrink-0">
                            {t.clientName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold">{t.clientName}</div>
                          {t.clientRole && (
                            <div className="text-[11px] opacity-60">{t.clientRole}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 7. MEDIA KIT & STATS / BRAND COLLABS BLOCK
          // ----------------------------------------------------
          if (block.type === 'mediakit') {
            const hasStats = platformStats && platformStats.length > 0;
            const hasCollabs = brandCollabs && brandCollabs.length > 0;

            return (
              <section key={block.id} id="mediakit" className="space-y-6 scroll-mt-20">
                <div className={`p-4 xs:p-6 sm:p-8 md:p-10 border shadow-xs space-y-8 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                      {block.title || 'Audience & Partnerships'}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black font-heading">
                      Media Kit & Brand Reach
                    </h2>
                    <p className="text-xs sm:text-sm opacity-75">
                      {block.subtitle || 'Verified social footprint, audience demographics and brand collaborations.'}
                    </p>
                  </div>

                  {/* Platform Stats Grid with auto-fit and minmax */}
                  {hasStats ? (
                    <div
                      className="grid gap-2.5 xs:gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,130px),1fr))]"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
                        gap: 'clamp(0.625rem, 1.5vw, 1rem)',
                      }}
                    >
                      {platformStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1"
                        >
                          <div className="text-lg sm:text-2xl font-black font-heading text-indigo-600 dark:text-indigo-400">
                            {stat.count || stat.label || '0'}
                          </div>
                          <div className="text-xs font-bold opacity-80">{stat.platform}</div>
                          {stat.engagementRate && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {stat.engagementRate} Engagement
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="grid gap-2.5 xs:gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,130px),1fr))]"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
                        gap: 'clamp(0.625rem, 1.5vw, 1rem)',
                      }}
                    >
                      <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                        <div className="text-lg sm:text-2xl font-black font-heading text-pink-600">50K+</div>
                        <div className="text-xs font-bold opacity-80">Instagram</div>
                      </div>
                      <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                        <div className="text-lg sm:text-2xl font-black font-heading text-red-600">100K+</div>
                        <div className="text-xs font-bold opacity-80">YouTube</div>
                      </div>
                      <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                        <div className="text-lg sm:text-2xl font-black font-heading text-blue-600">25K+</div>
                        <div className="text-xs font-bold opacity-80">LinkedIn</div>
                      </div>
                      <div className="p-3.5 xs:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
                        <div className="text-lg sm:text-2xl font-black font-heading text-emerald-600">4.8%</div>
                        <div className="text-xs font-bold opacity-80">Avg. Engagement</div>
                      </div>
                    </div>
                  )}

                  {/* Brand Collaborations */}
                  {hasCollabs && (
                    <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <h3 className="text-xs font-bold opacity-60 uppercase tracking-wider">
                        Trusted by Leading Brands
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        {brandCollabs.map((collab) => (
                          <div
                            key={collab.id}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2"
                          >
                            {collab.logoUrl && (
                              <img src={collab.logoUrl} alt={collab.brandName} className="w-4 h-4 object-contain" />
                            )}
                            <span>{collab.brandName}</span>
                            {collab.description && (
                              <span className="text-[10px] opacity-60 font-normal">({collab.description})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 8. CONTACT & INQUIRY BLOCK
          // ----------------------------------------------------
          if (block.type === 'contact') {
            return (
              <section key={block.id} id="contact" className="space-y-6 scroll-mt-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Direct Info Card */}
                  <div
                    className={`p-4 xs:p-6 sm:p-8 border shadow-xs space-y-6 ${getCardRadiusClass()} ${getCardClass()}`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                        {block.title || 'Get in Touch'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black font-heading">
                        Direct Contact Details
                      </h2>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <div className="font-bold">WhatsApp Direct</div>
                          <div className="opacity-70">
                            {business.whatsapp || business.phone || 'Available for Chat'}
                          </div>
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

                    {/* Social Profiles Grid with WCAG 44px touch targets */}
                    {social && Object.values(social).some(Boolean) && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="text-xs font-bold opacity-60">Connect on Social</div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {social.instagram && (
                            <a
                              href={
                                social.instagram.startsWith('http')
                                  ? social.instagram
                                  : `https://instagram.com/${social.instagram.replace('@', '')}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 border border-pink-200 dark:border-pink-900 transition hover:scale-105 touch-manipulation active:scale-95"
                              title="Instagram"
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {social.youtube && (
                            <a
                              href={
                                social.youtube.startsWith('http')
                                  ? social.youtube
                                  : `https://${social.youtube}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900 transition hover:scale-105 touch-manipulation active:scale-95"
                              title="YouTube"
                            >
                              <Youtube className="w-4 h-4" />
                            </a>
                          )}
                          {social.twitter && (
                            <a
                              href={
                                social.twitter.startsWith('http')
                                  ? social.twitter
                                  : `https://twitter.com/${social.twitter.replace('@', '')}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-500 border border-sky-200 dark:border-sky-900 transition hover:scale-105 touch-manipulation active:scale-95"
                              title="Twitter / X"
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                          {social.linkedin && (
                            <a
                              href={
                                social.linkedin.startsWith('http')
                                  ? social.linkedin
                                  : `https://${social.linkedin}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-200 dark:border-blue-900 transition hover:scale-105 touch-manipulation active:scale-95"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                          {social.github && (
                            <a
                              href={
                                social.github.startsWith('http')
                                  ? social.github
                                  : `https://${social.github}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition hover:scale-105 touch-manipulation active:scale-95"
                              title="GitHub"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {social.website && (
                            <a
                              href={
                                social.website.startsWith('http')
                                  ? social.website
                                  : `https://${social.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition hover:scale-105 touch-manipulation active:scale-95"
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
                  <div
                    className={`p-4 xs:p-6 sm:p-8 border shadow-xs space-y-5 ${getCardRadiusClass()} ${getCardClass()}`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                        Quick Inquiry
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black font-heading">Send a Message</h2>
                    </div>

                    {contactSent ? (
                      <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                        <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          Message Prepared!
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Opening WhatsApp to connect with {business.name}.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSendContactMessage} className="space-y-3.5 text-xs sm:text-sm">
                        <div>
                          <label className="block font-bold opacity-80 mb-1">Your Name</label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full px-3.5 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold opacity-80 mb-1">
                            Phone / WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full px-3.5 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold opacity-80 mb-1">
                            Project Requirements / Brief
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Describe your project goals, timelines, or specific deliverables..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 px-4 min-h-[48px] rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] touch-manipulation"
                          style={{ backgroundColor: themeConfig.primaryColor }}
                        >
                          <Send className="w-4 h-4" />
                          <span>Send Message on WhatsApp</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          // ----------------------------------------------------
          // 9. CUSTOM / RICH CONTENT BLOCK
          // ----------------------------------------------------
          if (
            block.type === 'custom' ||
            block.type === 'custom_rich' ||
            block.type === 'custom_rich_text' ||
            block.type === 'custom_cta'
          ) {
            const bodyContent = block.content || block.customContent?.bodyText || '';
            const ctaUrl = block.customContent?.buttonUrl;
            const ctaText = block.customContent?.buttonText;
            const highlightBadge = block.customContent?.badge;
            const imageUrl = block.customContent?.imageUrl;

            return (
              <section key={block.id} className="space-y-4">
                <div className={`p-4 xs:p-6 sm:p-10 border shadow-xs space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}>
                  <div className="space-y-1">
                    {highlightBadge && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 mb-1">
                        {highlightBadge}
                      </span>
                    )}
                    <span className="block text-xs font-bold opacity-60 uppercase tracking-wider">
                      {block.title}
                    </span>
                    {block.subtitle && (
                      <h2 className="text-xl sm:text-2xl font-black font-heading">
                        {block.subtitle}
                      </h2>
                    )}
                  </div>

                  {imageUrl && (
                    <div className="rounded-xl overflow-hidden max-h-72 w-full">
                      <img src={imageUrl} alt={block.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {bodyContent && (
                    <div className="text-xs sm:text-sm opacity-85 leading-relaxed whitespace-pre-line">
                      {bodyContent}
                    </div>
                  )}

                  {ctaUrl && ctaText && (
                    <div className="pt-2">
                      <a
                        href={ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-xl text-white font-bold text-xs sm:text-sm shadow-xs transition hover:opacity-90 active:scale-[0.99] touch-manipulation"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        <span>{ctaText}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          return null;
        })}

        {/* ===================================================== */}
        {/* BOTTOM READY TO WORK TOGETHER CONVERSION FOOTER */}
        {/* ===================================================== */}
        <section
          className={`p-6 sm:p-10 border shadow-xs text-center space-y-4 ${getCardRadiusClass()} ${getCardClass()}`}
        >
          <h3 className="text-xl sm:text-2xl font-black font-heading">
            Ready to Work Together?
          </h3>
          <p className="text-xs sm:text-sm opacity-75 max-w-md mx-auto">
            Have a project, consulting requirement, or collaboration in mind? Let's discuss dates and requirements!
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="px-6 py-3.5 min-h-[48px] rounded-xl text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Chat on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-3.5 min-h-[48px] rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.99] touch-manipulation"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Portfolio</span>
            </button>
          </div>
        </section>

        {/* FOOTER BRANDING */}
        <footer className="text-center pt-2 pb-6 space-y-1">
          <p className="text-xs opacity-60 font-medium">
            Powered by <span className="font-bold text-indigo-600 dark:text-indigo-400">Storelly</span> • One Link. Every Portfolio.
          </p>
        </footer>
      </main>

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

export default StandalonePortfolioView;
