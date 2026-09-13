import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import { BusinessProfile, BioLink } from '../../types';
import {
  getBioLinks,
  getDigitalStoreUrl,
  getPortfolioUrl,
  recordBioLinkClick,
  recordBioLinkView,
  recordAnalyticsEvent,
} from '../../services/firebaseService';
import { getSocialLinkValue } from '../../utils/profileHelper';
import {
  ExternalLink,
  Share2,
  Check,
  Sparkles,
  ChevronRight,
  Copy,
  X,
  ArrowLeft,
  Store,
  ShoppingBag,
  Briefcase,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  SocialBrandIcon,
  getBrandConfig,
  BIO_THEME_PRESETS,
} from './SocialBrandIcons';
import { DEFAULT_BIO_THEME } from './constants';

interface Props {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  onOpenStorefront?: () => void;
}



export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard }) => {
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [themeValidated, setThemeValidated] = useState(false);

  useEffect(() => {
    if (business) {
      setThemeValidated(true);
    }
  }, [business]);

  if (!business || !themeValidated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold">Profile not found or unavailable.</p>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const rawTheme = business.bioTheme || {};
  const presetKey = rawTheme?.presetId || 'classic_green';
  const preset = (BIO_THEME_PRESETS && BIO_THEME_PRESETS[presetKey]) ? BIO_THEME_PRESETS[presetKey] : (BIO_THEME_PRESETS?.['classic_green'] || DEFAULT_BIO_THEME);

  const theme = {
    background: rawTheme?.background || preset?.backgroundGradient || preset?.backgroundColor || DEFAULT_BIO_THEME.backgroundColor,
    textColor: rawTheme?.textColor || preset?.textColor || DEFAULT_BIO_THEME.textColor,
    subtitleColor: rawTheme?.subtitleColor || preset?.subtitleColor || DEFAULT_BIO_THEME.subtitleColor,
    buttonStyle: (rawTheme?.buttonStyle as string) || preset?.buttonStyle || DEFAULT_BIO_THEME.buttonStyle,
    buttonColor: rawTheme?.buttonColor || preset?.buttonColor || DEFAULT_BIO_THEME.buttonColor,
    buttonTextColor: rawTheme?.buttonTextColor || preset?.buttonTextColor || DEFAULT_BIO_THEME.buttonTextColor,
    buttonSubtitleColor: rawTheme?.buttonSubtitleColor || preset?.buttonSubtitleColor || DEFAULT_BIO_THEME.buttonSubtitleColor,
    buttonBorderColor: rawTheme?.buttonBorderColor || preset?.buttonBorderColor || DEFAULT_BIO_THEME.buttonBorderColor,
    buttonHoverEffect: rawTheme?.buttonHoverEffect || DEFAULT_BIO_THEME.buttonHoverEffect,
    fontFamily: rawTheme?.fontFamily || DEFAULT_BIO_THEME.fontFamily,
    avatarShape: rawTheme?.avatarShape || DEFAULT_BIO_THEME.avatarShape,
    avatarBorder: rawTheme?.avatarBorder !== false,
    showVerifiedBadge: rawTheme?.showVerifiedBadge !== false,
    profession: rawTheme?.profession || business?.tagline || DEFAULT_BIO_THEME.profession,
    showSocialIconsBar: rawTheme?.showSocialIconsBar !== false,
  };

  useEffect(() => {
    const title = `${business.name} — Official Bio Link | Storelly`;
    document.title = title;
    recordBioLinkView(business.id);
    loadData();

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
      const linksData = (await getBioLinks(business.id)) as BioLink[];
      const activeLinks = (linksData || [])
        .filter((l) => l.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      setLinks(activeLinks);
      recordAnalyticsEvent(business.id, 'bio_views', { slug: business.slug }).catch(() => {});
    } catch (err) {
      console.error('Error loading biolinks:', err);
    } finally {
      setLoading(false);
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

    if (link.url === '#store') {
      window.open(getDigitalStoreUrl(business.slug), '_blank', 'noopener,noreferrer');
      return;
    }

    if (link.url === '#portfolio') {
      window.open(getPortfolioUrl(business.slug), '_blank', 'noopener,noreferrer');
      return;
    }

    let targetUrl = link.url;
    if (link.type === 'email' && !targetUrl.startsWith('mailto:')) {
      targetUrl = `mailto:${targetUrl}`;
    } else if (link.type === 'phone' && !targetUrl.startsWith('tel:')) {
      targetUrl = `tel:${targetUrl.replace(/[^0-9+]/g, '')}`;
    } else if (targetUrl.startsWith('/')) {
      window.location.href = targetUrl;
      return;
    } else if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith('mailto:') && !targetUrl.startsWith('tel:')) {
      targetUrl = `https://${targetUrl}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Quick social icons
  const rawSocials = rawTheme.socials || {};
  const socialConfig = {
    whatsapp: rawSocials.whatsapp || business.whatsapp || getSocialLinkValue(business, 'whatsapp') || '',
    instagram: rawSocials.instagram || getSocialLinkValue(business, 'instagram') || '',
    youtube: rawSocials.youtube || getSocialLinkValue(business, 'youtube') || '',
    telegram: rawSocials.telegram || getSocialLinkValue(business, 'telegram') || '',
    linkedin: rawSocials.linkedin || getSocialLinkValue(business, 'linkedin') || '',
    twitter: rawSocials.twitter || getSocialLinkValue(business, 'twitter') || '',
    facebook: rawSocials.facebook || getSocialLinkValue(business, 'facebook') || '',
    discord: rawSocials.discord || getSocialLinkValue(business, 'discord') || '',
    spotify: rawSocials.spotify || getSocialLinkValue(business, 'spotify') || '',
    github: rawSocials.github || getSocialLinkValue(business, 'github') || '',
  };

  const getSocialUrl = (platform: string, val: string) => {
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
      subtitle: 'Browse products, downloads & offers',
      url: `/store/${business.slug}`,
      enabled: true,
      highlight: true,
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'default_portfolio',
      businessId: business.id,
      type: 'custom',
      title: 'View Work Portfolio & Case Studies',
      subtitle: 'Explore recent creative deliverables & projects',
      url: `/portfolio/${business.slug}`,
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

  const hasStoreModule = Boolean(
    business.modules?.digital_products ||
    business.modules?.digitalProducts ||
    business.modules?.products ||
    business.modules?.catalog
  );
  const hasPortfolioModule = Boolean(business.modules?.work_portfolio || business.modules?.portfolio);

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col items-center justify-start ${getFontFamilyClass()}`}
      style={{
        background: theme.background,
        color: theme.textColor,
      }}
    >
      {/* Decorative Cover / Top Banner if Available */}
      {business.banner && (
        <div className="w-full h-44 sm:h-56 md:h-64 relative overflow-hidden">
          <img
            src={business.banner}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>
      )}

      {/* Floating Top Bar (Dashboard Back, Module Links & Share) */}
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl px-3.5 xs:px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 z-20 flex items-center justify-between">
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 min-h-[44px] min-w-[44px] rounded-full text-xs sm:text-sm font-bold transition backdrop-blur-md bg-black/20 hover:bg-black/40 text-white border border-white/10 cursor-pointer shadow-xs active:scale-95 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 opacity-70 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Universal Bio Link</span>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {hasStoreModule && (
            <a
              href={`/store/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open digital store"
              className="flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 min-h-[44px] min-w-[44px] rounded-full text-xs sm:text-sm font-bold transition backdrop-blur-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shadow-xs cursor-pointer active:scale-95 touch-manipulation"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {hasPortfolioModule && (
            <a
              href={`/portfolio/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open work portfolio"
              className="flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 min-h-[44px] min-w-[44px] rounded-full text-xs sm:text-sm font-bold transition backdrop-blur-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 shadow-xs cursor-pointer active:scale-95 touch-manipulation"
            >
              <Briefcase className="w-4 h-4" />
              <span>Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleShare}
            aria-label="Share profile"
            className="flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 min-h-[44px] min-w-[44px] rounded-full text-xs sm:text-sm font-bold transition backdrop-blur-md bg-black/20 hover:bg-black/40 text-white border border-white/10 shadow-xs hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Profile Header Container - Device Friendly & Fluid Scaling */}
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl px-3.5 xs:px-4 sm:px-6 md:px-8 lg:px-10 pt-2 sm:pt-4 pb-28 z-10 flex flex-col items-center text-center bio-viewport-container">
        {/* Profile Avatar with Verified Badge */}
        <div className={`relative mb-4 sm:mb-5 group ${business.banner ? '-mt-16 sm:-mt-20 md:-mt-24' : 'mt-2 sm:mt-4'}`}>
          <div
            className={`w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 p-1 sm:p-1.5 backdrop-blur-md transition-transform duration-300 group-hover:scale-105 bio-avatar-fluid ${getAvatarRadiusClass()} ${
              theme.avatarBorder ? 'bg-white/30 ring-4 sm:ring-6 ring-white/25 shadow-2xl' : 'bg-transparent'
            }`}
          >
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className={`w-full h-full object-cover shadow-inner bg-slate-900 high-dpi-crisp ${getAvatarRadiusClass()}`}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black shadow-inner ${getAvatarRadiusClass()}`}
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
              className="absolute bottom-1 right-1 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl border-2 sm:border-3 border-white ring-2 ring-emerald-500/20"
              title="Verified Creator"
            >
              <Check className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Full Name */}
        <h1
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight bio-title-fluid"
          style={{ color: theme.textColor }}
        >
          {business.name}
        </h1>

        {/* Profession / Subtitle */}
        {theme.profession && (
          <p
            className="text-sm sm:text-base md:text-lg font-bold tracking-wide uppercase mt-1.5 sm:mt-2 opacity-90"
            style={{ color: theme.subtitleColor }}
          >
            {theme.profession}
          </p>
        )}

        {/* Description / Bio */}
        {business.description && (
          <p
            className="text-sm sm:text-base md:text-lg max-w-md sm:max-w-xl md:max-w-2xl mt-3 sm:mt-3.5 opacity-85 leading-relaxed font-normal"
            style={{ color: theme.textColor }}
          >
            {business.description}
          </p>
        )}

        {/* Social Icons Quick Bar - Large & Touch-Friendly (WCAG compliant >= 48px targets) */}
        {theme.showSocialIconsBar && (
          <div className="flex items-center justify-center flex-wrap gap-2.5 xs:gap-3 sm:gap-4 mt-5 xs:mt-6 sm:mt-7">
            {/* WhatsApp */}
            {socialConfig.whatsapp && (
              <a
                href={getSocialUrl('whatsapp', socialConfig.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#25D366' }}
              >
                <SocialBrandIcon type="whatsapp" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* Instagram */}
            {socialConfig.instagram && (
              <a
                href={getSocialUrl('instagram', socialConfig.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                }}
              >
                <SocialBrandIcon type="instagram" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* YouTube */}
            {socialConfig.youtube && (
              <a
                href={getSocialUrl('youtube', socialConfig.youtube)}
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#FF0000' }}
              >
                <SocialBrandIcon type="youtube" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* Telegram */}
            {socialConfig.telegram && (
              <a
                href={getSocialUrl('telegram', socialConfig.telegram)}
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram Channel"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#229ED9' }}
              >
                <SocialBrandIcon type="telegram" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* LinkedIn */}
            {socialConfig.linkedin && (
              <a
                href={getSocialUrl('linkedin', socialConfig.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn Profile"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#0A66C2' }}
              >
                <SocialBrandIcon type="linkedin" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* Twitter / X */}
            {socialConfig.twitter && (
              <a
                href={getSocialUrl('twitter', socialConfig.twitter)}
                target="_blank"
                rel="noopener noreferrer"
                title="Twitter / X"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#000000' }}
              >
                <SocialBrandIcon type="twitter" size={22} className="w-5.5 h-5.5 fill-current" />
              </a>
            )}

            {/* Facebook */}
            {socialConfig.facebook && (
              <a
                href={getSocialUrl('facebook', socialConfig.facebook)}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#1877F2' }}
              >
                <SocialBrandIcon type="facebook" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* Discord */}
            {socialConfig.discord && (
              <a
                href={getSocialUrl('discord', socialConfig.discord)}
                target="_blank"
                rel="noopener noreferrer"
                title="Discord Community"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#5865F2' }}
              >
                <SocialBrandIcon type="discord" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* Spotify */}
            {socialConfig.spotify && (
              <a
                href={getSocialUrl('spotify', socialConfig.spotify)}
                target="_blank"
                rel="noopener noreferrer"
                title="Spotify"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#1DB954' }}
              >
                <SocialBrandIcon type="spotify" size={24} className="w-6 h-6 fill-current" />
              </a>
            )}

            {/* GitHub */}
            {socialConfig.github && (
              <a
                href={getSocialUrl('github', socialConfig.github)}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
                style={{ backgroundColor: '#24292F' }}
              >
                <SocialBrandIcon type="github" size={22} className="w-5.5 h-5.5 fill-current" />
              </a>
            )}
          </div>
        )}

        {/* CUSTOM BIO LINKS CONTAINER: Refactored with CSS Grid auto-fit & minmax
            Expands gracefully on tablets / foldables while staying compact on smaller mobile devices */}
        <div 
          className="w-full mt-6 xs:mt-7 sm:mt-8 md:mt-10 grid grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-3 xs:gap-3.5 sm:gap-4 md:gap-5 animate-in fade-in duration-200 bio-grid-adaptive"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)',
          }}
        >
          {loading ? (
            <div className="py-16 col-span-full flex flex-col items-center justify-center space-y-3">
              <div className="w-9 h-9 border-3 border-current border-t-transparent rounded-full animate-spin opacity-60" />
              <span className="text-sm font-semibold opacity-70">Loading bio links...</span>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLinkClick(link, e as any);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${link.title}${displaySubtitle ? ` - ${displaySubtitle}` : ''}`}
                  className={`w-full h-full group text-left cursor-pointer flex items-center p-3.5 xs:p-4 sm:p-4.5 md:p-5 min-h-[64px] xs:min-h-[68px] sm:min-h-[76px] md:min-h-[82px] border relative overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] shadow-xs hover:shadow-md touch-manipulation select-none ${getRadiusClass()} ${getHoverClass()} ${
                    isHighlight ? 'ring-2 sm:ring-3 ring-emerald-400 shadow-md col-span-full' : ''
                  }`}
                  style={{
                    backgroundColor: theme.buttonColor,
                    color: theme.buttonTextColor,
                    borderColor: isHighlight ? '#10B981' : theme.buttonBorderColor,
                  }}
                >
                  {/* Highlight Ribbon / Badge */}
                  {isHighlight && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-[10px] sm:text-xs font-black text-white uppercase tracking-wider rounded-bl-xl shadow-xs">
                      Featured
                    </div>
                  )}

                  {/* Left Column: Brand Icon Box */}
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shrink-0 mr-3.5 xs:mr-4 sm:mr-5 shadow-xs transition-transform duration-200 group-hover:scale-105"
                    style={{
                      background:
                        link.type === 'instagram'
                          ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                          : brand.color,
                    }}
                  >
                    <SocialBrandIcon
                      type={link.type}
                      size={24}
                      className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                    />
                  </div>

                  {/* Middle Column: Title & Subtitle */}
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-extrabold text-base sm:text-lg md:text-xl leading-snug truncate">
                      {link.title}
                    </div>
                    {displaySubtitle && (
                      <div
                        className="text-xs sm:text-sm md:text-base leading-tight truncate mt-0.5 sm:mt-1 font-medium opacity-85"
                        style={{ color: theme.buttonSubtitleColor }}
                      >
                        {displaySubtitle}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Chevron Arrow */}
                  <div className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 pl-1">
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Made with ❤️ by Storelly */}
        <div className="mt-14 sm:mt-16 flex flex-col items-center space-y-2">
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-full backdrop-blur-md bg-black/15 hover:bg-black/25 text-xs sm:text-sm font-bold transition border border-white/10 active:scale-95 touch-manipulation"
            style={{ color: theme.textColor }}
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>
              Made with <span className="text-rose-500">❤️</span> by <strong className="font-black">Storelly</strong>
            </span>
          </a>
          <div className="text-xs sm:text-sm opacity-60 tracking-wider uppercase font-semibold">
            One Link. Everything You Do.
          </div>
        </div>
      </div>

      {/* Share & QR Code Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 text-slate-900 shadow-2xl relative space-y-5 animate-in zoom-in-95">
            <button
              onClick={() => setShareModalOpen(false)}
              aria-label="Close share dialog"
              className="absolute top-4 right-4 w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pt-1">
              <h3 className="font-black text-xl sm:text-2xl text-slate-900">Share Bio Link</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Share this profile with your audience across WhatsApp, Instagram or QR code.
              </p>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-2xl shadow-xs bg-white p-2 high-dpi-crisp"
                />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2.5">
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
                className="bg-transparent text-xs sm:text-sm font-mono font-bold flex-1 outline-hidden text-slate-900 px-2 select-all truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-800 shadow-xs hover:bg-slate-50'
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
              className="w-full py-3.5 px-4 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95 touch-manipulation"
            >
              <SocialBrandIcon type="whatsapp" size={20} className="w-5 h-5 fill-current" />
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
