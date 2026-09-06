import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Briefcase,
  Star,
  MapPin,
  Check,
  Eye,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Play,
  RotateCcw,
  Share2,
  Mail,
  Phone,
  Camera,
  PenTool,
  Code2,
  Youtube,
  Feather,
  HeartHandshake,
  Brush,
  PartyPopper,
  Smile,
} from 'lucide-react';
import {
  BusinessProfile,
  PortfolioItem,
  Testimonial,
  PortfolioSettings,
  PortfolioServicePackage,
  PortfolioThemeConfig,
  PortfolioThemeColor,
  PortfolioLayoutMode,
  PortfolioProfession,
} from '../../types';
import { SafeImage } from '../common/SafeImage';
import { PORTFOLIO_PRESETS, getStarterPortfolioItems } from '../../data/portfolioPresets';
import {
  getBorderRadiusClass,
  getCardStyleClasses,
  getFontFamilyClass,
} from '../../utils/portfolioTheme';

interface PortfolioLiveMockupProps {
  business: BusinessProfile;
  items: PortfolioItem[];
  testimonials: Testimonial[];
  settings: PortfolioSettings;
  services: PortfolioServicePackage[];
  themeConfig: PortfolioThemeConfig;
  themeColor: PortfolioThemeColor;
  layoutMode: PortfolioLayoutMode;
  onOpenItem?: (item: PortfolioItem) => void;
  deviceMode?: 'mobile' | 'desktop';
  onDeviceModeChange?: (mode: 'mobile' | 'desktop') => void;
  onRefresh?: () => void;
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

export const PortfolioLiveMockup: React.FC<PortfolioLiveMockupProps> = ({
  business,
  items,
  testimonials,
  settings,
  services,
  themeConfig,
  themeColor,
  layoutMode,
  onOpenItem,
  deviceMode = 'mobile',
  onDeviceModeChange,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewSection, setActivePreviewSection] = useState<'works' | 'about' | 'services' | 'reviews'>('works');

  const professionKey = settings.profession || 'custom';
  const preset = PORTFOLIO_PRESETS[professionKey] || PORTFOLIO_PRESETS.custom;

  const isDark = themeConfig.colorMode === 'dark';

  // Guaranteed showcase items
  const effectiveItems: PortfolioItem[] =
    items.length > 0
      ? items.filter((i) => i.isActive !== false)
      : getStarterPortfolioItems(professionKey, business.name, business.id);

  // Categories
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

  const effectiveServices: PortfolioServicePackage[] =
    services.length > 0 ? services : preset.suggestedServices || [];

  const effectiveTestimonials: Testimonial[] =
    testimonials.length > 0
      ? testimonials.filter((t) => t.isActive !== false)
      : [
          {
            id: 'sample_1',
            businessId: business.id,
            clientName: 'Rohit Sharma',
            clientRole: 'Founder, TechScale',
            quote: 'Outstanding work quality and delivered ahead of schedule!',
            rating: 5,
            order: 1,
            isActive: true,
            createdAt: Date.now(),
          },
          {
            id: 'sample_2',
            businessId: business.id,
            clientName: 'Anjali Verma',
            clientRole: 'Creative Director',
            quote: 'A true professional. Highly recommended for top tier projects!',
            rating: 5,
            order: 2,
            isActive: true,
            createdAt: Date.now(),
          },
        ];

  // Theme Wrapper Class
  const getThemeWrapperClass = () => {
    const fontClass = getFontFamilyClass(themeConfig.fontFamily);
    switch (themeColor) {
      case 'dark':
        return `bg-slate-950 text-slate-100 ${fontClass}`;
      case 'minimal':
        return `bg-[#F9F9F8] text-[#1A1A1A] ${fontClass}`;
      case 'photo':
        return `bg-white text-slate-900 ${fontClass}`;
      case 'rose':
        return `bg-[#FFF7F7] text-rose-950 ${fontClass}`;
      case 'indigo':
        return `bg-[#F5F3FF] text-slate-900 ${fontClass}`;
      case 'emerald':
        return `bg-[#F0FDF4] text-emerald-950 ${fontClass}`;
      case 'amber':
        return `bg-[#FFFBEB] text-amber-950 ${fontClass}`;
      default:
        return `bg-slate-50 text-slate-900 ${fontClass}`;
    }
  };

  const getCardClass = () => getCardStyleClasses(themeConfig.cardStyle, isDark);
  const getCardRadiusClass = () => getBorderRadiusClass(themeConfig.borderRadius);

  const handleOpenLiveUrl = () => {
    const path = `/portfolio/${business.slug || business.id}`;
    window.open(path, '_blank');
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Interactive Preview</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Auto-Synced
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Device Switcher */}
          {onDeviceModeChange && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onDeviceModeChange('mobile')}
                className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Mobile Phone Preview"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => onDeviceModeChange('desktop')}
                className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer ${
                  deviceMode === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Desktop / Wide Preview"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Desktop</span>
              </button>
            </div>
          )}

          {/* Open in new tab */}
          <button
            type="button"
            onClick={handleOpenLiveUrl}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:border-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Open Live Portfolio Website in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Open Site</span>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SMARTPHONE CASING (MOBILE MODE) */}
      {/* ===================================================== */}
      {deviceMode === 'mobile' ? (
        <div className="w-full max-w-[380px] border-[9px] border-slate-900 dark:border-slate-800 rounded-[2.8rem] overflow-hidden bg-slate-900 shadow-2xl relative h-[720px] ring-4 ring-slate-900/10 flex flex-col transition-all">
          {/* Phone Status Bar + Dynamic Island */}
          <div className="h-10 bg-slate-950/80 text-white flex items-center justify-between px-6 text-[11px] font-bold shrink-0 relative z-40">
            <span>9:41</span>
            {/* Center Dynamic Island */}
            <div className="w-24 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2 shadow-inner" />
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <span className="text-[10px]">5G</span>
              <div className="w-5 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Phone Mini Sticky Header */}
          <div className="px-3.5 py-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                {business.logo || business.profileImage ? (
                  <img src={business.logo || business.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full text-white flex items-center justify-center font-bold text-[10px]"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    {business.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="font-black text-xs truncate font-heading">{business.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                WhatsApp
              </span>
            </div>
          </div>

          {/* Phone Inner Scroll Canvas */}
          <div
            className={`w-full flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4 text-left transition-all ${getThemeWrapperClass()}`}
            style={{ backgroundColor: themeConfig.backgroundColor }}
          >
            {/* HERO SECTION */}
            <div className={`p-4 border space-y-3.5 shadow-2xs ${getCardRadiusClass()} ${getCardClass()}`}>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-100 shrink-0">
                  {business.logo || business.profileImage ? (
                    <img src={business.logo || business.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full text-white flex items-center justify-center font-black text-xl"
                      style={{ backgroundColor: themeConfig.primaryColor }}
                    >
                      {business.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h2 className="font-black text-sm tracking-tight truncate font-heading">{business.name}</h2>
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold opacity-75">{professionTitle}</p>
                  <p className="text-[10px] opacity-60 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-red-500" />
                    <span>{locationText}</span>
                  </p>
                </div>
              </div>

              {sloganText && (
                <p className="text-[10px] italic font-serif opacity-80 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  "{sloganText}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  className="py-2 px-2.5 rounded-lg text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-3 h-3 fill-current" />
                  <span>{primaryBtnLabel}</span>
                </button>
                <button
                  type="button"
                  className="py-2 px-2.5 rounded-lg text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  <Briefcase className="w-3 h-3" />
                  <span>{secondaryBtnLabel}</span>
                </button>
              </div>
            </div>

            {/* QUICK PREVIEW TABS */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {(['works', 'about', 'services', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePreviewSection(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition shrink-0 cursor-pointer ${
                    activePreviewSection === tab
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab === 'works' ? 'Featured Works' : tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: WORKS */}
            {activePreviewSection === 'works' && (
              <div className="space-y-3">
                {/* Category Pills */}
                {allAvailableCategories.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition shrink-0 ${
                        selectedCategory === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 opacity-80'
                      }`}
                    >
                      All ({effectiveItems.length})
                    </button>
                    {allAvailableCategories.slice(0, 4).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition shrink-0 ${
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 opacity-80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Project cards */}
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredItems.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenItem && onOpenItem(item)}
                      className={`group border overflow-hidden transition hover:shadow-md cursor-pointer ${getCardRadiusClass()} ${getCardClass()}`}
                    >
                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                        <SafeImage
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 text-white">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 space-y-1">
                        <h4 className="font-bold text-xs line-clamp-1 group-hover:text-indigo-600 font-heading">
                          {item.title}
                        </h4>
                        <p className="text-[10px] opacity-70 line-clamp-2">{item.description}</p>
                        {item.projectOutcome && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                            <Award className="w-2.5 h-2.5" />
                            <span className="truncate">{item.projectOutcome}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ABOUT */}
            {activePreviewSection === 'about' && (
              <div className={`p-3.5 border space-y-3 ${getCardRadiusClass()} ${getCardClass()}`}>
                <h3 className="font-bold text-xs font-heading">Story & Philosophy</h3>
                <p className="text-[10px] opacity-80 leading-relaxed whitespace-pre-line">{aboutStory}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <div className="font-black text-xs">{experienceYears}</div>
                    <div className="text-[9px] opacity-60">Experience</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <div className="font-black text-xs">{effectiveItems.length}+</div>
                    <div className="text-[9px] opacity-60">Projects</div>
                  </div>
                </div>

                {skillsList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold opacity-75">Skills & Tools:</div>
                    <div className="flex flex-wrap gap-1">
                      {skillsList.slice(0, 6).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SERVICES */}
            {activePreviewSection === 'services' && (
              <div className="space-y-2.5">
                {effectiveServices.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-3 border space-y-2 relative ${getCardRadiusClass()} ${getCardClass()} ${
                      pkg.popular ? 'ring-1 ring-indigo-500' : ''
                    }`}
                  >
                    {pkg.badge && (
                      <span
                        className="px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        {pkg.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs font-heading">{pkg.title}</h4>
                      <span className="font-black text-xs font-heading">{pkg.price}</span>
                    </div>
                    <p className="text-[10px] opacity-75 leading-relaxed">{pkg.description}</p>
                    <button
                      type="button"
                      className="w-full py-1.5 rounded-lg text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs"
                      style={{ backgroundColor: themeConfig.primaryColor }}
                    >
                      <MessageCircle className="w-3 h-3 fill-current" />
                      <span>Book on WhatsApp</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: REVIEWS */}
            {activePreviewSection === 'reviews' && (
              <div className="space-y-2.5">
                {effectiveTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 border space-y-1.5 ${getCardRadiusClass()} ${getCardClass()}`}
                  >
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 ${s <= (t.rating || 5) ? 'fill-current' : 'opacity-25'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] italic opacity-85 leading-relaxed">"{t.quote}"</p>
                    <div className="text-[10px] font-bold pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>{t.clientName}</span>
                      <span className="text-[9px] opacity-60">{t.clientRole}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Watermark */}
            <div className="pt-2 text-center text-[9px] opacity-50 font-bold">
              Powered by Storelly Creator Suite
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================== */
        /* DESKTOP / TABLET CANVAS PREVIEW */
        /* ===================================================== */
        <div className="w-full border-4 border-slate-800 rounded-3xl overflow-hidden bg-slate-900 shadow-2xl relative h-[720px] flex flex-col transition-all">
          {/* Browser Window Bar */}
          <div className="h-9 bg-slate-950 text-slate-400 flex items-center justify-between px-4 text-xs font-mono shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="px-4 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 truncate max-w-xs">
              https://storelly.com/portfolio/{business.slug || business.id}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold font-sans">Live Preview</span>
            </div>
          </div>

          {/* Desktop Canvas Scroll Area */}
          <div
            className={`w-full flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 text-left transition-all ${getThemeWrapperClass()}`}
            style={{ backgroundColor: themeConfig.backgroundColor }}
          >
            {/* Desktop Hero */}
            <div className={`p-6 border space-y-4 shadow-xs ${getCardRadiusClass()} ${getCardClass()}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-100 shrink-0">
                    {business.logo || business.profileImage ? (
                      <img src={business.logo || business.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full text-white flex items-center justify-center font-black text-2xl"
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      >
                        {business.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-xl font-heading">{business.name}</h2>
                      <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold opacity-80 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {professionTitle}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span>{locationText}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="py-2 px-3.5 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-xs"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>{primaryBtnLabel}</span>
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3.5 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-xs"
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{secondaryBtnLabel}</span>
                  </button>
                </div>
              </div>

              {sloganText && <p className="text-xs italic font-serif opacity-80">"{sloganText}"</p>}
            </div>

            {/* Works Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="font-black text-base font-heading">Featured Works & Case Studies</h3>
                <div className="flex items-center gap-1 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold">
                    All ({effectiveItems.length})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onOpenItem && onOpenItem(item)}
                    className={`group border overflow-hidden transition hover:shadow-lg cursor-pointer flex flex-col justify-between ${getCardRadiusClass()} ${getCardClass()}`}
                  >
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                      <SafeImage
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="font-bold text-xs font-heading group-hover:text-indigo-600 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] opacity-75 line-clamp-2">{item.description}</p>
                      {item.projectOutcome && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                          <Award className="w-3 h-3" />
                          <span className="truncate">{item.projectOutcome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Packages */}
            {effectiveServices.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-black text-base font-heading">Packages & Offerings</h3>
                <div className="grid grid-cols-2 gap-3">
                  {effectiveServices.slice(0, 2).map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 border space-y-2 ${getCardRadiusClass()} ${getCardClass()}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs font-heading">{pkg.title}</h4>
                        <span className="font-black text-xs font-heading">{pkg.price}</span>
                      </div>
                      <p className="text-[10px] opacity-75">{pkg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
