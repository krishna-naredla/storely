import { CreatorAuthGuard } from './components/auth/CreatorAuthGuard';
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { ResponsiveDiagnostic } from './components/dashboard/ResponsiveDiagnostic';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { BioProfileView } from './components/biolink/BioProfileView';
import { StorefrontView } from './components/storefront/StorefrontView';
import { PortfolioShowcase } from './components/storefront/PortfolioShowcase';
import { StandalonePortfolioView } from './components/portfolio/StandalonePortfolioView';
import { QuotePaymentView } from './components/storefront/QuotePaymentView';
import { LandingPage } from './components/landing/LandingPage';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
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
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  const qBiz = urlParams.get('quote_biz');
  const qReq = urlParams.get('quote_req');
  if (qBiz && qReq) {
    return { businessId: qBiz.trim(), requestId: qReq.trim() };
  }
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/quote-pay\/([^/?#]+)\/([^/?#]+)/i);
  if (match && match[1] && match[2]) {
    return { businessId: decodeURIComponent(match[1]).trim(), requestId: decodeURIComponent(match[2]).trim() };
  }
  return null;
}

/**
 * Extract store slug from current URL query parameters or pathname
 */
function parseStoreSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  
  const bioMatch = pathname.match(/^\/@([^/?#]+)/i);
  if (bioMatch && bioMatch[1]) {
    return decodeURIComponent(bioMatch[1]).trim();
  }
  
  const portMatch = pathname.match(/^\/portfolio\/([^/?#]+)/i);
  if (portMatch && portMatch[1]) {
    return decodeURIComponent(portMatch[1]).trim();
  }

  const shortPortMatch = pathname.match(/^\/p\/([^/?#]+)/i);
  if (shortPortMatch && shortPortMatch[1]) {
    return decodeURIComponent(shortPortMatch[1]).trim();
  }

  const match = pathname.match(/^\/store\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const portfolioParam = urlParams.get('portfolio') || urlParams.get('p');
  if (portfolioParam && portfolioParam.trim()) {
    return decodeURIComponent(portfolioParam).trim();
  }

  const bioParam = urlParams.get('bio');
  if (bioParam && bioParam.trim()) {
    return decodeURIComponent(bioParam).trim();
  }

  const creatorParam = urlParams.get('creator');
  if (creatorParam && creatorParam.trim()) {
    return decodeURIComponent(creatorParam).trim();
  }

  const storeParam = urlParams.get('store');
  if (storeParam && storeParam.trim()) {
    return decodeURIComponent(storeParam).trim();
  }

  return null;
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

  updateMeta('og:title', isPortfolio ? `${business.name} Portfolio` : business.name);
  updateMeta('og:description', desc);
  updateMeta('og:image', img);
  updateMeta('og:url', url);
  updateMeta('og:type', isPortfolio ? 'profile' : 'website');

  updateMeta('twitter:card', 'summary_large_image', false);
  updateMeta('twitter:title', isPortfolio ? `${business.name} Portfolio` : business.name, false);
  updateMeta('twitter:description', desc, false);
  updateMeta('twitter:image', img, false);

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

  // Register Service Worker for PWA Web Push background alerts
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('Storelly PWA ServiceWorker registered with scope:', reg.scope);
      }).catch((err) => {
        console.warn('ServiceWorker registration failed:', err);
      });
    }
  }, []);

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
  const [publicStoreSlug, setPublicStoreSlug] = useState<string | null>(parseStoreSlugFromUrl);
  const [publicBusiness, setPublicBusiness] = useState<BusinessProfile | null>(null);
  const [isLoadingPublicStore, setIsLoadingPublicStore] = useState(false);
  const [publicStoreNotFound, setPublicStoreNotFound] = useState(false);

  // Dynamic White-Labeling & Favicon Sync
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isPortfolioPath = currentPathname.startsWith('/portfolio') || currentPathname.startsWith('/p/');
  const currentBrandingContext = isPortfolioPath ? 'portfolio' : (publicStoreSlug || viewMode === 'storefront') ? 'store' : 'dashboard';
  
  useDynamicBranding(publicBusiness || selectedBusiness, currentBrandingContext, publicStoreSlug);

  // Quote Pay Direct Route States
  const [quotePayInfo, setQuotePayInfo] = useState<{ businessId: string; requestId: string } | null>(parseQuotePayFromUrl);
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

        // 3. Check dedicated 'admin-settings' document in Firestore
        const adminDocRef = doc(db, 'admin_settings', currentUser.uid);
        const adminSnap = await getDoc(adminDocRef);
        if (adminSnap.exists() && adminSnap.data()?.isActive) {
          if (isMounted) setIsMasterAdminMode(true);
          return;
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
      const quoteInfo = parseQuotePayFromUrl();
      setQuotePayInfo(quoteInfo);

      const slug = parseStoreSlugFromUrl();
      setPublicStoreSlug(slug);
      if (!slug && !quoteInfo) {
        setPublicBusiness(null);
        setPublicStoreNotFound(false);
        setViewMode('dashboard');
      } else {
        // Handle item deep linking
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('item');
        if (itemId && publicBusiness) {
           // We might need to fetch the item specifically if not in list
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [publicBusiness]);

  // Fetch and resolve public business whenever publicStoreSlug changes
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
    if (publicStoreSlug) {
      resolvePublicStore(publicStoreSlug);
    } else {
      setPublicBusiness(null);
      setPublicStoreNotFound(false);
    }
  }, [publicStoreSlug, resolvePublicStore]);

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
    const ownerId = currentUser ? currentUser.uid : 'guest_user';
    return await createBusiness(ownerId, data);
  };

  // Navigate cleanly into Public Storefront or Creator Portfolio
  const navigateToStorefront = (slug: string, explicitPath?: string) => {
    let targetPath = `/store/${encodeURIComponent(slug)}`;
    if (explicitPath) {
      targetPath = explicitPath;
    } else if (selectedBusiness && isCreatorProfile(selectedBusiness)) {
      targetPath = getPrimaryPublicDisplayPath(selectedBusiness);
    }

    window.history.pushState({}, '', targetPath);
    setPublicStoreSlug(slug);
    if (selectedBusiness && selectedBusiness.slug === slug) {
      setPublicBusiness(selectedBusiness);
    }
    setIsShareModalOpen(false);
    setViewMode('storefront');
  };

  // Navigate back to Merchant Dashboard / Home
  const navigateToDashboard = () => {
    window.history.pushState({}, '', '/');
    setPublicStoreSlug(null);
    setPublicBusiness(null);
    setPublicStoreNotFound(false);
    setViewMode('dashboard');
  };

  // ==========================================
  // ROUTE 0: MASTER ADMIN CONTROL CENTER MODE
  // ==========================================
  if (isMasterAdminMode) {
    if (currentUser && isUserAuthorizedAdmin(currentUser.email)) {
      return (
        <MasterAdminDashboard
          adminEmail={currentUser.email!}
          onLogout={async () => {
            await logout();
            setIsMasterAdminMode(false);
          }}
          onBackToApp={() => setIsMasterAdminMode(false)}
        />
      );
    }
    return (
      <MasterAdminLogin
        onLoginSuccess={() => setIsMasterAdminMode(true)}
        onBackToApp={() => setIsMasterAdminMode(false)}
      />
    );
  }

  // ==========================================
  // ROUTE: DIRECT CUSTOM QUOTE PAYMENT
  // ==========================================
  if (quotePayInfo) {
    if (loadingQuotePay) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span>Loading Custom Quote Payment...</span>
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
  if (publicStoreSlug || (viewMode === 'storefront' && (publicBusiness || selectedBusiness))) {
    const isPortfolioPath =
      window.location.pathname.startsWith('/portfolio') ||
      window.location.pathname.startsWith('/p/') ||
      new URLSearchParams(window.location.search).has('portfolio') ||
      new URLSearchParams(window.location.search).has('p');

    // 1A. Loading Screen
    if (isLoadingPublicStore) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center space-y-6 px-4 ${
          isPortfolioPath
            ? 'bg-slate-950 text-white selection:bg-indigo-500 selection:text-white'
            : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-slate-900 selection:bg-emerald-500 selection:text-white'
        }`}>
          <div className={`max-w-sm w-full backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300 ${
            isPortfolioPath
              ? 'bg-slate-900/90 border border-slate-800'
              : 'bg-white/90 border border-slate-200/80'
          }`}>
            {/* Creator / Vendor Custom Logo or Dynamic Branded Monogram */}
            <div className="relative">
              <div
                className={`absolute -inset-2 rounded-3xl blur-md opacity-30 animate-pulse ${
                  isPortfolioPath
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                }`}
              />
              <div
                className={`relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm ${
                  isPortfolioPath
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-white border border-emerald-200'
                }`}
              >
                {publicBusiness?.logo || publicBusiness?.profileImage ? (
                  <img
                    src={publicBusiness.logo || publicBusiness.profileImage}
                    alt={publicBusiness.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-white font-black text-2xl font-heading shadow-inner ${
                      isPortfolioPath
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-700'
                        : 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    }`}
                  >
                    {(publicBusiness?.name || publicStoreSlug || 'S').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3
                className={`text-base font-black font-heading tracking-tight ${
                  isPortfolioPath ? 'text-white' : 'text-slate-900'
                }`}
              >
                {publicBusiness?.name || (publicStoreSlug ? `@${publicStoreSlug}` : isPortfolioPath ? 'Creator Portfolio' : 'Storefront')}
              </h3>
              <p className={`text-xs ${isPortfolioPath ? 'text-slate-400' : 'text-slate-500'}`}>
                {isPortfolioPath
                  ? 'Official Creator Portfolio & Showcase'
                  : publicBusiness?.tagline || (publicStoreSlug ? `Official Storefront • @${publicStoreSlug}` : 'Connecting to secure catalog...')}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Loader2 className={`w-4 h-4 animate-spin ${isPortfolioPath ? 'text-indigo-400' : 'text-emerald-600'}`} />
              <span className={`text-xs font-bold tracking-wider ${isPortfolioPath ? 'text-slate-400' : 'text-slate-600'}`}>
                Connecting...
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 1B. Storefront Found & Active
    const targetBusiness = publicStoreSlug ? publicBusiness : selectedBusiness;
    if (targetBusiness && !publicStoreNotFound) {
      const isOwner = currentUser && selectedBusiness && selectedBusiness.id === targetBusiness.id;
      
      // Check if it's a bio link, digital store, or portfolio
      const pathname = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const isBioStoreRoute =
        Boolean(pathname.match(/^\/@[^/?#]+\/(store|shop|products|catalog)/i)) ||
        (pathname.startsWith('/@') && (urlParams.get('view') === 'store' || urlParams.get('tab') === 'store'));
      const isBioLink = !isBioStoreRoute && (pathname.startsWith('/@') || urlParams.has('bio'));
      const isPortfolio =
        pathname.startsWith('/portfolio') ||
        pathname.startsWith('/p/') ||
        urlParams.has('portfolio') ||
        urlParams.has('p');
      
      if (isBioLink) {
        return (
          <CreatorAuthGuard business={targetBusiness} moduleName="bio" isOwner={!!isOwner}>
            <BioProfileView
              business={targetBusiness}
              onBackToDashboard={isOwner ? navigateToDashboard : undefined}
              onOpenStorefront={() => navigateToStorefront(targetBusiness.slug, `/store/${targetBusiness.slug}`)}
            />
          </CreatorAuthGuard>
        );
      }

      if (isPortfolio) {
        return (
          <CreatorAuthGuard business={targetBusiness} moduleName="portfolio" isOwner={!!isOwner}>
            <StandalonePortfolioView
              business={targetBusiness}
              onBackToDashboard={isOwner ? navigateToDashboard : undefined}
              isOwner={!!isOwner}
            />
          </CreatorAuthGuard>
        );
      }

      // Default to Storefront
      return (
        <CreatorAuthGuard business={targetBusiness} moduleName="store" isOwner={!!isOwner}>
          <StorefrontView
            business={targetBusiness}
            onBackToDashboard={isOwner ? navigateToDashboard : undefined}
            onOpenDigitalCard={() => {
              setSelectedBusiness(targetBusiness);
              setIsShareModalOpen(true);
            }}
          />
        </CreatorAuthGuard>
      );
    }

    // 1C. Public Handle Not Found (404) -> Clean Public Not Found Page
    const currentPath = window.location.pathname;
    const currentParams = new URLSearchParams(window.location.search);
    const isPortfolioRoute =
      currentPath.startsWith('/portfolio') ||
      currentPath.startsWith('/p/') ||
      currentParams.has('portfolio') ||
      currentParams.has('p');

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500 selection:text-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            {isPortfolioRoute ? <Briefcase className="w-8 h-8" /> : <Store className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white font-heading">
              {isPortfolioRoute ? 'Portfolio Not Found' : 'Store Not Found'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              We couldn't find an active {isPortfolioRoute ? 'creator portfolio' : 'digital storefront'} matching the handle{' '}
              <span className="font-mono font-bold text-emerald-400">"{publicStoreSlug}"</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 text-left space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Possible Reasons:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-400">
              <li>The {isPortfolioRoute ? 'portfolio' : 'store'} link may contain a spelling mistake.</li>
              <li>The {isPortfolioRoute ? 'creator' : 'merchant'} may have updated their handle.</li>
              <li>The {isPortfolioRoute ? 'portfolio' : 'store'} has not been published yet.</li>
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
                <span>Retry Loading {isPortfolioRoute ? 'Portfolio' : 'Store'}</span>
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
    const isCreator = selectedBusiness ? isCreatorProfile(selectedBusiness) : false;
    const initial = (selectedBusiness?.name || 'S').slice(0, 1).toUpperCase();
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl animate-pulse overflow-hidden p-1">
          {selectedBusiness?.logo || selectedBusiness?.profileImage ? (
            <img
              src={selectedBusiness.logo || selectedBusiness.profileImage}
              alt={selectedBusiness.name}
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`w-full h-full rounded-xl flex items-center justify-center text-white font-black text-xl font-heading ${
                isCreator ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
              }`}
            >
              {initial}
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-white">
            {selectedBusiness?.name || 'Business Workspace'}
          </h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Loading workspace &amp; catalog...</span>
          </p>
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
              <Store className="w-5 h-5" />
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
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full my-6">
          <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 space-y-6">
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
  const biz = selectedBusiness!;

  return (
    <div className="min-h-screen bg-slate-100/70 flex font-sans text-slate-900">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
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
                <h4 className="font-extrabold text-sm text-white">{activeNewOrderNotification.title}</h4>
                <p className="text-xs text-slate-300">{activeNewOrderNotification.body}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeNewOrderNotification.type === 'order' ? 'orders' : 'bookings');
                      setActiveNewOrderNotification(null);
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
          <PWAInstallPrompt />
          <OfflineBanner />
          <ResponsiveDiagnostic />
        </LanguageProvider>
      </StorefrontCartProvider>
    </AuthProvider>
  );
}
