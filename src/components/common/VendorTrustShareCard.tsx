import React, { useState, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Star,
  Check,
  Copy,
  Download,
  Share2,
  ExternalLink,
  MessageCircle,
  Truck,
  Heart,
  ShieldCheck,
  Leaf,
  Gift,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  QrCode,
  Sliders,
  X,
  Store,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { getStorefrontUrl, getTrustCardUrl, updateBusiness } from '../../services/firebaseService';
import { SafeImage } from './SafeImage';

interface VendorTrustShareCardProps {
  business: BusinessProfile;
  onOpenStore?: () => void;
  standalone?: boolean; // If true, rendered as full standalone page
  onCloseModal?: () => void;
}

export const VendorTrustShareCard: React.FC<VendorTrustShareCardProps> = ({
  business,
  onOpenStore,
  standalone = false,
  onCloseModal,
}) => {
  const cardNodeRef = useRef<HTMLDivElement>(null);

  // Settings from business or smart fallbacks matching the reference card
  const settings = business.trustCardSettings || {};
  const defaultHeadline = settings.headline || business.name || 'Sri Lakshmi Pickles';
  const defaultSubHeadline = settings.subHeadline || business.tagline || 'Homemade with love';
  const defaultBadge1 = settings.badge1 || '100% Homemade';
  const defaultBadge2 = settings.badge2 || 'No Preservatives';
  const defaultPill1 = settings.trustPill1Text || 'Pure Ingredients';
  const defaultPill2 = settings.trustPill2Text || 'Hygienic Prepared';
  const defaultPill3 = settings.trustPill3Text || 'Pan India Delivery';
  const defaultPill4 = settings.trustPill4Text || 'Made with Love';
  const defaultTaglineDivider =
    settings.taglineDivider ||
    `${defaultSubHeadline} · Fresh & Natural ingredients · ${defaultPill3}`;

  // Default coupon code derived from business name (e.g. LAKSHMI10)
  const cleanNameForCode = business.name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 7);
  const defaultCouponCode = settings.couponCode || (cleanNameForCode ? `${cleanNameForCode}10` : 'WELCOME10');
  const defaultDiscount = settings.couponDiscount || 'Flat 10% OFF on All Orders';
  const ratingValue = settings.rating || 4.8;
  const reviewCountValue = settings.reviewCount || 128;
  const happyCustomersText = settings.happyCustomers || '256+ Happy Customers';

  // Customizable states
  const [headline, setHeadline] = useState(defaultHeadline);
  const [subHeadline, setSubHeadline] = useState(defaultSubHeadline);
  const [badge1, setBadge1] = useState(defaultBadge1);
  const [badge2, setBadge2] = useState(defaultBadge2);
  const [pill1, setPill1] = useState(defaultPill1);
  const [pill2, setPill2] = useState(defaultPill2);
  const [pill3, setPill3] = useState(defaultPill3);
  const [pill4, setPill4] = useState(defaultPill4);
  const [taglineDivider, setTaglineDivider] = useState(defaultTaglineDivider);
  const [couponCode, setCouponCode] = useState(defaultCouponCode);
  const [couponDiscount, setCouponDiscount] = useState(defaultDiscount);

  // UI state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  const storeUrl = getStorefrontUrl(business);
  const cardUrl = getTrustCardUrl(business);
  const displayUrl = storeUrl.replace(/^https?:\/\//, '').split('?')[0];
  const merchantPhone = (business.whatsapp || business.phone || '919876543210').replace(/\D/g, '');

  const whatsappGreetingText = encodeURIComponent(
    `👋 Hello *${business.name}*!\n\n` +
    `I saw your official store trust card! 🏪✨\n` +
    `🏷️ Special Offer: *${couponDiscount}* (Code: *${couponCode}*)\n\n` +
    `🛒 I would like to check your available products and place an order.\n` +
    `👉 Store: ${storeUrl}`
  );

  const whatsappShareText = encodeURIComponent(
    `✨ *${headline.toUpperCase()}* ✨\n` +
    `• ${subHeadline} •\n\n` +
    `⭐ *${ratingValue}* (${reviewCountValue} Reviews) • ${happyCustomersText}\n` +
    `🌿 ${pill1} | 🛡️ ${pill2} | 🚚 ${pill3} | ❤️ ${pill4}\n\n` +
    `🎁 *SPECIAL OFFER:* ${couponDiscount}\n` +
    `🏷️ Use Coupon Code: *${couponCode}*\n\n` +
    `👇 *VISIT OUR DIGITAL STORE & ORDER DIRECTLY ON WHATSAPP:*\n` +
    `🔗 ${storeUrl}\n\n` +
    `📍 ${business.city || 'Pan-India Delivery'}`
  );

  // 1. Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 2. Copy Coupon
  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  // 3. Download High-Res PNG Card
  const handleDownloadPng = async () => {
    if (!cardNodeRef.current || isExporting) return;
    setIsExporting(true);
    setExportSuccessMsg('Generating high-res card image...');

    try {
      // Allow browser render frame
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardNodeRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // Crisp retina quality
        quality: 0.98,
        backgroundColor: '#FFFFFF',
      });

      const downloadAnchor = document.createElement('a');
      downloadAnchor.download = `${business.slug || 'store'}-trust-share-card.png`;
      downloadAnchor.href = dataUrl;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      setExportSuccessMsg('✅ Image downloaded! You can now send it on WhatsApp.');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to export card as PNG:', err);
      setExportSuccessMsg('Could not download image. Please take a screenshot or copy link.');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Copy Image to Clipboard (Paste directly into WhatsApp Web/Desktop)
  const handleCopyImageToClipboard = async () => {
    if (!cardNodeRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await toBlob(cardNodeRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#FFFFFF',
      });

      if (!blob) throw new Error('Blob generation failed');

      if (navigator.clipboard && window.ClipboardItem) {
        // @ts-ignore
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        setExportSuccessMsg('✅ Image copied! You can now press Ctrl+V / Paste directly into WhatsApp chat.');
        setTimeout(() => {
          setCopiedImage(false);
          setExportSuccessMsg('');
        }, 4000);
      } else {
        throw new Error('ClipboardItem not supported');
      }
    } catch (err) {
      console.warn('Clipboard write image failed, falling back to download:', err);
      handleDownloadPng();
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Native WhatsApp Share / Web Share API
  const handleShareOnWhatsApp = async () => {
    // If mobile Web Share API supports file sharing, share the actual PNG image directly to WhatsApp!
    if (navigator.share && cardNodeRef.current) {
      try {
        const blob = await toBlob(cardNodeRef.current, {
          pixelRatio: 2,
          backgroundColor: '#FFFFFF',
        });
        if (blob) {
          const file = new File([blob], `${business.slug || 'store'}-card.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: headline,
              text: `Check out ${headline} - ${subHeadline}. Use code ${couponCode} for ${couponDiscount}!`,
              url: storeUrl,
              files: [file],
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Web Share with file failed, falling back to standard URL:', err);
      }
    }

    // Standard WhatsApp URL redirect with pre-formatted rich message
    window.open(`https://wa.me/?text=${whatsappShareText}`, '_blank');
  };

  // 6. Save Customizations to Firestore
  const handleSaveCustomization = async () => {
    setIsSavingSettings(true);
    try {
      await updateBusiness(business.id, {
        trustCardSettings: {
          enabled: true,
          headline,
          subHeadline,
          badge1,
          badge2,
          trustPill1Text: pill1,
          trustPill2Text: pill2,
          trustPill3Text: pill3,
          trustPill4Text: pill4,
          taglineDivider,
          couponCode,
          couponDiscount,
          rating: ratingValue,
          reviewCount: reviewCountValue,
          happyCustomers: happyCustomersText,
        },
      });
      setIsCustomizing(false);
      setExportSuccessMsg('✅ Store card settings saved successfully!');
      setTimeout(() => setExportSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save trust card settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className={`w-full ${standalone ? 'min-h-screen py-8 px-4 flex flex-col items-center justify-center bg-slate-100' : 'space-y-5'}`}>
      {/* Top Notification Toast */}
      {exportSuccessMsg && (
        <div className="w-full max-w-md mx-auto p-3 rounded-2xl bg-emerald-900 text-white text-xs font-bold shadow-xl border border-emerald-500/40 text-center animate-in fade-in slide-in-from-top duration-200">
          {exportSuccessMsg}
        </div>
      )}

      {/* Main Header / Control Bar (When not standalone) */}
      {!standalone && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-slate-950" /> High-Trust Share Card
              </span>
              <span className="text-xs text-emerald-400 font-bold">• WhatsApp Ready</span>
            </div>
            <h3 className="text-base sm:text-lg font-black font-heading mt-1">
              Store Trust & WhatsApp Share Card
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Share a rich branded card like Sri Lakshmi Pickles instead of plain text to build instant customer trust.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCustomizing ? 'Close Editor' : 'Customize Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handleShareOnWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            {onCloseModal && (
              <button
                type="button"
                onClick={onCloseModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Customizer Drawer (Optional) */}
      {isCustomizing && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto w-full animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Customize Trust Card Text & Offer
            </h4>
            <span className="text-[11px] text-slate-400">Updates reflected live below</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Store Display Title</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Sri Lakshmi Pickles"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Sub-headline / Tagline</label>
              <input
                type="text"
                value={subHeadline}
                onChange={(e) => setSubHeadline(e.target.value)}
                placeholder="e.g. Homemade with love"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Trust Tag 1</label>
              <input
                type="text"
                value={badge1}
                onChange={(e) => setBadge1(e.target.value)}
                placeholder="e.g. 100% Homemade"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Trust Tag 2</label>
              <input
                type="text"
                value={badge2}
                onChange={(e) => setBadge2(e.target.value)}
                placeholder="e.g. No Preservatives"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Coupon Offer Headline</label>
              <input
                type="text"
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(e.target.value)}
                placeholder="e.g. Flat 10% OFF on All Orders"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Coupon Promo Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="e.g. LAKSHMI10"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 mb-1 block">4 Value Props (Icons Row)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={pill1}
                  onChange={(e) => setPill1(e.target.value)}
                  placeholder="Pure Ingredients"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
                <input
                  type="text"
                  value={pill2}
                  onChange={(e) => setPill2(e.target.value)}
                  placeholder="Hygienic Prepared"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
                <input
                  type="text"
                  value={pill3}
                  onChange={(e) => setPill3(e.target.value)}
                  placeholder="Pan India Delivery"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
                <input
                  type="text"
                  value={pill4}
                  onChange={(e) => setPill4(e.target.value)}
                  placeholder="Made with Love"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCustomizing(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomization}
              disabled={isSavingSettings}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
            >
              {isSavingSettings ? 'Saving...' : 'Save As Default'}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          THE RICH TRUST CARD PREVIEW (Matches reference image pixel-perfectly)
         ========================================================================= */}
      <div className="w-full flex justify-center items-center py-2">
        <div
          ref={cardNodeRef}
          id="vendor-trust-share-card-container"
          className="w-full max-w-[480px] bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col font-sans transition-all duration-300"
          style={{ boxSizing: 'border-box' }}
        >
          {/* 1. TOP HERO COVER BANNER */}
          <div className="relative h-[210px] w-full overflow-hidden bg-linear-to-b from-[#A4C4DC] via-[#D1E3ED] to-[#E9F1F6] flex flex-col justify-end p-5 select-none">
            {/* Background illustrations / celebration elements / photo */}
            {business.banner || business.coverImage ? (
              <img
                src={business.banner || business.coverImage}
                alt={business.name}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-linear-to-b from-[#8eb3ce] via-[#bcd6e8] to-[#e4eef5]">
                {/* Decorative friendly cartoon / sticker confetti shapes matching reference */}
                <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none">
                  <div className="absolute top-4 left-6 w-12 h-12 rounded-2xl bg-white/60 rotate-12 flex items-center justify-center text-blue-500 font-bold text-xl shadow-xs">
                    👍
                  </div>
                  <div className="absolute top-3 right-16 w-12 h-12 rounded-full bg-amber-400/80 -rotate-6 flex items-center justify-center text-white font-bold text-xl shadow-xs">
                    ⭐
                  </div>
                  <div className="absolute top-12 right-6 w-10 h-10 rounded-full bg-rose-400/80 rotate-12 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                    ❤️
                  </div>
                  <div className="absolute top-2 left-1/3 w-8 h-8 rounded-full bg-emerald-400/70 flex items-center justify-center text-white text-xs">
                    ✨
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Scrim for maximum text contrast */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/25 to-transparent pointer-events-none" />

            {/* Banner Headlines */}
            <div className="relative z-10 space-y-1 mb-1">
              <h1
                className="text-2xl sm:text-3xl font-black text-white italic tracking-tight drop-shadow-md"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                {headline}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-white/95 tracking-wide drop-shadow-sm flex items-center gap-1.5">
                <span>• {subHeadline} •</span>
              </p>
            </div>
          </div>

          {/* 2. OVERLAPPING AVATAR & VENDOR TITLE HEADER */}
          <div className="px-5 pt-0 pb-4 bg-white relative">
            <div className="flex items-end justify-between -mt-10 mb-3">
              {/* Overlapping Rounded Square Logo */}
              <div className="w-20 h-20 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {business.logo || business.profileImage ? (
                  <img
                    src={business.logo || business.profileImage}
                    alt={business.name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain object-center rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-inner">
                    {business.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Verified Status Tag */}
              <div className="flex items-center gap-1.5 pb-1">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Seller
                </span>
              </div>
            </div>

            {/* Title & Verified Checkmark */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading leading-tight">
                  {headline}
                </h2>
                {/* Rose Verified Checkmark Badge */}
                <div
                  className="w-5 h-5 rounded-full bg-[#E11D48] text-white flex items-center justify-center shadow-xs shrink-0"
                  title="Verified Business"
                >
                  <Check className="w-3 h-3 stroke-[3.5]" />
                </div>
              </div>

              {/* Rating & Happy Customers */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold flex-wrap">
                <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="text-slate-900 text-sm">{ratingValue}</span>
                </div>
                <span className="text-slate-500">({reviewCountValue} Reviews)</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-800 font-bold">{happyCustomersText}</span>
              </div>
            </div>

            {/* 3. HIGHLIGHT BADGES (Pink Outline Pills) */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap">
              {badge1 && (
                <span className="px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#F472B6] text-[#BE185D] text-xs font-extrabold shadow-2xs">
                  {badge1}
                </span>
              )}
              {badge2 && (
                <span className="px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#F472B6] text-[#BE185D] text-xs font-extrabold shadow-2xs">
                  {badge2}
                </span>
              )}
              {business.deliveryAvailable && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold shadow-2xs">
                  🚀 Instant WhatsApp Order
                </span>
              )}
            </div>

            {/* 4. 4-COLUMN TRUST ICONS GRID */}
            <div className="grid grid-cols-4 gap-2 pt-5 pb-4 text-center">
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <Leaf className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">{pill1}</span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">{pill2}</span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                  <Truck className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">{pill3}</span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                  <Heart className="w-5 h-5 text-rose-600 fill-rose-100" />
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">{pill4}</span>
              </div>
            </div>

            {/* 5. TAGLINE DIVIDER TEXT */}
            <div className="pt-2 pb-3 border-b border-slate-200/80 text-center">
              <p className="text-xs font-semibold text-slate-600 tracking-wide">
                {taglineDivider}
              </p>
            </div>

            {/* 6. PROMOTIONAL OFFER / COUPON BOX */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-[#FFF0F5] border border-[#F472B6]/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs border border-amber-200">
                  <Gift className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                    {couponDiscount}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <span>Use Code:</span>
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      title="Click to copy coupon code"
                      className="font-mono font-black text-rose-700 underline decoration-rose-400 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{couponCode}</span>
                      {copiedCoupon ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Visit Store Button */}
              <button
                type="button"
                onClick={onOpenStore || (() => window.open(storeUrl, '_blank'))}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-linear-to-r from-[#BE185D] to-[#E11D48] hover:from-[#9D174D] hover:to-[#BE185D] text-white text-xs font-black shrink-0 shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <span>Visit Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 7. BIG CHAT ON WHATSAPP ACTION BUTTON */}
            <div className="mt-3.5">
              <a
                href={`https://wa.me/${merchantPhone}?text=${whatsappGreetingText}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-base font-black flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 transition duration-150 cursor-pointer text-center"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* 8. BOTTOM CARD FOOTER STRIP */}
          <div className="px-5 py-2.5 bg-[#FFF5F8] border-t border-[#FCE7F3] flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="text-slate-600 truncate max-w-[200px] font-mono">
              {displayUrl}
            </span>
            <span className="text-slate-700 font-bold flex items-center gap-1 shrink-0">
              Powered by Storelly 🛍️
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar Below the Card */}
      <div className="w-full max-w-[480px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={isExporting}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>{isExporting ? 'Exporting...' : 'Download PNG'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyImageToClipboard}
          disabled={isExporting}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
        >
          {copiedImage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
          <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4 text-blue-600" />}
          <span>{copiedLink ? 'Link Copied!' : 'Copy Store URL'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareOnWhatsApp}
          className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-2xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Share</span>
        </button>
      </div>
    </div>
  );
};
