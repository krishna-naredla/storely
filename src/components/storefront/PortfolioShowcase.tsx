import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Layers,
  Film,
  Play,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
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
  Globe,
  Share2,
  Check,
  Maximize2,
  Tag,
  Clock,
  User,
  ArrowRight,
} from 'lucide-react';
import {
  BusinessProfile,
  PortfolioItem,
  PortfolioCategory,
  Testimonial,
  PlatformStat,
  BrandCollab,
  CatalogItem,
} from '../../types';
import {
  getPortfolioItems,
  recordAnalyticsEvent,
  getTestimonials,
} from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';
import { PortfolioProjectPageView } from '../portfolio/PortfolioProjectPageView';
import { PortfolioShareModal } from '../portfolio/PortfolioShareModal';
import { PORTFOLIO_PRESETS } from '../../data/portfolioPresets';
import {
  getEffectivePortfolioTheme,
  getCardStyleClasses,
  getFontFamilyClass,
  getBorderRadiusClass,
} from '../../utils/portfolioTheme';

interface PortfolioShowcaseProps {
  items?: PortfolioItem[];
  testimonials?: Testimonial[];
  business: BusinessProfile;
  onBookConsultation?: (item?: CatalogItem) => void;
}

const CATEGORIES: PortfolioCategory[] = [
  'Photography',
  'Video/Motion',
  'Design',
  'Development',
  'Writing',
  'Coaching',
  'Events',
  'Beauty',
  'Handmade/Art',
  'Other',
];

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({
  business,
  items: passedItems,
  testimonials: passedTestimonials,
  onBookConsultation,
}) => {
  const [items, setItems] = useState<PortfolioItem[]>(passedItems || []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(passedTestimonials || []);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (passedItems) setItems(passedItems);
    if (passedTestimonials) setTestimonials(passedTestimonials);
  }, [passedItems, passedTestimonials]);

  // Open Item Detail / Lightbox
  const handleOpenItem = (item: PortfolioItem) => {
    setSelectedItem(item);
    setActiveGalleryIndex(0);
  };

  // Close Lightbox
  const handleCloseItem = () => {
    setSelectedItem(null);
    setActiveGalleryIndex(0);
  };

  // Convert YouTube or Vimeo URLs to Embed URLs
  const getEmbedVideoUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}?autoplay=1&rel=0` : null;
      }
      if (url.includes('youtu.be/')) {
        const afterDomain = url.split('youtu.be/')[1];
        const id = afterDomain ? afterDomain.split('?')[0] : null;
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
      }
      if (url.includes('vimeo.com/')) {
        const afterDomain = url.split('vimeo.com/')[1];
        const id = afterDomain ? afterDomain.split('?')[0] : null;
        return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Primary Action Trigger (WhatsApp or Booking)
  const handlePrimaryCta = () => {
    const ctaMode = business.portfolioSettings?.ctaMode || 'whatsapp';
    if (ctaMode === 'booking' && onBookConsultation) {
      onBookConsultation();
    } else {
      // WhatsApp mode
      const phone = business.whatsapp || business.phone;
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const defaultMsg = `Hi ${business.name}, I saw your work portfolio on Storelly and would love to enquire about working together!`;
      const msg = business.portfolioSettings?.whatsappMessage || defaultMsg;
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
        '_blank'
      );
    }
  };

  // Inquire about specific project
  const handleInquireProject = (item: PortfolioItem) => {
    const phone = business.whatsapp || business.phone;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `Hi ${business.name}, I was browsing your portfolio on Storelly and loved "${item.title}". I'd love to discuss a similar project!`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const customCategories = business.portfolioSettings?.customCategories || [];
  const preset = business.portfolioSettings?.profession
    ? PORTFOLIO_PRESETS[business.portfolioSettings.profession]
    : null;
  const presetCategories = preset?.categories || [];
  const categoriesFromItems = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);
  const availableCategories = Array.from(
    new Set([...presetCategories, ...customCategories, ...categoriesFromItems])
  ).filter((c) => c !== 'All');

  const mediaKit = business.portfolioSettings?.mediaKit;
  const hasStats =
    mediaKit?.enabled !== false &&
    ((mediaKit?.platformStats && mediaKit.platformStats.length > 0) ||
      (preset?.suggestedStats && preset.suggestedStats.length > 0));

  const displayStats =
    mediaKit?.platformStats && mediaKit.platformStats.length > 0
      ? mediaKit.platformStats
      : preset?.suggestedStats || [];

  const displayCollabs =
    mediaKit?.brandCollabs && mediaKit.brandCollabs.length > 0
      ? mediaKit.brandCollabs
      : preset?.suggestedCollabs || [];

  const hasCollabs = mediaKit?.enabled !== false && displayCollabs.length > 0;
  const hasTestimonials = testimonials.length > 0;

  const ctaMode = business.portfolioSettings?.ctaMode || 'whatsapp';
  const ctaText =
    business.portfolioSettings?.customCtaText ||
    preset?.primaryCtaText ||
    (ctaMode === 'booking' ? 'Book a Consultation Slot' : 'Enquire on WhatsApp');

  const themeConfig = getEffectivePortfolioTheme(business);
  const themeColor =
    business.portfolioSettings?.themeColor ||
    preset?.themeColor ||
    (themeConfig.colorMode === 'dark' ? 'dark' : 'default');
  const fontStyle = themeConfig.fontFamily;
  
  const getContainerClass = () => {
    const fontClass = getFontFamilyClass(themeConfig.fontFamily);

    switch(themeColor) {
      case 'dark': return `bg-slate-950 text-slate-100 selection:bg-indigo-500 ${fontClass}`;
      case 'photo': return `bg-white text-slate-900 selection:bg-black selection:text-white ${fontClass}`;
      case 'minimal': return `bg-[#F9F9F8] text-[#1A1A1A] selection:bg-stone-300 ${fontClass}`;
      case 'rose': return `bg-[#FFF9F9] text-rose-950 selection:bg-rose-200 ${fontClass}`;
      case 'indigo': return `bg-[#FAF8FF] text-slate-900 selection:bg-indigo-200 ${fontClass}`;
      case 'emerald': return `bg-[#F7FDF9] text-emerald-950 selection:bg-emerald-200 ${fontClass}`;
      case 'amber': return `bg-[#FFFDF5] text-amber-950 selection:bg-amber-200 ${fontClass}`;
      default: return `bg-slate-50 text-slate-900 selection:bg-indigo-100 ${fontClass}`;
    }
  };

  const getCardClass = () => {
    return getCardStyleClasses(themeConfig.cardStyle, themeColor === 'dark');
  };

  const getCardRadiusClass = () => {
    return getBorderRadiusClass(themeConfig.borderRadius);
  };

  // Full-Page Project View
  if (selectedItem) {
    return (
      <PortfolioProjectPageView
        item={selectedItem}
        business={business}
        allItems={items}
        onBack={() => {
          setSelectedItem(null);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('item');
            url.searchParams.delete('project');
            window.history.pushState({}, '', url.toString());
          }
        }}
        onSelectOtherItem={(newItem) => {
          setSelectedItem(newItem);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('item', newItem.id);
            window.history.pushState({ itemId: newItem.id }, '', url.toString());
          }
        }}
      />
    );
  }

  return (
    <section className="py-12 sm:py-16 border-t border-slate-200/80 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Creator Showcase</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Featured Work & Portfolio
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Explore recent projects, case studies, and creative deliverables by {business.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <a
              href={`/portfolio/${business.slug || business.id}`}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: themeConfig.primaryColor }}
            >
              <span>View Full Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={
                selectedCategory === 'all'
                  ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff', borderColor: themeConfig.primaryColor }
                  : undefined
              }
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Projects ({items.length})
            </button>
            {availableCategories.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={
                    selectedCategory === cat
                      ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff', borderColor: themeConfig.primaryColor }
                      : undefined
                  }
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Portfolio Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No portfolio projects found in this category
            </h3>
            <p className="text-xs text-slate-500">
              Try switching category filters to view other work samples.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className={`group border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer ${getCardRadiusClass()} ${getCardClass()}`}
              >
                {/* Media Thumbnail */}
                <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={item.coverImage}
                    alt={item.title}
                    fallbackType="product"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Media Type Indicator */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      {item.mediaType === 'image' && <Layers className="w-3 h-3" />}
                      {item.mediaType === 'gallery' && (
                        <>
                          <Layers className="w-3 h-3" />
                          <span>{item.mediaUrls?.length || 0} Photos</span>
                        </>
                      )}
                      {item.mediaType === 'video_file' && <Film className="w-3 h-3" />}
                      {item.mediaType === 'external_video' && <Play className="w-3 h-3" />}
                      {item.mediaType === 'external_link' && <ExternalLink className="w-3 h-3" />}
                      {item.mediaType === 'video_file' || item.mediaType === 'external_video'
                        ? 'Video'
                        : item.mediaType === 'external_link'
                        ? 'Live Link'
                        : item.mediaType === 'image'
                        ? 'Photo'
                        : ''}
                    </span>
                  </div>

                  {/* Hover Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/30 backdrop-blur-2xs">
                    <span className="px-4 py-2 rounded-2xl bg-white text-slate-900 text-xs font-black shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-600" /> View Case Study
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900 font-heading line-clamp-1 group-hover:text-indigo-600 transition">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Client / Outcome chips */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {item.clientName && (
                        <span className="font-semibold text-slate-700">
                          {item.clientName}
                        </span>
                      )}
                      {item.clientName && item.projectOutcome && <span>•</span>}
                      {item.projectOutcome && (
                        <span className="text-emerald-700 font-bold">
                          {item.projectOutcome}
                        </span>
                      )}
                    </div>
                    <span className="text-indigo-600 text-xs font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Case Study <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share & QR Code Modal */}
      <PortfolioShareModal
        business={business}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </section>
  );
};
