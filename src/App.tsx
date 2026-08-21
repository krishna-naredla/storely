import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
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
  createBusiness,
  getStorefrontUrl,
  subscribeToOrders,
  subscribeToBookings,
} from './services/firebaseService';
import { showMerchantNotification } from './services/fcmPushService';
import { testFirestoreConnection, db } from './config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BUSINESS_TYPES } from './services/businessConfig';
import { Sidebar, DashboardTab } from './components/dashboard/Sidebar';
import { Header } from './components/dashboard/Header';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CatalogManager } from './components/dashboard/CatalogManager';
import { CategoryManager } from './components/dashboard/CategoryManager';
import { OrderManager } from './components/dashboard/OrderManager';
import { BookingManager } from './components/dashboard/BookingManager';
import { CustomerManager } from './components/dashboard/CustomerManager';
import { ReviewsManager } from './components/dashboard/ReviewsManager';
import { OffersManager } from './components/dashboard/OffersManager';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { ModuleManager } from './components/dashboard/ModuleManager';
import { StorePaymentsManager } from './components/dashboard/StorePaymentsManager';
import { StoreSettings } from './components/dashboard/StoreSettings';
import { NotificationHistoryView } from './components/dashboard/NotificationHistoryView';
import { DigitalCardPreview } from './components/common/DigitalCardPreview';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { StorefrontView } from './components/storefront/StorefrontView';
import { LandingPage } from './components/landing/LandingPage';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { MasterAdminDashboard } from './components/admin/MasterAdminDashboard';
import { MasterAdminLogin } from './components/admin/MasterAdminLogin';
import { isUserAuthorizedAdmin } from './services/adminService';

/**
 * Extract store slug from current URL query parameters or pathname
 */
function parseStoreSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check query parameter e.g. ?store=myshop or ?store=nmk-restent
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  if (storeParam && storeParam.trim()) {
    return storeParam.trim();
  }

  // 2. Check path e.g. /store/myshop or /store/myshop/
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/store\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  return null;
}

function generateFallbackOgImage(name: string): string {
  const safeName = (name || 'Storelly Business').replace(/[<>&'"]/g, '');
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
    <text x="100" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#34d399" letter-spacing="4">STORELLY DIGITAL STORE</text>
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

  const title = `${business.name} - Official Store | Storelly`;
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

  const desc = business.tagline || business.description || `Explore catalog, special offers, and order instantly from ${business.name} on Storelly.`;
  const img = business.banner || business.logo || generateFallbackOgImage(business.name);
  const url = window.location.href;

  updateMeta('og:title', business.name);
  updateMeta('og:description', desc);
  updateMeta('og:image', img);
  updateMeta('og:url', url);
  updateMeta('og:type', 'website');

  updateMeta('twitter:card', 'summary_large_image', false);
  updateMeta('twitter:title', business.name, false);
  updateMeta('twitter:description', desc, false);
  updateMeta('twitter:image', img, false);
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
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [activeNewOrderNotification, setActiveNewOrderNotification] = useState<{
    id: string;
    title: string;
    body: string;
    type: 'order' | 'booking';
  } | null>(null);

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
      const slug = parseStoreSlugFromUrl();
      setPublicStoreSlug(slug);
      if (!slug) {
        setPublicBusiness(null);
        setPublicStoreNotFound(false);
        setViewMode('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      setBusinesses(userBizs);

      if (userBizs.length > 0) {
        // Restore last selected or select first
        const savedId = localStorage.getItem('storelly_active_biz');
        const found = userBizs.find((b) => b.id === savedId) || userBizs[0];
        setSelectedBusiness(found);
      } else {
        setSelectedBusiness(null);
      }
    } catch (err) {
      console.error('Error fetching vendor businesses:', err);
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadUserBusinesses();
    }
  }, [currentUser, authLoading]);

  // Real-time FCM Push Notification Listener for New Orders & Bookings across ALL user businesses
  useEffect(() => {
    if (!businesses || businesses.length === 0) return;

    const unsubs: (() => void)[] = [];

    businesses.forEach((biz) => {
      let ordersInitialized = false;
      const unsubOrders = subscribeToOrders(biz.id, (orders) => {
        if (!ordersInitialized) {
          ordersInitialized = true;
          return;
        }
        const latest = orders[0];
        if (latest && latest.status === 'pending') {
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
        }
      });
      unsubs.push(unsubOrders);

      let bookingsInitialized = false;
      const unsubBookings = subscribeToBookings(biz.id, (bookings) => {
        if (!bookingsInitialized) {
          bookingsInitialized = true;
          return;
        }
        const latestBooking = bookings[0];
        if (latestBooking && latestBooking.status === 'pending') {
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
        }
      });
      unsubs.push(unsubBookings);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [businesses]);

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

  // Navigate cleanly into Public Storefront
  const navigateToStorefront = (slug: string) => {
    window.history.pushState({}, '', `/store/${encodeURIComponent(slug)}`);
    setPublicStoreSlug(slug);
    if (selectedBusiness && selectedBusiness.slug === slug) {
      setPublicBusiness(selectedBusiness);
    }
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
  // ROUTE 1: PUBLIC STOREFRONT RESOLUTION
  // ==========================================
  if (publicStoreSlug || (viewMode === 'storefront' && (publicBusiness || selectedBusiness))) {
    // 1A. Loading Storefront Screen
    if (isLoadingPublicStore) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center text-slate-900 space-y-6 px-4 selection:bg-emerald-500 selection:text-white">
          <div className="max-w-sm w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Vendor Logo or 2D Vector Clipart Illustration */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl blur-md opacity-20 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center overflow-hidden shadow-sm">
                {publicBusiness?.logoUrl ? (
                  <img
                    src={publicBusiness.logoUrl}
                    alt={publicBusiness.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img src="/storelly3.jpg.jpeg" alt="Storelly Logo" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 font-heading tracking-tight">
                {publicBusiness ? publicBusiness.name : 'Opening Digital Storefront...'}
              </h3>
              <p className="text-xs text-slate-500">
                Preparing secure catalog for <span className="font-mono text-emerald-600 font-bold">@{publicStoreSlug}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Loading Store...</span>
            </div>
          </div>
        </div>
      );
    }

    // 1B. Storefront Found & Active
    const targetBusiness = publicStoreSlug ? publicBusiness : selectedBusiness;
    if (targetBusiness && !publicStoreNotFound) {
      const isOwner = currentUser && selectedBusiness && selectedBusiness.id === targetBusiness.id;
      return (
        <StorefrontView
          business={targetBusiness}
          onBackToDashboard={isOwner ? navigateToDashboard : undefined}
          onOpenDigitalCard={() => setIsShareModalOpen(true)}
        />
      );
    }

    // 1C. Storefront Not Found (404) -> Clean Public Not Found Page
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500 selection:text-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Store className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white font-heading">Store Not Found</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              We couldn't find an active digital storefront matching the handle{' '}
              <span className="font-mono font-bold text-emerald-400">"{publicStoreSlug}"</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 text-left space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Possible Reasons:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-400">
              <li>The store link may contain a spelling mistake.</li>
              <li>The merchant may have updated their store handle.</li>
              <li>The store has not been published yet.</li>
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
                <span>Retry Loading Store</span>
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center text-slate-900 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shadow-md shadow-emerald-500/10 animate-pulse overflow-hidden p-1">
          <img src="/storelly3.jpg.jpeg" alt="Storelly Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-slate-900">Storelly Business OS</h2>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            Loading merchant workspace...
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
                  Welcome to Storelly, {currentUser.displayName || currentUser.email || 'Merchant'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Let's create your digital business profile & public storefront in 4 simple steps.
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs self-start sm:self-auto border border-emerald-200">
                Step-by-Step Setup
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
          {activeTab === 'overview' && (
            <DashboardOverview
              business={biz}
              setActiveTab={setActiveTab}
              onOpenStorefront={() => navigateToStorefront(biz.slug)}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          )}

          {activeTab === 'catalog' && <CatalogManager business={biz} />}

          {activeTab === 'categories' && <CategoryManager business={biz} />}

          {activeTab === 'orders' && <OrderManager business={biz} />}

          {activeTab === 'bookings' && <BookingManager business={biz} />}

          {activeTab === 'customers' && <CustomerManager business={biz} />}

          {activeTab === 'reviews' && <ReviewsManager business={biz} />}

          {activeTab === 'offers' && <OffersManager business={biz} />}

          {activeTab === 'analytics' && <AnalyticsView business={biz} />}

          {activeTab === 'modules' && (
            <ModuleManager
              business={biz}
              onBusinessUpdated={(updated) => {
                setSelectedBusiness(updated);
                setBusinesses((prev) =>
                  prev.map((b) => (b.id === updated.id ? updated : b))
                );
              }}
            />
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
            />
          )}
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
            <DigitalCardPreview
              business={biz}
              onOpenStore={() => {
                setIsShareModalOpen(false);
                navigateToStorefront(biz.slug);
              }}
            />
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
            <OnboardingWizard
              onComplete={handleOnboardingComplete}
              onCancel={() => setIsOnboardingOpen(false)}
              createBusinessFn={handleCreateBusiness}
            />
          </div>
        </div>
      )}

      {/* Floating Quick Actions Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {isQuickActionsOpen && (
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 w-56 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              Quick Actions
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab('catalog'); setIsQuickActionsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700"><Plus className="w-3.5 h-3.5" /></div>
              <span>Add Product / Item</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('offers'); setIsQuickActionsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-800 rounded-xl transition flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700"><Tag className="w-3.5 h-3.5" /></div>
              <span>Create Offer / Coupon</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('orders'); setIsQuickActionsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-xl transition flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700"><ShoppingBag className="w-3.5 h-3.5" /></div>
              <span>View / Create Order</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('bookings'); setIsQuickActionsOpen(false); }}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 rounded-xl transition flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700"><CalendarCheck className="w-3.5 h-3.5" /></div>
              <span>New Appointment</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center overflow-hidden transition transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
          title="Quick Actions Menu"
        >
          {biz.logo ? (
            <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-sm">{biz.name.slice(0, 2).toUpperCase()}</span>
          )}
        </button>
      </div>

      {/* Real-time Order & Booking Pop-up Alert Banner for Vendors */}
      {activeNewOrderNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full bg-slate-900 border border-emerald-500/50 text-white rounded-3xl p-5 shadow-2xl animate-in slide-in-from-top-5 duration-300 flex items-start gap-4 mx-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 overflow-hidden">
            {biz.logo ? (
              <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className="w-6 h-6 animate-bounce" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🔔 New Order Alert</span>
              <button
                type="button"
                onClick={() => setActiveNewOrderNotification(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
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
        </div>
      )}
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
        </LanguageProvider>
      </StorefrontCartProvider>
    </AuthProvider>
  );
}
