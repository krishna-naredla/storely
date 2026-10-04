import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Download,
  FileText,
  Video,
  FolderArchive,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { BusinessProfile, CatalogItem } from '../../types';
import { getCatalogItems, recordAnalyticsEvent } from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';
import { DigitalCheckoutModal } from '../storefront/DigitalCheckoutModal';

interface StandaloneDigitalStoreViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  isOwner?: boolean;
}

export const StandaloneDigitalStoreView: React.FC<StandaloneDigitalStoreViewProps> = ({
  business,
  onBackToDashboard,
  isOwner = false,
}) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      setIsLoading(true);
      try {
        recordAnalyticsEvent(business.id, 'digital_product_view', { slug: business.slug }).catch(() => {});
        const catalog = await getCatalogItems(business.id);
        if (!isMounted) return;

        // Strictly filter for active and published digital items only (no physical product fallback)
        const digitalItems = (catalog || []).filter(
          (item) =>
            item.isActive !== false &&
            (item.productType === 'digital_file' ||
              item.type === 'course' ||
              Boolean(item.digitalFileUrl && item.digitalFileUrl.trim().length > 0))
        );

        setItems(digitalItems);
      } catch (err) {
        console.error('Error fetching digital products:', err);
        setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [business.id]);

  const currencySymbol = business.currencySymbol || '₹';
  const isProfileVerified = Boolean(business.isVerified || (business as any).verified);

  const getFormatBadge = (item: CatalogItem) => {
    if (item.type === 'course' || (item.productType as any) === 'course') {
      return { label: 'Video Course', icon: Video, color: 'bg-purple-100 text-purple-800' };
    }
    const name = item.name.toLowerCase();
    if (name.includes('pdf') || name.includes('ebook') || name.includes('guide')) {
      return { label: 'PDF Document', icon: FileText, color: 'bg-rose-100 text-rose-800' };
    }
    if (name.includes('template') || name.includes('figma') || name.includes('ui')) {
      return { label: 'Design Template', icon: Sparkles, color: 'bg-indigo-100 text-indigo-800' };
    }
    if (name.includes('code') || name.includes('preset') || name.includes('bundle')) {
      return { label: 'Asset Bundle', icon: FolderArchive, color: 'bg-amber-100 text-amber-800' };
    }
    return { label: 'Digital Download', icon: Download, color: 'bg-emerald-100 text-emerald-800' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Explicit Owner Preview Header */}
      {isOwner && onBackToDashboard && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Creator Owner Preview Mode</span>
            <span className="text-slate-400">• Standalone Digital Store &amp; Downloads</span>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md font-bold transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Hero Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50 border-2 border-emerald-100 p-1 shrink-0 shadow-sm overflow-hidden flex items-center justify-center">
              <SafeImage
                fallbackType="avatar"
                src={business.logo || business.profileImage || ''}
                alt={business.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-emerald-600" />
                  Digital Store &amp; Downloads
                </span>
                {isProfileVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Creator
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900">
                {business.name}
              </h1>

              <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                {business.tagline || business.description || 'Downloadable templates, guides, digital course packages, and creative assets with instant delivery.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-slate-500 font-medium">
                <span>{items.length} Digital Asset{items.length === 1 ? '' : 's'}</span>
                <span>•</span>
                <span>Instant Secure Access &amp; Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-semibold">Loading digital products &amp; assets...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Digital Products Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {business.name} has not published any digital assets for sale yet. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Downloadable Digital Assets
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {items.length} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const price = item.salePrice ?? item.price ?? 0;
                const isFree = price === 0;
                const badge = getFormatBadge(item);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Item Cover Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      <SafeImage
                        fallbackType="product"
                        src={item.images?.[0] || ''}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute top-3 left-3 z-10">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {isFree && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
                            Free
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="font-black text-base text-slate-900 leading-snug group-hover:text-emerald-700 transition">
                          {item.name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.shortDescription || item.detailedDescription || 'Instant digital download after checkout.'}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Price
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {isFree ? 'Free' : `${currencySymbol}${price}`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedItemForPurchase(item)}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isFree ? 'Download Free' : 'Buy & Access'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Digital Checkout Modal */}
      {selectedItemForPurchase && (
        <DigitalCheckoutModal
          business={business}
          item={selectedItemForPurchase}
          isOpen={!!selectedItemForPurchase}
          onClose={() => setSelectedItemForPurchase(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {business.name}. Hosted on Storelly Creator Studio.</p>
      </footer>
    </div>
  );
};
