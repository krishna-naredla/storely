import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  MessageCircle,
  Calendar,
  User,
  Tag,
  Award,
  Globe,
  Github,
  Play,
  Layers,
  Sparkles,
  Clock,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Briefcase,
  QrCode,
  SlidersHorizontal,
} from 'lucide-react';
import { BusinessProfile, PortfolioItem } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { PortfolioShareModal } from './PortfolioShareModal';
import {
  getEffectivePortfolioTheme,
  getCardStyleClasses,
  getFontFamilyClass,
} from '../../utils/portfolioTheme';

interface PortfolioProjectPageViewProps {
  item: PortfolioItem;
  business: BusinessProfile;
  allItems?: PortfolioItem[];
  onBack: () => void;
  onSelectOtherItem?: (item: PortfolioItem) => void;
  isOwner?: boolean;
}

export const PortfolioProjectPageView: React.FC<PortfolioProjectPageViewProps> = ({
  item,
  business,
  allItems = [],
  onBack,
  onSelectOtherItem,
  isOwner,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFullscreenImage, setSelectedFullscreenImage] = useState<string | null>(null);

  const themeConfig = getEffectivePortfolioTheme(business);
  const isDark = themeConfig.colorMode === 'dark';
  const fontFamilyClass = getFontFamilyClass(themeConfig.fontFamily);

  // Combine coverImage and mediaUrls into a distinct list of media
  const allImages = [item.coverImage, ...(item.mediaUrls || [])].filter(
    (url, index, self) => Boolean(url) && self.indexOf(url) === index
  );

  // Dynamic document title & SEO injection for this specific project page
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalTitle = document.title;
    const projectTitle = `${item.title} — ${business.name} | Project Case Study`;
    document.title = projectTitle;

    const updateMeta = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property='${property}']` : `meta[name='${property}']`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('og:title', projectTitle);
    updateMeta('og:description', item.description || `Case study and project details for ${item.title} by ${business.name}.`);
    updateMeta('og:image', item.coverImage);
    updateMeta('og:url', window.location.href);
    updateMeta('twitter:card', 'summary_large_image', false);
    updateMeta('twitter:title', projectTitle, false);
    updateMeta('twitter:image', item.coverImage, false);

    // Scroll to top upon project change
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      document.title = originalTitle;
    };
  }, [item, business.name]);

  // Video embed url parser
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

  const isVideo = item.mediaType === 'external_video' || item.mediaType === 'video_file';
  const embedUrl = isVideo ? getEmbedVideoUrl(item.externalUrl) : null;

  // WhatsApp enquiry for this specific project
  const handleWhatsAppEnquire = () => {
    const phone = business.whatsapp || business.phone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const defaultMsg = `Hi ${business.name}, I was viewing your portfolio on Storelly and loved your work on "${item.title}". I would love to enquire about a similar project!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  // Copy direct project link
  const handleCopyProjectLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Other related projects by this creator
  const relatedProjects = allItems.filter((i) => i.id !== item.id && i.isActive !== false).slice(0, 3);

  // Helper for rendering rich text / markdown-like paragraphs
  const renderFormattedStory = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-4" />;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      // Heading 2
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg sm:text-xl font-black text-slate-900 mt-6 mb-2 font-heading">
            {trimmed.replace('## ', '')}
          </h3>
        );
      }
      // Bullet list
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-xs sm:text-sm text-slate-600 leading-relaxed py-0.5">
            {trimmed.substring(2)}
          </li>
        );
      }
      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 bg-indigo-50/50 rounded-r-xl text-xs sm:text-sm text-slate-700 italic"
          >
            {trimmed.substring(2)}
          </blockquote>
        );
      }

      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${fontFamilyClass} selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
      {/* =================================================== */}
      {/* TOP NAVIGATION BREADCRUMB & ACTION BAR */}
      {/* =================================================== */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'} shadow-xs`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to</span>
            <span className="font-extrabold truncate max-w-[160px] sm:max-w-[200px]">{business.name}'s Portfolio</span>
          </button>

          {/* Right quick actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyProjectLink}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Copy direct project link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleWhatsAppEnquire}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enquire</span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================== */}
      {/* MAIN PROJECT HERO SECTION */}
      {/* =================================================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Project Header Title & Meta */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-xs"
              style={{
                backgroundColor: `${themeConfig.primaryColor}15`,
                color: themeConfig.primaryColor,
                border: `1px solid ${themeConfig.primaryColor}30`,
              }}
            >
              {item.category}
            </span>

            {item.year && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <Calendar className="w-3 h-3" />
                {item.year}
              </span>
            )}

            {item.role && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <Briefcase className="w-3 h-3" />
                {item.role}
              </span>
            )}

            {item.readTime && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <Clock className="w-3 h-3" />
                {item.readTime}
              </span>
            )}

            {item.videoViews && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <Eye className="w-3 h-3" />
                {item.videoViews}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-heading leading-tight">
            {item.title}
          </h1>

          {item.description && (
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {item.description}
            </p>
          )}

          {/* Client & Outcome highlights */}
          {(item.clientName || item.projectOutcome) && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xs`}>
              {item.clientName && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">Client / Brand</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{item.clientName}</span>
                  </div>
                </div>
              )}

              {item.projectOutcome && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">Key Project Outcome</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{item.projectOutcome}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================== */}
        {/* MEDIA SHOWCASE / GALLERY / VIDEO PLAYER */}
        {/* =================================================== */}
        <div className={`rounded-3xl overflow-hidden border shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-950 border-slate-800'}`}>
          {isVideo && embedUrl ? (
            <div className="relative w-full aspect-video">
              <iframe
                src={embedUrl}
                title={item.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isVideo && item.mediaUrls && item.mediaUrls[0] ? (
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={item.mediaUrls[0]}
                controls
                className="w-full h-full object-contain"
                poster={item.coverImage}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Primary Active Image Display */}
              <div className="relative w-full h-[360px] sm:h-[540px] md:h-[620px] bg-black/60 flex items-center justify-center overflow-hidden group">
                <SafeImage
                  src={allImages[activeImageIndex] || item.coverImage}
                  alt={`${item.title} preview ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain"
                  category={item.category}
                />

                {/* Fullscreen zoom trigger */}
                <button
                  type="button"
                  onClick={() => setSelectedFullscreenImage(allImages[activeImageIndex] || item.coverImage)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                  title="View full resolution"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Left/Right carousel arrows if multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md transition cursor-pointer shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md transition cursor-pointer shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter pill */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold">
                    {activeImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails Strip */}
              {allImages.length > 1 && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3 overflow-x-auto no-scrollbar">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <SafeImage
                        src={imgUrl}
                        alt={`thumbnail ${idx}`}
                        className="w-full h-full object-cover"
                        category={item.category}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================== */}
        {/* CASE STUDY STORY & RICH NARRATIVE */}
        {/* =================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Deep Case Study / Process */}
          <div className="lg:col-span-2 space-y-6">
            {(item.caseStudyStory || item.caseStudyNarrative) ? (
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg sm:text-xl font-bold font-heading">Project Story & Execution</h2>
                </div>

                <div className="prose prose-slate max-w-none">
                  {renderFormattedStory(item.caseStudyStory || item.caseStudyNarrative || '')}
                </div>
              </div>
            ) : item.description ? (
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg sm:text-xl font-bold font-heading">Project Overview</h2>
                </div>
                <p className={`text-xs sm:text-sm md:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {item.description}
                </p>
              </div>
            ) : null}

            {/* Tags & Competencies */}
            {item.tags && item.tags.length > 0 && (
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Skills & Disciplines Applied
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                        isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Quick Specs, External Links & Creator Bio Card */}
          <div className="space-y-6">
            {/* Live External Links (Website, GitHub, Figma) */}
            {(item.liveDemoUrl || item.externalUrl || item.githubUrl || item.figmaUrl) && (
              <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Project Deliverables</h3>

                <div className="space-y-2.5">
                  {(item.liveDemoUrl || item.externalUrl) && (
                    <a
                      href={item.liveDemoUrl || item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition group"
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>Visit Live Project / Site</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </a>
                  )}

                  {item.githubUrl && (
                    <a
                      href={item.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition group"
                    >
                      <span className="flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        <span>Source Code Repository</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </a>
                  )}

                  {item.figmaUrl && (
                    <a
                      href={item.figmaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition group"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Figma Design Prototype</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Direct Hire / Enquiry Box */}
            <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-800' : 'bg-gradient-to-br from-indigo-50/70 via-white to-teal-50/50 border-indigo-100'} space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                  {business.logo ? (
                    <img src={business.logo} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-black text-indigo-600">{business.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{business.name}</h4>
                  <p className="text-xs text-slate-500">{business.tagline || 'Available for projects & commissions'}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Interested in working on something similar? Get in touch directly to discuss requirements, deliverables, and custom estimates.
              </p>

              <button
                type="button"
                onClick={handleWhatsAppEnquire}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Discuss Similar Project on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* RELATED PROJECTS FROM THIS CREATOR */}
        {/* =================================================== */}
        {relatedProjects.length > 0 && (
          <div className="pt-8 border-t border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black font-heading">More Work by {business.name}</h3>
                <p className="text-xs text-slate-500">Explore other case studies and portfolio samples</p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
              >
                View All Projects →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedProjects.map((relItem) => (
                <div
                  key={relItem.id}
                  onClick={() => onSelectOtherItem ? onSelectOtherItem(relItem) : null}
                  className={`group rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <SafeImage
                      src={relItem.coverImage}
                      alt={relItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      category={relItem.category}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-xs">
                        {relItem.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                      {relItem.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{relItem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen High-Resolution Lightbox */}
      {selectedFullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedFullscreenImage(null)}
        >
          <img
            src={selectedFullscreenImage}
            alt="Full resolution showcase"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}

      {/* Share & QR Code Modal */}
      <PortfolioShareModal
        business={business}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
