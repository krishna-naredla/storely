import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  ExternalLink,
  Search,
  Filter,
  Share2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Gift,
  Compass,
  ArrowLeft,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile, AffiliateProductItem } from '../../types';
import { subscribeToAffiliateProducts, recordAffiliateProductClick, recordAnalyticsEvent } from '../../services/firebaseService';
import { getCreatorModulePublicUrl } from '../../utils/creatorModuleManager';
import { resolveThemePrimaryColor } from '../../utils/portfolioTheme';

interface StandaloneAffiliateViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  isOwner?: boolean;
}

export const StandaloneAffiliateView: React.FC<StandaloneAffiliateViewProps> = ({
  business,
  onBackToDashboard,
  isOwner = false,
}) => {
  const [items, setItems] = useState<AffiliateProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const primaryThemeColor = resolveThemePrimaryColor(business, '#2d8a45');

  useEffect(() => {
    recordAnalyticsEvent(business.id, 'affiliate_impression', { slug: business.slug }).catch(() => {});
    const unsub = subscribeToAffiliateProducts(business.id, (fetched) => {
      setItems(fetched.filter((item) => item.status !== 'archived'));
      setLoading(false);
    });
    return () => unsub();
  }, [business.id, business.slug]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.category) set.add(it.category.trim());
    });
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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
  }, [items, selectedCategory, searchQuery]);

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

  const handleSharePage = async () => {
    const url = getCreatorModulePublicUrl(business, 'affiliate_products');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${business.name} — Recommended Gear & Deals`,
          text: `Check out curated tools, gear, and exclusive discounts recommended by ${business.name}!`,
          url,
        });
        return;
      } catch (e) {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const creatorAvatar =
    business.profileImage ||
    business.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name)}&background=2d8a45&color=fff&size=200`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)] font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-24">
      {/* Top Banner (If owner preview mode) */}
      {isOwner && (
        <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-2 text-center text-xs font-bold text-[var(--t2)] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryThemeColor }} />
            <span>Owner Preview Mode — Recommendations &amp; Affiliate Store</span>
          </div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg)] hover:bg-[var(--card)] text-[var(--t1)] rounded-[var(--r8)] text-xs font-semibold border border-[var(--border)] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      )}

      {/* Header Section */}
      <header className="relative border-b border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-xs)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative shrink-0">
              <img
                src={creatorAvatar}
                alt={business.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 shadow-xl bg-[var(--bg)]"
                style={{ ringColor: `${primaryThemeColor}40` }}
              />
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg"
                style={{ backgroundColor: primaryThemeColor }}
              >
                <Tag className="w-4 h-4 fill-current" />
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className="px-3 py-0.5 rounded-full text-white text-xs font-bold tracking-wider uppercase shadow-xs"
                  style={{ backgroundColor: primaryThemeColor }}
                >
                  Curated Recommendations
                </span>
                <span className="text-xs text-[var(--t2)]">
                  {items.length} {items.length === 1 ? 'Recommendation' : 'Recommendations'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-[var(--t1)] tracking-tight font-heading">
                {business.name}
              </h1>

              <p className="text-sm sm:text-base text-[var(--t2)] max-w-2xl leading-relaxed">
                {business.tagline ||
                  business.bio ||
                  business.description ||
                  'Explore my personal tech stack, favorite books, daily tools, and exclusive discount codes.'}
              </p>

              <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                <button
                  type="button"
                  onClick={handleSharePage}
                  className="min-h-[44px] px-4 py-2 bg-[var(--bg)] hover:bg-[var(--card)] text-[var(--t1)] text-xs font-bold rounded-[var(--r12)] border border-[var(--border)] hover:border-[var(--g300)] transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  {copiedShareLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[var(--g600)]" />
                      <span className="text-[var(--g700)]">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[var(--t2)]" />
                      <span>Share Recommendations</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 pt-6 border-t border-[var(--border)] space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--t3)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gear, software, books, promo codes..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-sm text-[var(--t1)] placeholder:text-[var(--t3)] outline-hidden transition focus:border-[var(--g500)] shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--t3)] hover:text-[var(--t1)] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Chips */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-[var(--r12)] text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'text-white shadow-xs font-black'
                      : 'bg-[var(--card)] text-[var(--t2)] hover:text-[var(--t1)] border border-[var(--border)] hover:bg-[var(--bg)]'
                  }`}
                  style={selectedCategory === 'all' ? { backgroundColor: primaryThemeColor } : {}}
                >
                  All Items ({items.length})
                </button>
                {categories.map((cat) => {
                  const count = items.filter((i) => i.category === cat).length;
                  const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-[var(--r12)] text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'text-white shadow-xs font-black'
                          : 'bg-[var(--card)] text-[var(--t2)] hover:text-[var(--t1)] border border-[var(--border)] hover:bg-[var(--bg)]'
                      }`}
                      style={isActive ? { backgroundColor: primaryThemeColor } : {}}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Recommendations Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: primaryThemeColor, borderTopColor: 'transparent' }}
            />
            <p className="text-xs text-[var(--t2)] font-medium">Loading recommendations...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--t3)] shadow-2xs">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--t1)] font-heading">No recommendations found</h3>
              <p className="text-xs text-[var(--t2)] mt-1">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try searching with different keywords or selecting "All Items".'
                  : 'The creator has not added any recommended tools yet. Please check back shortly!'}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-[var(--card)] hover:bg-[var(--bg)] text-xs font-bold rounded-[var(--r12)] border border-[var(--border)] transition cursor-pointer shadow-2xs"
                style={{ color: primaryThemeColor }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-[var(--r24)] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--g400)] transition-all duration-300 p-5 flex flex-col justify-between shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-1"
              >
                <div className="space-y-3.5">
                  {/* Image or Icon Container */}
                  <div className="relative rounded-[var(--r16)] overflow-hidden aspect-video bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="p-6 text-[var(--t3)]">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}

                    {/* Badge */}
                    {item.badgeText && (
                      <span
                        className="absolute top-3 left-3 px-2.5 py-1 text-white text-[10px] font-black tracking-wider uppercase rounded-[var(--r8)] shadow-md"
                        style={{ backgroundColor: primaryThemeColor }}
                      >
                        {item.badgeText}
                      </span>
                    )}

                    {item.platform && (
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md border border-white/20">
                        {item.platform}
                      </span>
                    )}
                  </div>

                  {/* Header info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[11px] font-black uppercase tracking-wider text-[var(--g700)]"
                      >
                        {item.category}
                      </span>
                      {item.priceDisplay && (
                        <span className="text-xs font-black text-[var(--t1)] font-mono">
                          {item.priceDisplay}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[var(--t1)] group-hover:text-[var(--g700)] transition line-clamp-1 font-heading">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-[var(--t2)] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Discount Code Box */}
                  {item.discountCode && (
                    <div className="p-2.5 rounded-[var(--r12)] bg-[var(--g100)]/80 border border-[var(--g200)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--g900)] font-bold">
                        <Gift className="w-3.5 h-3.5 text-[var(--g600)] shrink-0" />
                        <span className="font-mono text-[11px]">{item.discountCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(item.id, item.discountCode!, e)}
                        className="px-2.5 py-1 bg-white hover:bg-[var(--g100)] text-[var(--g700)] rounded-[var(--r8)] text-[10px] font-bold border border-[var(--g200)] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        {copiedCodeId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-[var(--g600)]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Action Button */}
                <div className="pt-4 mt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleOpenAffiliateLink(item)}
                    className="w-full min-h-[44px] py-2.5 px-4 text-white font-bold text-xs rounded-[var(--r12)] shadow-[var(--shadow-xs)] transition flex items-center justify-center gap-2 cursor-pointer group/btn active:scale-95 hover:opacity-90"
                    style={{ backgroundColor: primaryThemeColor }}
                  >
                    <span>Get Deal &amp; Visit Link</span>
                    <ExternalLink className="w-3.5 h-3.5 transition group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Affiliate Transparency Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 text-center text-xs text-[var(--t2)] space-y-2 border-t border-[var(--border)]">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[var(--g600)] shrink-0" />
          <span>Transparency Notice: Some links on this page may be affiliate links. Purchasing through them directly supports {business.name} at no extra cost to you.</span>
        </p>
        <p className="text-[11px] text-[var(--t3)]">
          Powered by Storelly Creator Platform
        </p>
      </footer>
    </div>
  );
};
