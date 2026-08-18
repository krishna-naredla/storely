import React, { useState, useEffect } from 'react';
import {
  Store,
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
} from 'lucide-react';
import {
  BusinessProfile,
  CatalogItem,
  Category,
  Offer,
  Review,
} from '../../types';
import {
  getCatalogItems,
  getCategories,
  getOffers,
  getReviews,
  recordAnalyticsEvent,
} from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { ItemDetailModal } from './ItemDetailModal';
import { StorefrontCartDrawer } from './StorefrontCartDrawer';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';
import { BookingModal } from './BookingModal';
import { ReviewSubmitModal } from './ReviewSubmitModal';

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
    if (business.seoMetaTitle) {
      document.title = business.seoMetaTitle;
    } else {
      document.title = `${business.name} - Official Store`;
    }
    
    if (business.seoMetaDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', business.seoMetaDescription);
    }
  }, [business]);
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
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  // Modals
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<CatalogItem | null>(null);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState<CatalogItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  // Initialize cart business ID & record telemetry
  useEffect(() => {
    setStorefrontBusinessId(business.id);
    recordAnalyticsEvent(business.id, 'store_view', { slug: business.slug });
  }, [business.id, business.slug]);

  // Load all public store data from Firestore
  const loadStoreData = async () => {
    try {
      setIsLoading(true);
      const [fetchedItems, fetchedCategories, fetchedOffers, fetchedReviews] = await Promise.all([
        getCatalogItems(business.id, true),
        getCategories(business.id),
        getOffers(business.id),
        getReviews(business.id),
      ]);

      setCatalogItems(fetchedItems);
      setCategories(fetchedCategories.filter((c) => c.isActive !== false));
      setOffers(fetchedOffers.filter((o) => o.isActive));
      setReviews(fetchedReviews.filter((r) => r.status === 'published'));
    } catch (err) {
      console.error('Error loading storefront data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [business.id]);

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
    business.modules.cart_ordering ||
    business.modules.products ||
    business.modules.menu ||
    business.modules.table_delivery;

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
        <div className="relative h-44 sm:h-60 w-full bg-slate-900 overflow-hidden">
          {business.banner || business.coverImage ? (
            <img
              src={business.banner || business.coverImage}
              alt={business.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-800">
              <Store className="w-12 h-12 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Profile Card Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative pb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-5 sm:p-6 -mt-16 sm:-mt-20 mb-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Logo and Primary Info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-xl border-2 border-slate-100 overflow-hidden shrink-0 -mt-12 sm:-mt-16 relative z-20 flex items-center justify-center">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-600 text-white font-extrabold text-3xl flex items-center justify-center rounded-xl shadow-inner">
                    {business.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 mb-1 pt-1 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {business.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>

                {business.tagline && (
                  <p className="text-sm font-medium text-slate-600 line-clamp-1">
                    {business.tagline}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5 flex-wrap">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {bizMeta.label}
                  </span>

                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{averageRating}</span>
                    <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
                  </div>

                  {business.city && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{business.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Merchant Contact & Share CTAs */}
            <div className="flex items-center gap-2 sm:mb-1 shrink-0 flex-wrap pt-2 sm:pt-0">
              <PWAInstallPrompt variant="button" customTitle={`Install ${business.name} App`} />

              <a
                href={`https://wa.me/${(business.whatsapp || business.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hi ${business.name}, I am visiting your online storefront.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${business.phone || business.whatsapp}`}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-xs"
                title="Call Merchant"
              >
                <Phone className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleShareStore}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-xs"
                title="Share Store Link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>

              {onOpenDigitalCard && (
                <button
                  type="button"
                  onClick={onOpenDigitalCard}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer shadow-xs"
                  title="View Digital Visiting Card"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                </button>
              )}
            </div>
          </div>

          {/* Description & Store Badges */}
          {business.description && (
            <p className="text-xs text-slate-600 max-w-3xl pt-3 mt-3 border-t border-slate-100 leading-relaxed">
              {business.description}
            </p>
          )}
          </div>
        </div>
      </header>

      {/* Main Store Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-slate-200 p-3 space-y-3 animate-pulse"
                >
                  <div className="h-36 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
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
                  item.type === 'package';

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
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <ShoppingBag className="w-10 h-10 stroke-1" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
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

                        {/* Order / Book Button */}
                        {isBookable ? (
                          <button
                            type="button"
                            onClick={() => setSelectedItemForBooking(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                          >
                            Book
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={item.inStock === false}
                            onClick={() => {
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
                            {inCart ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span className="hidden sm:inline">In Cart ({inCart.quantity})</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Add</span>
                              </>
                            )}
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

      {/* Write Review Modal */}
      <ReviewSubmitModal
        business={business}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={loadStoreData}
      />
    </div>
  );
};
