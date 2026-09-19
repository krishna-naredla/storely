import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Phone,
  MapPin,
  Sparkles,
  Store,
  Printer,
  Globe,
  Send,
  Eye,
  Smartphone,
  Share,
  CheckCheck,
  Layers,
  Package,
  Calendar,
  FileText,
  Briefcase,
  FolderArchive,
  ShoppingBag,
  Link2,
  QrCode,
  Ticket,
  Star
} from 'lucide-react';
import { BusinessProfile, CatalogItem } from '../../types';
import {
  getStorefrontUrl,
  getBioLinkUrl,
  getPortfolioUrl,
  getModuleDeepUrl,
  getProductDeepUrl,
  getCatalogItems
} from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { VerifiedBadge } from './VerifiedBadge';
import { isCreatorProfile } from '../../utils/profileHelper';
import { SafeImage } from './SafeImage';
import { ModuleQrModal } from './ModuleQrModal';
import { VendorTrustShareCard } from './VendorTrustShareCard';

interface DigitalCardPreviewProps {
  business: BusinessProfile;
  onOpenStore?: () => void;
}

export const DigitalCardPreview: React.FC<DigitalCardPreviewProps> = ({ business, onOpenStore }) => {
  const [copied, setCopied] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedSocialText, setCopiedSocialText] = useState(false);
  const [copiedModuleKey, setCopiedModuleKey] = useState<string | null>(null);
  const [activeSocialTab, setActiveSocialTab] = useState<'whatsapp' | 'twitter' | 'facebook' | 'imessage'>('whatsapp');
  const [selectedModalQr, setSelectedModalQr] = useState<{
    title: string;
    subtitle?: string;
    badge?: string;
    url: string;
  } | null>(null);
  
  // Product Deep Link Generator state
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [copiedProductUrl, setCopiedProductUrl] = useState(false);
  const [copiedProductPitch, setCopiedProductPitch] = useState(false);
  const [cardViewStyle, setCardViewStyle] = useState<'trust' | 'standard'>('trust');

  const cardRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<SVGSVGElement>(null);
  const productQrSvgRef = useRef<SVGSVGElement>(null);

  const isCreator = isCreatorProfile(business);
  
  // Explicit shareable public URL calculation using window.location.origin
  const storeUrl = getStorefrontUrl(business);
  const displayUrl = storeUrl.replace(/^https?:\/\//, '');
  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  // Load business products for deep linking
  useEffect(() => {
    if (!business?.id) return;
    getCatalogItems(business.id)
      .then((items) => {
        setProducts(items);
        if (items.length > 0 && !selectedProductId) {
          setSelectedProductId(items[0].id);
        }
      })
      .catch((err) => console.warn('Failed to load items for link generator:', err));
  }, [business?.id]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;
  const selectedProductUrl = selectedProduct ? getProductDeepUrl(business, selectedProduct.id) : '';
  const selectedProductPrice = selectedProduct
    ? (selectedProduct.isFree || selectedProduct.price === 0 ? 'FREE' : `${business.currencySymbol || '₹'}${selectedProduct.salePrice || selectedProduct.price}`)
    : '';

  const productPitchText = selectedProduct
    ? `✨ *${selectedProduct.name.toUpperCase()}*\n` +
      `🏪 *${business.name}*\n\n` +
      `💰 Price: *${selectedProductPrice}*\n` +
      `${selectedProduct.shortDescription ? `📝 ${selectedProduct.shortDescription}\n\n` : ''}` +
      `🛒 *ORDER / BUY DIRECTLY HERE:*\n` +
      `👉 ${selectedProductUrl}\n\n` +
      `📍 Full Store Catalog: ${storeUrl}`
    : '';

  // All Module Direct Links
  const moduleLinks = [
    {
      key: 'store',
      name: 'Digital Storefront & Catalog',
      badge: 'Main Store',
      icon: Store,
      color: 'bg-emerald-500 text-white',
      url: storeUrl,
      desc: 'Full catalog where customers browse, add to cart, and order.'
    },
    {
      key: 'digital',
      name: 'Digital Products & Files Hub',
      badge: 'Instant Download',
      icon: FolderArchive,
      color: 'bg-indigo-600 text-white',
      url: getModuleDeepUrl(business, 'digital'),
      desc: 'Ebooks, courses, templates, presets, and downloadable assets.'
    },
    {
      key: 'services',
      name: '1:1 Appointments & Services',
      badge: 'Bookings',
      icon: Calendar,
      color: 'bg-amber-600 text-white',
      url: getModuleDeepUrl(business, 'services'),
      desc: 'Consultation slots, call bookings, and professional service orders.'
    },
    {
      key: 'portfolio',
      name: 'Work Portfolio Showcase',
      badge: 'Projects',
      icon: Briefcase,
      color: 'bg-purple-600 text-white',
      url: getPortfolioUrl(business.slug),
      desc: 'Case studies, project galleries, and creative work highlights.'
    },
    {
      key: 'biolink',
      name: 'Bio Links & Social Hub',
      badge: 'Universal Link',
      icon: Link2,
      color: 'bg-blue-600 text-white',
      url: getBioLinkUrl(business.slug),
      desc: 'Consolidated social links, top picks, and single link for Instagram bio.'
    },
    {
      key: 'quotes',
      name: 'Custom Quote Requests',
      badge: 'Lead Form',
      icon: FileText,
      color: 'bg-rose-600 text-white',
      url: getModuleDeepUrl(business, 'quotes'),
      desc: 'Direct quote and estimation request form for custom client orders.'
    },
    {
      key: 'events',
      name: 'Events, Workshops & Tickets',
      badge: 'Tickets & Webinars',
      icon: Ticket,
      color: 'bg-pink-600 text-white',
      url: getModuleDeepUrl(business, 'events'),
      desc: 'Masterclasses, webinars, live bootcamps, and workshop ticketing.'
    },
    {
      key: 'reviews',
      name: 'Client Reviews & Ratings',
      badge: 'Testimonials',
      icon: Star,
      color: 'bg-amber-600 text-white',
      url: getModuleDeepUrl(business, 'reviews'),
      desc: 'Verified client reviews, 5-star ratings, and public testimonials.'
    }
  ];

  const handleCopyModuleUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedModuleKey(key);
    setTimeout(() => setCopiedModuleKey(null), 2000);
  };

  const handleShareModuleWhatsApp = (name: string, url: string) => {
    const text = encodeURIComponent(
      `🌟 *${business.name}* - ${name}\n\n` +
      `Check out directly here:\n` +
      `👉 ${url}\n\n` +
      `Powered by Storelly`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const richShareText = 
    `🌟 *${business.name.toUpperCase()}* 🌟\n` +
    `${business.tagline || `Verified ${bizMeta.label} Storefront`}\n\n` +
    `🛒 *Explore Catalog & Place Orders / Bookings Instantly!*\n` +
    `${business.description ? `📝 _"${business.description}"_\n\n` : ''}` +
    `📍 Location: ${business.city || business.address || 'Online Store'}\n` +
    `📞 WhatsApp/Phone: ${business.whatsapp || business.phone}\n\n` +
    `👇 *VISIT STORE NOW (100% Secure & Fast)*:\n` +
    `🔗 ${storeUrl}\n\n` +
    `✨ _Tap the link above to browse products, check special offers, and order directly!_`;

  const handleCopyRichCard = () => {
    navigator.clipboard.writeText(richShareText);
    setCopiedRich(true);
    setTimeout(() => setCopiedRich(false), 2000);
  };

  const handleCopySocialText = () => {
    const text = `${business.name} - ${business.tagline || 'Shop & Order Online'}\n\nVisit our digital store: ${storeUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedSocialText(true);
    setTimeout(() => setCopiedSocialText(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(richShareText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const tweet = encodeURIComponent(`Explore our live storefront and place orders directly: ${business.name} \n\n${storeUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
  };

  const handleFacebookShare = () => {
    const u = encodeURIComponent(storeUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank');
  };

  const handleDownloadQR = () => {
    // Generate PNG download from the SVG element
    const svg = qrSvgRef.current;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${business.slug || 'store'}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintCard = () => {
    window.print();
  };

  const previewImage = business.banner || business.coverImage || business.logo || business.profileImage || (isCreator ? '/cteatorlink.jpeg' : '/storelly6.jpg.jpeg');
  const domainName = typeof window !== 'undefined' ? window.location.host : 'storelly.app';

  return (
    <div className="space-y-8">
      {/* =========================================================================
          TOP BANNER: PUBLIC STOREFRONT URL SHARING BAR
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
              isCreator ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Public Shareable Storefront URL</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live Online
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Share this link with customers across WhatsApp, Instagram Bio, SMS, or QR Flyers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(storeUrl, '_blank')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="Open storefront in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full URL Interactive Display Bar */}
        <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 gap-2">
          <Globe className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            readOnly
            value={storeUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full bg-transparent font-mono text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN GRID: DIGITAL VISITING CARD & QR CODE PREVIEW
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Digital Card Frame */}
        <div className="lg:col-span-6 space-y-4">
          {/* Card View Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setCardViewStyle('trust')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                cardViewStyle === 'trust'
                  ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>WhatsApp Rich Trust Card</span>
            </button>
            <button
              type="button"
              onClick={() => setCardViewStyle('standard')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                cardViewStyle === 'standard'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Visiting Card</span>
            </button>
          </div>

          {cardViewStyle === 'trust' ? (
            <VendorTrustShareCard business={business} onOpenStore={onOpenStore} />
          ) : (
            <div
              ref={cardRef}
              className={`relative max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/10 border overflow-hidden ${
                isCreator ? 'border-indigo-500/30' : 'border-emerald-500/30'
              }`}
            >
            {/* Dynamic Background Image Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img 
                src={isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg.jpeg"} 
                alt={isCreator ? "Creator Background" : "Storelly Background Showcase"} 
                className="w-full h-full object-cover object-center opacity-25 scale-105" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg";
                }}
              />
              <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px]"></div>
            </div>

            {/* Banner */}
            <div className={`relative z-10 h-32 overflow-hidden ${
              isCreator ? 'bg-linear-to-r from-indigo-600 to-purple-700' : 'bg-linear-to-r from-emerald-600 to-teal-700'
            }`}>
              {business.banner || business.coverImage ? (
                <img
                  src={business.banner || business.coverImage}
                  alt="Banner"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg.jpeg"}
                  alt="Banner"
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg";
                  }}
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
              
              {Boolean(business.name && (business.whatsapp || business.phone)) && (
                <div className="absolute top-3 right-3">
                  <VerifiedBadge verified={true} size="sm" />
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="relative z-10 px-6 pt-0 pb-6">
              {/* Logo overlapping banner */}
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden">
                  <img
                    src={
                      business.logo ||
                      business.profileImage ||
                      (isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg.jpeg")
                    }
                    alt={business.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg";
                    }}
                    className="w-full h-full object-contain object-center rounded-xl"
                  />
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {isCreator ? 'Creator Profile' : bizMeta.label}
                </span>
              </div>

              {/* Business Info */}
              <div className="space-y-1 mb-4">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{business.name}</h2>
                {business.tagline && (
                  <p className="text-xs font-medium text-emerald-700">{business.tagline}</p>
                )}
                {business.description && (
                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed pt-1">
                    {business.description}
                  </p>
                )}
              </div>

              {/* Contact Badges */}
              <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 mb-4 text-xs text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate font-medium text-slate-700">{business.whatsapp || business.phone}</span>
                </div>
                {business.address && (
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{business.city || business.address}</span>
                  </div>
                )}
              </div>

              {/* Centered QR Code Box using qrcode.react */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center mb-5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Scan with camera to visit instant storefront</span>
                </p>
                
                {/* Lightweight qrcode.react SVG component */}
                <div className="inline-block bg-white p-3 rounded-2xl border border-slate-200 shadow-sm transition hover:scale-105">
                  <QRCodeSVG
                    ref={qrSvgRef}
                    value={storeUrl}
                    size={160}
                    level="H"
                    includeMargin={true}
                    imageSettings={
                      business.logo
                        ? {
                            src: business.logo,
                            x: undefined,
                            y: undefined,
                            height: 28,
                            width: 28,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                </div>

                <div className="mt-2 text-[11px] text-slate-600 font-mono break-all px-2 select-all">
                  {storeUrl}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={onOpenStore || (() => window.open(storeUrl, '_blank'))}
                className={`w-full py-3 px-4 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                  isCreator
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <span>Visit Public Storefront</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Right Column: Actions, QR Downloads, & Marketing Tools */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Marketing &amp; Print Tools</span>
            </h3>
            <span className="text-xs text-slate-500">1-Click Distribution</span>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-600" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="p-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download high resolution PNG QR code for flyers, standees, and stickers"
            >
              <Download className="w-5 h-5 text-indigo-600" />
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCard}
              className="p-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Print flyer or digital visiting card"
            >
              <Printer className="w-5 h-5 text-slate-600" />
              <span>Print Poster</span>
            </button>
          </div>

          {/* Rich WhatsApp Message Box */}
          <div className="p-5 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Formatted WhatsApp Customer Message</span>
              </div>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                High Conversion
              </span>
            </div>
            
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Send this pre-formatted pitch to your customers, WhatsApp broadcast lists, or groups with your business catalog link:
            </p>

            <div className="p-3 bg-black/30 rounded-2xl border border-white/10 text-[11px] font-mono text-emerald-200 leading-relaxed whitespace-pre-line max-h-32 overflow-y-auto select-all">
              {richShareText}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-slate-950" />
                <span>Open WhatsApp &amp; Send</span>
              </button>
              <button
                type="button"
                onClick={handleCopyRichCard}
                className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedRich ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRich ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          {/* Social Share One-Click Buttons */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Share Direct to Social Channels
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleTwitterShare}
                className="py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>X / Twitter</span>
              </button>
              <button
                type="button"
                onClick={handleFacebookShare}
                className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOCK SOCIAL SHARE PREVIEW (WhatsApp, Twitter/X, Facebook, iMessage)
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Mock Social Media Link Preview
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live preview of how your store metadata, rich cards, logo, and description look when pasted into WhatsApp and social feeds.
            </p>
          </div>

          {/* Social Platform Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSocialTab('whatsapp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSocialTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setActiveSocialTab('twitter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSocialTab === 'twitter'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              X / Twitter
            </button>
            <button
              type="button"
              onClick={() => setActiveSocialTab('facebook')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSocialTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={() => setActiveSocialTab('imessage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSocialTab === 'imessage'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              iMessage
            </button>
          </div>
        </div>

        {/* Tab 1: WhatsApp Chat Bubble Preview */}
        {activeSocialTab === 'whatsapp' && (
          <div className="bg-[#EFEAE2] p-4 sm:p-6 rounded-2xl border border-[#DAD3C8] max-w-lg mx-auto shadow-inner space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
              <span>WhatsApp Chat Mockup</span>
              <span className="text-emerald-700 font-semibold">Online • Open Graph Metadata Active</span>
            </div>

            {/* Outgoing WhatsApp Bubble */}
            <div className="bg-[#E7FFDB] rounded-2xl rounded-tr-xs p-3 shadow-xs border border-[#D0ECC2] ml-auto max-w-sm space-y-2">
              <p className="text-xs text-slate-800 break-words leading-relaxed font-sans">
                Hey! Check out our official store and catalog online 👇
                <br />
                <span className="text-blue-600 underline font-medium">{storeUrl}</span>
              </p>

              {/* Rich Link Card Snippet */}
              <div className="bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
                <div className="h-32 bg-slate-100 overflow-hidden relative">
                  <img
                    src={previewImage}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = isCreator ? "/cteatorlink.jpeg" : "/storelly6.jpg";
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    STORE
                  </div>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {business.name} {business.tagline ? `— ${business.tagline}` : ''}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                    {business.description || `Browse products, place orders, and chat directly on WhatsApp.`}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 pt-0.5 truncate">
                    {domainName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-0.5">
                <span>12:45 PM</span>
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: X / Twitter Card Preview */}
        {activeSocialTab === 'twitter' && (
          <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 max-w-lg mx-auto text-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                <img
                  src={business.logo || business.profileImage || (isCreator ? '/cteatorlink.jpeg' : '/storelly6.jpg.jpeg')}
                  alt={business.name}
                  className="w-full h-full object-contain object-center"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">{business.name}</span>
                  <span className="text-[11px] text-slate-400">@{business.slug}</span>
                  <span className="text-slate-500 text-xs">· Just now</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Our live store is officially open! Visit our catalog &amp; place orders: {storeUrl}
                </p>
              </div>
            </div>

            {/* Twitter Large Summary Card */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition">
              <div className="h-40 bg-slate-800 overflow-hidden">
                <img
                  src={previewImage}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">{domainName}</span>
                <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{business.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {business.tagline || business.description || 'Visit our digital catalog and instant ordering storefront.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Facebook / LinkedIn Snippet Preview */}
        {activeSocialTab === 'facebook' && (
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={business.logo || business.profileImage || (isCreator ? '/cteatorlink.jpeg' : '/storelly6.jpg.jpeg')}
                  alt={business.name}
                  className="w-full h-full object-contain object-center"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{business.name}</h4>
                <span className="text-[10px] text-slate-500">Shared publicly • Just now</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Explore our full collection, new arrivals, and place orders directly:
            </p>

            {/* Facebook Rich Post Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
              <div className="h-44 bg-slate-100 overflow-hidden">
                <img
                  src={previewImage}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3.5 space-y-1 bg-slate-50/50">
                <span className="text-[10px] uppercase font-bold text-slate-400">{domainName}</span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{business.name}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {business.tagline || business.description || 'Browse products and order directly with instant checkout.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: iMessage Bubble Preview */}
        {activeSocialTab === 'imessage' && (
          <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>iMessage / SMS Rich Link</span>
              <span>iOS 17+ Rich Bubble</span>
            </div>

            <div className="bg-[#007AFF] text-white rounded-3xl rounded-br-md p-3 max-w-sm ml-auto space-y-2 shadow-sm">
              <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-xs">
                <div className="h-32 bg-slate-100 overflow-hidden">
                  <img
                    src={previewImage}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-bold line-clamp-1">{business.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">{domainName}</p>
                </div>
              </div>
              <p className="text-xs font-medium px-1">Check out our storefront: {storeUrl}</p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: ALL MODULES DEEP LINKS & URLS DIRECTORY
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                All Modules Deep Links & URLs Directory
              </h3>
              <p className="text-xs text-slate-500">
                Share direct links to specific parts of your business (store catalog, digital downloads, bookings, portfolio, quotes).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleLinks.map((mod) => {
            const Icon = mod.icon;
            const isCopied = copiedModuleKey === mod.key;

            return (
              <div
                key={mod.key}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${mod.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{mod.name}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                      {mod.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{mod.desc}</p>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 gap-2">
                    <input
                      type="text"
                      readOnly
                      value={mod.url}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-transparent font-mono text-[11px] text-slate-700 font-semibold focus:outline-none select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyModuleUrl(mod.key, mod.url)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedModalQr({
                          title: mod.name,
                          subtitle: mod.desc,
                          badge: mod.badge,
                          url: mod.url,
                        })
                      }
                      className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      title="Generate and download QR code for this module"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareModuleWhatsApp(mod.name, mod.url)}
                      className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer truncate"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(mod.url, '_blank')}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      title="Open link in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Live</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: PRODUCT DIRECT BUY & DEEP LINK GENERATOR
         ========================================================================= */}
      {products.length > 0 && selectedProduct && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Individual Product Deep Link &amp; QR Generator
                </h3>
                <p className="text-xs text-slate-500">
                  Select any product from your catalog to generate an instant purchasing link, product QR code, and promotional WhatsApp pitch.
                </p>
              </div>
            </div>

            {/* Product Selector Dropdown */}
            <div className="shrink-0">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl focus:outline-indigo-500 max-w-[260px] truncate"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.isFree || p.price === 0 ? 'FREE' : `${business.currencySymbol || '₹'}${p.salePrice || p.price}`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Deep Link Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {/* Left Column: QR Code & Download */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <QRCodeSVG
                  ref={productQrSvgRef}
                  value={selectedProductUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[180px]">
                  {selectedProduct.name}
                </span>
                <span className="text-[10px] text-slate-500">Scan to Buy Directly</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const svg = productQrSvgRef.current;
                  if (!svg) return;
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = 1000;
                    canvas.height = 1000;
                    if (ctx) {
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 50, 50, 900, 900);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = `${selectedProduct.slug || 'product'}-qr.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    }
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download Product QR</span>
              </button>
            </div>

            {/* Right Column: Direct Purchasing Link & WhatsApp Share */}
            <div className="lg:col-span-8 space-y-4">
              {/* Product Info Snapshot */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                  {selectedProduct.images?.[0] ? (
                    <SafeImage
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      fallbackType="product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-xs font-black text-indigo-600">
                    {selectedProductPrice}
                  </p>
                </div>
              </div>

              {/* Direct Link Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Direct Purchasing Link
                </label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1.5 gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedProductUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-transparent font-mono text-xs text-slate-800 font-semibold focus:outline-none select-all px-1 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedProductUrl);
                      setCopiedProductUrl(true);
                      setTimeout(() => setCopiedProductUrl(false), 2000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs ${
                      copiedProductUrl
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedProductUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedProductUrl ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(selectedProductUrl, '_blank')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                    title="Test product link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Share Pitch Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> WhatsApp Promotional Pitch
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(productPitchText);
                        setCopiedProductPitch(true);
                        setTimeout(() => setCopiedProductPitch(false), 2000);
                      }}
                      className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-md transition font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedProductPitch ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedProductPitch ? 'Copied' : 'Copy Pitch'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = encodeURIComponent(productPitchText);
                        window.open(`https://wa.me/?text=${text}`, '_blank');
                      }}
                      className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-md transition font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Send via WhatsApp</span>
                    </button>
                  </div>
                </div>
                <div className="p-2 bg-black/40 rounded-lg text-[11px] font-mono text-emerald-100 max-h-20 overflow-y-auto whitespace-pre-line leading-relaxed select-all">
                  {productPitchText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable QR Code Modal for all individual modules */}
      {selectedModalQr && (
        <ModuleQrModal
          isOpen={!!selectedModalQr}
          onClose={() => setSelectedModalQr(null)}
          title={`${selectedModalQr.title} QR Code`}
          subtitle={selectedModalQr.subtitle}
          badge={selectedModalQr.badge}
          url={selectedModalQr.url}
          businessName={business.name}
          logoUrl={business.logo || business.profileImage}
          accentColor={isCreator ? 'indigo' : 'emerald'}
        />
      )}
    </div>
  );
};

