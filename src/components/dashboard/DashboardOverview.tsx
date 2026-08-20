import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { BusinessProfile, AnalyticsSummary, Order, Booking } from '../../types';
import { getStorefrontUrl, getAnalyticsSummary } from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { DashboardTab } from './Sidebar';

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
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const storeUrl = getStorefrontUrl(business.slug);
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
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `👋 Check out our digital catalog and order directly on WhatsApp from *${business.name}*:\n\n${storeUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Store URL & Marketing Banner with Storelly4 background cover */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-xl shadow-emerald-900/15 relative overflow-hidden border border-emerald-500/30">
        {/* Background image overlay with perfect cover fit and blend mode */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="/storelly4.jpg.jpeg" 
            alt="Storelly Showcase" 
            className="w-full h-full object-cover object-center opacity-30 transform scale-105 hover:scale-100 transition duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/85 to-teal-950/90 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Permanent Public Storefront
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                {bizMeta.label}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} referrerPolicy="no-referrer" className="w-10 h-10 object-contain rounded-xl" />
                ) : (
                  <Store className="w-6 h-6 text-emerald-200" />
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading leading-tight text-white">
                {business.name} is Live & Ready to Sell
              </h1>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <div className="px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-xs text-xs font-mono text-emerald-200 truncate border border-emerald-500/20 max-w-sm sm:max-w-md">
                {storeUrl}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 text-white text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/30 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>Digital Card & QR</span>
            </button>
          </div>
        </div>

        {/* Right side image showcase matching the dark emerald theme */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 h-36 hidden xl:block rounded-2xl overflow-hidden border border-emerald-400/30 shadow-2xl group pointer-events-none">
          <img 
            src="/storelly4.jpg.jpeg" 
            alt="Storelly Digital Showcase" 
            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent flex items-end p-3">
            <span className="text-[11px] font-bold text-emerald-200 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-emerald-500/30">
              ⚡ Storelly Live QR & Card
            </span>
          </div>
        </div>
      </div>

      {/* Real Firestore Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : summary?.totalOrders ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">processed</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              {business.currencySymbol === '$' ? (
                <DollarSign className="w-4 h-4" />
              ) : (
                <IndianRupee className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-500">{business.currencySymbol}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : (summary?.totalRevenue ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Bookings / Inquiries */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {business.modules.booking_appointments || business.modules.stay_booking || business.modules.rental_booking
                ? 'Bookings'
                : 'Customers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {business.modules.booking_appointments ? (
                <CalendarCheck className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading
                ? '...'
                : business.modules.booking_appointments || business.modules.stay_booking || business.modules.rental_booking
                ? summary?.totalBookings ?? 0
                : summary?.totalCustomers ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">total</span>
          </div>
        </div>

        {/* Total Catalog Items */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {bizMeta.itemPlural}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {isLoading ? '...' : summary?.totalProducts ?? 0}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">listed</span>
          </div>
        </div>
      </div>

      {/* Quick Launch & Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders & Quick Ops */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Buttons Bar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Quick Operations
            </h3>
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
                  <div className="text-[10px] text-slate-600">New item & photos</div>
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
                  <div className="text-[10px] text-slate-600">Sections & order</div>
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
                  <div className="text-[10px] text-slate-600">Status & dispatch</div>
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
                  <div className="text-[10px] text-slate-600">Toggle features</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Orders
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>View All</span>
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
                <p className="text-xs font-semibold text-slate-700">No orders received yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Share your store link on WhatsApp to get your first customer order!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Digital Business Card Quick Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Store Marketing Card
              </h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-xs mx-auto overflow-hidden">
                {business.logo ? (
                  <img src={business.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center">
                    {business.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 truncate">{business.name}</h4>
                <p className="text-[10px] text-emerald-700 font-medium">{bizMeta.label}</p>
              </div>

              <button
                type="button"
                onClick={onOpenShareModal}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>View Card & Print QR</span>
              </button>
            </div>

            {/* WhatsApp Store Flow Tips */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <p className="font-bold text-slate-800">The Storelly Advantage:</p>
              <ul className="space-y-1.5 text-[11px] text-slate-500">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <span>Customer receives card link via WhatsApp or scans QR.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <span>Instant store opens without app installation or login.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <span>Customer orders & you receive notification directly.</span>
                </li>
              </ul>
            </div>

            {/* Showcase Image Banner */}
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 shadow-sm group mt-3">
              <img src="/storelly6.jpg.jpeg" alt="Storelly Commerce Showcase" className="w-full h-32 object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-2.5">
                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                  ✨ Storelly Commerce Engine
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
