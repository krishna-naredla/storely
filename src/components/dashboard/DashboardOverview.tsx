import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShoppingBag,
  IndianRupee,
  DollarSign,
  CalendarCheck,
  Users,
  Eye,
  TrendingUp,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  MessageCircle,
  Clock,
  QrCode,
  Store,
  Briefcase,
  Link as LinkIcon,
  FileText,
  Star,
  Ticket,
} from 'lucide-react';
import { BusinessProfile, AnalyticsSummary, Order, Booking } from '../../types';
import { getStorefrontUrl, getAnalyticsSummary } from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { DashboardTab } from './Sidebar';
import { SafeImage } from '../common/SafeImage';
import { isCreatorProfile, getPrimaryPublicUrl, getPublicDestinations } from '../../utils/profileHelper';

interface DashboardOverviewProps {
  business: BusinessProfile;
  setActiveTab: (tab: DashboardTab) => void;
  onOpenStorefront: () => void;
  onOpenShareModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  business,
  setActiveTab,
  onOpenStorefront,
  onOpenShareModal,
}) => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isCreator = isCreatorProfile(business);
  const publicDestinations = getPublicDestinations(business);
  const primaryUrl = getPrimaryPublicUrl(business);
  const displayUrl = primaryUrl.replace(/^https?:\/\//, '');
  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const data = await getAnalyticsSummary(business.id);
      if (isMounted) {
        setSummary(data);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [business.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(primaryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      isCreator
        ? `✨ Check out my creative portfolio and links at *${business.name}*:\n\n${primaryUrl}`
        : `👋 Check out our digital catalog and order directly on WhatsApp from *${business.name}*:\n\n${primaryUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          TOP BANNER: BRAND / PROFILE HERO
         ========================================================================= */}
      <div
        className={`p-6 sm:p-8 rounded-3xl relative overflow-hidden border shadow-xl ${
          isCreator
            ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100/90 text-slate-900 border-indigo-200 shadow-indigo-900/10'
            : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/90 text-slate-900 border-emerald-300/80 shadow-emerald-900/10'
        }`}
      >
        {/* Background image overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/storelly4.jpg.jpeg"
            alt="Storelly Showcase"
            className="w-full h-full object-cover object-center opacity-30 transform scale-105 hover:scale-100 transition duration-700"
          />
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 text-white ${
                  isCreator ? 'bg-indigo-600 border border-indigo-500' : 'bg-emerald-600 border border-emerald-500'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                {isCreator ? 'Verified Creator Profile' : 'Permanent Public Storefront'}
              </span>
              <span className={`text-xs font-bold ${isCreator ? 'text-indigo-800' : 'text-emerald-800'}`}>
                {isCreator ? business.tagline || 'Creator Workspace' : bizMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenStorefront}
                title={isCreator ? 'Click to open live portfolio' : 'Click to open live storefront'}
                className={`w-12 h-12 rounded-2xl bg-white border flex items-center justify-center shrink-0 shadow-sm transition group cursor-pointer overflow-hidden ${
                  isCreator
                    ? 'border-indigo-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-400/40'
                    : 'border-emerald-200 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/40'
                }`}
              >
                {business.logo || business.profileImage ? (
                  <SafeImage
                    fallbackType="avatar"
                    src={business.logo || business.profileImage}
                    alt={business.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-contain rounded-xl group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <Store className={`w-6 h-6 group-hover:scale-110 transition duration-300 ${isCreator ? 'text-indigo-700' : 'text-emerald-700'}`} />
                )}
              </button>

              <div
                onClick={onOpenStorefront}
                className="cursor-pointer group"
                title={isCreator ? 'Click to open live portfolio' : 'Click to open live storefront'}
              >
                <h1 className={`text-xl sm:text-2xl font-black font-heading leading-tight text-slate-900 transition flex items-center gap-2 ${
                  isCreator ? 'group-hover:text-indigo-700' : 'group-hover:text-emerald-700'
                }`}>
                  <span>{business.name} is Live &amp; Published</span>
                  <ExternalLink className={`w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition shrink-0 ${
                    isCreator ? 'text-indigo-600' : 'text-emerald-600'
                  }`} />
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className={`px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-xs font-mono truncate border shadow-xs max-w-sm sm:max-w-md font-bold ${
                isCreator ? 'text-indigo-800 border-indigo-200' : 'text-emerald-800 border-emerald-200'
              }`}>
                {displayUrl}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Copied' : 'Copy Public Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                isCreator
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ANALYTICS METRIC CARDS
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Profile Views' : t('dashboard.totalOrders')}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCreator ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isCreator ? <Eye className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : isCreator ? (summary?.bioLinkViews ?? 0) + (summary?.totalCustomers ?? 0) + 12 : summary?.totalOrders ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">{isCreator ? 'views' : 'processed'}</span>
          </div>
        </div>

        {/* Link Clicks / Inquiries */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Link Clicks' : 'Customers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              {isCreator ? <LinkIcon className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : isCreator ? summary?.bioLinkClicks ?? 0 : summary?.totalCustomers ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">interactions</span>
          </div>
        </div>

        {/* Bookings / Consultations */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? '1:1 Bookings' : 'Bookings'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : summary?.totalBookings ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">scheduled</span>
          </div>
        </div>

        {/* Listed Projects / Products */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Listed Items' : bizMeta.itemPlural}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              {isCreator ? <Briefcase className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : summary?.totalProducts ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">published</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          QUICK OPERATIONS & RECENT ACTIVITY
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Hub */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Buttons */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              {isCreator ? 'Creator Tools & Shortcuts' : 'Quick Operations'}
            </h3>

            {isCreator ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('portfolio')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">
                      Portfolio
                    </div>
                    <div className="text-[10px] text-slate-500">Case studies &amp; art</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('biolink')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-purple-800">
                      Bio Link
                    </div>
                    <div className="text-[10px] text-slate-500">Links &amp; socials</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-teal-800">
                      Digital Store
                    </div>
                    <div className="text-[10px] text-slate-500">PDFs, code &amp; kits</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('modules')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800">
                      Modules
                    </div>
                    <div className="text-[10px] text-slate-500">Toggle features</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                      Add {bizMeta.itemLabel}
                    </div>
                    <div className="text-[10px] text-slate-500">New item &amp; photos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('categories')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-teal-800">
                      Categories
                    </div>
                    <div className="text-[10px] text-slate-500">Sections &amp; order</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-800">
                      Manage Orders
                    </div>
                    <div className="text-[10px] text-slate-500">Status &amp; dispatch</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('modules')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200/80 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-purple-800">
                      Modules
                    </div>
                    <div className="text-[10px] text-slate-500">Toggle features</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Recent Orders / Client Activity List */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCreator ? (
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                )}
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isCreator ? 'Recent Inquiries & Activity' : 'Recent Orders'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(isCreator ? 'orders' : 'orders')}
                className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  isCreator ? 'text-indigo-600 hover:text-indigo-700' : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                <span>{t('dashboard.viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2 py-4">
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : summary?.recentOrders && summary.recentOrders.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {summary.recentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{order.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        {order.customerName} • {order.items.length} items
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {business.currencySymbol}{order.total}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {isCreator ? 'No recent client inquiries or orders yet' : 'No orders received yet'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Share your link on WhatsApp or Instagram to reach your audience!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Public Profile / Store Marketing Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className={`w-4 h-4 ${isCreator ? 'text-indigo-600' : 'text-emerald-600'}`} />
                {isCreator ? 'Creator Digital Card' : 'Store Marketing Card'}
              </h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <button
                type="button"
                onClick={onOpenStorefront}
                title={isCreator ? 'Click to open live portfolio' : 'Click to open live storefront'}
                className={`w-14 h-14 rounded-xl bg-white border shadow-xs mx-auto overflow-hidden block cursor-pointer group transition duration-300 ${
                  isCreator ? 'border-slate-200 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-300' : 'border-slate-200 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-300'
                }`}
              >
                {business.logo || business.profileImage ? (
                  <SafeImage
                    fallbackType="avatar"
                    src={business.logo || business.profileImage}
                    alt="Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <div className={`w-full h-full font-bold text-lg flex items-center justify-center transition ${
                    isCreator ? 'bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200' : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                  }`}>
                    {business.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              <div>
                <button
                  type="button"
                  onClick={onOpenStorefront}
                  title={isCreator ? 'Click to open live portfolio' : 'Click to open live storefront'}
                  className={`text-xs font-bold text-slate-900 transition truncate max-w-full inline-flex items-center gap-1 cursor-pointer ${
                    isCreator ? 'hover:text-indigo-700' : 'hover:text-emerald-700'
                  }`}
                >
                  <span className="truncate">{business.name}</span>
                  <ExternalLink className={`w-3 h-3 text-slate-400 shrink-0 ${
                    isCreator ? 'hover:text-indigo-600' : 'hover:text-emerald-600'
                  }`} />
                </button>
                <p className={`text-[10px] font-medium ${isCreator ? 'text-indigo-700' : 'text-emerald-700'}`}>
                  {isCreator ? 'Creator Profile' : bizMeta.label}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenShareModal}
                className={`w-full py-2 px-3 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCreator ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>View Card &amp; Print QR</span>
              </button>
            </div>

            {/* Platform Feature Tips */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <p className="font-bold text-slate-800">
                {isCreator ? 'Creator Advantage:' : 'The Storelly Advantage:'}
              </p>
              <ul className="space-y-1.5 text-[11px] text-slate-500">
                <li className="flex items-start gap-1.5">
                  <span className={`font-bold ${isCreator ? 'text-indigo-600' : 'text-emerald-600'}`}>1.</span>
                  <span>
                    {isCreator
                      ? 'Put your portfolio or bio link in your Instagram & WhatsApp bio.'
                      : 'Customer receives card link via WhatsApp or scans QR.'}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className={`font-bold ${isCreator ? 'text-indigo-600' : 'text-emerald-600'}`}>2.</span>
                  <span>
                    {isCreator
                      ? 'Clients explore your case studies & services with zero login required.'
                      : 'Instant store opens without app installation or login.'}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className={`font-bold ${isCreator ? 'text-indigo-600' : 'text-emerald-600'}`}>3.</span>
                  <span>
                    {isCreator
                      ? 'Direct WhatsApp inquiries, consultations, and digital sales come straight to you.'
                      : 'Customer orders & you receive notification directly.'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
