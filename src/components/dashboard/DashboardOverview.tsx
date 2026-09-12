import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
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
  BarChart3,
  CheckCircle2,
  Download,
  Printer,
  Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BusinessProfile, AnalyticsSummary, Order, Booking } from '../../types';
import { getStorefrontUrl, getAnalyticsSummary, getOrders } from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { DashboardTab } from './Sidebar';
import { SafeImage } from '../common/SafeImage';
import { isCreatorProfile, getPrimaryPublicUrl, getPublicDestinations } from '../../utils/profileHelper';
import { VendorTrustShareModal } from '../common/VendorTrustShareModal';

interface DashboardOverviewProps {
  business: BusinessProfile;
  setActiveTab: (tab: DashboardTab) => void;
  onOpenStorefront: () => void;
  onOpenShareModal: () => void;
}

interface WeeklyTrendItem {
  day: string;
  dateStr: string;
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  revenue: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  business,
  setActiveTab,
  onOpenStorefront,
  onOpenShareModal,
}) => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);
  const [cardQrUrl, setCardQrUrl] = useState<string>('');
  const [isTrustCardModalOpen, setIsTrustCardModalOpen] = useState(false);

  const isCreator = isCreatorProfile(business);
  const publicDestinations = getPublicDestinations(business);
  const [selectedDestinationKey, setSelectedDestinationKey] = useState<string>(
    publicDestinations[0]?.id || 'store'
  );

  const activeDestination =
    publicDestinations.find((d) => d.id === selectedDestinationKey) || publicDestinations[0];
  const activeUrl = activeDestination ? activeDestination.url : getStorefrontUrl(business);
  const primaryUrl = getPrimaryPublicUrl(business);
  const displayUrl = activeUrl.replace(/^https?:\/\//, '');
  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  useEffect(() => {
    QRCode.toDataURL(activeUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => setCardQrUrl(url))
      .catch((err) => console.error('Overview QR generation error:', err));
  }, [activeUrl]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [summaryData, ordersData] = await Promise.all([
          getAnalyticsSummary(business.id),
          getOrders(business.id),
        ]);

        if (isMounted) {
          setSummary(summaryData);

          // Compute daily metrics for the last 7 days
          const now = new Date();
          const daysArr: WeeklyTrendItem[] = [];

          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
            const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
            const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
            const dateFormatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            const dayOrders = (ordersData || []).filter(
              (o) => o.createdAt >= startOfDay && o.createdAt <= endOfDay
            );
            const totalOrders = dayOrders.length;
            const completedOrders = dayOrders.filter(
              (o) => o.status === 'delivered' || o.status === 'confirmed'
            ).length;
            const completionRate =
              totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
            const revenue = dayOrders
              .filter((o) => o.status !== 'cancelled')
              .reduce((sum, o) => sum + (o.total || 0), 0);

            daysArr.push({
              day: dayName,
              dateStr: dateFormatted,
              totalOrders,
              completedOrders,
              completionRate,
              revenue,
            });
          }

          setWeeklyTrends(daysArr);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading dashboard analytics:', err);
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [business.id]);

  const weeklyTotalOrders = weeklyTrends.reduce((sum, item) => sum + item.totalOrders, 0);
  const weeklyCompletedOrders = weeklyTrends.reduce((sum, item) => sum + item.completedOrders, 0);
  const weeklyAvgCompletionRate =
    weeklyTotalOrders > 0
      ? Math.round((weeklyCompletedOrders / weeklyTotalOrders) * 100)
      : 0;
  const weeklyTotalRevenue = weeklyTrends.reduce((sum, item) => sum + item.revenue, 0);

  const handleCopyLink = (urlToCopy?: string, key?: string) => {
    const target = urlToCopy || activeUrl;
    navigator.clipboard.writeText(target);
    if (key) {
      setCopiedUrlKey(key);
      setTimeout(() => setCopiedUrlKey(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenExternal = (urlToOpen?: string) => {
    window.open(urlToOpen || activeUrl, '_blank');
  };

  const handleDownloadQr = () => {
    if (!cardQrUrl) return;
    const a = document.createElement('a');
    a.href = cardQrUrl;
    a.download = `${business.slug || 'store'}-qr-code.png`;
    a.click();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      isCreator
        ? `✨ Check out my creative portfolio and digital shop at *${business.name}*:\n\n${activeUrl}\n\nTap to browse and connect directly!`
        : `👋 Check out our digital catalog and order directly on WhatsApp from *${business.name}*:\n\n${activeUrl}\n\nTap to browse products, offers, and place instant orders!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          TOP BANNER: BRAND / PROFILE HERO & DIGITAL STORE LINK CENTER
         ========================================================================= */}
      <div
        className={`p-6 sm:p-7 rounded-3xl relative overflow-hidden border shadow-xl ${
          isCreator
            ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100/90 text-slate-900 border-indigo-200 shadow-indigo-900/10'
            : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/90 text-slate-900 border-emerald-300/80 shadow-emerald-900/10'
        }`}
      >
        {/* Background image overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={
              business.coverImage ||
              business.banner ||
              (isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg.jpeg")
            }
            alt={isCreator ? "Creator Showcase" : "Vendor Store Showcase"}
            loading="lazy"
            className="w-full h-full object-cover object-center opacity-30 transform scale-105 hover:scale-100 transition duration-700"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = isCreator
                ? "/cteatorlink.jpeg"
                : "/storelly6.jpg";
            }}
          />
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px]"></div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 text-white ${
                    isCreator ? 'bg-indigo-600 border border-indigo-500' : 'bg-emerald-600 border border-emerald-500'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {isCreator ? 'Verified Creator Studio' : 'Live & Verified Digital Storefront'}
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
                  <SafeImage
                    fallbackType="avatar"
                    src={
                      business.logo ||
                      business.profileImage ||
                      (isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg.jpeg")
                    }
                    alt={business.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition duration-300"
                  />
                </button>

                <div
                  onClick={onOpenStorefront}
                  className="cursor-pointer group"
                  title={isCreator ? 'Click to open live portfolio' : 'Click to open live storefront'}
                >
                  <h1 className={`text-xl sm:text-2xl font-black font-heading leading-tight text-slate-900 transition flex items-center gap-2 ${
                    isCreator ? 'group-hover:text-indigo-700' : 'group-hover:text-emerald-700'
                  }`}>
                    <span>{business.name}</span>
                    <span className="text-xs font-normal text-slate-500 hidden sm:inline">• Live Online</span>
                    <ExternalLink className={`w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition shrink-0 ${
                      isCreator ? 'text-indigo-600' : 'text-emerald-600'
                    }`} />
                  </h1>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {business.tagline || business.description || 'Customer-facing digital store & WhatsApp ordering'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button Group */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenExternal(activeUrl)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                  isCreator
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
                title="Open live public store in a new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open {isCreator && activeDestination ? activeDestination.badgeLabel : 'Store'} ↗</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrustCardModalOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Open and share high-trust WhatsApp card (Sri Lakshmi style)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>WhatsApp Rich Card</span>
              </button>

              <button
                type="button"
                onClick={onOpenShareModal}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="View and print QR code poster"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>QR Code & Card</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrustCardModalOpen(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Share rich store card directly on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Interactive URL Bar & Link Selector */}
          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Multiple URL tabs if Creator */}
            {isCreator && publicDestinations.length > 1 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {publicDestinations.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setSelectedDestinationKey(dest.id)}
                    className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      selectedDestinationKey === dest.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{dest.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Your Public Store Link:</span>
              </div>
            )}

            {/* URL Display & 1-Click Copy */}
            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-200/90 p-1 shadow-2xs max-w-full sm:max-w-md min-h-[44px]">
              <span className={`w-2 h-2 rounded-full inline-block shrink-0 ml-1.5 ${isCreator ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              <input
                type="text"
                readOnly
                value={activeUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="text-xs font-mono font-medium text-slate-700 bg-transparent border-none focus:outline-none flex-1 truncate px-1 cursor-text"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(activeUrl)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                title="Copy URL to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleOpenExternal(activeUrl)}
                aria-label="Open in new tab"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 cursor-pointer"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CREATOR INDEPENDENT MODULE LINKS
         ========================================================================= */}
      {isCreator && publicDestinations.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Your Independent Public Module URLs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each module has its own independent page and URL. Share whichever one you need with your clients or audience.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
              {publicDestinations.length} Public Module{publicDestinations.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {publicDestinations.map((dest) => {
              const isDestCopied = copiedUrlKey === dest.id;
              return (
                <div
                  key={dest.id}
                  className="rounded-2xl border border-slate-200/90 p-4 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900">{dest.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                        {dest.badgeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{dest.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/70">
                    <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-mono text-slate-700 font-semibold truncate flex-1 select-all">
                        {dest.displayPath}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(dest.url, dest.id)}
                        className={`flex-1 min-h-[36px] py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDestCopied
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {isDestCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isDestCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenExternal(dest.url)}
                        className="min-h-[36px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        title={`Open ${dest.title} in new tab`}
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          RECHARTS: WEEKLY ORDER VOLUME TRENDS & COMPLETION RATES
         ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${isCreator ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                Weekly Order Volume &amp; Completion Rate
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              7-day order fulfillment velocity and completion percentage for {business.name}.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Weekly Volume</span>
              <span className="text-xs font-extrabold text-slate-900">{weeklyTotalOrders} orders</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-center ${
              isCreator ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-[10px] font-bold uppercase block opacity-75">Avg Completion</span>
              <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {weeklyAvgCompletionRate}%
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Week Revenue</span>
              <span className="text-xs font-extrabold text-slate-900">
                {business.currencySymbol}{weeklyTotalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="w-full h-64 sm:h-72">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/60 rounded-2xl animate-pulse">
              <span className="text-xs text-slate-400 font-medium">Loading weekly trends...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={weeklyTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#818cf8"
                  fontSize={11}
                  domain={[0, 100]}
                  unit="%"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as WeeklyTrendItem;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 z-50 min-w-[170px]">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400">{data.dateStr}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              Total Orders:
                            </span>
                            <span className="font-bold text-white">{data.totalOrders}</span>
                          </div>
                          <div className="flex justify-between text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Completed:
                            </span>
                            <span className="font-bold">{data.completedOrders}</span>
                          </div>
                          <div className="flex justify-between text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                              Completion Rate:
                            </span>
                            <span className="font-bold">{data.completionRate}%</span>
                          </div>
                          {data.revenue > 0 && (
                            <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-800 text-[11px]">
                              <span>Day Revenue:</span>
                              <span className="font-bold">{business.currencySymbol}{data.revenue}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalOrders"
                  name="Total Orders"
                  fill={isCreator ? '#818cf8' : '#94a3b8'}
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar
                  yAxisId="left"
                  dataKey="completedOrders"
                  name="Completed Orders"
                  fill={isCreator ? '#4f46e5' : '#059669'}
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completionRate"
                  name="Completion Rate (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
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

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              {/* QR Code Scannable Canvas/Image Preview */}
              <div className="relative mx-auto w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center group">
                {cardQrUrl ? (
                  <img
                    src={cardQrUrl}
                    alt="Live Storefront QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-slate-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-white/95 text-[9px] font-bold text-slate-600 px-1.5 py-0.5 rounded shadow-xs border border-slate-200/80">
                  Scan to Test
                </span>
              </div>

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
                  {isCreator ? 'Creator Profile & Portfolio' : `${bizMeta.label} • Live Store`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-2 px-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl text-slate-800 text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download PNG QR Code image for print/stickers"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenExternal(activeUrl)}
                  className={`py-2 px-2.5 text-white text-[11px] font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCreator ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  title="Open live public store in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Store ↗</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsTrustCardModalOpen(true)}
                className="w-full py-2.5 px-3 bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mb-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>WhatsApp Rich Card (Sri Lakshmi)</span>
              </button>

              <button
                type="button"
                onClick={onOpenShareModal}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Digital Card & Poster</span>
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

      {isTrustCardModalOpen && (
        <VendorTrustShareModal
          isOpen={isTrustCardModalOpen}
          onClose={() => setIsTrustCardModalOpen(false)}
          business={business}
          onOpenStore={onOpenStorefront}
        />
      )}
    </div>
  );
};
