import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CalendarCheck,
  Users,
  Star,
  Tag,
  BarChart3,
  Sliders,
  Settings,
  Share2,
  ExternalLink,
  LogOut,
  X,
  Store,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { subscribeToOrders } from '../../services/firebaseService';

export type DashboardTab =
  | 'overview'
  | 'catalog'
  | 'categories'
  | 'orders'
  | 'bookings'
  | 'customers'
  | 'reviews'
  | 'offers'
  | 'analytics'
  | 'modules'
  | 'share'
  | 'settings'
  | 'profile';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  business: BusinessProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStorefront: () => void;
  onLogout: () => void;
  onOpenMasterAdmin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  business,
  isOpen,
  onClose,
  onOpenStorefront,
  onLogout,
  onOpenMasterAdmin,
}) => {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (!business) return;
    const unsubscribe = subscribeToOrders(business.id, (orders) => {
      const pendingCount = orders.filter(o => o.status === 'pending').length;
      setPendingOrdersCount(pendingCount);
    });
    return () => unsubscribe();
  }, [business]);

  const bizMeta = business ? BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail : BUSINESS_TYPES.retail;
  const modules = business?.modules;

  const navItems: {
    id: DashboardTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    visible: boolean;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'catalog',
      label: bizMeta.itemPlural || 'Catalog',
      icon: Package,
      visible: true,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Layers,
      visible: true,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount.toString() : undefined,
      visible: !!modules?.cart_ordering || !!modules?.menu || !!modules?.products,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarCheck,
      visible: !!modules?.booking_appointments || !!modules?.stay_booking || !!modules?.rental_booking,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      visible: true,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      visible: !!modules?.reviews,
    },
    {
      id: 'offers',
      label: 'Offers & Coupons',
      icon: Tag,
      visible: !!modules?.offers,
    },
    {
      id: 'share',
      label: 'Digital Card & QR',
      icon: Share2,
      badge: 'Core',
      visible: true,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      visible: true,
    },
    {
      id: 'modules',
      label: 'Module Manager',
      icon: Sliders,
      visible: true,
    },
    {
      id: 'settings',
      label: 'Store Settings',
      icon: Settings,
      visible: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
                <img 
                  src={business?.logo || "/storelly3.jpg.jpeg"} 
                  alt="Storelly Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1">
                  Storelly
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    OS
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Business Card */}
          {business && (
            <div className="px-3.5 pt-3 pb-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={business.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {business.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{business.name}</h4>
                  <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    {bizMeta.label}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          {onOpenMasterAdmin && (
            <button
              type="button"
              onClick={onOpenMasterAdmin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master Admin Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStorefront}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>View Public Store</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 py-2 px-3 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
