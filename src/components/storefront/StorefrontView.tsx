import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { getBusinessLogo, getAppLogo } from '../../utils/branding';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import {
  getCatalogItems,
  getCategories,
  getOffers,
  getReviews,
  getEvents,
  getBioLinks,
  getPortfolioItems,
  getTestimonials,
  recordAnalyticsEvent,
  incrementShareCount,
} from '../../services/firebaseService';
import {
  BusinessProfile,
  Category,
  CatalogItem,
  Offer,
  Review,
  EventItem,
} from '../../types/index';
import { BUSINESS_TYPES } from '../../services/businessConfig';
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
  Briefcase,
  LayoutGrid,
  Map,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Mail,
  ArrowUpRight,
  ChevronDown,
  Filter,
  ShieldCheck,
  Award,
} from 'lucide-react';

// Modals
import { ItemDetailModal } from './ItemDetailModal';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { StayBookingModal } from './StayBookingModal';
import { RentalBookingModal } from './RentalBookingModal';
import { ConsultationBookingModal } from './ConsultationBookingModal';
import { StorefrontCartDrawer } from './StorefrontCartDrawer';
import { DigitalCheckoutModal } from './DigitalCheckoutModal';
import { ReviewSubmitModal } from './ReviewSubmitModal';
import { CustomerOrdersModal } from './CustomerOrdersModal';
import { CustomQuoteRequestModal } from './CustomQuoteRequestModal';
import { resolveItemAction } from '../../utils/itemActionResolver';

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
      const storeImage = business.logo || business.banner || '';
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
        const headEl = document.head || document.getElementsByTagName('head')?.[0];
        if (headEl) headEl.appendChild(link);
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
    if (catalogItems.length > 0 || categories.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const itemId = urlParams.get('item') || urlParams.get('product');
      const categoryParam = urlParams.get('category');
      const viewParam = urlParams.get('view');
      const tableParam = urlParams.get('table');

      if (tableParam && business.modules.table_delivery) {
        // Save table to local storage for persistence across the session
        localStorage.setItem(`storelly_table_${business.id}`, tableParam);
      }

      // Deep link to a specific item
      if (itemId) {
        const item = catalogItems.find(i => i.id === itemId || i.slug === itemId);
        if (item) {
          if (item.productType === 'digital_file') {
            setSelectedItemForDigital(item);
          } else {
            setSelectedItemForDetail(item);
          }
        }
      }

      // Deep link to a specific category
      if (categoryParam) {
        const cat = categories.find(
          c => c.id === categoryParam || c.slug === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase()
        );
        if (cat) {
          setSelectedCategory(cat.id);
        }
      }

      // Deep link to a specific view/action
      if (viewParam === 'quotes') {
        setIsQuoteModalOpen(true);
      } else if (viewParam === 'reviews') {
        const el = document.getElementById('reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (viewParam === 'portfolio') {
        const el = document.getElementById('portfolio-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (viewParam === 'events') {
        const el = document.getElementById('events-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [catalogItems, categories]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          <img
            src={getAppLogo()}
            alt="Storelly"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 pb-28 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Admin Control Bar (if viewing from app preview / management) */}
      {onBackToDashboard && (
        <aside aria-label="Customer preview toolbar" className="sticky top-0 z-40 bg-emerald-600 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-200 truncate">Customer Storefront Preview</span>
            <span className="hidden sm:inline text-slate-400">({bizMeta.label})</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDigitalCard && (
              <button
                type="button"
                onClick={onOpenDigitalCard}
                className="px-2.5 py-1.5 min-h-[36px] sm:min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visiting Card & QR</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-1.5 min-h-[36px] sm:min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-500 font-bold text-white transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Store Banner & Profile Header */}
      <header className="relative bg-white">
        {/* Banner Cover */}
        <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full bg-slate-100 overflow-hidden">
          {(business.banner || business.coverImage) && !bannerError ? (
            <div className="w-full h-full relative">
              <SafeImage
                src={business.banner || business.coverImage}
                alt={business.name}
                fallbackType="banner"
                loading="eager"
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60" />
            </div>
          ) : (
            <div className="w-full h-full bg-emerald-900 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent" />
              <div className="relative z-10 flex flex-col items-center gap-2 opacity-50">
                <Store className="w-12 h-12 text-white/40" />
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{business.name}</span>
              </div>
            </div>
          )}

          {/* Floating Share Button on Banner */}
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={handleShareStore}
              className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all active:scale-95 cursor-pointer text-slate-900 border border-white/50"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Profile Info Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12 sm:-mt-20 mb-8">
            {/* Logo */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className="w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-1.5 sm:p-2 border-4 border-white overflow-hidden relative group">
                <div className="w-full h-full rounded-2xl sm:rounded-[2rem] overflow-hidden bg-slate-50 flex items-center justify-center">
                  {getBusinessLogo(business) ? (
                    <SafeImage
                      src={getBusinessLogo(business)!}
                      alt={business.name}
                      fallbackType="avatar"
                      loading="eager"
                      className="w-full h-full object-contain object-center p-1"
                    />
                  ) : (
                    <div className="text-emerald-600 font-black text-3xl sm:text-5xl uppercase font-heading select-none">
                      {business.name.substring(0, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Core Info & Primary Actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
              <div className="space-y-3 text-center md:text-left min-w-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight truncate leading-tight">
                      {business.name}
                    </h1>
                    <VerifiedBadge size="md" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wide">
                    {business.category && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <LayoutGrid className="w-4 h-4" />
                        <span>{business.category}</span>
                      </span>
                    )}
                    {business.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{business.city}</span>
                      </span>
                    )}
                    {business.status === 'open' && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Open Now</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {(business.tagline || business.description || business.bio) && (
                  <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl line-clamp-3 leading-relaxed mx-auto md:mx-0">
                    {business.tagline || business.bio || business.description}
                  </p>
                )}
              </div>

              {/* Action Group */}
              <div className="flex items-center justify-center gap-3 shrink-0">
                {(business.whatsapp || business.phone) && (
                  <a
                    href={`https://wa.me/${(business.whatsapp || business.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${business.name}, I'm interested in your offerings.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none min-h-[48px] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp Now</span>
                  </a>
                )}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="p-3.5 min-h-[48px] min-w-[48px] rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10 flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Active Promotional Offers Ribbon */}
        {offers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em] flex items-center gap-2 px-1">
              <Tag className="w-4 h-4 text-emerald-600" />
              Exclusive Offers
            </h2>

            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="min-w-[280px] sm:min-w-[320px] p-5 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-600/10 flex flex-col justify-between gap-4 relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                  
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase tracking-wider">{offer.title}</h3>
                      {offer.code && (
                        <span className="text-[10px] font-mono font-black bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/30">
                          {offer.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 font-medium leading-relaxed line-clamp-2">
                      {offer.description}
                    </p>
                  </div>

                  <div className="flex items-end justify-between relative z-10">
                    <div className="text-2xl font-black font-heading leading-none">
                      {offer.discountType === 'percentage'
                        ? `${offer.discountValue}% OFF`
                        : `${business.currencySymbol}${offer.discountValue} OFF`}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                      Apply at checkout
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search, Filter & Categories Navigation Bar */}
        <div className={`sticky ${onBackToDashboard ? 'top-12 sm:top-14' : 'top-0'} z-30 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/60 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 transition-all duration-300`}>
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Search bar & Sort Controls */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${business.name}...`}
                  className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-white text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-hidden shadow-sm transition-all"
                />
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
                {/* Food Diet Filter */}
                {(business.type === 'restaurant' || business.type === 'bakery' || business.type === 'grocery') && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shrink-0 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setFoodFilter('all')}
                      className={`min-h-[36px] px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        foodFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodFilter('veg')}
                      className={`min-h-[36px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        foodFilter === 'veg'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodFilter('non_veg')}
                      className={`min-h-[36px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        foodFilter === 'non_veg'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                )}

                {/* Sort Dropdown */}
                <div className="relative shrink-0 group">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="min-h-[44px] pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-hidden font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="default">Featured</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Categories Navigation */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x border-t border-slate-200/60 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`min-h-[40px] px-5 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer border-2 ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-white border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-200'
                  }`}
                >
                  All Items
                </button>

                {categories.map((cat) => {
                  const count = catalogItems.filter((i) => i.categoryId === cat.id).length;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`min-h-[40px] px-5 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all flex items-center gap-2 cursor-pointer border-2 ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                          : 'bg-white border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-200'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-lg font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div>
          {filteredItems.length === 0 ? (
            <div className="py-12 px-6 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3 shadow-xs max-w-md mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100/60 shadow-xs">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 font-heading">
                  No products found
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {searchQuery ? `No results matching "${searchQuery}".` : 'No items match your selected category or filter.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setFoodFilter('all');
                }}
                className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredItems.map((item) => {
                const actionResult = resolveItemAction(item);
                const isBookable = actionResult.isBooking;
                const isDigital = actionResult.isDigital;
                const isCartable = actionResult.isCartable;

                const displayPrice =
                  typeof item.salePrice === 'number' && item.salePrice >= 0 && item.salePrice < item.price
                    ? item.salePrice
                    : (item.price ?? 0);
                const hasDiscount =
                  typeof item.salePrice === 'number' && item.salePrice >= 0 && item.salePrice < item.price;
                const inCart = cartItems.find((c) => c.catalogItem.id === item.id);
                const hasVariants = Boolean(item.variants && item.variants.length > 0);
                const variantItemsInCart = hasVariants ? cartItems.filter((c) => c.catalogItem.id === item.id) : [];
                const totalVariantQty = variantItemsInCart.reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="group rounded-[2rem] bg-white border border-slate-200/60 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Item Image with Badges */}
                    <div
                      onClick={() => setSelectedItemForDetail(item)}
                      className="relative aspect-square sm:aspect-square bg-slate-50 overflow-hidden cursor-pointer"
                    >
                      {item.images?.[0] ? (
                        <SafeImage 
                          src={item.images[0]} 
                          alt={item.name} 
                          fallbackType="product" 
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                          <ShoppingBag className="w-16 h-16 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Badges Overlay */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                        {isDigital && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                            Digital
                          </span>
                        )}
                        {item.isOffer && (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                            {item.offerText || 'Offer'}
                          </span>
                        )}
                        {typeof item.isVeg === 'boolean' && (
                          <span
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                              item.isVeg ? 'border-emerald-600 bg-white' : 'border-rose-600 bg-white'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          </span>
                        )}
                      </div>

                      {/* Featured Badge */}
                      {item.isFeatured && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-lg">
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                        </div>
                      )}

                      {item.inStock === false && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-2xl">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {/* Quick Add Hover Button (Desktop only, for cartable physical products without variants) */}
                      {isCartable && item.inStock !== false && !hasVariants && (
                        <div className="absolute bottom-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(item, 1);
                            }}
                            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
                            title="Add to Cart"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div
                        onClick={() => setSelectedItemForDetail(item)}
                        className="cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight font-heading">
                            {item.name}
                          </h4>
                        </div>

                        {/* Extra metadata specs */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-wrap">
                          {item.type === 'service' && item.durationMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {item.durationMinutes}m
                            </span>
                          )}
                          {(item.type === 'room' || item.type === 'room_stay') && item.roomCapacity && (
                            <span className="flex items-center gap-1">
                              <BedDouble className="w-3.5 h-3.5" />
                              {item.roomCapacity}p
                            </span>
                          )}
                          {(item.type === 'vehicle' || item.type === 'rental_vehicle') && item.seatingCapacity && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5" />
                              {item.seatingCapacity}s
                            </span>
                          )}
                        </div>

                        {item.shortDescription && (
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {item.shortDescription}
                          </p>
                        )}
                      </div>

                      {/* Price & Action Row */}
                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="text-base sm:text-xl font-black text-slate-900 font-heading leading-none">
                            {business.currencySymbol}{displayPrice}
                            {item.unit && (
                              <span className="text-[10px] font-bold text-slate-400 ml-1">
                                /{item.unit}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="text-[11px] text-slate-400 font-bold line-through">
                              {business.currencySymbol}{item.price}
                            </div>
                          )}
                        </div>

                        {/* Order / Book / Digital / Add to Cart Action */}
                        {isDigital ? (
                          <button
                            type="button"
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDigitalPurchase(item);
                            }}
                            className="min-h-[44px] px-4 py-2.5 ds-btn-primary text-xs font-bold rounded-[var(--r12)] shadow-[var(--shadow-xs)] transition active:scale-95 cursor-pointer flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">{actionResult.buttonText}</span>
                          </button>
                        ) : isBookable ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForBooking(item);
                            }}
                            className="min-h-[44px] px-4 py-2.5 ds-btn-primary text-xs font-bold rounded-[var(--r12)] shadow-[var(--shadow-xs)] transition active:scale-95 cursor-pointer flex items-center gap-2"
                          >
                            <CalendarCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">{actionResult.buttonText}</span>
                          </button>
                        ) : (
                          <div className="flex items-center">
                            {hasVariants ? (
                              <button
                                type="button"
                                disabled={item.inStock === false}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemForDetail(item);
                                }}
                                className={`min-h-[44px] px-4 py-2.5 rounded-[var(--r12)] font-bold text-xs shadow-[var(--shadow-xs)] transition active:scale-95 cursor-pointer flex items-center gap-2 ${
                                  item.inStock === false
                                    ? 'bg-[var(--g100)] text-[var(--t3)] cursor-not-allowed shadow-none'
                                    : totalVariantQty > 0
                                    ? 'bg-[var(--g100)] text-[var(--g700)] border-2 border-[var(--g600)] hover:bg-[var(--g200)]'
                                    : 'ds-btn-primary'
                                }`}
                              >
                                {totalVariantQty > 0 ? (
                                  <span>In Cart ({totalVariantQty})</span>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    <span>Add to Cart</span>
                                  </>
                                )}
                              </button>
                            ) : inCart && inCart.quantity > 0 ? (
                              <div className="flex items-center bg-[var(--g100)] rounded-[var(--r12)] p-1 gap-2 border border-[var(--border)]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(item, -1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-[var(--t1)] hover:bg-[var(--card)] rounded-[var(--r8)] transition cursor-pointer font-bold text-sm"
                                  title="Decrease quantity"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-[var(--t1)]">
                                  {inCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(item, 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-[var(--t1)] hover:bg-[var(--card)] rounded-[var(--r8)] transition cursor-pointer font-bold text-sm"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={item.inStock === false}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItem(item, 1);
                                }}
                                className={`min-h-[44px] px-4 py-2.5 rounded-[var(--r12)] font-bold text-xs shadow-[var(--shadow-xs)] transition active:scale-95 cursor-pointer flex items-center gap-2 ${
                                  item.inStock === false
                                    ? 'bg-[var(--g100)] text-[var(--t3)] cursor-not-allowed shadow-none'
                                    : 'ds-btn-primary'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add to Cart</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Reviews & Trust Section */}
        <section id="reviews-section" className="rounded-[var(--r24)] bg-[var(--card)] border border-[var(--border)] p-6 sm:p-8 shadow-[var(--shadow-xs)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[var(--r12)] bg-amber-50 text-amber-500 flex items-center justify-center shadow-xs">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--t1)] font-heading">
                  Customer Stories &amp; Trust
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--t2)] font-medium">
                Verified experiences from real customers of {business.name}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-1.5 bg-amber-500/10 rounded-[var(--r12)] border border-amber-500/20 flex items-center gap-2">
                <span className="text-base font-bold text-amber-700 leading-none">{averageRating}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'fill-[var(--g200)] text-[var(--g200)]'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider ml-1">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="min-h-[44px] px-5 py-2.5 rounded-[var(--r12)] ds-btn-primary text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-[var(--shadow-xs)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Review</span>
              </button>
            </div>
          </div>

          {/* Verified Guarantee Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[var(--r16)] bg-[var(--bg)] border border-[var(--border)] shadow-[var(--shadow-xs)] text-xs">
            <div className="flex items-center gap-2 text-[var(--t1)]">
              <ShieldCheck className="w-4 h-4 text-[var(--g600)] shrink-0" />
              <span className="font-semibold">Storelly Verified Partner</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--t1)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--g600)] shrink-0" />
              <span className="font-semibold">Direct WhatsApp Orders</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--t1)]">
              <Clock className="w-4 h-4 text-[var(--g600)] shrink-0" />
              <span className="font-semibold">Live Merchant Confirmation</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="py-8 px-4 text-center bg-[var(--bg)] rounded-[var(--r16)] border border-[var(--border)] space-y-2">
              <p className="text-xs font-bold text-[var(--t1)]">No customer reviews yet</p>
              <p className="text-[11px] text-[var(--t2)] max-w-sm mx-auto">
                Be the first to share your experience with {business.name}!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-[var(--r16)] bg-[var(--bg)] border border-[var(--border)] space-y-3 shadow-[var(--shadow-xs)] hover:border-[var(--g500)] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center font-bold text-xs uppercase">
                        {rev.customerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--t1)] uppercase tracking-wide">{rev.customerName}</h4>
                        <span className="text-[10px] text-[var(--t3)] font-medium block">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-[var(--g200)] text-[var(--g200)]'}`} />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--t2)] font-medium leading-relaxed italic">"{rev.comment}"</p>

                  {rev.reply && (
                    <div className="p-3 rounded-[var(--r8)] bg-[var(--card)] border border-[var(--border)] text-[11px] space-y-1 relative">
                      <div className="text-[var(--g700)] font-bold text-[9px] uppercase tracking-wider">
                        Merchant Reply
                      </div>
                      <p className="text-[var(--t2)] font-medium">{rev.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Store Information & Location Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* About Section */}
          <div className="p-6 sm:p-7 rounded-[var(--r24)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g600)] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--t1)]">
                  Our Story
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[var(--t2)] font-normal leading-relaxed">
                {business.description || business.bio || `${business.name} is a verified partner committed to providing high-quality offerings and exceptional customer service.`}
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2 border-t border-[var(--border)]">
              <div className="w-8 h-8 rounded-full bg-[var(--g100)] flex items-center justify-center text-[var(--t2)] hover:text-[var(--g600)] transition-colors cursor-pointer">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--g100)] flex items-center justify-center text-[var(--t2)] hover:text-[var(--g600)] transition-colors cursor-pointer">
                <Instagram className="w-3.5 h-3.5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--g100)] flex items-center justify-center text-[var(--t2)] hover:text-[var(--g600)] transition-colors cursor-pointer">
                <Facebook className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="p-6 sm:p-7 rounded-[var(--r24)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g600)] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[var(--t1)] uppercase tracking-[0.15em]">
                  Find Us
                </h4>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-[var(--r8)] bg-[var(--bg)] flex items-center justify-center text-[var(--t3)] shrink-0">
                    <Map className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-[var(--t1)] font-bold">Address</p>
                    <p className="text-[11px] text-[var(--t2)] font-medium leading-relaxed">
                      {business.address || 'Contact merchant for exact location details.'}
                      {business.city ? `, ${business.city}` : ''}
                      {business.state ? `, ${business.state}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-[var(--r8)] bg-[var(--bg)] flex items-center justify-center text-[var(--t3)] shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-[var(--t1)] font-bold">Contact Info</p>
                    <p className="text-[11px] text-[var(--t2)]">{business.email || 'Email not provided'}</p>
                    <p className="text-[11px] text-[var(--t1)] font-bold">{business.whatsapp || business.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {business.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address} ${business.city || ''} ${business.state || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-2.5 ds-btn-secondary text-xs font-bold rounded-[var(--r12)] transition flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>
            )}
          </div>

          {/* Business Hours */}
          <div className="p-6 sm:p-7 rounded-[var(--r24)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g600)] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[var(--t1)] uppercase tracking-[0.15em]">
                  Business Hours
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-emerald-100/60">
                  <span className="text-xs font-semibold text-emerald-800">Schedule</span>
                  <span className="text-xs font-black text-emerald-950">
                    {business.businessHours?.isAlwaysOpen
                      ? '24/7 Available'
                      : business.businessHours?.openTime && business.businessHours?.closeTime
                      ? `${business.businessHours.openTime} — ${business.businessHours.closeTime}`
                      : '10:00 AM — 09:00 PM'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 flex items-center gap-2.5 shadow-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Operational Status</span>
                <span className="text-xs font-black text-emerald-950">Accepting Orders Now</span>
              </div>
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
          <div className="w-40 h-24 rounded-xl border border-emerald-500/40 shadow-lg z-10 hidden sm:flex items-center justify-center bg-black/20 overflow-hidden shrink-0">
            <img src="/storelly7.jpg.jpeg" alt="Store Showroom" className="w-full h-full object-contain object-center" />
          </div>
        </div>
      </main>

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {totalItemsCount > 0 && isOrderable && (
        <aside aria-label="Cart summary" className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-50 animate-in slide-in-from-bottom-10 duration-500">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 bg-slate-950 text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-4 group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 group-hover:rotate-12 transition-transform">
                {totalItemsCount}
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Review Cart</span>
                <div className="text-lg font-black text-white font-heading leading-none">
                  {business.currencySymbol}{subtotal}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl text-emerald-400 text-xs font-black uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </aside>
      )}

      {/* Footer Section */}
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-600">
                    <Store className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{business.name}</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center md:text-left max-w-xs">
                 Shop digital products, services and more directly from {business.name}.
               </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by</span>
                <img src="/main logo.jpg" alt="Storelly" className="h-4 grayscale opacity-60" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">© {new Date().getFullYear()} Storelly Business OS</p>
            </div>
          </div>
        </div>
      </footer>

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

      {/* Specialized Booking Modals */}
      {selectedItemForBooking && (
        resolveItemAction(selectedItemForBooking).isStay ? (
          <StayBookingModal
            business={business}
            item={selectedItemForBooking}
            isOpen={!!selectedItemForBooking}
            onClose={() => setSelectedItemForBooking(null)}
          />
        ) : resolveItemAction(selectedItemForBooking).isRental ? (
          <RentalBookingModal
            business={business}
            item={selectedItemForBooking}
            isOpen={!!selectedItemForBooking}
            onClose={() => setSelectedItemForBooking(null)}
          />
        ) : resolveItemAction(selectedItemForBooking).isConsultation ? (
          <ConsultationBookingModal
            business={business}
            item={selectedItemForBooking}
            isOpen={!!selectedItemForBooking}
            onClose={() => setSelectedItemForBooking(null)}
          />
        ) : (
          <AppointmentBookingModal
            business={business}
            item={selectedItemForBooking}
            isOpen={!!selectedItemForBooking}
            onClose={() => setSelectedItemForBooking(null)}
          />
        )
      )}

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
