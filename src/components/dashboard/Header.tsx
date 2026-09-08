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
  Bell,
  Sparkles,
  Briefcase,
  QrCode,
  Globe
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { getStorefrontUrl, subscribeToOrders } from '../../services/firebaseService';
import { requestFcmNotificationPermission } from '../../services/fcmPushService';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { isCreatorProfile, getPrimaryPublicUrl, getProfileTypeLabel } from '../../utils/profileHelper';
import { SafeImage } from '../common/SafeImage';

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
  const [copiedBizId, setCopiedBizId] = useState<string | null>(null);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const isCreator = isCreatorProfile(business);
  const storeUrl = business ? (isCreator ? getPrimaryPublicUrl(business) : getStorefrontUrl(business)) : '';

  useEffect(() => {
    if (!business) return;
    const unsubscribe = subscribeToOrders(business.id, (orders) => {
      const pendingCount = orders.filter(o => o.status === 'pending').length;
      setPendingOrdersCount(pendingCount);
    });
    return () => unsubscribe();
  }, [business]);

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySpecificBiz = (e: React.MouseEvent, biz: BusinessProfile) => {
    e.stopPropagation();
    const url = isCreatorProfile(biz) ? getPrimaryPublicUrl(biz) : getStorefrontUrl(biz);
    navigator.clipboard.writeText(url);
    setCopiedBizId(biz.id);
    setTimeout(() => setCopiedBizId(null), 2000);
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storeUrl) return;
    window.open(storeUrl, '_blank');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between">
      {/* Left side: Hamburger & Store Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            className={`min-h-[44px] flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
              isCreator
                ? 'bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200 text-indigo-950'
                : 'bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 border shadow-2xs ${
              isCreator ? 'border-indigo-300/80 bg-indigo-100 text-indigo-700' : 'border-emerald-300/80 bg-emerald-100 text-emerald-700'
            } flex items-center justify-center font-black text-[10px]`}>
              {business?.logo || business?.profileImage ? (
                <SafeImage
                  src={business.logo || business.profileImage}
                  alt={business?.name || "Store"}
                  fallbackType="avatar"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(business?.name || (isCreator ? 'C' : 'M')).slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="max-w-[100px] sm:max-w-[160px] md:max-w-[200px] truncate">
              {business ? business.name : t("header.selectStore")}
            </span>
            <span className={`hidden md:inline-flex items-center text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
              isCreator
                ? 'bg-indigo-100/80 text-indigo-800 border border-indigo-200/60'
                : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/60'
            }`}>
              {isCreator ? 'Creator' : 'Merchant'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {bizDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("header.myBusinesses")} ({userBusinesses.length})
                </span>
                <span className="text-[10px] text-slate-400">Click to switch</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 my-1 p-0.5">
                {userBusinesses.map((b) => {
                  const bCreator = isCreatorProfile(b);
                  const isSelected = business?.id === b.id;
                  const bImg = b.logo || b.profileImage;
                  const bUrl = bCreator ? getPrimaryPublicUrl(b) : getStorefrontUrl(b);
                  const isCopied = copiedBizId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        onSelectBusiness(b);
                        setBizDropdownOpen(false);
                      }}
                      className={`group w-full flex items-center justify-between p-2 min-h-[44px] text-xs rounded-xl transition cursor-pointer ${
                        isSelected
                          ? bCreator
                            ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/80'
                            : 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                          : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center font-bold text-xs ${
                          bCreator ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                        }`}>
                          {bImg ? (
                            <SafeImage
                              src={bImg}
                              alt={b.name}
                              fallbackType="avatar"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{b.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 text-left flex-1">
                          <span className="truncate block font-semibold text-xs">{b.name}</span>
                          <span className={`text-[10px] font-mono block truncate ${bCreator ? 'text-indigo-600' : 'text-emerald-600'}`}>
                            {bUrl.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => handleCopySpecificBiz(e, b)}
                          title="Copy Public URL"
                          aria-label="Copy Public URL"
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 rounded-md hover:bg-white text-slate-400 hover:text-slate-700 transition"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(bUrl, '_blank');
                          }}
                          title="Open Store in New Tab"
                          aria-label="Open Store in New Tab"
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 rounded-md hover:bg-white text-slate-400 hover:text-slate-700 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setBizDropdownOpen(false);
                    onCreateNewBusiness();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Store or Creator Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live URL Pill (Desktop & Tablet) */}
        {business && storeUrl && (
          <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-600 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${isCreator ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="max-w-[200px] truncate text-[11px] text-slate-700 select-all">
              {storeUrl.replace(/^https?:\/\//, '')}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopy(e)}
              title="Copy store link"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition cursor-pointer ml-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Open storefront in new tab"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right side quick actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher />

        {/* Notifications */}
        <button
          type="button"
          onClick={() => requestFcmNotificationPermission()}
          className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition cursor-pointer"
          title="Enable Real-Time Browser Push Notifications (FCM)"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {pendingOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">
              {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
            </span>
          )}
        </button>

        <PWAInstallPrompt variant="button" customTitle={isCreator ? "Install Storelly Creator App" : "Install Storelly Merchant App"} />

        {business && (
          <>
            {/* Quick Copy Button */}
            <button
              type="button"
              onClick={(e) => handleCopy(e)}
              className="hidden md:flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              title={isCreator ? "Copy live portfolio link" : "Copy public store link"}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? t("header.copied") : t("header.copyLink")}</span>
            </button>

            {/* Share & QR Code Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              title="View & Share Store QR Code & Digital Visiting Card"
              className={`flex items-center gap-1.5 min-h-[44px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition shadow-2xs border cursor-pointer ${
                isCreator
                  ? 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              <QrCode className={`w-3.5 h-3.5 ${isCreator ? 'text-indigo-600' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">Share & QR</span>
            </button>

            {/* Open / Visit Storefront Button with In-App & New-Tab */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onOpenStorefront}
                title={isCreator ? "Preview creator portfolio" : "Preview live digital storefront in-app"}
                className={`flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs font-bold text-white rounded-l-xl transition shadow-sm cursor-pointer ${
                  isCreator
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{isCreator ? 'Live Profile' : t("header.visitStore")}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                title="Open live storefront in new browser tab"
                aria-label="Open live storefront in new tab"
                className={`min-h-[44px] min-w-[40px] flex items-center justify-center px-2.5 py-1.5 text-white text-xs rounded-r-xl border-l border-white/20 transition cursor-pointer ${
                  isCreator
                    ? 'bg-indigo-700 hover:bg-indigo-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            {userName ? userName.slice(0, 1).toUpperCase() : <User className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>
    </header>
  );
};

export const DashboardHeader = Header;
export default Header;
