import React, { useState, useMemo } from 'react';
import {
  Tag,
  ExternalLink,
  Search,
  Filter,
  Share2,
  Copy,
  Check,
  Sparkles,
  Gift,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { BusinessProfile, AffiliateProductItem } from '../../types';
import { recordAffiliateProductClick, recordAnalyticsEvent } from '../../services/firebaseService';
import { resolveThemePrimaryColor } from '../../utils/portfolioTheme';
import { SafeImage } from '../common/SafeImage';

interface AffiliateProductsShowcaseProps {
  items: AffiliateProductItem[];
  business: BusinessProfile;
  title?: string;
  subtitle?: string;
}

export const AffiliateProductsShowcase: React.FC<AffiliateProductsShowcaseProps> = ({
  items,
  business,
  title = 'Recommended Tools & Curated Gear',
  subtitle = 'Personally tested & recommended products, gear setups, and exclusive subscriber deals.',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const primaryThemeColor = resolveThemePrimaryColor(business);

  // Filter only active items for storefront
  const activeItems = useMemo(() => {
    return items.filter((item) => item.status !== 'archived');
  }, [items]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeItems.forEach((it) => {
      if (it.category) set.add(it.category.trim());
    });
    return Array.from(set);
  }, [activeItems]);

  // Filtered items by search & category
  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.platform?.toLowerCase().includes(q) ||
        item.badgeText?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [activeItems, selectedCategory, searchQuery]);

  const handleCopyCode = (itemId: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(itemId);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleOpenAffiliateLink = (item: AffiliateProductItem) => {
    recordAffiliateProductClick(business.id, item.id);
    recordAnalyticsEvent(business.id, 'affiliate_click', {
      itemId: item.id,
      title: item.title,
      url: item.affiliateUrl,
    }).catch(() => {});
    window.open(item.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareSection = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${business.name} — Recommendations & Deals`,
          text: `Check out curated gear and exclusive deals recommended by ${business.name}!`,
          url: currentUrl,
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard.writeText(currentUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <section id="recommendations-section" className="space-y-6 pt-4 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-xs"
              style={{ backgroundColor: primaryThemeColor }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Recommendations</span>
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {activeItems.length} Handpicked {activeItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleShareSection}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
        >
          {copiedShareLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share Deals</span>
            </>
          )}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gear, software, tools..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 shadow-xs transition"
            style={{ ringColor: primaryThemeColor }}
          />
        </div>

        {/* Categories Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'text-white shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: primaryThemeColor, borderColor: primaryThemeColor } : {}}
            >
              All Gear
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={isSelected ? { backgroundColor: primaryThemeColor, borderColor: primaryThemeColor } : {}}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Items */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <Tag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No matching recommendations found</p>
          <p className="text-xs text-slate-400">Try clearing your search query or selecting another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => {
            const hasPromo = Boolean(item.discountCode && item.discountCode.trim());
            const isCodeCopied = copiedCodeId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenAffiliateLink(item)}
                className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden">
                    {item.imageUrl ? (
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.title}
                        fallbackType="item"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                      <span className="px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-sm border border-slate-100">
                        {item.category}
                      </span>

                      {item.badgeText && (
                        <span
                          className="px-2.5 py-1 rounded-xl text-white text-[10px] font-black uppercase tracking-wider shadow-md"
                          style={{ backgroundColor: primaryThemeColor }}
                        >
                          {item.badgeText}
                        </span>
                      )}
                    </div>

                    {/* Platform Tag & Price */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold z-10">
                      {item.platform && (
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-semibold">
                          {item.platform}
                        </span>
                      )}
                      {item.priceDisplay && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md text-white font-mono font-bold text-xs shadow-md border border-white/10 ml-auto">
                          {item.priceDisplay}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Promo Coupon Code Bar */}
                    {hasPromo && (
                      <div
                        onClick={(e) => handleCopyCode(item.id, item.discountCode!, e)}
                        className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs hover:bg-amber-100 transition cursor-pointer"
                        title="Click to copy promo code"
                      >
                        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-950">
                          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Code: {item.discountCode}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                          {isCodeCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Outbound Action Button */}
                <div className="p-4 sm:p-5 pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAffiliateLink(item);
                    }}
                    className="w-full py-3 px-4 rounded-2xl text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 group-hover:opacity-90 active:scale-95 cursor-pointer"
                    style={{ backgroundColor: primaryThemeColor }}
                  >
                    <span>Get Deal on {item.platform || 'Partner Store'}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
