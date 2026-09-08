import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import { BusinessProfile, BioLink, CatalogItem, Category } from '../../types';
import {
  getBioLinks,
  getCatalogItems,
  getCategories,
  getDigitalStoreUrl,
  recordBioLinkClick,
  recordBioLinkView,
  recordAnalyticsEvent,
} from '../../services/firebaseService';
import { DigitalCheckoutModal } from '../storefront/DigitalCheckoutModal';
import { ItemDetailModal } from '../storefront/ItemDetailModal';
import {
  ExternalLink,
  Share2,
  Check,
  Sparkles,
  ChevronRight,
  Copy,
  QrCode,
  X,
  ArrowLeft,
  Store,
  ShoppingBag,
  Download,
  Eye,
  Search,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  SocialBrandIcon,
  getBrandConfig,
  BIO_THEME_PRESETS,
} from './SocialBrandIcons';

interface Props {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  onOpenStorefront?: () => void;
}

export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard, onOpenStorefront }) => {
  const [links, setLinks] = useState<BioLink[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activeTab, setActiveTab] = useState<'links' | 'store'>('links');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<CatalogItem | null>(null);
  const [selectedItemForDigital, setSelectedItemForDigital] = useState<CatalogItem | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Theme resolution: preset or custom
  const rawTheme = business.bioTheme || {};
  const presetKey = rawTheme.themePreset || 'classic_green';
  const preset = BIO_THEME_PRESETS[presetKey] || BIO_THEME_PRESETS.classic_green;

  const hasCustomBg = !!rawTheme.backgroundColor;

  const theme = {
    backgroundColor: rawTheme.backgroundColor || preset.backgroundColor,
    backgroundGradient: hasCustomBg
      ? (rawTheme.backgroundGradient || undefined)
      : (rawTheme.backgroundGradient || preset.backgroundGradient),
    textColor: rawTheme.textColor || preset.textColor,
    subtitleColor: rawTheme.subtitleColor || preset.subtitleColor,
    buttonStyle: (rawTheme.buttonStyle as string) || preset.buttonStyle || 'rounded',
    buttonColor: rawTheme.buttonColor || preset.buttonColor,
    buttonTextColor: rawTheme.buttonTextColor || preset.buttonTextColor,
    buttonSubtitleColor: rawTheme.buttonSubtitleColor || preset.buttonSubtitleColor,
    buttonBorderColor: rawTheme.buttonBorderColor || preset.buttonBorderColor,
    buttonHoverEffect: rawTheme.buttonHoverEffect || 'lift',
    fontFamily: rawTheme.fontFamily || 'modern',
    avatarShape: rawTheme.avatarShape || 'circle',
    avatarBorder: rawTheme.avatarBorder !== false,
    showVerifiedBadge: rawTheme.showVerifiedBadge !== false,
    profession: rawTheme.profession || business.tagline || 'Entrepreneur | Content Creator',
    showSocialIconsBar: rawTheme.showSocialIconsBar !== false,
  };

  useEffect(() => {
    // SEO setup
    const title = `${business.name} — Official Bio Link | Storelly`;
    document.title = title;
    recordBioLinkView(business.id);
    loadData();

    // Check if query wants store tab
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get('tab') === 'store' ||
      urlParams.get('view') === 'store' ||
      urlParams.has('store') ||
      window.location.hash === '#store'
    ) {
      setActiveTab('store');
    }

    // Generate QR Code for sharing
    const currentUrl = window.location.href;
    QRCode.toDataURL(currentUrl, {
      width: 260,
      margin: 2,
      color: { dark: '#064E3B', light: '#FFFFFF' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [business.id]);

  const loadData = async () => {
    try {
      const [linksData, catalogData, categoriesData] = await Promise.all([
        getBioLinks(business.id) as Promise<BioLink[]>,
        getCatalogItems(business.id, true) as Promise<CatalogItem[]>,
        getCategories(business.id) as Promise<Category[]>,
      ]);

      const activeLinks = (linksData || [])
        .filter((l) => l.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      setLinks(activeLinks);
      setCatalogItems(catalogData || []);
      setCategories(categoriesData || []);

      recordAnalyticsEvent(business.id, 'bio_views', { slug: business.slug }).catch(() => {});
    } catch (err) {
      console.error('Error loading biolinks & catalog:', err);
    } finally {
      setLoading(false);
      setLoadingCatalog(false);
    }
  };

  const handleLinkClick = (link: BioLink, e: React.MouseEvent) => {
    recordBioLinkClick(business.id, link.id).catch(console.error);
    recordAnalyticsEvent(business.id, 'bio_link_click', {
      linkId: link.id,
      title: link.title,
      type: link.type,
    }).catch(() => {});

    if (link.url === '#share') {
      handleShare();
      return;
    }

    if (link.type === 'digital_store' || link.url === '#store' || link.url.includes('/store')) {
      setActiveTab('store');
      return;
    }

    let targetUrl = link.url;
    if (link.type === 'email' && !targetUrl.startsWith('mailto:')) {
      targetUrl = `mailto:${targetUrl}`;
    } else if (link.type === 'phone' && !targetUrl.startsWith('tel:')) {
      targetUrl = `tel:${targetUrl.replace(/[^0-9+]/g, '')}`;
    } else if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith('mailto:') && !targetUrl.startsWith('tel:')) {
      targetUrl = `https://${targetUrl}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Quick social icons (WhatsApp, Instagram, YouTube, Telegram, LinkedIn, Twitter/X, Facebook, Discord, Spotify, GitHub)
  const rawSocials = rawTheme.socials || {};
  const socialConfig = {
    whatsapp: rawSocials.whatsapp || business.whatsapp || '',
    instagram: rawSocials.instagram || business.socialLinks?.instagram || '',
    youtube: rawSocials.youtube || business.socialLinks?.youtube || '',
    telegram: rawSocials.telegram || business.socialLinks?.telegram || '',
    linkedin: rawSocials.linkedin || business.socialLinks?.linkedin || '',
    twitter: rawSocials.twitter || business.socialLinks?.twitter || '',
    facebook: rawSocials.facebook || business.socialLinks?.facebook || '',
    discord: rawSocials.discord || '',
    spotify: rawSocials.spotify || '',
    github: rawSocials.github || '',
  };

  // If creator hasn't explicitly set socials, fall back gracefully so real icons are present
  if (!socialConfig.whatsapp && business.whatsapp) socialConfig.whatsapp = business.whatsapp;
  if (!socialConfig.whatsapp && !socialConfig.instagram && !socialConfig.youtube && !socialConfig.telegram) {
    socialConfig.whatsapp = '919876543210';
    socialConfig.instagram = business.slug || 'storelly';
  }

  const getSocialUrl = (platform: string, val: string) => {
    if (!val) return '';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/${val.replace(/[^0-9]/g, '')}`;
      case 'instagram':
        return `https://instagram.com/${val.replace('@', '')}`;
      case 'youtube':
        return val.includes('@') ? `https://youtube.com/${val}` : `https://youtube.com/@${val}`;
      case 'telegram':
        return `https://t.me/${val.replace('@', '')}`;
      case 'linkedin':
        return `https://linkedin.com/in/${val.replace('@', '')}`;
      case 'twitter':
        return `https://x.com/${val.replace('@', '')}`;
      case 'facebook':
        return `https://facebook.com/${val}`;
      case 'discord':
        return val.startsWith('discord.gg') ? `https://${val}` : `https://discord.gg/${val}`;
      case 'spotify':
        return val.startsWith('open.spotify') ? `https://${val}` : `https://open.spotify.com/artist/${val}`;
      case 'github':
        return `https://github.com/${val.replace('@', '')}`;
      default:
        return `https://${val}`;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${business.name} | Storelly Bio Link`,
      text: business.tagline || `Check out all links, services & updates for ${business.name}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to modal if cancelled or unsupported
      }
    }
    setShareModalOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Card border radius mapping
  const getRadiusClass = () => {
    if (theme.buttonStyle === 'pill') return 'rounded-full';
    if (theme.buttonStyle === 'square') return 'rounded-lg';
    if (theme.buttonStyle === 'glass') return 'rounded-2xl backdrop-blur-md border shadow-lg';
    if (theme.buttonStyle === 'brutalist') return 'rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_rgba(15,23,42,1)]';
    return 'rounded-2xl';
  };

  const getHoverClass = () => {
    if (theme.buttonHoverEffect === 'scale') return 'hover:scale-[1.02] active:scale-[0.98] transition-transform';
    if (theme.buttonHoverEffect === 'glow') return 'hover:ring-2 hover:ring-white/60 hover:shadow-xl transition-all';
    return 'hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] transition-all';
  };

  const getAvatarRadiusClass = () => {
    if (theme.avatarShape === 'rounded') return 'rounded-2xl';
    if (theme.avatarShape === 'squircle') return 'rounded-[28%]';
    return 'rounded-full';
  };

  const getFontFamilyClass = () => {
    if (theme.fontFamily === 'serif') return 'font-serif';
    if (theme.fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  // Smart Starter Links if list is completely empty
  const smartStarterLinks: BioLink[] = [
    {
      id: 'default_wa',
      businessId: business.id,
      type: 'whatsapp',
      title: 'Chat on WhatsApp',
      subtitle: 'Quickly connect with me directly',
      url: `https://wa.me/${(business.whatsapp || '919876543210').replace(/[^0-9]/g, '')}`,
      enabled: true,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'default_store',
      businessId: business.id,
      type: 'digital_store',
      title: 'Explore My Digital Store & Catalog',
      subtitle: 'Browse notes, courses, eBooks & offers',
      url: '#store',
      enabled: true,
      highlight: true,
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'default_call',
      businessId: business.id,
      type: 'phone',
      title: 'Direct Voice Call',
      subtitle: 'Speak with our team directly',
      url: `tel:${business.phone || business.whatsapp || '+919876543210'}`,
      enabled: true,
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'default_share',
      businessId: business.id,
      type: 'custom',
      title: 'Share & Recommend Profile',
      subtitle: 'Instant QR code & WhatsApp share',
      url: '#share',
      enabled: true,
      order: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const displayedLinks = links.length > 0 ? links : smartStarterLinks;

  // Filtered digital store products
  const filteredProducts = catalogItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.shortDescription && item.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const currency = business.currencySymbol || '₹';
  const fullStoreUrl = getDigitalStoreUrl(business.slug);

  return (
    <div
      className={`min-h-screen ${getFontFamilyClass()} flex flex-col items-center relative overflow-x-hidden selection:bg-emerald-500 selection:text-white`}
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundGradient || undefined,
        color: theme.textColor,
      }}
    >
      {/* Background Ambience / Subtle Top Glow */}
      <div className="absolute top-0 inset-x-0 h-96 pointer-events-none opacity-25 blur-3xl bg-gradient-to-b from-white/10 to-transparent" />

      {/* Top Floating Controls (Share & Store Info) */}
      <div className="w-full max-w-xl px-4 pt-5 pb-2 flex items-center justify-between z-20">
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-md bg-black/20 hover:bg-black/40 text-white border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Profile</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <a
            href={fullStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open full digital store"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Store</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={handleShare}
            aria-label="Share profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-md bg-black/20 hover:bg-black/40 text-white border border-white/10 shadow-sm hover:scale-105 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Profile Header Container */}
      <div className="w-full max-w-md px-5 pt-3 pb-24 z-10 flex flex-col items-center text-center">
        {/* Profile Avatar with Verified Badge */}
        <div className="relative mb-4 group">
          <div
            className={`w-28 h-28 sm:w-32 sm:h-32 p-1 backdrop-blur-md transition-transform duration-300 group-hover:scale-105 ${getAvatarRadiusClass()} ${
              theme.avatarBorder ? 'bg-white/25 ring-4 ring-white/20 shadow-2xl' : 'bg-transparent'
            }`}
          >
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className={`w-full h-full object-cover shadow-inner bg-slate-900 ${getAvatarRadiusClass()}`}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-4xl font-black shadow-inner ${getAvatarRadiusClass()}`}
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor,
                }}
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Green Verified Tick Checkmark */}
          {theme.showVerifiedBadge && (
            <div
              className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-500/20"
              title="Verified Creator"
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Full Name */}
        <h1
          className="text-2xl sm:text-3xl font-black tracking-tight leading-tight"
          style={{ color: theme.textColor }}
        >
          {business.name}
        </h1>

        {/* Profession / Subtitle */}
        {theme.profession && (
          <p
            className="text-xs sm:text-sm font-semibold tracking-wide uppercase mt-1 opacity-90"
            style={{ color: theme.subtitleColor }}
          >
            {theme.profession}
          </p>
        )}

        {/* Bio / Description */}
        {(business.bio || business.description || business.tagline) && (
          <p
            className="mt-3 text-xs sm:text-sm leading-relaxed max-w-sm whitespace-pre-wrap font-medium opacity-90 px-2"
            style={{ color: theme.textColor }}
          >
            {business.bio || business.description || business.tagline}
          </p>
        )}

        {/* Authentic Quick Social Media Icons Row */}
        {theme.showSocialIconsBar && (
          <div className="mt-5 flex items-center justify-center flex-wrap gap-2.5 max-w-xs">
            {/* WhatsApp */}
            {socialConfig.whatsapp && (
              <a
                href={getSocialUrl('whatsapp', socialConfig.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <SocialBrandIcon type="whatsapp" size={20} className="w-5 h-5 fill-current" />
              </a>
            )}

            {/* Instagram */}
            {socialConfig.instagram && (
              <a
                href={getSocialUrl('instagram', socialConfig.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  background:
                    'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                }}
              >
                <SocialBrandIcon type="instagram" size={20} className="w-5 h-5 fill-current" />
              </a>
            )}

            {/* YouTube */}
            {socialConfig.youtube && (
              <a
                href={getSocialUrl('youtube', socialConfig.youtube)}
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#FF0000' }}
              >
                <SocialBrandIcon type="youtube" size={20} className="w-5 h-5 fill-current" />
              </a>
            )}

            {/* Telegram */}
            {socialConfig.telegram && (
              <a
                href={getSocialUrl('telegram', socialConfig.telegram)}
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#229ED9' }}
              >
                <SocialBrandIcon type="telegram" size={20} className="w-5 h-5 fill-current" />
              </a>
            )}

            {/* LinkedIn */}
            {socialConfig.linkedin && (
              <a
                href={getSocialUrl('linkedin', socialConfig.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#0A66C2' }}
              >
                <SocialBrandIcon type="linkedin" size={18} className="w-4.5 h-4.5 fill-current" />
              </a>
            )}

            {/* Twitter / X */}
            {socialConfig.twitter && (
              <a
                href={getSocialUrl('twitter', socialConfig.twitter)}
                target="_blank"
                rel="noopener noreferrer"
                title="X (Twitter)"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#000000' }}
              >
                <SocialBrandIcon type="twitter" size={17} className="w-4 h-4 fill-current" />
              </a>
            )}

            {/* Facebook */}
            {socialConfig.facebook && (
              <a
                href={getSocialUrl('facebook', socialConfig.facebook)}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#1877F2' }}
              >
                <SocialBrandIcon type="facebook" size={18} className="w-4.5 h-4.5 fill-current" />
              </a>
            )}

            {/* Discord */}
            {socialConfig.discord && (
              <a
                href={getSocialUrl('discord', socialConfig.discord)}
                target="_blank"
                rel="noopener noreferrer"
                title="Discord"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#5865F2' }}
              >
                <SocialBrandIcon type="discord" size={18} className="w-4.5 h-4.5 fill-current" />
              </a>
            )}

            {/* Spotify */}
            {socialConfig.spotify && (
              <a
                href={getSocialUrl('spotify', socialConfig.spotify)}
                target="_blank"
                rel="noopener noreferrer"
                title="Spotify"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#1DB954' }}
              >
                <SocialBrandIcon type="spotify" size={18} className="w-4.5 h-4.5 fill-current" />
              </a>
            )}

            {/* GitHub */}
            {socialConfig.github && (
              <a
                href={getSocialUrl('github', socialConfig.github)}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#24292F' }}
              >
                <SocialBrandIcon type="github" size={18} className="w-4.5 h-4.5 fill-current" />
              </a>
            )}
          </div>
        )}

        {/* Modern Segmented Navigation Tabs (Links vs Digital Store) */}
        <div className="w-full mt-6 flex items-center justify-center">
          <div className="p-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center gap-1 w-full max-w-sm shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Links</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'links' ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-white'
                }`}
              >
                {displayedLinks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'store'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Digital Store</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'store' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/30 text-emerald-300'
                }`}
              >
                {catalogItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: LINKS VIEW */}
        {activeTab === 'links' && (
          <div className="w-full mt-5 space-y-3 animate-in fade-in duration-200">
            {/* Featured Digital Products Banner (Instant Access into Store) */}
            {catalogItems.length > 0 && (
              <div
                onClick={() => setActiveTab('store')}
                role="button"
                tabIndex={0}
                className={`w-full group text-left cursor-pointer p-4 border rounded-2xl relative overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg ${getHoverClass()}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.35) 100%)',
                  borderColor: '#10B981',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                          Digital Store
                        </span>
                        <span className="text-[11px] font-bold text-emerald-300">
                          {catalogItems.length} {catalogItems.length === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>
                      <div className="font-extrabold text-sm sm:text-base text-white mt-0.5">
                        Explore Digital Products & Store
                      </div>
                      <div className="text-xs text-white/70">
                        Download guides, templates, notes & order directly
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>

                {/* Quick Preview Thumbnails Strip */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {catalogItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.productType === 'digital_file') {
                          setSelectedItemForDigital(item);
                        } else {
                          setSelectedItemForDetail(item);
                        }
                      }}
                      className="flex items-center gap-2 bg-black/40 hover:bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0 transition cursor-pointer"
                    >
                      {item.images?.[0] || item.coverImage ? (
                        <SafeImage
                          src={item.images?.[0] || item.coverImage || ''}
                          alt={item.name}
                          className="w-6 h-6 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-white max-w-[110px] truncate">{item.name}</span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        {item.isFree ? 'FREE' : `${currency}${item.salePrice || item.price}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Links Stack */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin opacity-60" />
                <span className="text-xs font-semibold tracking-wider uppercase opacity-60">
                  Loading links...
                </span>
              </div>
            ) : (
              displayedLinks.map((link) => {
                const brand = getBrandConfig(link.type);
                const displaySubtitle = link.subtitle || brand.defaultSubtitle;
                const isHighlight = link.highlight;

                return (
                  <div
                    key={link.id}
                    onClick={(e) => handleLinkClick(link, e)}
                    role="button"
                    tabIndex={0}
                    className={`w-full group text-left cursor-pointer flex items-center p-3 sm:p-3.5 border relative overflow-hidden ${getRadiusClass()} ${getHoverClass()} ${
                      isHighlight ? 'ring-2 ring-emerald-400 shadow-md animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: theme.buttonColor,
                      color: theme.buttonTextColor,
                      borderColor: isHighlight ? '#10B981' : theme.buttonBorderColor,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Highlight Ribbon / Badge */}
                    {isHighlight && (
                      <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-500 text-[9px] font-black text-white uppercase tracking-wider rounded-bl-lg shadow-sm">
                        Featured
                      </div>
                    )}

                    {/* Left Column: Authentic Brand Icon Box */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-3.5 shadow-sm transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background:
                          link.type === 'instagram'
                            ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                            : brand.color,
                      }}
                    >
                      <SocialBrandIcon
                        type={link.type}
                        size={22}
                        className="w-5.5 h-5.5 text-white"
                      />
                    </div>

                    {/* Middle Column: Title & Subtitle */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-sm sm:text-base leading-snug truncate">
                        {link.title}
                      </div>
                      {displaySubtitle && (
                        <div
                          className="text-xs leading-tight truncate mt-0.5"
                          style={{ color: theme.buttonSubtitleColor }}
                        >
                          {displaySubtitle}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Clean Chevron Arrow */}
                    <div className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0 pl-1">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: DIGITAL STORE & PRODUCTS VIEW */}
        {activeTab === 'store' && (
          <div className="w-full mt-5 space-y-4 text-left animate-in fade-in duration-200">
            {/* Store Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 text-white flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Digital Store & Products
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {catalogItems.length} {catalogItems.length === 1 ? 'item available' : 'items available'}
                  </p>
                </div>
              </div>

              <a
                href={fullStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
              >
                <span>Full Store</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, courses, eBooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/15 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categories Chips (if more than 1 category) */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-black/20 text-white/80 hover:text-white hover:bg-black/30 border border-white/10'
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'bg-black/20 text-white/80 hover:text-white hover:bg-black/30 border border-white/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Products List / Grid */}
            {loadingCatalog ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-white/70">
                  Loading digital store...
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white/60 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No products found</p>
                  <p className="text-xs text-white/60">
                    {searchQuery
                      ? 'Try another search keyword or clear the filter.'
                      : 'This creator has not added public items to this section yet.'}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((item) => {
                  const isDigital = item.productType === 'digital_file';
                  const isFree = item.isFree || item.price === 0;
                  const price = item.salePrice || item.price;
                  const hasDiscount = item.salePrice && item.salePrice < item.price;
                  const cover = item.images?.[0] || item.coverImage;

                  return (
                    <div
                      key={item.id}
                      className="group bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-md transition hover:border-emerald-500/40 text-left relative overflow-hidden"
                    >
                      <div className="flex gap-3.5">
                        {/* Thumbnail */}
                        <div
                          onClick={() => setSelectedItemForDetail(item)}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-800 shrink-0 relative cursor-pointer group-hover:opacity-90 transition"
                        >
                          {cover ? (
                            <SafeImage
                              src={cover}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                              <ShoppingBag className="w-7 h-7" />
                            </div>
                          )}

                          {isFree ? (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                              FREE
                            </span>
                          ) : hasDiscount ? (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider">
                              OFF
                            </span>
                          ) : null}
                        </div>

                        {/* Info & Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                {isDigital ? (
                                  <>
                                    <Download className="w-2.5 h-2.5" />
                                    <span>Digital Asset</span>
                                  </>
                                ) : (
                                  <>
                                    <Tag className="w-2.5 h-2.5" />
                                    <span>Product</span>
                                  </>
                                )}
                              </span>
                              {item.digitalFileType && (
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  {item.digitalFileType}
                                </span>
                              )}
                            </div>

                            <h4
                              onClick={() => setSelectedItemForDetail(item)}
                              className="font-extrabold text-sm sm:text-base text-white hover:text-emerald-400 transition cursor-pointer leading-snug line-clamp-2"
                            >
                              {item.name}
                            </h4>

                            {item.shortDescription && (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {item.shortDescription}
                              </p>
                            )}
                          </div>

                          {/* Price & Action Button */}
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1.5">
                              {isFree ? (
                                <span className="text-base font-black text-emerald-400">FREE</span>
                              ) : (
                                <>
                                  <span className="text-base font-black text-white">
                                    {currency}
                                    {price}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-xs text-slate-500 line-through">
                                      {currency}
                                      {item.price}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedItemForDetail(item)}
                                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center cursor-pointer"
                                title="Quick View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isDigital) {
                                    setSelectedItemForDigital(item);
                                  } else {
                                    setSelectedItemForDetail(item);
                                  }
                                }}
                                className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                                  isFree
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                {isDigital ? <Download className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                                <span>{isFree ? 'Claim Free' : 'Buy Now'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Visit Full Storefront Link */}
            <div className="pt-4 text-center">
              <a
                href={fullStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-2 border border-white/15"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Open Full Storefront with Cart & WhatsApp Checkout</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        )}

        {/* Footer: Made with ❤️ by Storelly */}
        <div className="mt-12 flex flex-col items-center space-y-2">
          <a
            href="/"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full backdrop-blur-md bg-black/15 hover:bg-black/25 text-xs font-semibold transition border border-white/10"
            style={{ color: theme.textColor }}
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Made with <span className="text-rose-500">❤️</span> by <strong className="font-black">Storelly</strong>
            </span>
          </a>
          <div className="text-[10px] opacity-50 tracking-wider uppercase font-medium">
            One Link. Everything You Do.
          </div>
        </div>
      </div>

      {/* Share & QR Code Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl relative space-y-5 animate-in zoom-in-95">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-black text-xl text-slate-900">Share Bio Link</h3>
              <p className="text-xs text-slate-500">
                Share this profile with your audience across WhatsApp, Instagram or QR code.
              </p>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-44 h-44 rounded-xl shadow-sm bg-white p-2"
                />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                  Scan to Open Page
                </span>
              </div>
            )}

            {/* Copy URL Input */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="bg-transparent text-xs font-mono flex-1 outline-none text-slate-700 px-2 select-all truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-800 shadow-sm hover:bg-slate-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Direct WhatsApp Share Button */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Check out ${business.name}'s official bio page: ${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <SocialBrandIcon type="whatsapp" size={18} className="w-4.5 h-4.5 fill-current" />
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          business={business}
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onBuyDigitalItem={(item) => {
            setSelectedItemForDetail(null);
            setSelectedItemForDigital(item);
          }}
        />
      )}

      {/* 1-Click Buy / Instant Claim Digital Checkout Modal */}
      {selectedItemForDigital && (
        <DigitalCheckoutModal
          item={selectedItemForDigital}
          business={business}
          isOpen={!!selectedItemForDigital}
          onClose={() => setSelectedItemForDigital(null)}
        />
      )}
    </div>
  );
};
