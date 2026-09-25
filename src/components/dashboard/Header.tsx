import React, { useState, useEffect, useRef } from 'react';
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
import { BusinessProfile, Notification } from '../../types';
import { getStorefrontUrl, subscribeToNotifications } from '../../services/firebaseService';
import { auth } from '../../config/firebase';
import { requestFcmNotificationPermission } from '../../services/fcmPushService';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { isCreatorProfile, getPrimaryPublicUrl, getProfileTypeLabel } from '../../utils/profileHelper';
import { SafeImage } from '../common/SafeImage';
import { useFirestoreSyncStatus } from '../../services/firestoreSyncService';
import { getBusinessLogo } from '../../utils/branding';

interface HeaderProps {
  business: BusinessProfile | null;
  userBusinesses: BusinessProfile[];
  onSelectBusiness: (biz: BusinessProfile) => void;
  onCreateNewBusiness: () => void;
  onToggleSidebar: () => void;
  onOpenStorefront: () => void;
  onOpenShareModal: () => void;
  onNavigateToNotifications?: () => void;
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
  onNavigateToNotifications,
  userName,
}) => {
  const { t } = useLanguage();
  const syncStatus = useFirestoreSyncStatus();
  const [copied, setCopied] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [copiedBizId, setCopiedBizId] = useState<string | null>(null);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const prevUnreadCountRef = useRef(0);

  const isCreator = isCreatorProfile(business);
  const storeUrl = business ? (isCreator ? getPrimaryPublicUrl(business) : getStorefrontUrl(business)) : '';

  useEffect(() => {
    if (!business?.id || !auth?.currentUser) {
      setUnreadNotificationsCount(0);
      return;
    }
    const unsubscribe = subscribeToNotifications(business.id, (notifications) => {
      const count = notifications.filter((n) => !n.read).length;
      
      // Play sound if a new notification arrives
      if (count > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
        playNotificationSound();
      }
      prevUnreadCountRef.current = count;
      setUnreadNotificationsCount(count);
    });
    return () => unsubscribe();
  }, [business?.id]);

  const playNotificationSound = () => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      const playNote = (freq: number, start: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play a pleasant "pop" / "chime" sequence (D5 -> A5)
      playNote(587.33, now, 0.4, 0.1);
      playNote(880, now + 0.1, 0.5, 0.1);
    } catch (err) {
      // ignore
    }
  };

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!storeUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(storeUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = storeUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setShowCopiedToast(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setShowCopiedToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy store URL:', err);
    }
  };

  const handleCopySpecificBiz = async (e: React.MouseEvent, biz: BusinessProfile) => {
    e.stopPropagation();
    const url = isCreatorProfile(biz) ? getPrimaryPublicUrl(biz) : getStorefrontUrl(biz);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedBizId(biz.id);
      setShowCopiedToast(true);
      setTimeout(() => setCopiedBizId(null), 2500);
      setTimeout(() => setShowCopiedToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy specific biz URL:', err);
    }
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storeUrl) return;
    window.open(storeUrl, '_blank');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)] px-3 sm:px-6 flex items-center justify-between">
      {/* Copied Toast Confirmation Banner */}
      {showCopiedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[var(--g900)] text-white text-xs font-bold rounded-[var(--r16)] shadow-[var(--shadow-lg)] border border-[var(--border)] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-[var(--g500)]/20 text-[var(--g300)] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span>Copied!</span>
            <span className="text-[var(--g200)] font-normal hidden xs:inline">Public store link ready to share</span>
          </div>
        </div>
      )}

      {/* Left side: Hamburger & Store Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-[var(--r8)] text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg)] transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            className="touch-target-accessible min-h-[44px] flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-[var(--r8)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--g100)] text-[var(--t1)] text-xs font-bold transition shadow-[var(--shadow-xs)] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-[var(--r8)] overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--g100)] text-[var(--g700)] shadow-[var(--shadow-xs)] flex items-center justify-center font-black text-[10px]">
              {getBusinessLogo(business) ? (
                <SafeImage
                  src={getBusinessLogo(business)!}
                  alt={business?.name || "Store"}
                  fallbackType="avatar"
                  loading="lazy"
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <span>{(business?.name || (isCreator ? 'C' : 'M')).slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="max-w-[100px] sm:max-w-[160px] md:max-w-[200px] truncate">
              {business ? business.name : t("header.selectStore")}
            </span>
            <span className="hidden md:inline-flex items-center text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--r4)] bg-[var(--g100)] text-[var(--g700)] border border-[var(--g200)]">
              {isCreator ? 'Creator' : 'Merchant'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--t3)] shrink-0" />
          </button>

          {bizDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-[var(--card)] rounded-[var(--r16)] shadow-[var(--shadow)] border border-[var(--border)] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider">
                  {t("header.myBusinesses")} ({userBusinesses.length})
                </span>
                <span className="text-[10px] text-[var(--t3)]">Click to switch</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 my-1 p-0.5">
                {userBusinesses.map((b) => {
                  const bCreator = isCreatorProfile(b);
                  const isSelected = business?.id === b.id;
                  const bImg = getBusinessLogo(b);
                  const bUrl = bCreator ? getPrimaryPublicUrl(b) : getStorefrontUrl(b);
                  const isCopied = copiedBizId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        onSelectBusiness(b);
                        setBizDropdownOpen(false);
                      }}
                      className={`group w-full flex items-center justify-between p-2 touch-target-accessible min-h-[44px] text-xs rounded-[var(--r8)] transition cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--g100)] text-[var(--g800)] font-bold border border-[var(--g300)]'
                          : 'text-[var(--t1)] hover:bg-[var(--bg)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-[var(--r8)] overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center font-bold text-xs">
                          {bImg ? (
                            <SafeImage
                              src={bImg}
                              alt={b.name}
                              fallbackType="avatar"
                              loading="lazy"
                              className="w-full h-full object-contain object-center"
                            />
                          ) : (
                            <span>{b.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 text-left flex-1">
                          <span className="truncate block font-semibold text-xs text-[var(--t1)]">{b.name}</span>
                          <span className="text-[10px] font-mono block truncate text-[var(--g600)]">
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
                          className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-[var(--r8)] hover:bg-[var(--card)] text-[var(--t3)] hover:text-[var(--t1)] transition cursor-pointer"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-[var(--g600)]" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(bUrl, '_blank');
                          }}
                          title="Open Store in New Tab"
                          aria-label="Open Store in New Tab"
                          className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-[var(--r8)] hover:bg-[var(--card)] text-[var(--t3)] hover:text-[var(--t1)] transition cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setBizDropdownOpen(false);
                    onCreateNewBusiness();
                  }}
                  className="w-full touch-target-accessible min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[var(--g700)] hover:bg-[var(--g100)] rounded-[var(--r8)] transition cursor-pointer"
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
          <div className="hidden lg:flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r8)] px-2.5 py-1 text-xs text-[var(--t2)] font-mono">
            <span className="w-1.5 h-1.5 rounded-full inline-block bg-[var(--g500)] animate-pulse" />
            <span className="max-w-[200px] truncate text-[11px] text-[var(--t1)] select-all">
              {storeUrl.replace(/^https?:\/\//, '')}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopy(e)}
              title="Copy store link"
              aria-label="Copy store link"
              className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-1 text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--g100)] rounded-[var(--r8)] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Open storefront in new tab"
              aria-label="Open storefront in new tab"
              className="touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right side quick actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Firestore Real-Time Sync Indicator */}
        <div
          role="status"
          aria-live="polite"
          title={
            syncStatus === 'synced'
              ? 'Firestore Online • Real-time cloud sync active'
              : syncStatus === 'syncing'
              ? 'Firestore Syncing • Saving changes to cloud...'
              : 'Firestore Offline • Network disconnected'
          }
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold select-none bg-slate-50/90 border-slate-200/80 transition shadow-2xs"
        >
          <span className="relative flex h-2 w-2">
            {syncStatus === 'syncing' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            {syncStatus === 'synced' && (
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500 ring-2 ring-emerald-100'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500 ring-2 ring-amber-100'
                  : 'bg-rose-500 ring-2 ring-rose-100'
              }`}
            />
          </span>
          <span className="text-[11px] hidden sm:inline-block">
            {syncStatus === 'synced' && <span className="text-emerald-700 font-bold">Synced</span>}
            {syncStatus === 'syncing' && <span className="text-amber-700 font-bold">Syncing</span>}
            {syncStatus === 'offline' && <span className="text-rose-700 font-bold">Offline</span>}
          </span>
        </div>

        <LanguageSwitcher />

        {/* Notifications */}
        <button
          type="button"
          onClick={() => {
            if (onNavigateToNotifications) {
              onNavigateToNotifications();
            } else {
              requestFcmNotificationPermission();
            }
          }}
          className="relative touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {business && (
          <>
            {/* Copy Store URL Button (Accessible on desktop and mobile) */}
            <button
              type="button"
              onClick={(e) => handleCopy(e)}
              aria-label="Copy Store URL"
              title={isCreator ? "Copy live portfolio URL" : "Copy public store URL"}
              className={`touch-target-accessible min-h-[44px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-[var(--r8)] border transition shadow-[var(--shadow-xs)] flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g400)] ring-2 ring-[var(--g400)]/20'
                  : 'bg-[var(--card)] hover:bg-[var(--bg)] text-[var(--t1)] border-[var(--border)]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--g600)] shrink-0" />
                  <span className="text-[var(--g700)] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--t3)] shrink-0" />
                  <span className="hidden sm:inline">Copy Store URL</span>
                  <span className="sm:hidden">Copy URL</span>
                </>
              )}
            </button>

            {/* Share & QR Code Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              title="View & Share Store QR Code & Digital Visiting Card"
              aria-label="Share Store and QR Code"
              className={`touch-target-accessible min-h-[44px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-[var(--r8)] transition shadow-[var(--shadow-xs)] border flex items-center gap-1.5 cursor-pointer ${
                isCreator
                  ? 'text-[var(--p500)] bg-[var(--p100)] hover:bg-purple-100 border-purple-200'
                  : 'text-[var(--g700)] bg-[var(--g100)] hover:bg-[var(--g200)] border-[var(--g200)]'
              }`}
            >
              <QrCode className={`w-3.5 h-3.5 ${isCreator ? 'text-[var(--p500)]' : 'text-[var(--g600)]'}`} />
              <span className="hidden md:inline">Share & QR</span>
            </button>

            {/* Open / Visit Storefront Button with In-App & New-Tab */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onOpenStorefront}
                title={isCreator ? "Preview creator portfolio" : "Preview live digital storefront in-app"}
                className={`touch-target-accessible min-h-[44px] px-3 py-1.5 text-xs font-bold text-white rounded-l-[var(--r8)] transition shadow-[var(--shadow-xs)] flex items-center gap-1.5 cursor-pointer ${
                  isCreator
                    ? 'bg-[var(--p500)] hover:bg-purple-700 shadow-purple-600/20'
                    : 'bg-[var(--g600)] hover:bg-[var(--g700)] shadow-[var(--shadow-xs)]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{isCreator ? 'Live Profile' : t("header.visitStore")}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                title="Open live storefront in new browser tab"
                aria-label="Open live storefront in new tab"
                className={`touch-target-accessible min-h-[44px] min-w-[44px] flex items-center justify-center px-2.5 py-1.5 text-white text-xs rounded-r-[var(--r8)] border-l border-white/20 transition cursor-pointer ${
                  isCreator
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : 'bg-[var(--g700)] hover:bg-[var(--g800)]'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--t1)] flex items-center justify-center font-bold text-xs">
            {userName ? userName.slice(0, 1).toUpperCase() : <User className="w-4 h-4 text-[var(--t3)]" />}
          </div>
        </div>
      </div>
    </header>
  );
};

export const DashboardHeader = Header;
export default Header;
