import { CreatorAuthGuard } from './components/auth/CreatorAuthGuard';
import { useInitializationGuard } from './hooks/useInitializationGuard';
import { normalizeBusinessData } from './utils/dataNormalization';
import { ViewRouter } from './components/common/ViewRouter';
import {
  resolvePublicRouteFromUrl,
  resolveTargetViewForBusiness,
  PublicRouteInfo,
} from './utils/publicRouteResolver';
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAppLogo, getBusinessLogo } from './utils/branding';
import { useDynamicBranding } from './utils/dynamicBranding';
import {
  Store,
  Briefcase,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Layers,
  ShoppingBag,
  Loader2,
  Lock,
  User,
  LogOut,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  CalendarCheck,
  Star,
  Tag,
  Building2,
  UtensilsCrossed,
  Scissors,
  BedDouble,
  Car,
  Search,
  HelpCircle,
  Home,
  RefreshCw,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StorefrontCartProvider } from './context/StorefrontCartContext';
import { LanguageProvider } from './context/LanguageContext';
import { BusinessProfile } from './types';
import {
  getUserBusinesses,
  getBusinessBySlug,
  getBusinessById,
  createBusiness,
  getStorefrontUrl,
  subscribeToOrders,
  subscribeToBookings,
} from './services/firebaseService';
import { showMerchantNotification } from './services/fcmPushService';
import { testFirestoreConnection, db } from './config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BUSINESS_TYPES } from './services/businessConfig';
import { isCreatorProfile, getPrimaryPublicDisplayPath } from './utils/profileHelper';
import { Sidebar, DashboardTab } from './components/dashboard/Sidebar';
import { Header } from './components/dashboard/Header';
import { FloatingActionButton } from './components/dashboard/FloatingActionButton';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { BioProfileView } from './components/biolink/BioProfileView';
import { StorefrontView } from './components/storefront/StorefrontView';
import { PortfolioShowcase } from './components/storefront/PortfolioShowcase';
import { StandalonePortfolioView } from './components/portfolio/StandalonePortfolioView';
import { StandaloneTrustCardView } from './components/common/StandaloneTrustCardView';
import { QuotePaymentView } from './components/storefront/QuotePaymentView';
import { LandingPage } from './components/landing/LandingPage';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AuthModal } from './components/auth/AuthModal';
import { isUserAuthorizedAdmin } from './services/adminService';

// Lazy-loaded major dashboard views to reduce initial mobile bundle size
const CatalogManager = lazy(() => import('./components/dashboard/CatalogManager').then(m => ({ default: m.CatalogManager })));
const PortfolioManager = lazy(() => import('./components/dashboard/PortfolioManager').then(m => ({ default: m.PortfolioManager })));
const EventManager = lazy(() => import('./components/dashboard/EventManager').then(m => ({ default: m.EventManager })));
const CustomQuoteManager = lazy(() => import('./components/dashboard/CustomQuoteManager').then(m => ({ default: m.CustomQuoteManager })));
const CategoryManager = lazy(() => import('./components/dashboard/CategoryManager').then(m => ({ default: m.CategoryManager })));
const OrderManager = lazy(() => import('./components/dashboard/OrderManager').then(m => ({ default: m.OrderManager })));
const BookingManager = lazy(() => import('./components/dashboard/BookingManager').then(m => ({ default: m.BookingManager })));
const CustomerManager = lazy(() => import('./components/dashboard/CustomerManager').then(m => ({ default: m.CustomerManager })));
const ReviewsManager = lazy(() => import('./components/dashboard/ReviewsManager').then(m => ({ default: m.ReviewsManager })));
const OffersManager = lazy(() => import('./components/dashboard/OffersManager').then(m => ({ default: m.OffersManager })));
const AnalyticsView = lazy(() => import('./components/dashboard/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const ModuleManager = lazy(() => import('./components/dashboard/ModuleManager').then(m => ({ default: m.ModuleManager })));
const CreatorModulesManager = lazy(() => import('./components/dashboard/CreatorModulesManager').then(m => ({ default: m.CreatorModulesManager })));
const StorePaymentsManager = lazy(() => import('./components/dashboard/StorePaymentsManager').then(m => ({ default: m.StorePaymentsManager })));
const StoreSettings = lazy(() => import('./components/dashboard/StoreSettings').then(m => ({ default: m.StoreSettings })));
const NotificationHistoryView = lazy(() => import('./components/dashboard/NotificationHistoryView').then(m => ({ default: m.NotificationHistoryView })));
const BioProfileManager = lazy(() => import('./components/biolink/BioProfileManager').then(m => ({ default: m.BioProfileManager })));
const DigitalCardPreview = lazy(() => import('./components/common/DigitalCardPreview').then(m => ({ default: m.DigitalCardPreview })));
const MasterAdminDashboard = lazy(() => import('./components/admin/MasterAdminDashboard').then(m => ({ default: m.MasterAdminDashboard })));
const MasterAdminLogin = lazy(() => import('./components/admin/MasterAdminLogin').then(m => ({ default: m.MasterAdminLogin })));
const OnboardingWizard = lazy(() => import('./components/auth/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));

/**
 * Mobile-optimized tab loading placeholder
 */
const DashboardTabSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse p-2 sm:p-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 rounded-lg w-48" />
        <div className="h-3.5 bg-slate-200 rounded-md w-72" />
      </div>
      <div className="h-10 bg-slate-200 rounded-xl w-32" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
      <div className="h-36 bg-slate-200 rounded-2xl" />
      <div className="h-36 bg-slate-200 rounded-2xl" />
      <div className="h-36 bg-slate-200 rounded-2xl" />
    </div>
    <div className="h-64 bg-slate-200 rounded-2xl w-full" />
  </div>
);

/**
 * Extract quote payment parameters from URL
 */
function parseQuotePayFromUrl(): { businessId: string; requestId: string } | null {
  return resolvePublicRouteFromUrl().quotePayInfo;
}

/**
 * Extract store slug from current URL query parameters or pathname
 */
function parseStoreSlugFromUrl(): string | null {
  return resolvePublicRouteFromUrl().slug;
}

function generateFallbackOgImage(name: string): string {
  const safeName = (name || 'Official Business').replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#065f46" />
        <stop offset="100%" stop-color="#022c22" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)" />
    <circle cx="1050" cy="150" r="250" fill="#10b981" opacity="0.15" />
    <circle cx="150" cy="500" r="200" fill="#059669" opacity="0.1" />
    <text x="100" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#34d399" letter-spacing="4">OFFICIAL DIGITAL STOREFRONT</text>
    <text x="100" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="#ffffff">${safeName}</text>
    <text x="100" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="#a7f3d0">Catalog, Instant Orders &amp; Direct WhatsApp Checkout</text>
    <rect x="100" y="490" width="220" height="50" rx="25" fill="#10b981" />
    <text x="210" y="523" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Shop Now</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Helper function to update document head with charset, viewport, and vendor-specific og:title, og:description, and og:image
 */
function injectStoreMetadata(business: BusinessProfile) {
  if (!business) return;

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const urlParams = new URLSearchParams(search);
  const isPortfolio =
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/p/') ||
    urlParams.has('portfolio') ||
    urlParams.has('p');

  // Ensure charset and viewport tags exist for social crawlers and mobile previews
  let charsetMeta = document.querySelector('meta[charset]');
  if (!charsetMeta) {
    charsetMeta = document.createElement('meta');
    charsetMeta.setAttribute('charset', 'UTF-8');
    document.head.insertBefore(charsetMeta, document.head.firstChild);
  }

  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.setAttribute('name', 'viewport');
    document.head.appendChild(viewportMeta);
  }
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

  const title = isPortfolio
    ? `${business.name} — ${business.portfolioSettings?.headline || business.tagline || 'Official Creator Portfolio & Case Studies'}`
    : `${business.name} — ${business.tagline || 'Official Storefront'}`;
  document.title = title;

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

  const desc = isPortfolio
    ? (business.portfolioSettings?.subheadline || business.description || `Explore verified work samples, case studies, and creative services by ${business.name}.`)
    : (business.tagline || business.description || `Explore catalog, special offers, and order instantly from ${business.name}.`);

  const img = business.banner || business.logo || generateFallbackOgImage(business.name);
  const url = window.location.href;
  const imageType = img.startsWith('data:image/svg')
    ? 'image/svg+xml'
    : img.endsWith('.png')
    ? 'image/png'
    : img.endsWith('.webp')
    ? 'image/webp'
    : 'image/jpeg';

  // Primary OpenGraph Metadata (LinkedIn, WhatsApp, Facebook, iMessage)
  updateMeta('og:site_name', 'Storelly');
  updateMeta('og:title', isPortfolio ? `${business.name} | Creator Portfolio` : `${business.name} | Official Store`);
  updateMeta('og:description', desc);
  updateMeta('og:image', img);
  if (img.startsWith('https://')) {
    updateMeta('og:image:secure_url', img);
  }
  updateMeta('og:image:width', '1200');
  updateMeta('og:image:height', '630');
  updateMeta('og:image:type', imageType);
  updateMeta('og:image:alt', `${business.name} — ${isPortfolio ? 'Portfolio & Showcase' : 'Storefront & Catalog'}`);
  updateMeta('og:url', url);
  updateMeta('og:type', isPortfolio ? 'profile' : 'website');
  updateMeta('og:locale', 'en_US');

  // LinkedIn & Twitter Card metadata
  updateMeta('twitter:card', 'summary_large_image', false);
  updateMeta('twitter:site', '@Storelly', false);
  updateMeta('twitter:title', isPortfolio ? `${business.name} Portfolio` : business.name, false);
  updateMeta('twitter:description', desc, false);
  updateMeta('twitter:image', img, false);
  updateMeta('twitter:image:alt', `${business.name} preview`, false);

  // Author & Theme color for WhatsApp browser bar
  const themeColor = business.portfolioSettings?.themeColor || (business as unknown as { primaryColor?: string })?.primaryColor || '#10b981';
  updateMeta('author', business.name, false);
  updateMeta('theme-color', themeColor, false);

  // Structured JSON-LD Schema for Google & Search Crawlers
  try {
    let schemaTag = document.querySelector('script[type="application/ld+json"]#storelly-seo-schema');
    if (!schemaTag) {
      schemaTag = document.createElement('script');
      schemaTag.setAttribute('type', 'application/ld+json');
      schemaTag.setAttribute('id', 'storelly-seo-schema');
      document.head.appendChild(schemaTag);
    }

    const structuredData = isPortfolio
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: business.name,
          jobTitle: business.portfolioSettings?.profession || 'Creator',
          description: desc,
          url: url,
          image: img,
          telephone: business.whatsapp || business.phone || undefined,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: business.name,
          description: desc,
          url: url,
          image: img,
          telephone: business.whatsapp || business.phone || undefined,
        };

    schemaTag.textContent = JSON.stringify(structuredData);
  } catch (err) {
    // Non-blocking schema injection failure
  }
}

// Main App Container
function MainContent() {
  const { currentUser, logout, loading: authLoading } = useAuth();

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'storefront'>('dashboard');

  // Business Data States
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessProfile | null>(null);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeNewOrderNotification, setActiveNewOrderNotification] = useState<{
    id: string;
    title: string;
    body: string;
    type: 'order' | 'booking';
  } | null>(null);

  // Cache to track processed orders/bookings to prevent duplicate chimes & false triggers
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const seenBookingIdsRef = useRef<Set<string>>(new Set());


  const playNotificationChime = (volumeMultiplier = 1.0) => {
    const playSingle = (vol: number) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.15); // A5

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      } catch (err) {
        console.warn('Audio chime note:', err);
      }
    };

    // Play 3 times sequentially with volume scaling
    playSingle(0.3 * volumeMultiplier);
    setTimeout(() => playSingle(0.5 * volumeMultiplier), 400);
    setTimeout(() => playSingle(0.8 * volumeMultiplier), 800);
  };

  // Attention Seek Mode: if notification popup is not acknowledged within 15 seconds, repeat chime with increasing volume sequence
  useEffect(() => {
    if (!activeNewOrderNotification) return;

    const timer1 = setTimeout(() => {
      playNotificationChime(1.5);
    }, 15000);

    const timer2 = setTimeout(() => {
      playNotificationChime(2.0);
    }, 30000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeNewOrderNotification]);

  // Public Storefront Resolution States
  const [publicRouteInfo, setPublicRouteInfo] = useState<PublicRouteInfo>(() => resolvePublicRouteFromUrl());
  const publicStoreSlug = publicRouteInfo.slug;
  const [publicBusiness, setPublicBusiness] = useState<BusinessProfile | null>(null);
  const [isLoadingPublicStore, setIsLoadingPublicStore] = useState<boolean>(Boolean(publicRouteInfo.slug));
  const [publicStoreNotFound, setPublicStoreNotFound] = useState(false);

  const initGuard = useInitializationGuard({
    currentUser,
    loadingUser: authLoading,
    selectedBusiness,
    isInitializingBusiness: isLoadingBusinesses,
    publicBusiness,
    isLoadingPublicStore,
    isPublicRoute: Boolean(publicRouteInfo.isPublicRoute || publicStoreSlug),
  });

  // Dynamic White-Labeling & Favicon Sync
  const isPortfolioPath = publicRouteInfo.explicitView === 'portfolio';
  const currentBrandingContext = isPortfolioPath ? 'portfolio' : (publicStoreSlug || viewMode === 'storefront') ? 'store' : 'dashboard';
  
  useDynamicBranding(publicBusiness || selectedBusiness, currentBrandingContext, publicStoreSlug);

  // Quote Pay Direct Route States
  const [quotePayInfo, setQuotePayInfo] = useState<{ businessId: string; requestId: string } | null>(
    () => publicRouteInfo.quotePayInfo
  );
  const [quotePayBusiness, setQuotePayBusiness] = useState<BusinessProfile | null>(null);
  const [loadingQuotePay, setLoadingQuotePay] = useState(false);

  useEffect(() => {
    if (quotePayInfo) {
      setLoadingQuotePay(true);
      getBusinessById(quotePayInfo.businessId)
        .then((biz) => {
          setQuotePayBusiness(biz);
        })
        .catch((err) => {
          console.error('Error fetching quote pay business:', err);
        })
        .finally(() => setLoadingQuotePay(false));
    } else {
      setQuotePayBusiness(null);
    }
  }, [quotePayInfo]);

  // Invoke injectStoreMetadata whenever publicBusiness changes
  useEffect(() => {
    if (publicBusiness) {
      injectStoreMetadata(publicBusiness);
    }
  }, [publicBusiness]);
  const [isMasterAdminMode, setIsMasterAdminMode] = useState<boolean>(false);

  // Check user custom claims, dedicated 'admin-settings' document in Firestore, or email whitelist upon login
  useEffect(() => {
    let isMounted = true;
    async function verifyAdminAuth() {
      if (!currentUser || !currentUser.email) {
        if (isMounted) setIsMasterAdminMode(false);
        return;
      }

      // 1. Check whitelisted super admin email
      if (isUserAuthorizedAdmin(currentUser.email)) {
        if (isMounted) setIsMasterAdminMode(true);
        return;
      }

      try {
        // 2. Check Firebase Auth custom claims
        const tokenResult = await currentUser.getIdTokenResult();
        if (tokenResult.claims.admin || tokenResult.claims.masterAdmin) {
          if (isMounted) setIsMasterAdminMode(true);
          return;
        }

        // 3. Check dedicated 'admins' document in Firestore
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminSnap = await getDoc(adminDocRef);
        if (adminSnap.exists() && adminSnap.data()?.isActive !== false) {
          if (isMounted) setIsMasterAdminMode(true);
          return;
        }

        if (currentUser.email) {
          const emailDocRef = doc(db, 'admins', currentUser.email.toLowerCase());
          const emailSnap = await getDoc(emailDocRef);
          if (emailSnap.exists() && emailSnap.data()?.isActive !== false) {
            if (isMounted) setIsMasterAdminMode(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Error verifying admin authorization:', err);
      }

      if (isMounted) setIsMasterAdminMode(false);
    }

    verifyAdminAuth();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Initialize Firestore connection test on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync state with browser URL popstate navigation (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = resolvePublicRouteFromUrl();
      setPublicRouteInfo(nextRoute);
      setQuotePayInfo(nextRoute.quotePayInfo);

      if (!nextRoute.isPublicRoute && !nextRoute.slug && !nextRoute.quotePayInfo) {
        setPublicBusiness(null);
        setPublicStoreNotFound(false);
        setViewMode('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch and resolve public business whenever publicRouteInfo.slug changes
  const resolvePublicStore = useCallback(async (slug: string) => {
    try {
      setIsLoadingPublicStore(true);
      setPublicStoreNotFound(false);
      const biz = await getBusinessBySlug(slug);
      if (biz) {
        setPublicBusiness(biz);
        setPublicStoreNotFound(false);
        setViewMode('storefront');
      } else {
        setPublicBusiness(null);
        setPublicStoreNotFound(true);
        setViewMode('storefront');
      }
    } catch (err) {
      console.error('Error resolving store by slug:', err);
      setPublicBusiness(null);
      setPublicStoreNotFound(true);
      setViewMode('storefront');
    } finally {
      setIsLoadingPublicStore(false);
    }
  }, []);

  useEffect(() => {
    if (publicRouteInfo.slug) {
      resolvePublicStore(publicRouteInfo.slug);
    } else {
      setPublicBusiness(null);
      setPublicStoreNotFound(false);
      setIsLoadingPublicStore(false);
    }
  }, [publicRouteInfo.slug, resolvePublicStore]);

  // Load Logged-In User's Businesses
  const loadUserBusinesses = async () => {
    if (!currentUser) {
      setBusinesses([]);
      setSelectedBusiness(null);
      setIsLoadingBusinesses(false);
      return;
    }

    try {
      setIsLoadingBusinesses(true);
      const userBizs = await getUserBusinesses(currentUser.uid);
      const activeBizs = (userBizs || []).filter((b) => b.status !== 'deleted');
      setBusinesses(activeBizs);

      if (activeBizs.length > 0) {
        // Restore last selected or select first
        const savedId = localStorage.getItem('storelly_active_biz');
        const found = activeBizs.find((b) => b.id === savedId) || activeBizs[0];
        setSelectedBusiness(found);
        localStorage.setItem('storelly_active_biz', found.id);
      } else {
        setSelectedBusiness(null);
        localStorage.removeItem('storelly_active_biz');
      }
    } catch (err) {
      console.error('Error fetching vendor businesses:', err);
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  const handleBusinessDeleted = (deletedId: string) => {
    if (publicBusiness?.id === deletedId) {
      setPublicBusiness(null);
      setPublicStoreNotFound(true);
    }
    setBusinesses((prev) => {
      const remaining = prev.filter((b) => b.id !== deletedId);
      if (remaining.length > 0) {
        setSelectedBusiness(remaining[0]);
        localStorage.setItem('storelly_active_biz', remaining[0].id);
      } else {
        setSelectedBusiness(null);
        localStorage.removeItem('storelly_active_biz');
      }
      return remaining;
    });
    setActiveTab('overview');
  };

  useEffect(() => {
    if (!authLoading) {
      loadUserBusinesses();
    }
  }, [currentUser, authLoading]);

  // Real-time Push Notification Listener for New Orders & Bookings strictly scoped to active selectedBusiness
  useEffect(() => {
    // Clear notification caches immediately on business switch or unmount to prevent cross-business notification leakage
    seenOrderIdsRef.current.clear();
    seenBookingIdsRef.current.clear();

    // Strictly isolate notifications: do NOT listen or chime when viewing public customer storefronts
    if (!currentUser || !selectedBusiness || !selectedBusiness.id || publicStoreSlug || viewMode === 'storefront') {
      return;
    }

    const biz = selectedBusiness;
    let ordersInitialized = false;
    const unsubOrders = subscribeToOrders(biz.id, (orders) => {
      if (!ordersInitialized) {
        // Initialize existing order cache so existing orders never trigger notifications
        orders.forEach((o) => seenOrderIdsRef.current.add(o.id));
        ordersInitialized = true;
        return;
      }

      // Filter ONLY brand new pending orders for this specific business
      const newOrders = orders.filter(
        (o) => !seenOrderIdsRef.current.has(o.id) && o.status === 'pending' && (!o.businessId || o.businessId === biz.id)
      );

      newOrders.forEach((latest) => {
        seenOrderIdsRef.current.add(latest.id);
        playNotificationChime();
        setActiveNewOrderNotification({
          id: latest.id,
          title: `New Order #${latest.orderNumber || latest.id.slice(-5)} (${biz.name})`,
          body: `${latest.customerName} placed an order for ${biz.currencySymbol || '₹'}${latest.total}`,
          type: 'order',
        });
        showMerchantNotification(
          `📦 New Order #${latest.orderNumber || latest.id.slice(-5)} (${biz.name})!`,
          `${latest.customerName} placed an order for ${biz.currencySymbol || '₹'}${latest.total}`,
          biz
        );
      });
    });

    let bookingsInitialized = false;
    const unsubBookings = subscribeToBookings(biz.id, (bookings) => {
      if (!bookingsInitialized) {
        // Initialize existing booking cache
        bookings.forEach((b) => seenBookingIdsRef.current.add(b.id));
        bookingsInitialized = true;
        return;
      }

      // Filter ONLY brand new pending bookings for this specific business
      const newBookings = bookings.filter(
        (b) => !seenBookingIdsRef.current.has(b.id) && b.status === 'pending' && (!b.businessId || b.businessId === biz.id)
      );

      newBookings.forEach((latestBooking) => {
        seenBookingIdsRef.current.add(latestBooking.id);
        playNotificationChime();
        setActiveNewOrderNotification({
          id: latestBooking.id,
          title: `New Appointment (${biz.name})`,
          body: `${latestBooking.customerName} requested a booking`,
          type: 'booking',
        });
        showMerchantNotification(
          `📅 New Appointment / Booking (${biz.name})!`,
          `${latestBooking.customerName} requested a booking`,
          biz
        );
      });
    });

    return () => {
      unsubOrders();
      unsubBookings();
      seenOrderIdsRef.current.clear();
      seenBookingIdsRef.current.clear();
    };
  }, [currentUser, selectedBusiness?.id, publicStoreSlug, viewMode]);

  // Business Selector Handler
  const handleSelectBusiness = (biz: BusinessProfile) => {
    setSelectedBusiness(biz);
    localStorage.setItem('storelly_active_biz', biz.id);
    // Reset to overview to ensure no cross-profile tab state leaks
    setActiveTab('overview');
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = (newBiz: BusinessProfile) => {
    setBusinesses((prev) => [newBiz, ...prev]);
    setSelectedBusiness(newBiz);
    localStorage.setItem('storelly_active_biz', newBiz.id);
    setIsOnboardingOpen(false);
    setActiveTab('overview');
  };

  // Create Business through Onboarding
  const handleCreateBusiness = async (
    data: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<BusinessProfile> => {
    if (!currentUser) {
      throw new Error('You must be signed in to create a business or creator profile.');
    }
    const ownerId = currentUser.uid;
    return await createBusiness(ownerId, data);
  };

  // Navigate cleanly into Public Storefront or Creator Portfolio
  const navigateToStorefront = (slug: string, explicitPath?: string) => {
    let targetPath = explicitPath;
    if (!targetPath) {
      if (selectedBusiness && isCreatorProfile(selectedBusiness)) {
        targetPath = getPrimaryPublicDisplayPath(selectedBusiness);
      } else {
        targetPath = `/store/${encodeURIComponent(slug)}`;
      }
    }

    window.history.pushState({}, '', targetPath);
    const nextRoute = resolvePublicRouteFromUrl(targetPath);
    setPublicRouteInfo(nextRoute);
    if (selectedBusiness && selectedBusiness.slug === slug) {
      setPublicBusiness(selectedBusiness);
      setIsLoadingPublicStore(false);
      setPublicStoreNotFound(false);
    } else {
      resolvePublicStore(slug);
    }
    setIsShareModalOpen(false);
    setViewMode('storefront');
  };

  // Navigate back to Merchant Dashboard / Home
  const navigateToDashboard = () => {
    window.history.pushState({}, '', '/');
    const nextRoute = resolvePublicRouteFromUrl('/', '');
    setPublicRouteInfo(nextRoute);
    setPublicBusiness(null);
    setPublicStoreNotFound(false);
    setIsLoadingPublicStore(false);
    setViewMode('dashboard');
  };

  // ==========================================
  // ROUTE 0: MASTER ADMIN CONTROL CENTER MODE
  // ==========================================
  if (isMasterAdminMode) {
    if (currentUser && isUserAuthorizedAdmin(currentUser.email)) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}>
          <MasterAdminDashboard
            adminEmail={currentUser.email!}
            onLogout={async () => {
              await logout();
              setIsMasterAdminMode(false);
            }}
            onBackToApp={() => setIsMasterAdminMode(false)}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}>
        <MasterAdminLogin
          onLoginSuccess={() => setIsMasterAdminMode(true)}
          onBackToApp={() => setIsMasterAdminMode(false)}
        />
      </Suspense>
    );
  }

  // ==========================================
  // ROUTE: DIRECT CUSTOM QUOTE PAYMENT
  // ==========================================
  if (quotePayInfo) {
    if (loadingQuotePay) {
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
    if (quotePayBusiness) {
      return (
        <QuotePaymentView
          business={quotePayBusiness}
          requestId={quotePayInfo.requestId}
          onBackToStorefront={() => {
            setQuotePayInfo(null);
            navigateToStorefront(quotePayBusiness.slug);
          }}
        />
      );
    }
  }

  // ==========================================
  // ROUTE 1: PUBLIC STOREFRONT RESOLUTION
  // ==========================================
  if (publicRouteInfo.isPublicRoute || publicStoreSlug || (viewMode === 'storefront' && (publicBusiness || selectedBusiness))) {
    // 1A. Loading Screen (shown while resolving - never flashes 404)
    if (isLoadingPublicStore || (publicStoreSlug && !publicBusiness && !publicStoreNotFound)) {
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

    // 1B. Storefront Found & Active
    // Public routes must strictly resolve using publicBusiness, never fall back to selectedBusiness!
    const rawTargetBusiness = (publicRouteInfo.isPublicRoute || publicStoreSlug)
      ? publicBusiness
      : (viewMode === 'storefront' ? (publicBusiness || selectedBusiness) : null);
    const targetBusiness = normalizeBusinessData(rawTargetBusiness);
    if (targetBusiness && !publicStoreNotFound) {
      const { targetView } = resolveTargetViewForBusiness(publicRouteInfo, targetBusiness);

      // Public URLs must NEVER use dashboard/auth guards or expose Dashboard/Edit/Manage/Owner controls.
      // Owner preview is strictly prohibited on clean public routes.
      const isExplicitOwnerPreview =
        !publicRouteInfo.isPublicRoute &&
        publicRouteInfo.isExplicitPreview &&
        Boolean(currentUser && targetBusiness.ownerId === currentUser.uid);

      return (
        <ViewRouter
          viewMode={targetView === 'store' ? 'storefront' : targetView === 'bio' ? 'biolink' : targetView}
          targetBusiness={targetBusiness}
          isOwner={isExplicitOwnerPreview}
          isExplicitPreview={isExplicitOwnerPreview}
          onBackToDashboard={isExplicitOwnerPreview ? navigateToDashboard : undefined}
          onOpenStorefront={navigateToStorefront}
          onOpenDigitalCard={
            isExplicitOwnerPreview
              ? () => {
                  setSelectedBusiness(targetBusiness);
                  setIsShareModalOpen(true);
                }
              : undefined
          }
        />
      );
    }

    // 1C. Public Handle Not Found (404) -> Clean Public Not Found Page
    const isPortfolioRoute = publicRouteInfo.explicitView === 'portfolio';
    const isBioRoute = publicRouteInfo.explicitView === 'bio';
    const notFoundTypeLabel = isBioRoute ? 'bio link profile' : isPortfolioRoute ? 'creator portfolio' : 'digital storefront';
    const notFoundTitle = isBioRoute ? 'Bio Link Not Found' : isPortfolioRoute ? 'Portfolio Not Found' : 'Store Not Found';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500 selection:text-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            {isBioRoute ? <Sparkles className="w-8 h-8" /> : isPortfolioRoute ? <Briefcase className="w-8 h-8" /> : <Store className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white font-heading">
              {notFoundTitle}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              We couldn't find an active {notFoundTypeLabel} matching the handle{' '}
              <span className="font-mono font-bold text-emerald-400">"{publicStoreSlug}"</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 text-left space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Possible Reasons:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-400">
              <li>The link may contain a spelling mistake.</li>
              <li>The owner may have updated their handle.</li>
              <li>This page has not been published yet.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            {publicStoreSlug && (
              <button
                type="button"
                onClick={() => resolvePublicStore(publicStoreSlug)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading Page</span>
              </button>
            )}

            <button
              type="button"
              onClick={navigateToDashboard}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Visit Storelly Homepage</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ROUTE 2: AUTHENTICATION & LOADING GATES
  // ==========================================
  if (authLoading || (currentUser && isLoadingBusinesses)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden">
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

  // If User is Not Logged In -> Show Full SaaS Landing Page Experience
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onExploreDemoStore={(demoSlug) => {
            navigateToStorefront(demoSlug);
          }}
          onOpenMasterAdmin={() => setIsMasterAdminMode(true)}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    );
  }

  // If user is Logged In, but has NO businesses yet -> Prompt Onboarding as Full Page
  if (!selectedBusiness && businesses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-10 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-white">
              <img src={getAppLogo()} alt="Storelly Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">Storelly</span>
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Merchant Onboarding Portal</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Sign Out
          </button>
        </header>

        {/* Full Page Content Container */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full my-6">
          <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-5 sm:p-8 md:p-10 space-y-6">
            <div className="pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  Welcome to Storelly, {currentUser.displayName || currentUser.email || 'Partner'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Choose between a Vendor Storefront or Creator Workspace to start.
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs self-start sm:self-auto border border-slate-200">
                Setup Wizard
              </div>
            </div>

            <OnboardingWizard
              onComplete={handleOnboardingComplete}
              createBusinessFn={handleCreateBusiness}
            />
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // ROUTE 3: LOGGED-IN VENDOR DASHBOARD
  // ==========================================
  if (!selectedBusiness) {
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

  const biz = selectedBusiness;

  return (
    <div key={biz.id} className="min-h-screen bg-slate-100/70 flex font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        business={biz}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenStorefront={() => navigateToStorefront(biz.slug)}
        onLogout={logout}
        onOpenMasterAdmin={() => setIsMasterAdminMode(true)}
      />

      {/* Main Workspace Area: lg:pl-64 guarantees zero overlap with fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          business={biz}
          userBusinesses={businesses}
          onSelectBusiness={handleSelectBusiness}
          onCreateNewBusiness={() => setIsOnboardingOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenStorefront={() => navigateToStorefront(biz.slug)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onNavigateToNotifications={() => {
            setActiveTab('notifications');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          userName={currentUser.displayName || currentUser.email}
        />

        {/* Tab Content Router */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Suspense fallback={<DashboardTabSkeleton />}>
            {activeTab === 'overview' && (
              <DashboardOverview
                business={biz}
                setActiveTab={setActiveTab}
                onOpenStorefront={() => navigateToStorefront(biz.slug)}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            )}

            {activeTab === 'catalog' && <CatalogManager business={biz} />}

            {activeTab === 'portfolio' && (
              <PortfolioManager
                business={biz}
                onBusinessUpdated={(updated) => {
                  setSelectedBusiness(updated);
                  setBusinesses((prev) =>
                    prev.map((b) => (b.id === updated.id ? updated : b))
                  );
                }}
              />
            )}

            {activeTab === 'events' && <EventManager business={biz} />}

            {activeTab === 'quotes' && <CustomQuoteManager business={biz} />}

            {activeTab === 'categories' && <CategoryManager business={biz} />}

            {activeTab === 'orders' && <OrderManager business={biz} />}

            {activeTab === 'bookings' && <BookingManager business={biz} />}

            {activeTab === 'customers' && <CustomerManager business={biz} />}

            {activeTab === 'reviews' && <ReviewsManager business={biz} />}

            {activeTab === 'offers' && <OffersManager business={biz} />}

            {activeTab === 'analytics' && <AnalyticsView business={biz} />}

            {activeTab === 'modules' && (
              isCreatorProfile(biz) ? (
                <CreatorModulesManager
                  business={biz}
                  onNavigateTab={setActiveTab}
                  onBusinessUpdated={(updated) => {
                    setSelectedBusiness(updated);
                    setBusinesses((prev) =>
                      prev.map((b) => (b.id === updated.id ? updated : b))
                    );
                  }}
                />
              ) : (
                <ModuleManager
                  business={biz}
                  onBusinessUpdated={(updated) => {
                    setSelectedBusiness(updated);
                    setBusinesses((prev) =>
                      prev.map((b) => (b.id === updated.id ? updated : b))
                    );
                  }}
                />
              )
            )}

            {activeTab === 'payments' && (
              <StorePaymentsManager
                business={biz}
                onBusinessUpdated={(updated) => {
                  setSelectedBusiness(updated);
                  setBusinesses((prev) =>
                    prev.map((b) => (b.id === updated.id ? updated : b))
                  );
                }}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationHistoryView
                business={biz}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'biolink' && (
              <BioProfileManager
                business={biz}
                onBusinessUpdated={(updated) => {
                  setSelectedBusiness(updated);
                  setBusinesses((prev) =>
                    prev.map((b) => (b.id === updated.id ? updated : b))
                  );
                }}
              />
            )}

            {activeTab === 'share' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                    Digital Visiting Card & QR
                  </h2>
                  <p className="text-xs text-slate-500">
                    Share your scannable QR card with customers or display it at your store checkout.
                  </p>
                </div>
                <DigitalCardPreview
                  business={biz}
                  onOpenStore={() => navigateToStorefront(biz.slug)}
                />
              </div>
            )}

            {(activeTab === 'settings' || activeTab === 'profile') && (
              <StoreSettings
                business={biz}
                onBusinessUpdated={(updated) => {
                  setSelectedBusiness(updated);
                  setBusinesses((prev) =>
                    prev.map((b) => (b.id === updated.id ? updated : b))
                  );
                }}
                onBusinessDeleted={handleBusinessDeleted}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Share / QR Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition cursor-pointer"
            >
              ✕
            </button>
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>}>
              <DigitalCardPreview
                business={biz}
                onOpenStore={() => {
                  setIsShareModalOpen(false);
                  navigateToStorefront(biz.slug);
                }}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Onboarding / Create New Store Modal */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl border border-slate-200 my-auto">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              ✕
            </button>
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>}>
              <OnboardingWizard
                onComplete={handleOnboardingComplete}
                onCancel={() => setIsOnboardingOpen(false)}
                createBusinessFn={handleCreateBusiness}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Floating Quick Actions Button with Dynamic Branding & Profile Differentiation */}
      <FloatingActionButton
        business={biz}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        onOpenStorefront={() => navigateToStorefront(biz.slug)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Real-time Order & Booking Pop-up Alert Banner with Swipe-to-Dismiss */}
      <AnimatePresence>
        {activeNewOrderNotification && (
          <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
                  setActiveNewOrderNotification(null);
                }
              }}
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -30, opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              whileTap={{ cursor: 'grabbing' }}
              className="max-w-md w-full bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 text-white rounded-3xl p-5 shadow-2xl flex items-start gap-4 cursor-grab touch-pan-y pointer-events-auto select-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 overflow-hidden">
                {biz.logo ? (
                  <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-6 h-6 animate-bounce" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🔔 New Order Alert</span>
                    <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">(Swipe to dismiss)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNewOrderNotification(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="font-extrabold text-sm text-white">{activeNewOrderNotification?.title}</h4>
                <p className="text-xs text-slate-300">{activeNewOrderNotification?.body}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeNewOrderNotification) {
                        setActiveTab(activeNewOrderNotification.type === 'order' ? 'orders' : 'bookings');
                        setActiveNewOrderNotification(null);
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    View in Orders <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StorefrontCartProvider>
        <LanguageProvider>
          <MainContent />
          <OfflineBanner />
        </LanguageProvider>
      </StorefrontCartProvider>
    </AuthProvider>
  );
}
