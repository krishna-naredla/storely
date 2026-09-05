import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Type,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Briefcase,
  Layers,
  Save,
  Check,
  Globe,
  Share2,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
  Eye,
  Camera,
  PenTool,
  Code2,
  Youtube,
  Feather,
  HeartHandshake,
  Brush,
  PartyPopper,
  Smile,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Award,
  Star,
  Download,
} from 'lucide-react';
import {
  BusinessProfile,
  PortfolioSettings,
  PortfolioProfession,
  PortfolioThemeColor,
  PortfolioFontStyle,
  PortfolioLayoutMode,
  PortfolioCardStyle,
  PortfolioThemeConfig,
  PortfolioSocialLinks,
  PortfolioServicePackage,
} from '../../types';
import { PORTFOLIO_PRESETS, PortfolioPreset } from '../../data/portfolioPresets';
import { updatePortfolioSettings } from '../../services/firebaseService';
import {
  PORTFOLIO_THEME_PALETTES,
  PORTFOLIO_FONT_OPTIONS,
  PORTFOLIO_CARD_STYLES,
  BORDER_RADIUS_OPTIONS,
  getEffectivePortfolioTheme,
  getCardStyleClasses,
  getFontFamilyClass,
  getBorderRadiusClass,
} from '../../utils/portfolioTheme';

interface PortfolioAppearanceTabProps {
  business: BusinessProfile;
  onBusinessUpdated?: (updatedBusiness: BusinessProfile) => void;
}

const PROFESSION_LIST: { id: PortfolioProfession; name: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: 'photographer', name: 'Photographer', icon: Camera, desc: 'Weddings, candid shoots, portraits & drone' },
  { id: 'designer', name: 'Designer', icon: PenTool, desc: 'Logo design, branding, UI/UX & social media' },
  { id: 'developer', name: 'Developer', icon: Code2, desc: 'Web apps, SaaS, APIs, code & tech stack' },
  { id: 'youtuber', name: 'YouTuber / Influencer', icon: Youtube, desc: 'Videos, vlogs, media kit & brand collabs' },
  { id: 'writer', name: 'Writer', icon: Feather, desc: 'Articles, blogs, copywriting & newsletters' },
  { id: 'coach', name: 'Coach / Mentor', icon: HeartHandshake, desc: '1:1 coaching, mindset, programs & growth' },
  { id: 'artist', name: 'Artist', icon: Brush, desc: 'Canvas paintings, digital art & commissions' },
  { id: 'event_planner', name: 'Event Planner', icon: PartyPopper, desc: 'Weddings, corporate summits & birthdays' },
  { id: 'beauty', name: 'Beauty Professional', icon: Smile, desc: 'HD bridal makeup, party glam & makeovers' },
  { id: 'custom', name: 'Custom / Freelancer', icon: Sparkles, desc: 'Flexible portfolio layout for any creator' },
];

export const PortfolioAppearanceTab: React.FC<PortfolioAppearanceTabProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const settings = business.portfolioSettings || { ctaMode: 'whatsapp' };
  const initialTheme = getEffectivePortfolioTheme(business);

  const [selectedProfession, setSelectedProfession] = useState<PortfolioProfession>(
    settings.profession || 'custom'
  );
  const [professionTitle, setProfessionTitle] = useState(
    settings.professionTitle || PORTFOLIO_PRESETS[selectedProfession]?.professionTitle || ''
  );
  const [specializations, setSpecializations] = useState<string[]>(
    settings.specializations || PORTFOLIO_PRESETS[selectedProfession]?.specializations || []
  );
  const [specInput, setSpecInput] = useState('');
  const [slogan, setSlogan] = useState(
    settings.slogan || PORTFOLIO_PRESETS[selectedProfession]?.slogan || ''
  );
  const [location, setLocation] = useState(
    settings.location || PORTFOLIO_PRESETS[selectedProfession]?.location || ''
  );
  const [aboutStory, setAboutStory] = useState(
    settings.aboutStory || PORTFOLIO_PRESETS[selectedProfession]?.aboutStory || business.description || ''
  );
  const [experienceYears, setExperienceYears] = useState(
    settings.experienceYears || PORTFOLIO_PRESETS[selectedProfession]?.experienceYears || '5+ Years'
  );

  // 3 CTA Action Buttons
  const [primaryCtaText, setPrimaryCtaText] = useState(
    settings.primaryCtaText || PORTFOLIO_PRESETS[selectedProfession]?.primaryCtaText || 'WhatsApp'
  );
  const [primaryCtaAction, setPrimaryCtaAction] = useState<'whatsapp' | 'booking' | 'url'>(
    settings.primaryCtaAction || 'whatsapp'
  );
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState(settings.primaryCtaUrl || '');

  const [secondaryCtaText, setSecondaryCtaText] = useState(
    settings.secondaryCtaText || PORTFOLIO_PRESETS[selectedProfession]?.secondaryCtaText || 'Hire Me'
  );
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState(settings.secondaryCtaUrl || '');

  const [tertiaryCtaText, setTertiaryCtaText] = useState(
    settings.tertiaryCtaText || PORTFOLIO_PRESETS[selectedProfession]?.tertiaryCtaText || 'View Packages'
  );
  const [tertiaryCtaUrl, setTertiaryCtaUrl] = useState(settings.tertiaryCtaUrl || '');

  // Theme & Styling
  const [themeColor, setThemeColor] = useState<PortfolioThemeColor>(
    settings.themeColor || 'default'
  );
  const [primaryColor, setPrimaryColor] = useState<string>(initialTheme.primaryColor || '#4f46e5');
  const [backgroundColor, setBackgroundColor] = useState<string>(initialTheme.backgroundColor || '#ffffff');
  const [fontStyle, setFontStyle] = useState<PortfolioFontStyle>(initialTheme.fontFamily || 'sans');
  const [cardStyle, setCardStyle] = useState<PortfolioCardStyle>(initialTheme.cardStyle || 'bordered');
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'>(
    initialTheme.borderRadius || 'xl'
  );
  const [layoutMode, setLayoutMode] = useState<PortfolioLayoutMode>(
    settings.layoutMode || 'grid'
  );

  // Navigation Tabs
  const [navTabs, setNavTabs] = useState<string[]>(
    settings.customNavTabs || PORTFOLIO_PRESETS[selectedProfession]?.navTabs || ['Portfolio', 'About', 'Services', 'Pricing', 'Reviews', 'Contact']
  );
  const [newTabInput, setNewTabInput] = useState('');

  // Categories
  const [categories, setCategories] = useState<string[]>(
    settings.customCategories && settings.customCategories.length > 0
      ? settings.customCategories
      : PORTFOLIO_PRESETS[selectedProfession]?.categories.filter((c) => c !== 'All') || [
          'Branding',
          'Logo',
          'Social Media',
          'Print',
          'Web',
        ]
  );
  const [newCatInput, setNewCatInput] = useState('');

  // Services & Packages
  const [services, setServices] = useState<PortfolioServicePackage[]>(
    settings.services && settings.services.length > 0
      ? settings.services
      : PORTFOLIO_PRESETS[selectedProfession]?.suggestedServices || []
  );

  // Social Links
  const [socialLinks, setSocialLinks] = useState<PortfolioSocialLinks>(
    settings.socialLinks || {
      instagram: business.socials?.instagram || '',
      youtube: business.socials?.youtube || '',
      twitter: business.socials?.twitter || '',
      linkedin: business.socials?.linkedin || '',
      github: '',
      website: business.socials?.website || '',
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1-Click Apply Profession Preset
  const handleApplyPreset = (preset: PortfolioPreset) => {
    setSelectedProfession(preset.id);
    setProfessionTitle(preset.professionTitle);
    setSpecializations(preset.specializations);
    setSlogan(preset.slogan);
    setLocation(preset.location);
    setAboutStory(preset.aboutStory);
    setExperienceYears(preset.experienceYears);
    setPrimaryCtaText(preset.primaryCtaText);
    setSecondaryCtaText(preset.secondaryCtaText);
    setTertiaryCtaText(preset.tertiaryCtaText);
    setThemeColor(preset.themeColor);
    setPrimaryColor(preset.primaryColor);
    setBackgroundColor(preset.backgroundColor);
    setFontStyle(preset.fontStyle);
    setLayoutMode(preset.layoutMode);
    setNavTabs(preset.navTabs);
    setCategories(preset.categories.filter((c) => c !== 'All'));
    setServices(preset.suggestedServices);

    setToastMessage(`Applied ${preset.name} Template!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSpecialization = () => {
    const trimmed = specInput.trim();
    if (!trimmed) return;
    if (!specializations.includes(trimmed)) {
      setSpecializations([...specializations, trimmed]);
    }
    setSpecInput('');
  };

  const handleRemoveSpecialization = (item: string) => {
    setSpecializations(specializations.filter((s) => s !== item));
  };

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setNewCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleAddServicePackage = () => {
    const newPkg: PortfolioServicePackage = {
      id: `pkg_${Date.now()}`,
      title: 'New Service Package',
      price: '₹15,000',
      description: 'Describe what is included in this package and expected timeline.',
      duration: '5-7 Days',
      deliverables: ['Deliverable 1', 'Deliverable 2', 'Full Source Files'],
      popular: false,
    };
    setServices([...services, newPkg]);
  };

  const handleUpdateServicePackage = (id: string, field: keyof PortfolioServicePackage, value: any) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveServicePackage = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const themeConfig: PortfolioThemeConfig = {
        primaryColor,
        accentColor: primaryColor,
        backgroundColor,
        fontFamily: fontStyle,
        cardStyle,
        borderRadius,
        colorMode: themeColor === 'dark' ? 'dark' : 'light',
      };

      const updatedPortfolioSettings: PortfolioSettings = {
        ...settings,
        profession: selectedProfession,
        professionTitle,
        specializations,
        slogan,
        location,
        aboutStory,
        experienceYears,
        primaryCtaText,
        primaryCtaAction,
        primaryCtaUrl,
        secondaryCtaText,
        secondaryCtaUrl,
        tertiaryCtaText,
        tertiaryCtaUrl,
        themeColor,
        fontStyle,
        layoutMode,
        themeConfig,
        customNavTabs: navTabs,
        customCategories: categories,
        services,
        socialLinks,
      };

      await updatePortfolioSettings(business.id, updatedPortfolioSettings);

      if (onBusinessUpdated) {
        onBusinessUpdated({
          ...business,
          portfolioSettings: updatedPortfolioSettings,
          updatedAt: Date.now(),
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving portfolio settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
          <div>
            <div className="text-xs font-bold">{toastMessage}</div>
            <div className="text-[11px] text-slate-400">All styling, fields & services configured.</div>
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-heading">
            Portfolio Appearance & Layout Editor
          </h2>
          <p className="text-xs text-slate-500">
            Customize profession preset, 3 action buttons, navigation tabs, colors, and service packages.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href={`/portfolio/${business.slug || business.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Live URL</span>
          </a>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : showSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SECTION 1: 1-CLICK PROFESSION TEMPLATES (FROM POSTER) */}
      {/* ===================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Profession Presets</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 font-heading">
            Choose Your Profession Template
          </h3>
          <p className="text-xs text-slate-500">
            Click any profession to automatically apply the matching banner, headline, categories, services, and color scheme.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PROFESSION_LIST.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedProfession === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(PORTFOLIO_PRESETS[p.id])}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    {p.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================== */}
      {/* SECTION 2: IDENTITY & PROFILE DETAILS */}
      {/* ===================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-base">
          <PenTool className="w-4 h-4 text-indigo-600" />
          <span>Profile & Bio Identity</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Profession Title</label>
            <input
              type="text"
              value={professionTitle}
              onChange={(e) => setProfessionTitle(e.target.value)}
              placeholder="e.g. Graphic Designer / Photographer / Full Stack Developer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">One-Line Slogan / Motto (Italics on Poster)</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder='e.g. "Clean, Modern & Impactful Designs."'
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">
              Specializations Bullets (e.g. Logo Design • Branding • Social Media • Print)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
                placeholder="Add specialization tag (e.g. UI/UX Design)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSpecialization}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <span
                  key={spec}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
                >
                  <span>{spec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialization(spec)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Full Bio / Story Narrative (About Tab)</label>
            <textarea
              rows={4}
              value={aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              placeholder="Tell your story, years of experience, design philosophy, and client track record..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SECTION 3: 3 ACTION BUTTONS CONFIGURATION */}
      {/* ===================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-base">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>3 Action Buttons (Directly Below Profile Info)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Button 1 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Primary Button (WhatsApp / Subscribe)</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Button Label</label>
              <input
                type="text"
                value={primaryCtaText}
                onChange={(e) => setPrimaryCtaText(e.target.value)}
                placeholder="e.g. WhatsApp / Subscribe"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Action Type</label>
              <select
                value={primaryCtaAction}
                onChange={(e) => setPrimaryCtaAction(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
              >
                <option value="whatsapp">Direct WhatsApp Chat</option>
                <option value="booking">Book Consultation / Services</option>
                <option value="url">Custom External Link</option>
              </select>
            </div>
          </div>

          {/* Button 2 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Secondary Button (Hire Me / Book Shoot)</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Button Label</label>
              <input
                type="text"
                value={secondaryCtaText}
                onChange={(e) => setSecondaryCtaText(e.target.value)}
                placeholder="e.g. Hire Me / Book a Shoot"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Link (Optional)</label>
              <input
                type="text"
                value={secondaryCtaUrl}
                onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                placeholder="Leave blank to open Services tab"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Button 3 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Tertiary Button (Packages / Media Kit)</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Button Label</label>
              <input
                type="text"
                value={tertiaryCtaText}
                onChange={(e) => setTertiaryCtaText(e.target.value)}
                placeholder="e.g. View Packages / Media Kit"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Link (Optional)</label>
              <input
                type="text"
                value={tertiaryCtaUrl}
                onChange={(e) => setTertiaryCtaUrl(e.target.value)}
                placeholder="Leave blank to switch tab"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SECTION 4: THEME COLORS & STYLING */}
      {/* ===================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-base">
          <Palette className="w-4 h-4 text-indigo-600" />
          <span>Theme, Colors, Typography & Shapes</span>
        </div>

        {/* Theme Palette Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">Preset Palettes</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PORTFOLIO_THEME_PALETTES.map((pal) => {
              const isSelected = themeColor === pal.id;
              return (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => {
                    setThemeColor(pal.id);
                    setPrimaryColor(pal.primary);
                    setBackgroundColor(pal.bg);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-xl border border-black/10 shrink-0 shadow-xs"
                    style={{ backgroundColor: pal.primary }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{pal.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{pal.id}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Color & Background Color Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Brand Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Page Canvas Background Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Font Family & Card Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Typography Font</label>
            <select
              value={fontStyle}
              onChange={(e) => setFontStyle(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            >
              {PORTFOLIO_FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Card Container Style</label>
            <select
              value={cardStyle}
              onChange={(e) => setCardStyle(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            >
              {PORTFOLIO_CARD_STYLES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Corner Radius</label>
            <select
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            >
              {BORDER_RADIUS_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SECTION 5: SERVICES & PACKAGES BUILDER */}
      {/* ===================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-base">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Service Packages & Offerings (Services / Pricing Tab)</span>
          </div>

          <button
            type="button"
            onClick={handleAddServicePackage}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Package</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((pkg, idx) => (
            <div
              key={pkg.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative text-xs"
            >
              <button
                type="button"
                onClick={() => handleRemoveServicePackage(pkg.id)}
                className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                title="Remove Package"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Package Title</label>
                <input
                  type="text"
                  value={pkg.title}
                  onChange={(e) => handleUpdateServicePackage(pkg.id, 'title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Price</label>
                  <input
                    type="text"
                    value={pkg.price}
                    onChange={(e) => handleUpdateServicePackage(pkg.id, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration / Time</label>
                  <input
                    type="text"
                    value={pkg.duration || ''}
                    onChange={(e) => handleUpdateServicePackage(pkg.id, 'duration', e.target.value)}
                    placeholder="e.g. 7 Days"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={pkg.description}
                  onChange={(e) => handleUpdateServicePackage(pkg.id, 'description', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Deliverables (comma-separated)
                </label>
                <input
                  type="text"
                  value={pkg.deliverables?.join(', ') || ''}
                  onChange={(e) =>
                    handleUpdateServicePackage(
                      pkg.id,
                      'deliverables',
                      e.target.value.split(',').map((d) => d.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-medium"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-8 py-3.5 rounded-full bg-slate-950 text-white font-black text-xs sm:text-sm shadow-2xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer border border-white/20"
        >
          {isSaving ? (
            <span>Saving Settings...</span>
          ) : showSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Settings Saved Live!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish Portfolio Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
