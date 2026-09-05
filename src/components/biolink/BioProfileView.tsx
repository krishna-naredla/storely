import React, { useState, useEffect } from 'react';
import { SafeImage } from '../common/SafeImage';
import { BusinessProfile, BioLink } from '../../types';
import {
  getBioLinks,
  recordBioLinkClick,
  recordBioLinkView,
  recordAnalyticsEvent,
} from '../../services/firebaseService';
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
}

export const BioProfileView: React.FC<Props> = ({ business, onBackToDashboard }) => {
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadLinks();

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

  const loadLinks = async () => {
    try {
      const data = (await getBioLinks(business.id)) as BioLink[];
      const activeLinks = data
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
      url: window.location.origin + `/@${business.slug}/store`,
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

        <button
          onClick={handleShare}
          aria-label="Share profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition backdrop-blur-md bg-black/20 hover:bg-black/40 text-white border border-white/10 shadow-sm hover:scale-105 active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
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

        {/* Primary Action Links Cards Stack */}
        <div className="w-full mt-6 space-y-3">
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
    </div>
  );
};
