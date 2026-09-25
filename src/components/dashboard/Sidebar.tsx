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
import { auth } from "../../config/firebase";
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
    if (!business?.id || !auth?.currentUser) {
      setPendingOrdersCount(0);
      return;
    }
    const unsubscribe = subscribeToOrders(business.id, (orders) => {
      const pendingCount = orders.filter((o) => o.status === "pending").length;
      setPendingOrdersCount(pendingCount);
    });
    return () => unsubscribe();
  }, [business?.id]);

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
            !!modules?.vehicles ||
            !!modules?.digital_products ||
            !!modules?.digitalProducts,
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
            !!modules?.cart_ordering ||
            !!modules?.menu ||
            !!modules?.products ||
            !!modules?.table_delivery ||
            !!modules?.inquiries ||
            !!modules?.digital_products ||
            !!modules?.digitalProducts,
        },
        {
          id: "portfolio",
          label: "Portfolio",
          icon: Briefcase,
          badge: "Showcase",
          visible: !!modules?.work_portfolio || !!modules?.portfolio,
        },
        {
          id: "biolink",
          label: "Bio Link",
          icon: Link,
          badge: "@link",
          visible: !!modules?.universal_links || !!modules?.biolink,
        },
        {
          id: "events",
          label: "Events & Tickets",
          icon: Ticket,
          visible: !!modules?.events_tickets || !!modules?.events_ticketing,
        },
        {
          id: "quotes",
          label: "Custom Quotes",
          icon: FileText,
          visible: !!modules?.custom_quotes,
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
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                onOpenStorefront();
                onClose();
              }}
              title={isCreator ? "Click to view live creator portfolio" : "Click to view live storefront"}
              className="touch-target-accessible min-h-[44px] flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-[var(--r8)] bg-[var(--card)] border border-[var(--border)] group-hover:border-[var(--g500)] overflow-hidden flex items-center justify-center shadow-[var(--shadow-xs)] transition">
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
                  <div className="w-full h-full flex items-center justify-center font-black text-xs text-white bg-[var(--g600)]">
                    {(business?.name || 'S').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg text-[var(--t1)] tracking-tight flex items-center gap-1 transition group-hover:text-[var(--g700)]">
                  Storelly
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--r4)] border text-[var(--g600)] bg-[var(--g100)] border-[var(--g200)]">
                    {isCreator ? 'CREATOR' : 'OS'}
                  </span>
                </span>
              </div>
            </button>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-[var(--t3)] hover:text-[var(--t1)] rounded-[var(--r8)] cursor-pointer"
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
                className="w-full text-left p-2.5 rounded-[var(--r12)] border border-[var(--border)] hover:border-[var(--g400)] bg-[var(--bg)] hover:bg-[var(--g100)] active:bg-[var(--g100)] flex items-center gap-2.5 transition group cursor-pointer shadow-[var(--shadow-xs)] touch-target-accessible min-h-[48px]"
              >
                <div className="w-9 h-9 rounded-[var(--r8)] bg-[var(--card)] border border-[var(--border)] group-hover:border-[var(--g500)] overflow-hidden shrink-0 transition">
                  {getBusinessLogo(business) ? (
                    <SafeImage
                      src={getBusinessLogo(business)!}
                      alt={business.name}
                      fallbackType="avatar"
                      loading="lazy"
                      className="w-full h-full object-contain object-center group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xs text-white bg-[var(--g600)]">
                      {business.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-heading font-bold truncate text-[var(--t1)] group-hover:text-[var(--g700)]">
                      {business.name}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-[var(--t3)] shrink-0 group-hover:text-[var(--g600)]" />
                  </div>
                  <p className="text-[10px] font-medium truncate flex items-center justify-between gap-1 text-[var(--g600)]">
                    <span className="flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse shrink-0 bg-[var(--g500)]" />
                      <span className="truncate">{isCreator ? 'Creator Studio' : bizMeta.label}</span>
                    </span>
                    <span className="text-[9px] font-semibold shrink-0 text-[var(--t3)] group-hover:text-[var(--g700)]">
                      {isCreator ? "Live Profile →" : "Open Store →"}
                    </span>
                  </p>
                </div>
              </button>

              {/* Quick URL & QR Action Strip */}
              <div className="mt-1.5 flex items-center justify-between gap-1 px-1 text-[11px] text-[var(--t2)]">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy store link"
                  className="flex-1 touch-target-accessible min-h-[44px] py-1 px-2 rounded-[var(--r8)] bg-[var(--bg)] hover:bg-[var(--g100)] text-[var(--t1)] font-medium flex items-center justify-center gap-1 transition cursor-pointer border border-[var(--border)]"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[var(--g600)]" />
                      <span className="text-[var(--g700)] font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[var(--t3)]" />
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
                  className="touch-target-accessible min-h-[44px] min-w-[44px] py-1 px-2.5 rounded-[var(--r8)] bg-[var(--bg)] hover:bg-[var(--g100)] text-[var(--t1)] font-medium flex items-center justify-center gap-1 transition cursor-pointer border border-[var(--border)]"
                >
                  <QrCode className="w-3.5 h-3.5 text-[var(--t2)]" />
                  <span>QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternal}
                  title="Open live store in a new browser tab"
                  className="touch-target-accessible min-h-[44px] min-w-[44px] py-1 px-2.5 rounded-[var(--r8)] bg-[var(--bg)] hover:bg-[var(--g100)] text-[var(--t1)] font-medium flex items-center justify-center gap-1 transition cursor-pointer border border-[var(--border)]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--t2)]" />
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
                    className={`w-full touch-target-accessible min-h-[44px] flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-[var(--r8)] transition-all cursor-pointer ${
                      isActive
                        ? "bg-[var(--g100)] text-[var(--g700)] font-bold shadow-[var(--shadow-xs)]"
                        : "text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-[var(--r8)] flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-[var(--g600)] text-white shadow-[var(--shadow-xs)]"
                            : "bg-[var(--bg)] text-[var(--t3)] group-hover:bg-[var(--card)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--r4)] bg-[var(--g100)] text-[var(--g700)]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[var(--border)] space-y-2 bg-[var(--bg)]">
          {onOpenMasterAdmin && (
            <button
              type="button"
              onClick={onOpenMasterAdmin}
              className="w-full touch-target-accessible min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 bg-[var(--card)] hover:bg-[var(--g100)] border border-[var(--border)] text-[var(--t1)] rounded-[var(--r8)] text-xs font-bold transition shadow-[var(--shadow-xs)] cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--t2)]" />
              <span>Master Admin Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStorefront}
            className="w-full touch-target-accessible min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 bg-[var(--card)] hover:bg-[var(--g100)] hover:text-[var(--g700)] border border-[var(--border)] text-[var(--t1)] rounded-[var(--r8)] text-xs font-semibold shadow-[var(--shadow-xs)] transition cursor-pointer"
          >
            {isCreator ? <Sparkles className="w-3.5 h-3.5 text-[var(--g600)]" /> : <Store className="w-3.5 h-3.5 text-[var(--g600)]" />}
            <span>{isCreator ? 'View Public Profile' : 'View Public Store'}</span>
            <ExternalLink className="w-3 h-3 text-[var(--t3)]" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full touch-target-accessible min-h-[44px] flex items-center gap-2 py-2 px-3 text-[var(--t2)] hover:text-[var(--r500)] hover:bg-[var(--r100)] rounded-[var(--r8)] text-xs font-medium transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
