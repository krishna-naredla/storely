import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Calendar,
  User,
  Tag,
  Award,
  Globe,
  Github,
  Figma,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile, PortfolioItem } from '../../types';
import { SafeImage } from '../common/SafeImage';

interface PortfolioDetailModalProps {
  item: PortfolioItem;
  business: BusinessProfile;
  onClose: () => void;
  onEnquire?: (item: PortfolioItem) => void;
}

export const PortfolioDetailModal: React.FC<PortfolioDetailModalProps> = ({
  item,
  business,
  onClose,
  onEnquire,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Combine cover image and mediaUrls for a full gallery
  const allImages = [item.coverImage, ...(item.mediaUrls || [])].filter(
    (url, index, self) => Boolean(url) && self.indexOf(url) === index
  );

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

  const handleWhatsAppEnquire = () => {
    if (onEnquire) {
      onEnquire(item);
      return;
    }
    const phone = business.whatsapp || business.phone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const msg = `Hi ${business.name}, I was viewing your portfolio on Storelly and loved your work on "${item.title}". I would love to discuss a similar project!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-6 text-slate-900">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {item.category}
            </span>
            {item.readTime && (
              <span className="text-xs text-slate-500 font-medium">
                • {item.readTime}
              </span>
            )}
            {item.videoViews && (
              <span className="text-xs text-slate-500 font-medium">
                • {item.videoViews}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Section */}
        <div className="bg-slate-950 relative flex items-center justify-center min-h-[300px] max-h-[520px] overflow-hidden">
          {isVideo && embedUrl ? (
            <iframe
              src={embedUrl}
              title={item.title}
              className="w-full aspect-video max-h-[500px]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : allImages.length > 0 ? (
            <div className="relative w-full h-[360px] sm:h-[460px] flex items-center justify-center bg-black/40">
              <SafeImage
                src={allImages[activeImageIndex]}
                alt={`${item.title} - ${activeImageIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {/* Prev / Next controls if multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 ? allImages.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === allImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Thumbnail Dot Strip */}
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          activeImageIndex === idx
                            ? 'w-6 bg-white shadow-sm'
                            : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No media preview available
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              {item.title}
            </h2>

            {/* Meta badges: client, year, role */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              {item.clientName && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Client: <strong>{item.clientName}</strong></span>
                </div>
              )}
              {item.projectYear && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.projectYear}</span>
                </div>
              )}
              {item.role && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>Role: <strong>{item.role}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {item.description}
          </div>

          {/* Extended Case Study Story if provided */}
          {item.caseStudyStory && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Behind The Project / Case Study
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {item.caseStudyStory}
              </p>
            </div>
          )}

          {/* Outcome & Impact */}
          {item.projectOutcome && (
            <div className="flex items-start gap-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950">
              <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Project Outcome & Results
                </div>
                <div className="text-sm font-semibold mt-0.5">
                  {item.projectOutcome}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Links & CTA Action Row */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* External Links */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.liveDemoUrl && (
                <a
                  href={item.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  <Globe className="w-3.5 h-3.5" /> Live Demo
                </a>
              )}
              {item.githubUrl && (
                <a
                  href={item.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  <Github className="w-3.5 h-3.5" /> GitHub Code
                </a>
              )}
              {item.figmaUrl && (
                <a
                  href={item.figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  <Figma className="w-3.5 h-3.5" /> Figma Design
                </a>
              )}
              {item.externalUrl && !item.liveDemoUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> External Link
                </a>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleWhatsAppEnquire}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enquire About This Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
