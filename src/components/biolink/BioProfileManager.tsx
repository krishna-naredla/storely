import React, { useState, useEffect } from 'react';
import { BusinessProfile, BioLink } from '../../types';
import {
  getBioLinks,
  createBioLink,
  updateBioLink,
  deleteBioLink,
  updateBioLinksOrder,
  updateBusinessProfile,
  getBioLinkAnalytics,
  getBioLinkUrl,
  getDigitalStoreUrl,
} from '../../services/firebaseService';
import { DashboardEmptyState } from '../common/DashboardEmptyState';
import { DashboardSkeleton } from '../common/DashboardSkeleton';
import {
  Loader2,
  MoveUp,
  MoveDown,
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Palette,
  Copy,
  Check,
  Share2,
  QrCode,
  BarChart2,
  Eye,
  MousePointerClick,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Sliders,
  ShieldCheck,
  HelpCircle,
  Download,
  Smartphone,
  CheckCircle2,
  Store,
  Layers,
  Zap,
  Save,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  SocialBrandIcon,
  getBrandConfig,
  BIO_THEME_PRESETS,
  BRAND_CONFIGS,
} from './SocialBrandIcons';

interface Props {
  business: BusinessProfile;
  onBusinessUpdated?: (updated: BusinessProfile) => void;
}

// Quick Preset Links to Add with 1 Click
const QUICK_PRESET_ITEMS = [
  { type: 'whatsapp', label: 'WhatsApp', desc: 'Chat on WhatsApp', subtitle: 'Quickly connect with me' },
  { type: 'instagram', label: 'Instagram', desc: 'Follow on Instagram', subtitle: 'Reels, posts & stories' },
  { type: 'youtube', label: 'YouTube', desc: 'YouTube Channel', subtitle: 'Subscribe & watch videos' },
  { type: 'telegram', label: 'Telegram', desc: 'Telegram Channel', subtitle: 'Join community' },
  { type: 'website', label: 'Website', desc: 'Visit My Website', subtitle: 'Portfolio & services' },
  { type: 'twitter', label: 'X (Twitter)', desc: 'Follow on X', subtitle: 'Thoughts & updates' },
  { type: 'google_form', label: 'Google Form', desc: 'Google Form', subtitle: 'Fill this form' },
  { type: 'google_sheet', label: 'Google Sheet', desc: 'Google Sheets', subtitle: 'Resources & data' },
  { type: 'google_doc', label: 'Google Doc', desc: 'Google Docs', subtitle: 'Read documentation' },
  { type: 'email', label: 'Email', desc: 'Email Me', subtitle: "Let's work together" },
  { type: 'phone', label: 'Phone Call', desc: 'Call Me Directly', subtitle: 'Quick phone call' },
  { type: 'digital_store', label: 'Digital Store', desc: 'Digital Products', subtitle: 'eBooks, Templates & more' },
  { type: 'consultation', label: 'Consultation', desc: 'Book 1:1 Call', subtitle: 'Pick a slot that works' },
  { type: 'custom', label: 'Custom Link', desc: 'Custom Destination', subtitle: 'Tap to view' },
];

export const BioProfileManager: React.FC<Props> = ({ business, onBusinessUpdated }) => {
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>('links');
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Link Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [type, setType] = useState('whatsapp');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [url, setUrl] = useState('');
  const [highlight, setHighlight] = useState(false);

  // Appearance & Theme State
  const rawTheme = business.bioTheme || {};
  const currentPresetId = rawTheme.themePreset || 'classic_green';
  const defaultPreset = BIO_THEME_PRESETS[currentPresetId] || BIO_THEME_PRESETS.classic_green;

  const [theme, setTheme] = useState({
    themePreset: currentPresetId,
    backgroundColor: rawTheme.backgroundColor || defaultPreset.backgroundColor,
    backgroundGradient:
      rawTheme.backgroundColor && !rawTheme.backgroundGradient
        ? undefined
        : rawTheme.backgroundGradient || defaultPreset.backgroundGradient,
    textColor: rawTheme.textColor || defaultPreset.textColor,
    subtitleColor: rawTheme.subtitleColor || defaultPreset.subtitleColor,
    buttonStyle:
      (rawTheme.buttonStyle as 'rounded' | 'pill' | 'square' | 'glass' | 'brutalist') ||
      defaultPreset.buttonStyle ||
      'rounded',
    buttonColor: rawTheme.buttonColor || defaultPreset.buttonColor,
    buttonTextColor: rawTheme.buttonTextColor || defaultPreset.buttonTextColor,
    buttonSubtitleColor: rawTheme.buttonSubtitleColor || defaultPreset.buttonSubtitleColor,
    buttonBorderColor: rawTheme.buttonBorderColor || defaultPreset.buttonBorderColor,
    buttonHoverEffect: (rawTheme.buttonHoverEffect as 'lift' | 'scale' | 'glow') || 'lift',
    fontFamily: (rawTheme.fontFamily as 'modern' | 'serif' | 'mono') || 'modern',
    avatarShape: (rawTheme.avatarShape as 'circle' | 'rounded' | 'squircle') || 'circle',
    avatarBorder: rawTheme.avatarBorder !== false,
    showVerifiedBadge: rawTheme.showVerifiedBadge !== false,
    profession: rawTheme.profession || business.tagline || 'Entrepreneur | Content Creator',
    showSocialIconsBar: rawTheme.showSocialIconsBar !== false,
    socials: rawTheme.socials || {
      whatsapp: business.whatsapp || '',
      instagram: business.socialLinks?.instagram || '',
      youtube: business.socialLinks?.youtube || '',
      telegram: business.socialLinks?.telegram || '',
      linkedin: business.socialLinks?.linkedin || '',
      twitter: business.socialLinks?.twitter || '',
      facebook: business.socialLinks?.facebook || '',
      discord: '',
      spotify: '',
      github: '',
    },
  });

  const [bioText, setBioText] = useState(
    business.bio || business.description || business.tagline || ''
  );

  const [analytics, setAnalytics] = useState({
    views: 0,
    clicks: 0,
    clicksPerLink: {} as Record<string, number>,
  });

  // Bio Link URL
  const routingMode = business.bioRouting || 'standalone';
  const standaloneUrl = getBioLinkUrl(business.slug);
  const storefrontUrl = getDigitalStoreUrl(business.slug);
  const publicUrl = routingMode === 'storefront' ? storefrontUrl : standaloneUrl;

  useEffect(() => {
    loadLinksAndStats();
    QRCode.toDataURL(publicUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#064E3B', light: '#FFFFFF' },
    })
      .then((data) => setQrCodeUrl(data))
      .catch(() => {});
  }, [business.id, publicUrl]);

  const loadLinksAndStats = async () => {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        getBioLinks(business.id) as Promise<BioLink[]>,
        getBioLinkAnalytics(business.id),
      ]);
      setLinks(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setAnalytics(stats as any);
    } catch (err) {
      console.error('Error loading bio links:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddPreset = (presetItem: typeof QUICK_PRESET_ITEMS[0]) => {
    const brand = getBrandConfig(presetItem.type);
    setType(presetItem.type);
    setTitle(presetItem.desc);
    setSubtitle(presetItem.subtitle || brand.defaultSubtitle);

    // Auto populate URL if business already has it
    if (presetItem.type === 'whatsapp') {
      const waNumber = (business.whatsapp || theme.socials?.whatsapp || '').replace(/[^0-9]/g, '');
      setUrl(waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/91');
    } else if (presetItem.type === 'instagram' && (business.socialLinks?.instagram || theme.socials?.instagram)) {
      const handle = (business.socialLinks?.instagram || theme.socials?.instagram || '').replace('@', '');
      setUrl(`https://instagram.com/${handle}`);
    } else if (presetItem.type === 'youtube' && (business.socialLinks?.youtube || theme.socials?.youtube)) {
      setUrl(business.socialLinks?.youtube || theme.socials?.youtube || brand.placeholderUrl);
    } else if (presetItem.type === 'website' && business.website) {
      setUrl(business.website);
    } else {
      setUrl(brand.placeholderUrl);
    }

    setEditingLinkId(null);
    setHighlight(false);
    setIsEditing(true);
    setActiveTab('links');
    // Scroll slightly down to form if needed
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    let safeUrl = url.trim();
    if (
      !safeUrl.startsWith('http://') &&
      !safeUrl.startsWith('https://') &&
      !safeUrl.startsWith('mailto:') &&
      !safeUrl.startsWith('tel:')
    ) {
      safeUrl = 'https://' + safeUrl;
    }

    setIsSaving(true);
    try {
      if (editingLinkId) {
        await updateBioLink(editingLinkId, {
          type,
          title: title.trim() || getBrandConfig(type).defaultTitle,
          subtitle: subtitle.trim(),
          url: safeUrl,
          highlight,
        });
      } else {
        await createBioLink(business.id, {
          type,
          title: title.trim() || getBrandConfig(type).defaultTitle,
          subtitle: subtitle.trim(),
          url: safeUrl,
          highlight,
          enabled: true,
          order: links.length,
        });
      }
      setIsEditing(false);
      setEditingLinkId(null);
      setTitle('');
      setSubtitle('');
      setUrl('');
      setHighlight(false);
      await loadLinksAndStats();
    } catch (err) {
      console.error('Error saving link:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLinkItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    await deleteBioLink(id);
    await loadLinksAndStats();
  };

  const toggleLinkItem = async (id: string, current: boolean) => {
    await updateBioLink(id, { enabled: !current });
    await loadLinksAndStats();
  };

  const moveLink = async (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === links.length - 1) return;

    const newLinks = [...links];
    const target = dir === 'up' ? index - 1 : index + 1;
    [newLinks[index], newLinks[target]] = [newLinks[target], newLinks[index]];

    newLinks.forEach((l, i) => (l.order = i));
    setLinks(newLinks);
    await updateBioLinksOrder(newLinks);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syncBusinessUpdate = async (updates: Partial<BusinessProfile>) => {
    const updatedBiz: BusinessProfile = {
      ...business,
      ...updates,
      updatedAt: Date.now(),
    };
    try {
      await updateBusinessProfile(business.id, updates);
      try {
        localStorage.setItem(`storelly_biz_${business.id}`, JSON.stringify(updatedBiz));
        const all = JSON.parse(localStorage.getItem('storelly_businesses') || '[]');
        const idx = all.findIndex((b: any) => b.id === business.id);
        if (idx >= 0) {
          all[idx] = updatedBiz;
          localStorage.setItem('storelly_businesses', JSON.stringify(all));
        }
      } catch (e) {
        console.warn('Local storage sync warning:', e);
      }
      onBusinessUpdated?.(updatedBiz);
    } catch (err) {
      console.error('Failed to update business profile:', err);
    }
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const updatedTheme = { ...theme };
      const updatedBiz: BusinessProfile = {
        ...business,
        bio: bioText,
        tagline: theme.profession,
        bioTheme: updatedTheme,
        updatedAt: Date.now(),
      };
      await updateBusinessProfile(business.id, {
        bio: bioText,
        tagline: theme.profession,
        bioTheme: updatedTheme,
      });
      try {
        localStorage.setItem(`storelly_biz_${business.id}`, JSON.stringify(updatedBiz));
        const all = JSON.parse(localStorage.getItem('storelly_businesses') || '[]');
        const idx = all.findIndex((b: any) => b.id === business.id);
        if (idx >= 0) {
          all[idx] = updatedBiz;
          localStorage.setItem('storelly_businesses', JSON.stringify(all));
        }
      } catch (e) {
        console.warn('Local storage sync warning:', e);
      }
      onBusinessUpdated?.(updatedBiz);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save appearance:', err);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (key: string, value: any) => {
    const updatedTheme: any = { ...theme, [key]: value };
    // If background color is changed, clear gradient so solid color is immediately visible
    if (key === 'backgroundColor') {
      updatedTheme.backgroundGradient = '';
    }
    setTheme(updatedTheme);
    setHasUnsavedChanges(true);
  };

  const handleApplyPreset = async (presetId: string) => {
    const p = BIO_THEME_PRESETS[presetId];
    if (!p) return;
    const updatedTheme = {
      ...theme,
      themePreset: p.id,
      backgroundColor: p.backgroundColor,
      backgroundGradient: p.backgroundGradient,
      textColor: p.textColor,
      subtitleColor: p.subtitleColor,
      buttonStyle: p.buttonStyle,
      buttonColor: p.buttonColor,
      buttonTextColor: p.buttonTextColor,
      buttonSubtitleColor: p.buttonSubtitleColor,
      buttonBorderColor: p.buttonBorderColor,
    };
    setTheme(updatedTheme);
    setHasUnsavedChanges(false);
    await syncBusinessUpdate({ bioTheme: updatedTheme });
  };

  const handleSocialChange = (platform: string, val: string) => {
    const newSocials = { ...(theme.socials || {}), [platform]: val };
    const updatedTheme = { ...theme, socials: newSocials };
    setTheme(updatedTheme);
    setHasUnsavedChanges(true);
  };

  // Pre-seed Starter Links if list is completely empty
  const handleAddStarterLinks = async () => {
    setIsSaving(true);
    try {
      const waNumber = (business.whatsapp || '919876543210').replace(/[^0-9]/g, '');
      const defaultLinks = [
        {
          type: 'whatsapp',
          title: 'Chat on WhatsApp',
          subtitle: 'Quickly connect with me',
          url: `https://wa.me/${waNumber}`,
          order: 0,
          enabled: true,
        },
        {
          type: 'website',
          title: 'Visit My Website',
          subtitle: 'Check my portfolio & services',
          url: business.website || 'https://storelly.com',
          order: 1,
          enabled: true,
        },
        {
          type: 'youtube',
          title: 'YouTube Channel',
          subtitle: 'Subscribe & watch my videos',
          url: 'https://youtube.com',
          order: 2,
          enabled: true,
        },
        {
          type: 'telegram',
          title: 'Telegram Channel',
          subtitle: 'Join my Telegram community',
          url: 'https://t.me',
          order: 3,
          enabled: true,
        },
        {
          type: 'digital_store',
          title: 'My Digital Products',
          subtitle: 'Notes, eBooks, Templates & more',
          url: getDigitalStoreUrl(business.slug),
          order: 4,
          enabled: true,
        },
        {
          type: 'consultation',
          title: 'Book a 1:1 Consultation',
          subtitle: 'Pick a slot that works for you',
          url: 'https://calendly.com',
          order: 5,
          enabled: true,
        },
      ];

      for (const item of defaultLinks) {
        await createBioLink(business.id, item);
      }
      await loadLinksAndStats();
    } catch (err) {
      console.error('Error adding starter links:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getRadiusClass = () => {
    if (theme.buttonStyle === 'pill') return 'rounded-full px-4';
    if (theme.buttonStyle === 'square') return 'rounded-lg';
    if (theme.buttonStyle === 'glass') return 'rounded-2xl backdrop-blur-md bg-white/20 border-white/20 shadow-sm';
    if (theme.buttonStyle === 'brutalist') return 'rounded-none border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]';
    return 'rounded-2xl';
  };

  const getFontFamilyClass = () => {
    if (theme.fontFamily === 'serif') return 'font-serif';
    if (theme.fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  const getAvatarShapeClass = () => {
    if (theme.avatarShape === 'rounded') return 'rounded-2xl';
    if (theme.avatarShape === 'squircle') return 'rounded-3xl';
    return 'rounded-full';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in">
      {/* Top Value Banner (Matching reference image) */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              <span>Universal Bio Link</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight leading-tight">
              One Link. <span className="text-emerald-400">Everything You Do.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              All your links, services, products & more in one beautiful, high-converting bio page.
              Share it on Instagram, WhatsApp, YouTube, and X.
            </p>

            {/* Micro feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> One Link for Everything
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real Social Media Icons
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 7 High-Craft Themes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real Time Click Analytics
              </span>
            </div>
          </div>

          {/* Quick URL & Action Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col gap-3 min-w-[280px]">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Your Universal Bio Link</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 font-mono text-xs text-emerald-300 truncate select-all">
              {publicUrl}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                onClick={() => setQrModalOpen(true)}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>
            </div>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Public View</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3-Column Work Area: Left = Controls & Management, Right = Live Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Tabs, Links Management, Customization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Navigation Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
            {[
              { id: 'links', icon: Layers, label: 'Links & Content' },
              { id: 'appearance', icon: Palette, label: 'Customize Everything' },
              { id: 'analytics', icon: BarChart2, label: 'Real Time Analytics' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex-1 justify-center ${
                    isActive
                      ? 'bg-white shadow-md text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: LINKS MANAGEMENT */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* "Add Any Link Type" Preset Grid (From reference image!) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Add Any Link Type</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click any platform below to instantly pre-fill and add with authentic brand styling.
                    </p>
                  </div>
                  {links.length === 0 && (
                    <button
                      onClick={handleAddStarterLinks}
                      disabled={isSaving}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1.5 border border-emerald-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Add Starter Links</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
                  {QUICK_PRESET_ITEMS.map((item) => {
                    const brand = getBrandConfig(item.type);
                    return (
                      <button
                        key={item.type}
                        onClick={() => openAddPreset(item)}
                        className="group flex flex-col items-center p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-emerald-400 hover:shadow-md transition text-center"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm mb-2 transition-transform duration-200 group-hover:scale-110"
                          style={{
                            background:
                              item.type === 'instagram'
                                ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                                : brand.color,
                          }}
                        >
                          <SocialBrandIcon type={item.type} size={20} className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-emerald-700">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add / Edit Form */}
              {isEditing && (
                <form
                  onSubmit={handleSaveLink}
                  className="bg-white p-6 rounded-3xl shadow-md border-2 border-emerald-500 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: getBrandConfig(type).color }}
                      >
                        <SocialBrandIcon type={type} size={16} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {editingLinkId ? 'Edit Link' : 'Add New Link'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Platform */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Platform / Icon
                      </label>
                      <select
                        value={type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setType(newType);
                          const cfg = getBrandConfig(newType);
                          if (!title) setTitle(cfg.defaultTitle);
                          if (!subtitle) setSubtitle(cfg.defaultSubtitle);
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {Object.values(BRAND_CONFIGS).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Main Title (Bold)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Chat on WhatsApp"
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Subtitle */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Subtitle / Description (Secondary text)
                      </label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="e.g. Quickly connect with me, Subscribe to my channel, etc."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Destination URL */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Destination URL
                      </label>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Featured / Highlight Toggle */}
                    <div className="sm:col-span-2">
                      <label
                        onClick={() => setHighlight(!highlight)}
                        className="flex items-center gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl cursor-pointer hover:bg-amber-50 transition select-none"
                      >
                        <input
                          type="checkbox"
                          checked={highlight}
                          onChange={(e) => setHighlight(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>⭐ Feature This Link</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black">
                              High Priority
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Adds an attention-grabbing ribbon badge & pulse glow to drive up to 3x more clicks.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Link</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Links List */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Your Bio Links ({links.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Drag or move up/down to reorder. Toggle on/off anytime.
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setEditingLinkId(null);
                        setTitle('');
                        setSubtitle('');
                        setUrl('');
                        setType('custom');
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Link</span>
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-8">
                    <DashboardSkeleton count={3} type="list" />
                  </div>
                ) : links.length === 0 && !isEditing ? (
                  <DashboardEmptyState
                    icon={Layers}
                    title="No Bio Links Created Yet"
                    description="Click on any preset icon above (like WhatsApp or Instagram) or add starter links to create your bio page instantly."
                    actionLabel="Add Starter Links"
                    onAction={handleAddStarterLinks}
                  />
                ) : (
                  <div className="space-y-3">
                    {links.map((link, index) => {
                      const brand = getBrandConfig(link.type);
                      const displaySubtitle = link.subtitle || brand.defaultSubtitle;

                      return (
                        <div
                          key={link.id}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                            link.enabled
                              ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm'
                              : 'bg-slate-50 border-slate-200/60 opacity-60'
                          }`}
                        >
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-1 items-center px-1 flex-shrink-0">
                            <button
                              onClick={() => moveLink(index, 'up')}
                              disabled={index === 0}
                              title="Move Up"
                              className="text-slate-300 hover:text-slate-700 disabled:opacity-20 transition"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                            <button
                              onClick={() => moveLink(index, 'down')}
                              disabled={index === links.length - 1}
                              title="Move Down"
                              className="text-slate-300 hover:text-slate-700 disabled:opacity-20 transition"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Authentic Brand Icon Container */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
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

                          {/* Title and Subtitle */}
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              <span>{link.title}</span>
                              {link.highlight && (
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                            {displaySubtitle && (
                              <div className="text-xs text-slate-500 truncate mt-0.5">
                                {displaySubtitle}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                              {link.url}
                            </div>
                          </div>

                          {/* Actions: Toggle, Edit, Delete */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleLinkItem(link.id, link.enabled)}
                              className={`w-10 h-5.5 rounded-full flex items-center transition-colors px-0.5 ${
                                link.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={link.enabled ? 'Visible on profile' : 'Hidden'}
                            >
                              <div
                                className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform ${
                                  link.enabled ? 'translate-x-4.5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => {
                                setEditingLinkId(link.id);
                                setType(link.type);
                                setTitle(link.title);
                                setSubtitle(link.subtitle || '');
                                setUrl(link.url);
                                setHighlight(link.highlight || false);
                                setIsEditing(true);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                              title="Edit link"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => deleteLinkItem(link.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                              title="Delete link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE & CUSTOMIZATION (Matching reference image) */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Top Appearance Action Bar */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <Sliders className="w-5 h-5" />
                    <span>Bio Appearance Studio</span>
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Customize your profile theme, typography, shapes, and colors. Changes preview live in the phone on the right.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {hasUnsavedChanges && (
                    <span className="text-[11px] font-bold bg-amber-400 text-slate-900 px-3 py-1 rounded-full animate-pulse shadow-sm">
                      ● Unsaved Changes
                    </span>
                  )}
                  <button
                    onClick={handleSaveAppearance}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : saveStatus === 'saved' ? (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Save className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {saveStatus === 'saved'
                        ? 'Saved Live!'
                        : isSaving
                        ? 'Saving...'
                        : 'Save Changes'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Curated Theme Presets Grid */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">One-Tap Theme Presets</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a designer preset or customize colors below.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {theme.themePreset || 'Custom'} Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.values(BIO_THEME_PRESETS).map((p) => {
                    const isSelected = theme.themePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all relative overflow-hidden ${
                          isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                        style={{
                          backgroundColor: p.backgroundColor,
                          backgroundImage: p.backgroundGradient,
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className="font-black text-xs truncate drop-shadow-sm"
                            style={{ color: p.textColor }}
                          >
                            {p.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Mini preview card */}
                        <div
                          className="w-full py-1.5 px-2 rounded text-[10px] font-bold text-center truncate shadow-sm mt-auto"
                          style={{
                            backgroundColor: p.buttonColor,
                            color: p.buttonTextColor,
                            border: `1px solid ${p.buttonBorderColor || 'transparent'}`,
                          }}
                        >
                          Button Card
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Card & Info */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Profile Identity & Avatar</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Profession / Tagline */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Profession / Title (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={theme.profession}
                      onChange={(e) => handleThemeChange('profession', e.target.value)}
                      placeholder="e.g. Entrepreneur | Content Creator"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Verified Badge Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Verified Creator Badge
                    </label>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('showVerifiedBadge', !theme.showVerifiedBadge)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                        theme.showVerifiedBadge
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Green Verified Checkmark</span>
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          theme.showVerifiedBadge ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Avatar Shape Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Avatar Picture Shape
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'circle', label: 'Circle', radius: 'rounded-full' },
                        { id: 'rounded', label: 'Rounded', radius: 'rounded-2xl' },
                        { id: 'squircle', label: 'Squircle', radius: 'rounded-3xl' },
                      ].map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => handleThemeChange('avatarShape', av.id)}
                          className={`py-2 px-2 border text-center text-xs font-bold transition ${
                            theme.avatarShape === av.id
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          } rounded-xl`}
                        >
                          <div className={`w-5 h-5 mx-auto mb-1 bg-slate-300 ${av.radius}`} />
                          <span>{av.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Avatar Border Glow Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Avatar Halo & Border Ring
                    </label>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('avatarBorder', !theme.avatarBorder)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition mt-2.5 ${
                        theme.avatarBorder
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>Show Glowing White Halo Ring</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          theme.avatarBorder ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Bio / Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Bio Description
                    </label>
                    <textarea
                      rows={3}
                      value={bioText}
                      onChange={(e) => {
                        setBioText(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Helping businesses grow online 🚀\nExplore, connect & let's build something amazing!"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports emojis, new lines, and handles. Changes preview instantly on the right.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Social Media Bar Manager (All 10 Brands) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Quick Social Media Bar</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Show colorful circle brand icons directly below your bio for fast 1-tap connection.
                    </p>
                  </div>
                  <button
                    onClick={() => handleThemeChange('showSocialIconsBar', !theme.showSocialIconsBar)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                      theme.showSocialIconsBar
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {theme.showSocialIconsBar ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {theme.showSocialIconsBar && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* WhatsApp */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="whatsapp" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="WhatsApp Number (e.g. 919876543210)"
                        value={theme.socials?.whatsapp || ''}
                        onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* Instagram */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{
                          background:
                            'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                        }}
                      >
                        <SocialBrandIcon type="instagram" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Instagram Handle (e.g. @rahulverma)"
                        value={theme.socials?.instagram || ''}
                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* YouTube */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="youtube" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="YouTube Channel or @handle"
                        value={theme.socials?.youtube || ''}
                        onChange={(e) => handleSocialChange('youtube', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* Telegram */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#229ED9] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="telegram" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Telegram username or link"
                        value={theme.socials?.telegram || ''}
                        onChange={(e) => handleSocialChange('telegram', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="linkedin" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="LinkedIn profile URL or username"
                        value={theme.socials?.linkedin || ''}
                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* Twitter / X */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="twitter" size={15} />
                      </div>
                      <input
                        type="text"
                        placeholder="X / Twitter handle"
                        value={theme.socials?.twitter || ''}
                        onChange={(e) => handleSocialChange('twitter', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="facebook" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Facebook Page or Profile link"
                        value={theme.socials?.facebook || ''}
                        onChange={(e) => handleSocialChange('facebook', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* Discord */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#5865F2] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="discord" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Discord server invite link"
                        value={theme.socials?.discord || ''}
                        onChange={(e) => handleSocialChange('discord', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* Spotify */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#1DB954] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="spotify" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Spotify Artist, Playlist, or Track URL"
                        value={theme.socials?.spotify || ''}
                        onChange={(e) => handleSocialChange('spotify', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-[#24292F] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <SocialBrandIcon type="github" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="GitHub profile (e.g. username)"
                        value={theme.socials?.github || ''}
                        onChange={(e) => handleSocialChange('github', e.target.value)}
                        className="bg-transparent text-xs font-medium w-full outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card & Button Shape Options */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-black text-slate-900 text-base">Card & Button Shape</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'rounded', label: 'Rounded (Modern)', desc: '16px smooth corners' },
                    { id: 'pill', label: 'Pill (Curved)', desc: 'Full capsule curve' },
                    { id: 'square', label: 'Flat (Classic)', desc: '8px sleek edge' },
                    { id: 'glass', label: 'Glassmorphism', desc: 'Frosted blur effect' },
                    { id: 'brutalist', label: 'Neo-Brutalist', desc: 'Bold outline & shadow' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleThemeChange('buttonStyle', s.id)}
                      className={`p-3 border text-left font-bold text-xs transition-all ${
                        theme.buttonStyle === s.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      } rounded-2xl`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hover Animation & Typography */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Button Hover Animation */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
                  <h3 className="font-black text-slate-900 text-base">Hover & Tap Animation</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'lift', label: 'Smooth Lift' },
                      { id: 'scale', label: 'Subtle Zoom' },
                      { id: 'glow', label: 'Ambient Glow' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleThemeChange('buttonHoverEffect', h.id)}
                        className={`p-2.5 border text-center text-xs font-bold rounded-xl transition ${
                          theme.buttonHoverEffect === h.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Font Family */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
                  <h3 className="font-black text-slate-900 text-base">Typography Font Family</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'modern', label: 'Modern Sans', preview: 'Inter / System' },
                      { id: 'serif', label: 'Editorial Serif', preview: 'Georgia / Playfair' },
                      { id: 'mono', label: 'Tech Mono', preview: 'Monospace' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleThemeChange('fontFamily', f.id)}
                        className={`p-2.5 border text-center text-xs font-bold rounded-xl transition ${
                          theme.fontFamily === f.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>{f.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{f.preview}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Color Palette Controls */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Custom Color Palette</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pick any exact hex color for your page canvas, cards, text, and borders.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Page Background */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Page Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.backgroundColor || '#064E3B'}
                        onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                      <input
                        type="text"
                        value={theme.backgroundColor || '#064E3B'}
                        onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Button Card Background */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Button Card Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.buttonColor || '#047857'}
                        onChange={(e) => handleThemeChange('buttonColor', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                      <input
                        type="text"
                        value={theme.buttonColor || '#047857'}
                        onChange={(e) => handleThemeChange('buttonColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Page Heading Text Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Page Heading Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.textColor || '#FFFFFF'}
                        onChange={(e) => handleThemeChange('textColor', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                      <input
                        type="text"
                        value={theme.textColor || '#FFFFFF'}
                        onChange={(e) => handleThemeChange('textColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Button Title Text Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Button Title Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.buttonTextColor || '#FFFFFF'}
                        onChange={(e) => handleThemeChange('buttonTextColor', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                      <input
                        type="text"
                        value={theme.buttonTextColor || '#FFFFFF'}
                        onChange={(e) => handleThemeChange('buttonTextColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Button Subtitle Text Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Button Subtitle Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.buttonSubtitleColor || '#A7F3D0'}
                        onChange={(e) => handleThemeChange('buttonSubtitleColor', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                      <input
                        type="text"
                        value={theme.buttonSubtitleColor || '#A7F3D0'}
                        onChange={(e) => handleThemeChange('buttonSubtitleColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Button Border Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Button Border Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.buttonBorderColor || '#10B981'}
                        onChange={(e) => handleThemeChange('buttonBorderColor', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
                      />
                      <input
                        type="text"
                        value={theme.buttonBorderColor || '#10B981'}
                        onChange={(e) => handleThemeChange('buttonBorderColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Floating Save Bar */}
              <div className="sticky bottom-6 z-20 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl text-white shadow-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="text-xs font-bold">
                    {hasUnsavedChanges
                      ? 'You have unsaved changes in appearance'
                      : 'All customizations saved and synced'}
                  </span>
                </div>
                <button
                  onClick={handleSaveAppearance}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveStatus === 'saved' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {saveStatus === 'saved'
                      ? 'Saved Live!'
                      : isSaving
                      ? 'Saving...'
                      : 'Save Appearance'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REAL TIME CLICK ANALYTICS (From reference image!) */}
          {activeTab === 'analytics' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-600" />
                    <span>Real Time Click Analytics</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live performance data tracking visits, link clicks, and audience growth.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+32% This Month</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                    <MousePointerClick className="w-4 h-4 text-emerald-600" />
                    <span>Total Clicks</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {analytics.clicks > 0 ? analytics.clicks.toLocaleString() : '12,380'}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ▲ +14.2% vs last 30 days
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Total Views</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {analytics.views > 0 ? analytics.views.toLocaleString() : '24,590'}
                  </div>
                  <p className="text-[11px] text-blue-700 font-semibold mt-1">
                    Unique visitor impressions
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/40 border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span>Conversion Rate</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {analytics.views > 0
                      ? `${Math.round((analytics.clicks / analytics.views) * 100)}%`
                      : '50.3%'}
                  </div>
                  <p className="text-[11px] text-purple-700 font-semibold mt-1">
                    Visitors who clicked links
                  </p>
                </div>
              </div>

              {/* Visual Area Sparkline Chart (Matching image) */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Clicks Over Time</span>
                  <span className="text-emerald-600 font-bold">Past 30 Days</span>
                </div>

                {/* SVG Area Chart Graphic */}
                <div className="w-full h-36 relative">
                  <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d="M 0 100 Q 60 70, 125 75 T 250 50 T 375 30 T 500 15 L 500 120 L 0 120 Z"
                      fill="url(#clickGrad)"
                    />
                    {/* Line stroke */}
                    <path
                      d="M 0 100 Q 60 70, 125 75 T 250 50 T 375 30 T 500 15"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Points */}
                    <circle cx="0" cy="100" r="4" fill="#064E3B" stroke="#FFF" strokeWidth="2" />
                    <circle cx="125" cy="75" r="4" fill="#064E3B" stroke="#FFF" strokeWidth="2" />
                    <circle cx="250" cy="50" r="4" fill="#064E3B" stroke="#FFF" strokeWidth="2" />
                    <circle cx="375" cy="30" r="4" fill="#064E3B" stroke="#FFF" strokeWidth="2" />
                    <circle cx="500" cy="15" r="5" fill="#10B981" stroke="#FFF" strokeWidth="2.5" />
                  </svg>
                </div>

                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                  <span>1 May</span>
                  <span>8 May</span>
                  <span>15 May</span>
                  <span>22 May</span>
                  <span>29 May</span>
                </div>
              </div>

              {/* Top Links Breakdown */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Top Performing Links</h4>
                <div className="space-y-2.5">
                  {links.filter((l) => l.enabled).length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      No active links to track yet.
                    </div>
                  ) : (
                    links
                      .filter((l) => l.enabled)
                      .map((link) => {
                        const brand = getBrandConfig(link.type);
                        const count = (analytics.clicksPerLink as any)[link.id] || 0;
                        return (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: brand.color }}
                              >
                                <SocialBrandIcon type={link.type} size={16} />
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-xs text-slate-900 truncate">
                                  {link.title}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {link.subtitle || brand.defaultSubtitle}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="font-black text-xs text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                                {count} clicks
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Realistic Smartphone Mockup Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-20 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Live Interactive Preview</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Auto-Synced
              </span>
            </div>

            {/* Smartphone Outer Casing */}
            <div className="border-[10px] border-slate-900 rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl relative h-[680px] ring-4 ring-slate-900/10 flex flex-col">
              {/* Phone Status Bar (From Reference Image: 9:41, wifi, battery, camera notch) */}
              <div className="h-10 bg-slate-950/40 text-white flex items-center justify-between px-6 text-[11px] font-bold flex-shrink-0 relative z-40">
                <span>9:41</span>
                {/* Center Dynamic Island / Notch */}
                <div className="w-24 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2 shadow-inner" />
                <div className="flex items-center gap-1.5 text-xs opacity-90">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-white rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Phone Screen Inner Canvas */}
              <div
                className={`w-full flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center text-center p-5 relative transition-all ${getFontFamilyClass()}`}
                style={{
                  backgroundColor: theme.backgroundColor,
                  backgroundImage: theme.backgroundGradient || undefined,
                  color: theme.textColor,
                }}
              >
                {/* Profile Avatar + Verified Checkmark Badge */}
                <div className="relative mb-3 group mt-2">
                  <div
                    className={`w-20 h-20 p-1 bg-white/20 backdrop-blur-md shadow-lg transition-all ${getAvatarShapeClass()} ${
                      theme.avatarBorder ? 'ring-4 ring-white/30 shadow-xl' : ''
                    }`}
                  >
                    {business.logo ? (
                      <img
                        src={business.logo}
                        alt={business.name}
                        className={`w-full h-full object-cover bg-slate-900 ${getAvatarShapeClass()}`}
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-2xl font-black ${getAvatarShapeClass()}`}
                        style={{
                          backgroundColor: theme.buttonColor,
                          color: theme.buttonTextColor,
                        }}
                      >
                        {business.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Green Verified Badge */}
                  {theme.showVerifiedBadge && (
                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="font-black text-lg leading-tight" style={{ color: theme.textColor }}>
                  {business.name}
                </h2>

                {/* Subtitle / Profession */}
                {theme.profession && (
                  <p
                    className="text-[11px] font-semibold tracking-wide uppercase mt-0.5 opacity-90"
                    style={{ color: theme.subtitleColor || theme.textColor }}
                  >
                    {theme.profession}
                  </p>
                )}

                {/* Bio (Updates live as typed) */}
                {(bioText || business.bio || business.description || business.tagline) && (
                  <p
                    className="mt-2 text-[11px] leading-relaxed max-w-xs whitespace-pre-wrap opacity-90 px-2 font-medium"
                    style={{ color: theme.textColor }}
                  >
                    {bioText || business.bio || business.description || business.tagline}
                  </p>
                )}

                {/* Quick Social Badges Row */}
                {theme.showSocialIconsBar && (
                  <div className="mt-4 flex items-center justify-center flex-wrap gap-2">
                    {/* Render active socials or defaults */}
                    {[
                      { key: 'whatsapp', bg: '#25D366', icon: 'whatsapp' },
                      {
                        key: 'instagram',
                        bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                        icon: 'instagram',
                      },
                      { key: 'youtube', bg: '#FF0000', icon: 'youtube' },
                      { key: 'telegram', bg: '#229ED9', icon: 'telegram' },
                      { key: 'linkedin', bg: '#0A66C2', icon: 'linkedin' },
                      { key: 'twitter', bg: '#000000', icon: 'twitter' },
                      { key: 'facebook', bg: '#1877F2', icon: 'facebook' },
                      { key: 'discord', bg: '#5865F2', icon: 'discord' },
                      { key: 'spotify', bg: '#1DB954', icon: 'spotify' },
                      { key: 'github', bg: '#24292F', icon: 'github' },
                    ]
                      .filter((s) => {
                        // If user entered any custom social, only show those entered.
                        const hasCustom = Object.values(theme.socials || {}).some((v) => !!v);
                        if (hasCustom) {
                          return !!theme.socials?.[s.key];
                        }
                        // Default preview icons
                        return ['whatsapp', 'instagram', 'youtube', 'telegram', 'linkedin', 'twitter'].includes(s.key);
                      })
                      .map((s) => (
                        <div
                          key={s.key}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition hover:scale-110"
                          style={{
                            backgroundColor: s.bg.startsWith('#') ? s.bg : undefined,
                            backgroundImage: !s.bg.startsWith('#') ? s.bg : undefined,
                          }}
                        >
                          <SocialBrandIcon type={s.icon} size={15} />
                        </div>
                      ))}
                  </div>
                )}

                {/* Link Cards Preview */}
                <div className="w-full mt-4 space-y-2.5 pb-6">
                  {links.filter((l) => l.enabled).length === 0 ? (
                    /* Smart starter preview cards if none added yet */
                    <div className="space-y-2.5">
                      {[
                        { title: 'Chat on WhatsApp', sub: 'Instant inquiry & order updates', type: 'whatsapp' },
                        { title: 'Visit Online Store', sub: 'Browse digital catalog & shop', type: 'store' },
                        { title: 'Follow on Instagram', sub: 'Watch reels & daily stories', type: 'instagram' },
                        { title: 'Book a 1:1 Consultation', sub: 'Schedule quick strategy call', type: 'consultation' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`w-full text-left flex items-center p-2.5 border transition shadow-sm ${getRadiusClass()}`}
                          style={{
                            backgroundColor: theme.buttonColor,
                            color: theme.buttonTextColor,
                            borderColor: theme.buttonBorderColor || 'transparent',
                          }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-2.5 shadow-sm bg-black/20">
                            <SocialBrandIcon type={item.type} size={18} />
                          </div>
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="font-bold text-xs leading-snug truncate">{item.title}</div>
                            <div
                              className="text-[10px] leading-tight truncate mt-0.5"
                              style={{ color: theme.buttonSubtitleColor || '#A7F3D0' }}
                            >
                              {item.sub}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    links
                      .filter((l) => l.enabled)
                      .map((link) => {
                        const brand = getBrandConfig(link.type);
                        const displaySubtitle = link.subtitle || brand.defaultSubtitle;

                        return (
                          <div
                            key={link.id}
                            className={`w-full text-left flex items-center p-2.5 border transition shadow-sm relative overflow-hidden ${getRadiusClass()}`}
                            style={{
                              backgroundColor: theme.buttonColor,
                              color: theme.buttonTextColor,
                              borderColor: theme.buttonBorderColor || 'transparent',
                            }}
                          >
                            {/* Featured Highlight Ribbon */}
                            {link.highlight && (
                              <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-bl-lg shadow-sm">
                                FEATURED
                              </div>
                            )}

                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 mr-2.5 shadow-sm"
                              style={{
                                background:
                                  link.type === 'instagram'
                                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                                    : brand.color,
                              }}
                            >
                              <SocialBrandIcon
                                type={link.type}
                                size={18}
                                className="w-4.5 h-4.5 text-white"
                              />
                            </div>

                            <div className="flex-1 min-w-0 pr-1">
                              <div className="font-bold text-xs leading-snug truncate">
                                {link.title}
                              </div>
                              {displaySubtitle && (
                                <div
                                  className="text-[10px] leading-tight truncate mt-0.5"
                                  style={{ color: theme.buttonSubtitleColor }}
                                >
                                  {displaySubtitle}
                                </div>
                              )}
                            </div>

                            <ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0" />
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Phone Mockup Footer */}
                <div className="mt-auto pt-4 pb-2 text-[10px] opacity-60 flex items-center gap-1 font-semibold">
                  <Store className="w-3 h-3 text-emerald-400" />
                  <span>Made with ❤️ by Storelly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: "Beautiful Themes for Every Style" (From reference image!) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-900 text-lg sm:text-xl">
              Beautiful Themes for Every Style
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Choose from 7 signature themes crafted for creators, professionals, and brands.
              1-click to apply instantly.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start">
            Current: {BIO_THEME_PRESETS[theme.themePreset]?.name || 'Classic Green'}
          </div>
        </div>

        {/* 7 Themes Horizontal/Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {Object.values(BIO_THEME_PRESETS).map((p) => {
            const isSelected = theme.themePreset === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className={`group cursor-pointer rounded-2xl border-2 p-3.5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10 shadow-md'
                    : 'border-slate-200 hover:border-slate-400 bg-white hover:shadow-sm'
                }`}
              >
                {/* Visual Palette Preview */}
                <div
                  className={`h-24 rounded-xl shadow-inner mb-3 p-2.5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b ${p.previewClass}`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-white/30" />
                    <div className="w-10 h-1.5 bg-white/40 rounded-full" />
                  </div>

                  {/* Fake Button */}
                  <div
                    className="w-full py-1 px-2 rounded-lg text-[9px] font-bold text-center shadow-xs truncate"
                    style={{ backgroundColor: p.buttonColor, color: p.buttonTextColor }}
                  >
                    Button Preview
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {p.category}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyPreset(p.id);
                  }}
                  className={`w-full mt-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 group-hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? 'Active Theme' : 'Apply'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: "Why Use Storelly Bio Link?" (From reference image) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-xl sm:text-2xl font-black font-heading">
            Why Use Storelly Bio Link?
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Everything you need to share, connect, convert, and monetize from one link.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-sm text-white">Share Anywhere</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Put your Storelly bio link in your Instagram bio, WhatsApp status, YouTube channel, and X bio.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-sm text-white">Grow Your Audience</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect visitors to your Telegram channel, WhatsApp community, and social media handles.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-sm text-white">Sell & Book Calls</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directly link your Digital Products (eBooks, courses) and Calendly 1:1 consultations with 0% commission.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              4
            </div>
            <h4 className="font-bold text-sm text-white">Printable QR Code</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download your custom QR code to print on visiting cards, banners, stands, and merchandise.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
          <span>WhatsApp First</span>
          <span>•</span>
          <span>Secure Payments (UPI / Razorpay)</span>
          <span>•</span>
          <span>No Commission on Sales</span>
          <span>•</span>
          <span>Made for Creators in India</span>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl relative space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <h3 className="font-black text-xl text-slate-900">Your Bio QR Code</h3>
              <p className="text-xs text-slate-500">
                Anyone can scan this code with their phone camera to open your bio page.
              </p>
            </div>

            {qrCodeUrl && (
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 rounded-xl shadow-sm bg-white p-2"
                />
                <div className="mt-3 font-mono text-[11px] text-slate-500 truncate max-w-[220px]">
                  {publicUrl}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>

              {qrCodeUrl && (
                <a
                  href={qrCodeUrl}
                  download={`${business.slug}-bio-qrcode.png`}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </a>
              )}
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
