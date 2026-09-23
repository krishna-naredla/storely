import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
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
  Link,
  CreditCard,
  ExternalLink,
  LogOut,
  X,
  Store,
  Sparkles,
  ShieldCheck,
  Bell,
  Briefcase,
  Ticket,
  FileText,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { BusinessProfile } from "../../types";
import { BUSINESS_TYPES } from "../../services/businessConfig";
import { subscribeToOrders, getStorefrontUrl } from "../../services/firebaseService";
import { isCreatorProfile, getProfileTypeLabel } from "../../utils/profileHelper";
import { SafeImage } from "../common/SafeImage";
import { getBusinessLogo } from "../../utils/branding";

export type DashboardTab =
  | "overview"
  | "catalog"
  | "portfolio"
  | "events"
  | "quotes"
  | "categories"
  | "orders"
  | "bookings"
  | "customers"
  | "reviews"
  | "offers"
  | "analytics"
  | "modules"
  | "payments"
  | "notifications"
  | "biolink"
  | "share"
  | "settings"
  | "profile";

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
  const { t } = useLanguage();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const storeUrl = business ? getStorefrontUrl(business) : '';

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storeUrl) return;
    window.open(storeUrl, '_blank');
  };

  useEffect(() => {
    if (!business) return;
    const unsubscribe = subscribeToOrders(business.id, (orders) => {
      const pendingCount = orders.filter((o) => o.status === "pending").length;
      setPendingOrdersCount(pendingCount);
    });
    return () => unsubscribe();
  }, [business]);

  const bizMeta = business
    ? BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail
    : BUSINESS_TYPES.retail;
  const modules = business?.modules;

  const isCreator = isCreatorProfile(business);
  
  const navItems: {
    id: DashboardTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    visible: boolean;
  }[] = isCreator
    ? [
        { id: "overview", label: "Overview", icon: LayoutDashboard, visible: true },
        { id: "share", label: "Profile Link & QR", icon: Share2, badge: "Public", visible: true },
        { id: "modules", label: "Creator Modules", icon: Layers, badge: "Modules", visible: true },
        { id: "portfolio", label: "Portfolio", icon: Briefcase, badge: "Showcase", visible: !!modules?.work_portfolio || !!modules?.portfolio },
        { id: "biolink", label: "Bio Link", icon: Link, badge: "@link", visible: !!modules?.universal_links || !!modules?.biolink },
        { id: "catalog", label: "Digital Products", icon: ShoppingBag, visible: !!modules?.digital_products || !!modules?.digitalProducts },
        { id: "orders", label: "Digital Sales", icon: Package, visible: !!modules?.digital_products || !!modules?.digitalProducts || !!modules?.cart_ordering },
        { id: "bookings", label: "1:1 Consultations", icon: CalendarCheck, visible: !!modules?.booking_appointments },
        { id: "quotes", label: "Custom Quotes", icon: FileText, visible: !!modules?.custom_quotes },
        { id: "events", label: "Events & Workshops", icon: Ticket, visible: !!modules?.events_tickets || !!modules?.events_ticketing },
        { id: "reviews", label: "Reviews", icon: Star, visible: !!modules?.reviews },
        { id: "analytics", label: "Traffic & Sales", icon: BarChart3, visible: true },
        { id: "payments", label: "Payments", icon: CreditCard, visible: true },
        { id: "notifications", label: "Activity", icon: Bell, visible: true },
        { id: "settings", label: "Creator Profile", icon: Settings, visible: true },
      ]
    : [
        {
          id: "overview",
          label: t("sidebar.dashboard"),
          icon: LayoutDashboard,
          visible: true,
        },
        {
          id: "share",
          label: "Store URL & QR",
          icon: Share2,
          badge: "QR & Link",
          visible: true,
        },
        {
          id: "catalog",
          label: bizMeta.itemPlural || t("sidebar.catalog"),
          icon: Package,
          visible:
            !!modules?.products ||
            !!modules?.services ||
            !!modules?.menu ||
            !!modules?.rooms ||
            !!modules?.vehicles,
        },
        {
          id: "categories",
          label: t("sidebar.categories"),
          icon: Layers,
          visible:
            !!modules?.products ||
            !!modules?.services ||
            !!modules?.menu ||
            !!modules?.rooms ||
            !!modules?.vehicles,
        },
        {
          id: "orders",
          label: t("sidebar.orders"),
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount.toString() : undefined,
          visible:
            !!modules?.cart_ordering || !!modules?.menu || !!modules?.products || !!modules?.table_delivery || !!modules?.inquiries,
        },
        {
          id: "bookings",
          label: t("sidebar.bookings"),
          icon: CalendarCheck,
          visible:
            !!modules?.booking_appointments ||
            !!modules?.stay_booking ||
            !!modules?.rental_booking,
        },
        {
          id: "customers",
          label: t("sidebar.customers"),
          icon: Users,
          visible: true,
        },
        {
          id: "reviews",
          label: t("sidebar.reviews"),
          icon: Star,
          visible: !!modules?.reviews,
        },
        {
          id: "offers",
          label: t("sidebar.offers"),
          icon: Tag,
          visible: !!modules?.offers,
        },
        {
          id: "analytics",
          label: t("sidebar.analytics"),
          icon: BarChart3,
          visible: true,
        },
        {
          id: "modules",
          label: t("sidebar.modules"),
          icon: Sliders,
          visible: true,
        },
        {
          id: "payments",
          label: t("sidebar.payments"),
          icon: CreditCard,
          visible: true,
        },
        {
          id: "notifications",
          label: t("sidebar.notifications"),
          icon: Bell,
          visible: true,
        },
        {
          id: "settings",
          label: t("sidebar.settings"),
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
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                onOpenStorefront();
                onClose();
              }}
              title={isCreator ? "Click to view live creator portfolio" : "Click to view live storefront"}
              className="touch-target-accessible min-h-[44px] flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-xl bg-white border overflow-hidden flex items-center justify-center shadow-xs transition ${
                isCreator ? 'border-slate-200 group-hover:border-indigo-500' : 'border-slate-200 group-hover:border-emerald-500'
              }`}>
                {getBusinessLogo(business) ? (
                  <img
                    src={getBusinessLogo(business)!}
                    alt={business?.name || "Logo"}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-black text-xs text-white ${
                    isCreator ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                  }`}>
                    {(business?.name || 'S').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <span className={`font-heading font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1 transition ${
                  isCreator ? 'group-hover:text-indigo-700' : 'group-hover:text-emerald-700'
                }`}>
                  Storelly
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    isCreator ? 'text-indigo-600 bg-indigo-50 border-indigo-200/60' : 'text-emerald-600 bg-emerald-50 border-emerald-200/60'
                  }`}>
                    {isCreator ? 'CREATOR' : 'OS'}
                  </span>
                </span>
              </div>
            </button>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Business Card - Click to Open Storefront / Portfolio */}
          {business && (
            <div className="px-3.5 pt-3 pb-1">
              <button
                type="button"
                onClick={() => {
                  onOpenStorefront();
                  onClose();
                }}
                title={isCreator ? "Click to view your live portfolio / public page" : "Click to open your live public storefront"}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-2.5 transition group cursor-pointer shadow-2xs touch-target-accessible min-h-[48px] ${
                  isCreator
                    ? "bg-slate-50 hover:bg-indigo-50/80 active:bg-indigo-100/60 border-slate-200/80 hover:border-indigo-300"
                    : "bg-slate-50 hover:bg-emerald-50/80 active:bg-emerald-100/60 border-slate-200/80 hover:border-emerald-300"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg bg-white border overflow-hidden shrink-0 transition ${
                  isCreator ? "border-slate-200 group-hover:border-indigo-400" : "border-slate-200 group-hover:border-emerald-400"
                }`}>
                  {getBusinessLogo(business) ? (
                    <SafeImage
                      src={getBusinessLogo(business)!}
                      alt={business.name}
                      fallbackType="avatar"
                      loading="lazy"
                      className="w-full h-full object-contain object-center group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-black text-xs text-white ${
                      isCreator ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                    }`}>
                      {business.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${
                      isCreator ? "text-slate-900 group-hover:text-indigo-800" : "text-slate-900 group-hover:text-emerald-800"
                    }`}>
                      {business.name}
                    </h4>
                    <ExternalLink className={`w-3 h-3 text-slate-400 shrink-0 ${
                      isCreator ? "group-hover:text-indigo-600" : "group-hover:text-emerald-600"
                    }`} />
                  </div>
                  <p className={`text-[10px] font-medium truncate flex items-center justify-between gap-1 ${
                    isCreator ? "text-indigo-600" : "text-emerald-600"
                  }`}>
                    <span className="flex items-center gap-1 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse shrink-0 ${
                        isCreator ? "bg-indigo-500" : "bg-emerald-500"
                      }`} />
                      <span className="truncate">{isCreator ? 'Creator Studio' : bizMeta.label}</span>
                    </span>
                    <span className={`text-[9px] font-semibold shrink-0 ${
                      isCreator ? "text-slate-400 group-hover:text-indigo-700" : "text-slate-400 group-hover:text-emerald-700"
                    }`}>
                      {isCreator ? "Live Profile →" : "Open Store →"}
                    </span>
                  </p>
                </div>
              </button>

              {/* Quick URL & QR Action Strip */}
              <div className="mt-1.5 flex items-center justify-between gap-1 px-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy store link"
                  className="flex-1 touch-target-accessible min-h-[44px] py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("share");
                    onClose();
                  }}
                  title="Open Store QR Code"
                  className="touch-target-accessible min-h-[44px] min-w-[44px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternal}
                  title="Open live store in a new browser tab"
                  className="touch-target-accessible min-h-[44px] min-w-[44px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>New Tab</span>
                </button>
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
                    className={`w-full touch-target-accessible min-h-[44px] flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? isCreator
                          ? "bg-indigo-50 text-indigo-700 font-bold shadow-xs"
                          : "bg-emerald-50 text-emerald-700 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? isCreator
                              ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                              : "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isCreator ? "bg-indigo-100/70 text-indigo-800" : "bg-emerald-100/70 text-emerald-800"
                      }`}>
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
              className="w-full touch-target-accessible min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Master Admin Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStorefront}
            className={`w-full touch-target-accessible min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
              isCreator ? "hover:text-indigo-700" : "hover:text-emerald-700"
            }`}
          >
            {isCreator ? <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> : <Store className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isCreator ? 'View Public Profile' : 'View Public Store'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full touch-target-accessible min-h-[44px] flex items-center gap-2 py-2 px-3 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
