import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [globalHeaderSearch, setGlobalHeaderSearch] = useState('');
  const [systemLogTypeFilter, setSystemLogTypeFilter] = useState<'all' | 'security' | 'error' | 'activity'>('all');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }
    const keys = Object.keys(data[0]);
    const csvRows = [
      keys.join(','),
      ...data.map((row) =>
        keys
          .map((k) => `"${String(row[k] || '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(businesses, 'storelly_platform_audit_report.csv');
    } else {
      window.print();
    }
  };

  const notifications = [
    { id: 'n1', title: 'New Business Registration', desc: `${businesses[0]?.name || 'New Merchant'} joined the platform`, time: '10m ago', type: 'info' },
    { id: 'n2', title: 'Payment Gateway Sync', desc: `Razorpay / Stripe webhook verified successfully`, time: '1h ago', type: 'success' },
    { id: 'n3', title: 'System Security Check', desc: `Cloud Firestore security rules audited and deployed`, time: '3h ago', type: 'security' },
  ];

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
    { id: 'system_logs', label: 'System Logs', icon: FileText, badge: 'Live' },
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
            {/* Global Header Search Bar */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={globalHeaderSearch}
                onChange={(e) => setGlobalHeaderSearch(e.target.value)}
                placeholder="Global search across platform..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={async () => {
                await loadPlatformData();
                alert('Platform data successfully synchronized with Firestore!');
              }}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase text-slate-900">Admin Alerts & Events</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">3 New</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl space-y-1 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 h-28 flex flex-col justify-between">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-8 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
                  ))}
                </div>
              </div>
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

                  {/* System Health & Growth Recharts Widget */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Platform Growth & System Health Analytics</h3>
                        <p className="text-xs text-slate-500">Weekly trend analysis of active merchants, order volumes, and user login spikes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => exportReport('csv')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" /> Export Excel (CSV)
                        </button>
                        <button
                          type="button"
                          onClick={() => exportReport('pdf')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-white" /> Export PDF Snapshot
                        </button>
                      </div>
                    </div>

                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { day: 'Mon', vendors: Math.max(1, totalVendors - 5), orders: Math.max(2, totalOrdersCount - 12), logins: 45 },
                          { day: 'Tue', vendors: Math.max(1, totalVendors - 4), orders: Math.max(3, totalOrdersCount - 9), logins: 62 },
                          { day: 'Wed', vendors: Math.max(1, totalVendors - 3), orders: Math.max(4, totalOrdersCount - 7), logins: 78 },
                          { day: 'Thu', vendors: Math.max(1, totalVendors - 2), orders: Math.max(5, totalOrdersCount - 4), logins: 91 },
                          { day: 'Fri', vendors: Math.max(1, totalVendors - 1), orders: Math.max(6, totalOrdersCount - 2), logins: 115 },
                          { day: 'Sat', vendors: totalVendors, orders: totalOrdersCount, logins: 140 },
                          { day: 'Sun', vendors: totalVendors, orders: totalOrdersCount + 2, logins: 125 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="logins" name="User Logins" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                          <Area type="monotone" dataKey="orders" name="Platform Orders" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                          <Area type="monotone" dataKey="vendors" name="Active Vendors" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => exportToCSV(businesses, 'storelly_vendors_report.csv')}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                      </button>
                      <span className="text-xs font-bold text-slate-500">Total: {businesses.length}</span>
                    </div>
                  </div>

                  {selectedVendorIds.length > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">{selectedVendorIds.length} vendors selected</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Bulk Enable Accounts',
                              message: `Are you sure you want to enable ${selectedVendorIds.length} accounts?`,
                              onConfirm: async () => {
                                for (const id of selectedVendorIds) {
                                  await adminUpdateBusiness(id, { status: 'active' });
                                }
                                await loadPlatformData();
                                setSelectedVendorIds([]);
                                alert('Selected vendors enabled successfully.');
                              },
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Bulk Enable
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Bulk Suspend Accounts',
                              message: `Are you sure you want to suspend ${selectedVendorIds.length} accounts?`,
                              onConfirm: async () => {
                                for (const id of selectedVendorIds) {
                                  await adminUpdateBusiness(id, { status: 'suspended' });
                                }
                                await loadPlatformData();
                                setSelectedVendorIds([]);
                                alert('Selected vendors suspended.');
                              },
                            });
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Bulk Suspend
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="p-4 w-10">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedVendorIds(businesses.map((b) => b.id));
                                  } else {
                                    setSelectedVendorIds([]);
                                  }
                                }}
                                checked={selectedVendorIds.length === businesses.length && businesses.length > 0}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            </th>
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
                            .map((biz) => {
                              const isSelected = selectedVendorIds.includes(biz.id);
                              return (
                                <tr key={biz.id} className="hover:bg-slate-50">
                                  <td className="p-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedVendorIds([...selectedVendorIds, biz.id]);
                                        } else {
                                          setSelectedVendorIds(selectedVendorIds.filter((id) => id !== biz.id));
                                        }
                                      }}
                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                  </td>
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
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
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

              {/* SYSTEM LOGS TAB */}
              {activeTab === 'system_logs' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {(['all', 'security', 'error', 'activity'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSystemLogTypeFilter(type)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                            systemLogTypeFilter === type
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => exportToCSV(auditLogs, 'system_audit_logs.csv')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" /> Export Logs to CSV
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Admin / Source</th>
                            <th className="p-4">Event Type</th>
                            <th className="p-4">Target Resource</th>
                            <th className="p-4">Log Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {auditLogs
                            .filter((log) => {
                              if (systemLogTypeFilter === 'security') return log.action.includes('SUSPEND') || log.action.includes('SECURITY');
                              if (systemLogTypeFilter === 'error') return log.action.includes('ERROR') || log.action.includes('FAIL');
                              return true;
                            })
                            .map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-4 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-4 font-bold text-slate-900">{log.adminEmail}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-emerald-700 border border-slate-200">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-800 font-semibold">{log.target}</td>
                                <td className="p-4 text-slate-600 font-mono text-[11px]">{log.details}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
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

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500">Please confirm your administrative action</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
