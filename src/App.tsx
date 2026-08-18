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
import { StoreSettings } from './components/dashboard/StoreSettings';
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

  // Public Storefront Resolution States
  const [publicStoreSlug, setPublicStoreSlug] = useState<string | null>(parseStoreSlugFromUrl);
  const [publicBusiness, setPublicBusiness] = useState<BusinessProfile | null>(null);
  const [isLoadingPublicStore, setIsLoadingPublicStore] = useState(false);
  const [publicStoreNotFound, setPublicStoreNotFound] = useState(false);
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

  // Real-time FCM Push Notification Listener for New Orders & Bookings
  useEffect(() => {
    if (!selectedBusiness) return;

    let ordersInitialized = false;
    const unsubOrders = subscribeToOrders(selectedBusiness.id, (orders) => {
      if (!ordersInitialized) {
        ordersInitialized = true;
        return;
      }
      const latest = orders[0];
      if (latest && latest.status === 'pending' && (Date.now() - (latest.createdAt || 0) < 30000)) {
        showMerchantNotification(
          `📦 New Order #${latest.orderNumber}!`,
          `${latest.customerName} placed an order for ${selectedBusiness.currencySymbol}${latest.total}`
        );
      }
    });

    let bookingsInitialized = false;
    const unsubBookings = subscribeToBookings(selectedBusiness.id, (bookings) => {
      if (!bookingsInitialized) {
        bookingsInitialized = true;
        return;
      }
      const latestBooking = bookings[0];
      if (latestBooking && latestBooking.status === 'pending' && (Date.now() - (latestBooking.createdAt || 0) < 30000)) {
        showMerchantNotification(
          `📅 New Appointment / Booking!`,
          `${latestBooking.customerName} requested a booking for ${latestBooking.bookingDate} ${latestBooking.bookingTimeSlot ? `at ${latestBooking.bookingTimeSlot}` : ''}`
        );
      }
    });

    return () => {
      unsubOrders();
      unsubBookings();
    };
  }, [selectedBusiness]);

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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 px-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-pulse">
            <Store className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-200">Opening Digital Storefront...</h3>
            <p className="text-xs text-slate-500 font-mono">@{publicStoreSlug}</p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mt-2" />
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pulse">
          <Store className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-slate-200">Storelly Business OS</h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
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

  // If user is Logged In, but has NO businesses yet -> Prompt Onboarding
  if (!selectedBusiness && businesses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="text-center space-y-3 mb-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Store className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Welcome to Storelly, {currentUser.displayName || 'Merchant'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Let's create your first business profile in less than 2 minutes.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl">
            <OnboardingWizard
              onComplete={handleOnboardingComplete}
              createBusinessFn={handleCreateBusiness}
            />
          </div>
        </div>
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StorefrontCartProvider>
        <MainContent />
        <PWAInstallPrompt />
      </StorefrontCartProvider>
    </AuthProvider>
  );
}
