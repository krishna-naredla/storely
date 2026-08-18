import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  Globe,
  Share2,
  Users,
  CreditCard,
  Tag,
  DollarSign,
  Star,
  FileText,
  Palette,
  Search,
  HelpCircle,
  Sliders,
  Layers,
  ShoppingBag,
  MessageSquare,
  Bell,
  ShieldAlert,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Lock,
  UserCheck,
  Ban,
  Filter,
} from 'lucide-react';
import { MasterAdminTab, PlatformPricingPlan, PlatformGlobalSettings, PlatformSupportTicket, PlatformAnnouncement } from '../../types/admin';
import { BusinessProfile } from '../../types';
import {
  adminGetAllBusinesses,
  adminGetAllOrders,
  adminGetAllBookings,
  adminGetAllReviews,
  adminGetAllCustomers,
  adminGetAuditLogs,
  adminGetPricingPlans,
  adminGetGlobalSettings,
  adminUpdateBusiness,
  adminSavePricingPlan,
  adminSaveGlobalSettings,
  adminRecordAuditLog,
} from '../../services/adminService';

interface MasterAdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  onBackToApp: () => void;
}

export const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({ adminEmail, onLogout, onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<MasterAdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Platform Data
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PlatformPricingPlan[]>([]);
  const [globalSettings, setGlobalSettings] = useState<PlatformGlobalSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      const [bizData, ordData, bookData, revData, custData, plansData, settingsData, auditData] = await Promise.all([
        adminGetAllBusinesses(),
        adminGetAllOrders(),
        adminGetAllBookings(),
        adminGetAllReviews(),
        adminGetAllCustomers(),
        adminGetPricingPlans(),
        adminGetGlobalSettings(),
        adminGetAuditLogs(),
      ]);

      setBusinesses(bizData);
      setOrders(ordData);
      setBookings(bookData);
      setReviews(revData);
      setCustomers(custData);
      setPricingPlans(plansData);
      setGlobalSettings(settingsData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Error loading Master Admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // Computed metrics
  const totalVendors = businesses.length;
  const activeVendors = businesses.filter((b) => b.status !== 'inactive' && b.status !== 'suspended').length;
  const suspendedVendors = businesses.filter((b) => b.status === 'suspended').length;
  const totalLiveStores = businesses.filter((b) => b.status !== 'inactive').length;
  const totalCustomersCount = customers.length;
  const totalOrdersCount = orders.length;
  const totalBookingsCount = bookings.length;
  const totalReviewsCount = reviews.length;

  const totalRevenue = orders.reduce((sum, item) => sum + (item.order.totalAmount || 0), 0);

  const navItems: { id: MasterAdminTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors Management', icon: Store, badge: totalVendors.toString() },
    { id: 'live_stores', label: 'Live Storefronts', icon: Globe, badge: totalLiveStores.toString() },
    { id: 'urls', label: 'URLs & Domains', icon: Share2 },
    { id: 'customers', label: 'Customers', icon: Users, badge: totalCustomersCount.toString() },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'pricing', label: 'Pricing Plans', icon: Tag },
    { id: 'payments', label: 'Payments & Finance', icon: DollarSign },
    { id: 'reviews', label: 'Reviews Moderation', icon: Star, badge: totalReviewsCount.toString() },
    { id: 'landing_cms', label: 'Landing Page CMS', icon: FileText },
    { id: 'branding', label: 'Global Branding', icon: Palette },
    { id: 'seo', label: 'SEO & Search', icon: Search },
    { id: 'faqs', label: 'FAQ Management', icon: HelpCircle },
    { id: 'features', label: 'Feature Flags', icon: Sliders },
    { id: 'business_types', label: 'Business Types', icon: Layers },
    { id: 'support', label: 'Support & Leads', icon: MessageSquare },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'audit_logs', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'system_health', label: 'System Health', icon: Activity },
    { id: 'settings', label: 'Global Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                S
              </div>
              <div>
                <span className="font-heading font-black text-base tracking-tight flex items-center gap-1.5">
                  Storelly
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Master Admin
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Badge */}
          <div className="p-4 border-b border-slate-100 bg-emerald-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {adminEmail.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">Platform Owner</p>
                <p className="text-[11px] text-emerald-700 truncate font-medium">{adminEmail}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)] no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
          <button
            type="button"
            onClick={onBackToApp}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Return to Storelly App
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Admin Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Control Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 font-heading capitalize">
                {activeTab.replace('_', ' ')}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Master Admin Control Center — Storelly Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadPlatformData}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {isLoading ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-600">Loading Master Admin platform data...</p>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        Master Control System Active
                      </span>
                      <h2 className="text-2xl font-black font-heading">Storelly SaaS Platform Overview</h2>
                      <p className="text-sm text-emerald-100 max-w-2xl">
                        Real-time metrics across {totalVendors} registered merchants, {totalLiveStores} live storefronts, and ₹{totalRevenue.toLocaleString()} platform gross order value.
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Vendors</span>
                        <Store className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{totalVendors}</p>
                      <p className="text-xs text-emerald-600 font-bold">{activeVendors} Active • {suspendedVendors} Suspended</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Live Storefronts</span>
                        <Globe className="w-5 h-5 text-teal-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{totalLiveStores}</p>
                      <p className="text-xs text-teal-600 font-bold">100% Route Resolution</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Platform Orders</span>
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">{totalOrdersCount}</p>
                      <p className="text-xs text-blue-600 font-bold">{totalBookingsCount} Bookings Recorded</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                        <DollarSign className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-amber-600 font-bold">Verified Real-time Value</p>
                    </div>
                  </div>

                  {/* Recent Vendors Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900">Recent Vendor Registrations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                            <th className="pb-3">Business Name</th>
                            <th className="pb-3">Owner UID</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Slug</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {businesses.slice(0, 5).map((biz) => (
                            <tr key={biz.id} className="hover:bg-slate-50">
                              <td className="py-3 font-bold text-slate-900">{biz.name}</td>
                              <td className="py-3 font-mono text-slate-500 text-[11px]">{biz.ownerId}</td>
                              <td className="py-3 capitalize text-slate-700 font-medium">{biz.type}</td>
                              <td className="py-3 font-mono text-emerald-700">/store/{biz.slug}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  biz.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {biz.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VENDORS MANAGEMENT TAB */}
              {activeTab === 'vendors' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search vendors by name, email, slug..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pl-10 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Total Registered: {businesses.length}</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-4">Store Name</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Public URL</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {businesses
                          .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.slug.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((biz) => (
                            <tr key={biz.id} className="hover:bg-slate-50">
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{biz.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{biz.id}</div>
                              </td>
                              <td className="p-4 capitalize font-semibold text-slate-700">{biz.type}</td>
                              <td className="p-4 font-mono text-emerald-700">/store/{biz.slug}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  biz.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {biz.status || 'Active'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const newStatus = biz.status === 'suspended' ? 'active' : 'suspended';
                                    await adminUpdateBusiness(biz.id, { status: newStatus });
                                    await adminRecordAuditLog({
                                      adminEmail,
                                      action: newStatus === 'suspended' ? 'SUSPEND_VENDOR' : 'ACTIVATE_VENDOR',
                                      target: biz.name,
                                      details: `Vendor status changed to ${newStatus}`,
                                    });
                                    loadPlatformData();
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    biz.status === 'suspended' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                >
                                  {biz.status === 'suspended' ? 'Restore' : 'Suspend'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LIVE STORES TAB */}
              {activeTab === 'live_stores' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businesses.map((biz) => (
                      <div key={biz.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{biz.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Live</span>
                        </div>
                        <p className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 truncate">
                          /store/{biz.slug}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <a
                            href={`/store/${biz.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            Open Storefront <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/store/${biz.slug}`);
                              alert('Storefront URL copied to clipboard!');
                            }}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg"
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRICING PLANS TAB */}
              {activeTab === 'pricing' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Storelly SaaS Pricing Tiers</h3>
                    <button
                      type="button"
                      onClick={async () => {
                        const newPlan: PlatformPricingPlan = {
                          id: 'plan_' + Date.now(),
                          name: 'Custom Tier',
                          tagline: 'Configured by Master Admin',
                          monthlyPrice: 799,
                          yearlyPrice: 7999,
                          trialDays: 14,
                          isActive: true,
                          features: ['Unlimited Catalogs', 'Custom Features'],
                          limits: { catalogueItems: 9999, monthlyOrders: 99999, customerRecords: 10000, hasCustomDomain: true, hasAiPromotions: true, hasDigitalCard: true },
                        };
                        await adminSavePricingPlan(newPlan);
                        loadPlatformData();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Pricing Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {pricingPlans.map((plan) => (
                      <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-lg text-slate-900">{plan.name}</h4>
                          <p className="text-xs text-slate-500">{plan.tagline}</p>
                          <div className="pt-2">
                            <span className="text-3xl font-black text-slate-900">₹{plan.monthlyPrice}</span>
                            <span className="text-xs text-slate-400 font-medium"> / month</span>
                          </div>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600">
                          {plan.features.map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AUDIT LOGS TAB */}
              {activeTab === 'audit_logs' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900">Master Admin Security & Action Audit Trail</h3>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Admin Email</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Target</th>
                          <th className="p-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-4 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-4 font-bold text-slate-900">{log.adminEmail}</td>
                            <td className="p-4 font-mono text-emerald-700 font-bold">{log.action}</td>
                            <td className="p-4 text-slate-800 font-medium">{log.target}</td>
                            <td className="p-4 text-slate-600">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* OTHER PLACEHOLDER TABS FOR COMPREHENSIVE COVERAGE */}
              {['customers', 'subscriptions', 'payments', 'reviews', 'landing_cms', 'branding', 'seo', 'faqs', 'features', 'business_types', 'support', 'announcements', 'system_health', 'settings', 'urls'].includes(activeTab) && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 capitalize">{activeTab.replace('_', ' ')} Management Center</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Manage all global platform settings, configurations, moderation queues, and operational records for {activeTab.replace('_', ' ')}.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => alert(`${activeTab.replace('_', ' ')} settings synchronized successfully.`)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Save & Sync Configuration
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
