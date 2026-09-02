import React, { useState, useEffect } from 'react';
import {
  Menu,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Plus,
  ChevronDown,
  Store,
  User,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { getStorefrontUrl, subscribeToOrders } from '../../services/firebaseService';
import { requestFcmNotificationPermission } from '../../services/fcmPushService';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  business: BusinessProfile | null;
  userBusinesses: BusinessProfile[];
  onSelectBusiness: (biz: BusinessProfile) => void;
  onCreateNewBusiness: () => void;
  onToggleSidebar: () => void;
  onOpenStorefront: () => void;
  onOpenShareModal: () => void;
  userName?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  userBusinesses,
  onSelectBusiness,
  onCreateNewBusiness,
  onToggleSidebar,
  onOpenStorefront,
  onOpenShareModal,
  userName,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const storeUrl = business ? getStorefrontUrl(business) : '';

  useEffect(() => {
    if (!business) return;
    const unsubscribe = subscribeToOrders(business.id, (orders) => {
      const pendingCount = orders.filter(o => o.status === 'pending').length;
      setPendingOrdersCount(pendingCount);
    });
    return () => unsubscribe();
  }, [business]);

  const handleCopy = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Hamburger & Store Switcher */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            {business?.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            ) : (
              <Store className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="max-w-[140px] sm:max-w-[200px] truncate">
              {business ? business.name : t("header.selectStore")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {bizDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 py-1.5">
                {" " + t("header.myBusinesses") + " "} ({userBusinesses.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1 my-1">
                {userBusinesses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSelectBusiness(b);
                      setBizDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition ${
                      business?.id === b.id
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {b.logo ? (
                        <img src={b.logo} alt={b.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span className="truncate">{b.name}</span>
                    </div>
                    {business?.id === b.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setBizDropdownOpen(false);
                    onCreateNewBusiness();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("header.createNewStore")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Storefront Status Pill - Click to Open */}
        {business && (
          <button
            type="button"
            onClick={onOpenStorefront}
            title="Click to visit live public storefront"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 hover:border-emerald-300 text-[11px] font-semibold transition cursor-pointer group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("header.storeLive")}</span>
            <ExternalLink className="w-2.5 h-2.5 text-emerald-600 opacity-60 group-hover:opacity-100 transition ml-0.5" />
          </button>
        )}
      </div>

      {/* Right side quick actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        {/* Notifications */}
        <button
          type="button"
          onClick={() => requestFcmNotificationPermission()}
          className="relative p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition cursor-pointer"
          title="Enable Real-Time Browser Push Notifications (FCM)"
        >
          <Bell className="w-5 h-5" />
          {pendingOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">
              {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
            </span>
          )}
        </button>

        <PWAInstallPrompt variant="button" customTitle="Install Storelly Merchant App" />

        {business && (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              title="Copy public store link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? t("header.copied") : t("header.copyLink")}</span>
            </button>

            <button
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t("header.shareQR")}</span>
            </button>

            <button
              type="button"
              onClick={onOpenStorefront}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm shadow-emerald-600/20"
            >
              <span className="hidden sm:inline">{t("header.visitStore")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            {userName ? userName.slice(0, 1).toUpperCase() : <User className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>
    </header>
  );
};
