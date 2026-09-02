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
  getTestimonials,
} from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';

interface PortfolioShowcaseProps {
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
  onBookConsultation,
}) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadPublicData = async () => {
      setIsLoading(true);
      try {
        const [fetchedItems, fetchedTestimonials] = await Promise.all([
          getPortfolioItems(business.id, true), // active only
          getTestimonials(business.id, true), // active only
        ]);
        setItems(fetchedItems);
        setTestimonials(fetchedTestimonials);
      } catch (err) {
        console.error('Error fetching public portfolio:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPublicData();
  }, [business.id]);

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
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
      }
      if (url.includes('vimeo.com/')) {
        const id = url.split('vimeo.com/')[1]?.split('?')[0];
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

  const availableCategories = Array.from(
    new Set(items.map((i) => i.category))
  ).filter(Boolean);

  const mediaKit = business.portfolioSettings?.mediaKit;
  const hasStats =
    mediaKit?.enabled !== false &&
    mediaKit?.platformStats &&
    mediaKit.platformStats.length > 0;
  const hasCollabs =
    mediaKit?.enabled !== false &&
    mediaKit?.brandCollabs &&
    mediaKit.brandCollabs.length > 0;
  const hasTestimonials = testimonials.length > 0;

  const ctaMode = business.portfolioSettings?.ctaMode || 'whatsapp';
  const ctaText =
    business.portfolioSettings?.customCtaText ||
    (ctaMode === 'booking' ? 'Book a Consultation Slot' : 'Enquire on WhatsApp');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-indigo-500 selection:text-white">
      {/* ===================================================== */}
      {/* 1. CREATOR HERO HEADER */}
      {/* ===================================================== */}
      <div className="bg-white border-b border-slate-200/80">
        {/* Banner */}
        <div className="relative h-44 sm:h-64 bg-slate-900 overflow-hidden">
          {business.banner || business.coverImage ? (
            <img
              src={business.banner || business.coverImage}
              alt={business.name}
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        </div>

        {/* Profile Info Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
              {/* Creator Avatar */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white p-1.5 shadow-xl border-2 border-white shrink-0 overflow-hidden">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-3xl sm:text-4xl font-heading">
                    {business.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Names & Bios */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
                    {business.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Verified Creator
                  </span>
                </div>

                {business.tagline && (
                  <p className="text-sm font-semibold text-slate-700">
                    {business.tagline}
                  </p>
                )}

                {business.description && (
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    {business.description}
                  </p>
                )}
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Share Portfolio"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>{copiedLink ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrimaryCta}
                className={`px-5 py-3 rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer ${
                  ctaMode === 'booking'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {ctaMode === 'booking' ? (
                  <Calendar className="w-4 h-4" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                <span>{ctaText}</span>
              </button>
            </div>
          </div>

          {/* Social Links Bar */}
          {business.socials && Object.values(business.socials).some(Boolean) && (
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-5 border-t border-slate-100 mt-5 flex-wrap">
              {business.socials.instagram && (
                <a
                  href={`https://instagram.com/${business.socials.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
              )}
              {business.socials.youtube && (
                <a
                  href={business.socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
              )}
              {business.socials.twitter && (
                <a
                  href={`https://twitter.com/${business.socials.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>Twitter / X</span>
                </a>
              )}
              {business.socials.linkedin && (
                <a
                  href={business.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              )}
              {business.socials.website && (
                <a
                  href={business.socials.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* 2. MAIN PORTFOLIO BODY */}
      {/* ===================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* Category Filter Tabs */}
        {availableCategories.length > 0 && (
          <div className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
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
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
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
                className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Media Thumbnail */}
                <div className="relative h-52 sm:h-56 bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={item.coverImage}
                    alt={item.title}
                    fallbackType="product"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Media Type Indicator */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
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
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-600" /> View Project
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
                      Explore <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===================================================== */}
        {/* 3. MEDIA KIT STATS & COLLABORATIONS (OPTIONAL BLOCK) */}
        {/* ===================================================== */}
        {(hasStats || hasCollabs) && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-8 shadow-xs">
            <div className="text-center sm:text-left space-y-1 border-b border-slate-100 pb-5">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                Audience & Reach
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Creator Media Kit & Brand Collaborations
              </h2>
              <p className="text-xs text-slate-500">
                Verified audience reach and past brand partnerships for sponsor inquiries.
              </p>
            </div>

            {/* Platform Stats Row */}
            {hasStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {mediaKit?.platformStats?.map((stat) => (
                  <div
                    key={stat.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {stat.platform}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                      {stat.count}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600">
                      {stat.label || 'Followers'}
                      {stat.engagementRate && (
                        <span className="block text-emerald-600 font-bold text-[10px] mt-0.5">
                          {stat.engagementRate} Engagement
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Brand Collaborations */}
            {hasCollabs && (
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Featured Client & Brand Partners
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mediaKit?.brandCollabs?.map((collab) => (
                    <div
                      key={collab.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">
                          {collab.brandName}
                        </span>
                        {collab.collabYear && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            {collab.collabYear}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {collab.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* 4. CLIENT TESTIMONIALS (PART C) */}
        {/* ===================================================== */}
        {hasTestimonials && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 uppercase tracking-wider">
                Social Proof
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-heading">
                What Clients Say
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Real feedback from clients, collaborators, and brands.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (t.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                    {t.clientPhoto ? (
                      <img
                        src={t.clientPhoto}
                        alt={t.clientName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {t.clientName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.clientName}</div>
                      {t.clientRole && (
                        <div className="text-[10px] text-slate-500">{t.clientRole}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* 5. BOTTOM CONVERSION CTA BANNER */}
        {/* ===================================================== */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 text-center relative overflow-hidden shadow-xl space-y-4">
          <div className="relative z-10 max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-heading">
              Have a project in mind? Let's talk.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Reach out to discuss timelines, creative direction, rates, or customized package bookings.
            </p>
            <div className="pt-3 flex items-center justify-center">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className={`px-8 py-4 rounded-2xl text-xs sm:text-sm font-black shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer ${
                  ctaMode === 'booking'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {ctaMode === 'booking' ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                <span>{ctaText}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 6. INTERACTIVE LIGHTBOX & MEDIA VIEWER MODAL */}
      {/* ===================================================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
                  {selectedItem.category}
                </span>
                <h3 className="text-base font-black text-slate-900 font-heading line-clamp-1">
                  {selectedItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseItem}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Presentation Container */}
            <div className="bg-slate-950 relative flex items-center justify-center min-h-[300px] max-h-[500px]">
              {/* Media Type: Single Image */}
              {selectedItem.mediaType === 'image' && (
                <img
                  src={selectedItem.coverImage}
                  alt={selectedItem.title}
                  className="w-full max-h-[500px] object-contain"
                />
              )}

              {/* Media Type: Gallery */}
              {selectedItem.mediaType === 'gallery' && (
                <div className="relative w-full h-[350px] sm:h-[480px] flex items-center justify-center">
                  {selectedItem.mediaUrls && selectedItem.mediaUrls[activeGalleryIndex] ? (
                    <img
                      src={selectedItem.mediaUrls[activeGalleryIndex]}
                      alt={`${selectedItem.title} ${activeGalleryIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={selectedItem.coverImage}
                      alt={selectedItem.title}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Prev / Next Controls */}
                  {selectedItem.mediaUrls && selectedItem.mediaUrls.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGalleryIndex((prev) =>
                            prev === 0 ? selectedItem.mediaUrls!.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-3 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGalleryIndex((prev) =>
                            prev === selectedItem.mediaUrls!.length - 1 ? 0 : prev + 1
                          );
                        }}
                        className="absolute right-3 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold">
                        {activeGalleryIndex + 1} / {selectedItem.mediaUrls.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Media Type: Uploaded Video File */}
              {selectedItem.mediaType === 'video_file' && (
                <div className="w-full h-[350px] sm:h-[480px] flex items-center justify-center bg-black">
                  <video
                    controls
                    autoPlay
                    src={selectedItem.mediaUrls?.[0] || selectedItem.coverImage}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Media Type: YouTube / Vimeo Embed */}
              {selectedItem.mediaType === 'external_video' && (
                <div className="w-full h-[320px] sm:h-[460px] bg-black">
                  <iframe
                    src={getEmbedVideoUrl(selectedItem.externalUrl) || ''}
                    title={selectedItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Media Type: External Link (Figma / Live Demo) */}
              {selectedItem.mediaType === 'external_link' && (
                <div className="relative w-full h-[300px] sm:h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <img
                    src={selectedItem.coverImage}
                    alt={selectedItem.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs"
                  />
                  <div className="relative z-10 space-y-3 max-w-md">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
                      <ExternalLink className="w-7 h-7" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Live Interactive Project
                    </h4>
                    <p className="text-xs text-slate-300">
                      This project is hosted externally (Figma, GitHub, or live demo site).
                    </p>
                    <a
                      href={selectedItem.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl shadow-xl transition cursor-pointer"
                    >
                      <span>Open Live Project</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Thumbnail Strip (if gallery) */}
            {selectedItem.mediaType === 'gallery' &&
              selectedItem.mediaUrls &&
              selectedItem.mediaUrls.length > 1 && (
                <div className="p-3 bg-slate-900 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-800">
                  {selectedItem.mediaUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        activeGalleryIndex === idx
                          ? 'border-indigo-500 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            {/* Details & Inquire Bar */}
            <div className="p-6 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h4 className="text-xl font-black text-slate-900 font-heading">
                    {selectedItem.title}
                  </h4>
                  {selectedItem.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  )}

                  {/* Client & Outcome */}
                  {(selectedItem.clientName || selectedItem.projectOutcome) && (
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      {selectedItem.clientName && (
                        <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
                          Client: {selectedItem.clientName}
                        </div>
                      )}
                      {selectedItem.projectOutcome && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold">
                          Outcome: {selectedItem.projectOutcome}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project-Specific Action Button */}
                <div className="shrink-0 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleInquireProject(selectedItem)}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire About Similar Project</span>
                  </button>

                  {selectedItem.externalUrl && selectedItem.mediaType !== 'external_link' && (
                    <a
                      href={selectedItem.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Original Link</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
