import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import {
  Store,
  Download,
  Loader2,
  X,
  ShoppingBag,
  Search,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  Star,
  Tag,
  Share2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
  CheckCircle2,
  CalendarCheck,
  BedDouble,
  Car,
  UtensilsCrossed,
  Scissors,
  ArrowLeft,
  QrCode,
  SlidersHorizontal,
  Wrench,
  Ticket,
  FileText,
} from 'lucide-react';
import {
  BusinessProfile,
  CatalogItem,
  Category,
  Offer,
  Review,
  EventItem,
} from '../../types';
import {
  getCatalogItems,
  getCategories,
  getOffers,
  getReviews,
  getEvents, getBioLinks, recordBioLinkClick, getPortfolioItems, getTestimonials,
  recordAnalyticsEvent,
  incrementShareCount,
} from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { ItemDetailModal } from './ItemDetailModal';
import { StorefrontCartDrawer } from './StorefrontCartDrawer';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';
import { BookingModal } from './BookingModal';
import { ReviewSubmitModal } from './ReviewSubmitModal';
import { CustomerOrdersModal } from './CustomerOrdersModal';
import { DigitalCheckoutModal } from './DigitalCheckoutModal';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PortfolioShowcase } from './PortfolioShowcase';
import { EventsShowcase } from './EventsShowcase';
import { BioLinksShowcase } from './BioLinksShowcase';
import { CustomQuoteRequestModal } from './CustomQuoteRequestModal';
import { Briefcase, LayoutGrid } from 'lucide-react';

interface StorefrontViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  onOpenDigitalCard?: () => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  business,
  onBackToDashboard,
  onOpenDigitalCard,
}) => {
  useEffect(() => {
    const storeTitle = business.seoMetaTitle || `${business.name} - Official Digital Store`;
    const storeDesc = business.seoMetaDescription || business.tagline || business.description || 'Explore catalog, instant WhatsApp checkout & direct bookings.';
    const currentUrl = window.location.href;
    const ogImage = business.seoMetaImage || `${window.location.origin}/api/og-image/${business.slug || business.id}`;

    document.title = storeTitle;

    // Helper to set or create meta tags
    const setMetaTag = (propertyOrName: string, attr: 'property' | 'name', content: string) => {
      let el = document.querySelector(`meta[${attr}="${propertyOrName}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, propertyOrName);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('description', 'name', storeDesc);
    setMetaTag('og:title', 'property', storeTitle);
    setMetaTag('og:description', 'property', storeDesc);
    setMetaTag('og:image', 'property', ogImage);
    setMetaTag('og:url', 'property', currentUrl);
    setMetaTag('og:type', 'property', 'website');
    setMetaTag('twitter:card', 'name', 'summary_large_image');
    setMetaTag('twitter:title', 'name', storeTitle);
    setMetaTag('twitter:description', 'name', storeDesc);
    setMetaTag('twitter:image', 'name', ogImage);
  }, [business]);

  if (business.maintenanceMode || business.status === 'maintenance') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Wrench className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
              Store Under Maintenance
            </span>
            <h1 className="text-2xl font-black text-slate-900 font-heading">
              {business.name} is Temporarily Offline
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {business.maintenanceMessage || 'We are currently performing scheduled system upgrades or taking a short break. Please check back shortly!'}
            </p>
          </div>

          {business.maintenanceImage && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-48">
              <img
                src={business.maintenanceImage}
                alt="Maintenance"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-3">
            {business.whatsapp || business.phone ? (
              <a
                href={`https://wa.me/${(business.whatsapp || business.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${business.name}, I wanted to inquire when your store will be back online.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contact Store on WhatsApp</span>
              </a>
            ) : null}

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  const {
    setStorefrontBusinessId,
    items: cartItems,
    addItem,
    totalItemsCount,
    subtotal,
    isCartOpen,
    setIsCartOpen,
  } = useStorefrontCart();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bioLinks, setBioLinks] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  // Modals
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<CatalogItem | null>(null);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState<CatalogItem | null>(null);
  const [selectedItemForDigital, setSelectedItemForDigital] = useState<CatalogItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Reset image errors on business or image URL change
  useEffect(() => {
    setLogoError(false);
    setBannerError(false);
  }, [business.id, business.logo, business.banner, business.coverImage]);

  

  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  const handleDigitalPurchase = (item: CatalogItem) => {
    setSelectedItemForDigital(item);
  };


  // Dynamic Browser Title, Favicon & Open Graph Meta Tags Injection for Rich WhatsApp Cards
  useEffect(() => {
    if (business.name) {
      
    document.title = `${business.name} - Official Store | Storelly`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', business.description || `Shop digital products, services, and exclusive content from ${business.name}.`);
    
    // Advanced SEO
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    const ogTags = [
      { property: 'og:title', content: `${business.name} - Official Store` },
      { property: 'og:description', content: business.description || `Shop digital products from ${business.name}` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'website' }
    ];
    
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });

      
      const updateMetaTag = (property: string, content: string, isProperty = true) => {
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

      const storeDesc = business.tagline || business.description || `Explore catalog, special offers, and order instantly from ${business.name} on Storelly.`;
      const storeImage = business.logo || business.banner || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80';
      const storeUrl = window.location.href;

      updateMetaTag('og:title', business.name);
      updateMetaTag('og:description', storeDesc);
      updateMetaTag('og:image', storeImage);
      updateMetaTag('og:url', storeUrl);
      updateMetaTag('og:type', 'website');
      
      updateMetaTag('twitter:card', 'summary_large_image', false);
      updateMetaTag('twitter:title', business.name, false);
      updateMetaTag('twitter:description', storeDesc, false);
      updateMetaTag('twitter:image', storeImage, false);
    }
    if (business.logo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = business.logo;
    }
  }, [business]);

  // Initialize cart business ID & record telemetry
  useEffect(() => {
    setStorefrontBusinessId(business.id);
    recordAnalyticsEvent(business.id, 'store_view', { slug: business.slug });
  }, [business.id, business.slug]);

  // Load all public store data from Firestore with Instant LocalStorage Caching
  const loadStoreData = async () => {
    const cacheKey = `storelly_store_cache_${business.id}`;
    
    // 1. Instantly load from cache if available for 0ms load time
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setCatalogItems(parsed.items || []);
        setCategories(parsed.categories || []);
        setOffers(parsed.offers || []);
        setReviews(parsed.reviews || []);
        setEvents(parsed.events || []);
        setBioLinks(parsed.bioLinks || []);
        setPortfolioItems(parsed.portfolioItems || []);
        setTestimonials(parsed.testimonials || []);
        setIsLoading(false);
      } catch (e) {
        // ignore parse errors
      }
    }

    try {
      if (!cachedData) {
        setIsLoading(true);
      }
      const [fetchedItems, fetchedCategories, fetchedOffers, fetchedReviews, fetchedEvents, fetchedBioLinks, fetchedPortfolioItems, fetchedTestimonials] = await Promise.all([
        getCatalogItems(business.id, true),
        getCategories(business.id),
        getOffers(business.id),
        getReviews(business.id),
        getEvents(business.id),
        getBioLinks(business.id) as Promise<any[]>,
        getPortfolioItems(business.id, true),
        getTestimonials(business.id, true),
      ]);

      const activeCategories = fetchedCategories.filter((c) => c.isActive !== false);
      const activeOffers = fetchedOffers.filter((o) => o.isActive);
      const publishedReviews = fetchedReviews.filter((r) => r.status === 'published');
      const activeEvents = fetchedEvents.filter((e) => e.status !== 'cancelled');

      setCatalogItems(fetchedItems);
      setCategories(activeCategories);
      setOffers(activeOffers);
      setReviews(publishedReviews);
      setEvents(activeEvents);
      setBioLinks(fetchedBioLinks.filter(l => l.enabled).sort((a,b) => (a.order || 0) - (b.order || 0)));
      setPortfolioItems(fetchedPortfolioItems);
      setTestimonials(fetchedTestimonials);

      // Save to cache for next instant load
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          items: fetchedItems,
          categories: activeCategories,
          offers: activeOffers,
          reviews: publishedReviews,
          events: activeEvents,
          bioLinks: fetchedBioLinks.filter(l => l.enabled).sort((a,b) => (a.order || 0) - (b.order || 0)),
          portfolioItems: fetchedPortfolioItems,
          testimonials: fetchedTestimonials,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error('Error loading storefront data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [business.id]);

  useEffect(() => {
    if (catalogItems.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const itemId = urlParams.get('item');
      if (itemId) {
        const item = catalogItems.find(i => i.id === itemId);
        if (item) setSelectedItemForDetail(item);
      }
    }
  }, [catalogItems.length]);

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  // Filter & sort catalog items
  const filteredItems = catalogItems
    .filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = (item.shortDescription || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      // Food veg/non-veg filter
      if (foodFilter === 'veg' && item.isVeg !== true) return false;
      if (foodFilter === 'non_veg' && item.isVeg === true) return false;

      return true;
    })
    .sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const handleShareStore = () => {
    incrementShareCount(business.id);
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: business.name,
          text: `Check out ${business.name} online storefront:`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isOrderable =
    business.status !== 'maintenance' &&
    (business.modules.cart_ordering ||
     business.modules.products ||
     business.modules.menu ||
     business.modules.table_delivery);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Admin Control Bar (if viewing from app preview / management) */}
      {onBackToDashboard && (
        <div className="sticky top-0 z-40 bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs shadow-md border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Customer Storefront Preview</span>
            <span className="hidden sm:inline text-slate-400">({bizMeta.label})</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDigitalCard && (
              <button
                type="button"
                onClick={onOpenDigitalCard}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visiting Card & QR</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Store Banner & Profile Header */}
      <header className="relative bg-white border-b border-slate-200 shadow-xs">
        {/* Banner Cover */}
        <div className="relative aspect-[16/5] sm:aspect-[21/6] w-full bg-slate-900 overflow-hidden">
          {(business.banner || business.coverImage) && !bannerError ? (
            <img
              src={business.banner || business.coverImage}
              alt={business.name}
              referrerPolicy="no-referrer"
              loading="eager"
              fetchPriority="high"
              onError={() => setBannerError(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
                  <div className="w-full h-full bg-linear-to-r from-emerald-900 to-teal-900 opacity-90" />
          )}
        </div>
        
        {/* Profile Info Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-12 sm:-mt-16 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl sm:rounded-3xl shadow-xl border-4 border-white overflow-hidden flex items-center justify-center relative z-20">
                {business.logo || business.profileImage ? (
                  <img src={business.logo || business.profileImage} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-600/40" />
                )}
              </div>
            </div>
            
            {/* Core Info */}
            <div className="flex-1 space-y-1 sm:pb-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading truncate">{business.name}</h1>
                <VerifiedBadge />
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 font-medium">
                {business.category && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{business.category}</span>
                  </span>
                )}
                {business.city && (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{business.city}, {business.state}</span>
                  </span>
                )}
              </div>
              
              {(business.tagline || business.description || business.bio) && (
                <p className="text-sm text-slate-600 mt-2 max-w-2xl line-clamp-2 leading-relaxed">
                  {business.tagline || business.bio || business.description}
                </p>
              )}
            </div>
            
            {/* Quick Actions (Share/Social) */}
            <div className="flex items-center gap-2 shrink-0 sm:pb-2">
              <button onClick={handleShareStore} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition tooltip-trigger group relative">
                <Share2 className="w-4 h-4" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Bio Link Buttons */}
        {(business.modules?.universal_links) && (
           <BioLinksShowcase links={bioLinks} business={business} />
        )}
        
        {/* Active Promotional Offers Ribbon */}
        {offers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Special Offers & Discounts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-3.5 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-emerald-950 font-heading truncate">
                        {offer.title}
                      </span>
                      {offer.code && (
                        <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                          {offer.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-800 line-clamp-1">
                      {offer.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-emerald-700 font-heading">
                      {offer.discountType === 'percentage'
                        ? `${offer.discountValue}% OFF`
                        : `${business.currencySymbol}${offer.discountValue} OFF`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search, Filter & Categories Navigation Bar */}
        <div className="space-y-4 sticky top-12 sm:top-14 z-20 bg-slate-50/95 backdrop-blur-md pt-2 pb-3 border-b border-slate-200">
          {/* Search bar & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${bizMeta.itemPlural.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-sm"
              />
            </div>

            {/* Food Diet Filter (if restaurant/bakery/food) */}
            {(business.type === 'restaurant' || business.type === 'bakery' || business.type === 'grocery') && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setFoodFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    foodFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFoodFilter('veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    foodFilter === 'veg'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <span>🟢 Veg</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFoodFilter('non_veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    foodFilter === 'non_veg'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  <span>🔴 Non-Veg</span>
                </button>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium text-slate-700"
              >
                <option value="default">Default Sorting</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Categories Horizontal Scroll Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              All Offerings ({catalogItems.length})
            </button>

            {categories.map((cat) => {
              const count = catalogItems.filter((i) => i.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-slate-200 p-3 space-y-3 shadow-xs animate-pulse"
                >
                  <div className="h-36 sm:h-44 bg-slate-200 rounded-xl w-full" />
                  <div className="space-y-1.5 pt-1">
                    <div className="h-4 bg-slate-200 rounded-md w-4/5" />
                    <div className="h-3 bg-slate-200 rounded-md w-3/5" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-8 bg-slate-200 rounded-xl w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-heading">
                No items found in this section
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting a different category or clearing search filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setFoodFilter('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isBookable =
                  item.type === 'service' ||
                  item.type === 'room' ||
                  item.type === 'vehicle' ||
                  item.type === 'package' || 
                  item.productType === 'consultation_slot';

                const isDigital = item.productType === 'digital_file';
                const displayPrice = item.salePrice || item.price;
                const hasDiscount = item.salePrice && item.salePrice < item.price;
                const inCart = cartItems.find((c) => c.catalogItem.id === item.id);

                return (
                  <div
                    key={item.id}
                    className="group rounded-2xl sm:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Item Image with Badges */}
                    <div
                      onClick={() => setSelectedItemForDetail(item)}
                      className="relative h-36 sm:h-44 bg-slate-100 overflow-hidden cursor-pointer"
                    >
                      {item.images?.[0] ? (
                        <SafeImage src={item.images[0]} alt={item.name} fallbackType="product" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <ShoppingBag className="w-10 h-10 stroke-1" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                        {isDigital && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Digital File
                          </span>
                        )}
                        {item.productType === 'consultation_slot' && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Consultation
                          </span>
                        )}
                        {item.isOffer && (
                          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            {item.offerText || 'Offer'}
                          </span>
                        )}
                        {typeof item.isVeg === 'boolean' && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              item.isVeg
                                ? 'bg-emerald-700 text-white'
                                : 'bg-rose-700 text-white'
                            }`}
                          >
                            {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                          </span>
                        )}
                        {item.isFeatured && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">
                            ★ Top
                          </span>
                        )}
                      </div>

                      {item.inStock === false && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold uppercase rounded-lg shadow-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Card Body */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div
                        onClick={() => setSelectedItemForDetail(item)}
                        className="cursor-pointer space-y-1"
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {item.name}
                        </h4>

                        {/* Extra metadata specs */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                          {item.type === 'service' && item.durationMinutes && (
                            <span className="flex items-center gap-1 text-purple-700 font-medium">
                              <Clock className="w-3 h-3" />
                              {item.durationMinutes} min
                            </span>
                          )}
                          {item.type === 'room_stay' && item.roomCapacity && (
                            <span className="flex items-center gap-1 text-blue-700 font-medium">
                              <BedDouble className="w-3 h-3" />
                              {item.roomCapacity} guests
                            </span>
                          )}
                          {item.type === 'rental_vehicle' && item.seatingCapacity && (
                            <span className="flex items-center gap-1 text-teal-700 font-medium">
                              <Car className="w-3 h-3" />
                              {item.seatingCapacity} seats
                            </span>
                          )}
                          {item.type === 'menu_item' && item.spiceLevel && (
                            <span>🌶️ {item.spiceLevel}</span>
                          )}
                        </div>

                        {item.shortDescription && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.shortDescription}
                          </p>
                        )}
                      </div>

                      {/* Price & Action Row */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-slate-900 font-heading leading-none">
                            {business.currencySymbol}
                            {displayPrice}
                            {item.unit && (
                              <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                                /{item.unit}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-slate-400 line-through">
                              {business.currencySymbol}
                              {item.price}
                            </div>
                          )}
                        </div>

                        {/* Order / Book / Digital Button */}
                        {isDigital ? (
                          <button
                            type="button"
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDigitalPurchase(item);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{item.price === 0 ? 'Get' : 'Buy'}</span>
                          </button>
                        ) : isBookable ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForBooking(item);
                            }}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                          >
                            <CalendarCheck className="w-3 h-3" />
                            <span>Book</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={item.inStock === false}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.variants && item.variants.length > 0) {
                                setSelectedItemForDetail(item);
                              } else {
                                addItem(item, 1);
                              }
                            }}
                            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer ${
                              inCart
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            {inCart ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            <span>{inCart ? 'Added' : 'Add'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Reviews & Testimonials Section */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Customer Ratings & Reviews
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic feedback from verified store customers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Write a Review</span>
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Star className="w-8 h-8 text-amber-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No reviews yet</p>
              <p className="text-[11px] text-slate-400">
                Be the first to share your experience with {business.name}!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rev.customerName}</h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                  {rev.reply && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Reply from Merchant:
                      </span>
                      <p className="text-slate-600">{rev.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Store Information & Location Section */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              About Store
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {business.description || `${business.name} is a verified business on Storelly Business OS.`}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Location & Contact
            </h4>
            <p className="text-xs text-slate-600">
              {business.address ? business.address : 'Contact merchant for direct address.'}
              {business.city ? `, ${business.city}` : ''}
            </p>
            <div className="text-xs font-semibold text-slate-800 pt-1">
              WhatsApp: {business.whatsapp || business.phone}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Store Hours
            </h4>
            <p className="text-xs text-slate-600">
              {business.businessHours?.isAlwaysOpen
                ? 'Open 24/7 Everyday'
                : business.businessHours?.openTime && business.businessHours?.closeTime
                ? `${business.businessHours.openTime} - ${business.businessHours.closeTime}`
                : '10:00 AM - 09:00 PM'}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Store Operating Normally
              </span>
            </div>
          </div>
        </section>

        {/* Storelly Powered Showcase Banner with storelly7.jpg.jpeg */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute right-0 top-0 w-80 h-full opacity-15 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url('/storelly7.jpg.jpeg')` }}></div>
          <div className="space-y-2 z-10">
            <span className="bg-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Verified Storefront</span>
            <h3 className="text-xl font-bold font-heading">{business.name} — Powered by Storelly</h3>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              Order securely, chat on WhatsApp instantly, and enjoy fast home delivery or pickup services.
            </p>
          </div>
          <img src="/storelly7.jpg.jpeg" alt="Store Showroom" className="w-40 h-24 object-cover rounded-xl border border-emerald-500/40 shadow-lg z-10 hidden sm:block" />
        </div>
      </main>

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {totalItemsCount > 0 && isOrderable && (
        <aside aria-label="Cart summary" className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-3.5 bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                {totalItemsCount}
              </div>
              <div>
                <span className="text-xs text-slate-300 font-medium">Cart Total</span>
                <div className="text-base font-extrabold text-white font-heading">
                  {business.currencySymbol}
                  {subtotal}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Cart & Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItemForDetail}
        business={business}
        isOpen={!!selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onBookItem={(item) => {
          setSelectedItemForDetail(null);
          setSelectedItemForBooking(item);
        }}
        onBuyDigitalItem={(item) => {
          setSelectedItemForDetail(null);
          handleDigitalPurchase(item);
        }}
      />

      {/* Booking Modal */}
      <BookingModal
        business={business}
        item={selectedItemForBooking}
        isOpen={!!selectedItemForBooking}
        onClose={() => setSelectedItemForBooking(null)}
      />

      {/* Slide-over Cart Drawer */}
      <StorefrontCartDrawer
        business={business}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      
      {/* 1-Click Buy / Instant Claim Digital Checkout Modal */}
      <DigitalCheckoutModal
        item={selectedItemForDigital}
        business={business}
        isOpen={!!selectedItemForDigital}
        onClose={() => setSelectedItemForDigital(null)}
      />

      {/* Write Review Modal */}
      <ReviewSubmitModal
        business={business}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={loadStoreData}
      />

      {/* Customer Orders & Tracking Modal */}
      <CustomerOrdersModal
        business={business}
        isOpen={isCustomerOrdersOpen}
        onClose={() => setIsCustomerOrdersOpen(false)}
      />

      {/* Custom Quote Request Modal */}
      <CustomQuoteRequestModal
        business={business}
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};
declare global {
  interface Window {
    Razorpay: any;
  }
}
