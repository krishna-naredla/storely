import { BusinessProfile, PortfolioThemeConfig, PortfolioCardStyle, PortfolioFontStyle, PortfolioThemeColor, PortfolioTemplateId, PortfolioBlock } from '../types';

export interface PortfolioTemplateDefinition {
  id: PortfolioTemplateId;
  name: string;
  tagline: string;
  description: string;
  recommendedTheme: PortfolioThemeColor;
  recommendedCardStyle: PortfolioCardStyle;
  recommendedFont: PortfolioFontStyle;
  badge: string;
  iconName: string;
}

export const PORTFOLIO_LAYOUT_TEMPLATES: PortfolioTemplateDefinition[] = [
  {
    id: 'modern_showcase',
    name: 'Modern Showcase',
    tagline: 'High-Impact Creative Agency',
    description: 'Hero presentation banner, floating quick stats, filterable gallery, and streamlined WhatsApp booking triggers.',
    recommendedTheme: 'default',
    recommendedCardStyle: 'bordered',
    recommendedFont: 'sans',
    badge: 'Popular',
    iconName: 'Sparkles',
  },
  {
    id: 'minimalist_studio',
    name: 'Minimalist Studio',
    tagline: 'Art & Design Focused',
    description: 'Editorial whitespace, refined typography hierarchy, edge-to-edge photography showcase, and quiet luxury aesthetic.',
    recommendedTheme: 'minimal',
    recommendedCardStyle: 'minimal',
    recommendedFont: 'serif',
    badge: 'Aesthetic',
    iconName: 'Camera',
  },
  {
    id: 'dark_luxury',
    name: 'Dark Luxury / Cinematic',
    tagline: 'Obsidian & Neon Glow',
    description: 'Deep obsidian dark canvas, spotlight glow project cards, cinematic showreels, and verified brand partnerships.',
    recommendedTheme: 'dark',
    recommendedCardStyle: 'glassmorphism',
    recommendedFont: 'sans',
    badge: 'Cinematic',
    iconName: 'Film',
  },
  {
    id: 'bento_grid',
    name: 'Bento Grid',
    tagline: 'Apple / Linear Inspired',
    description: 'Dynamic asymmetric modular grid combining bio cards, live follower metrics, featured project widgets, and tech stack chips.',
    recommendedTheme: 'indigo',
    recommendedCardStyle: 'elevated',
    recommendedFont: 'display',
    badge: 'Trending',
    iconName: 'LayoutGrid',
  },
  {
    id: 'creative_masonry',
    name: 'Visual Masonry Feed',
    tagline: 'Behance & Pinterest Flow',
    description: 'Staggered visual card flow, interactive tag pills, detailed case study expandable overlays, and client testimonials.',
    recommendedTheme: 'rose',
    recommendedCardStyle: 'bordered',
    recommendedFont: 'sans',
    badge: 'Visual',
    iconName: 'Brush',
  },
  {
    id: 'executive_agency',
    name: 'Executive & Agency',
    tagline: 'High-Converting Consultant',
    description: 'Enterprise client trust logos, verified milestone numbers, structured service deliverables matrix, and custom quote builder.',
    recommendedTheme: 'emerald',
    recommendedCardStyle: 'bordered',
    recommendedFont: 'sans',
    badge: 'Conversion',
    iconName: 'Briefcase',
  },
];

export function getDefaultPortfolioBlocks(business?: BusinessProfile): PortfolioBlock[] {
  return [
    {
      id: 'block_hero',
      type: 'hero',
      title: 'Hero & Introduction',
      subtitle: 'Creator avatar, profession badge, headline, and primary call-to-actions',
      enabled: true,
      order: 1,
    },
    {
      id: 'block_works',
      type: 'works',
      title: 'Works & Case Studies Showcase',
      subtitle: 'Filterable gallery of verified client projects, showreels, and case studies',
      enabled: true,
      order: 2,
    },
    {
      id: 'block_about',
      type: 'about',
      title: 'About Story & Experience',
      subtitle: 'Narrative bio, years of industry experience, and milestones',
      enabled: true,
      order: 3,
    },
    {
      id: 'block_skills',
      type: 'skills',
      title: 'Specializations & Tech Stack',
      subtitle: 'Core competencies, software tools, and domain specializations',
      enabled: true,
      order: 4,
    },
    {
      id: 'block_services',
      type: 'services',
      title: 'Services & Pricing Packages',
      subtitle: 'Structured service tiers, deliverable checklists, and WhatsApp inquiry buttons',
      enabled: true,
      order: 5,
    },
    {
      id: 'block_testimonials',
      type: 'testimonials',
      title: 'Client Reviews & Social Proof',
      subtitle: 'Verified client feedback, star ratings, and company/role badges',
      enabled: true,
      order: 6,
    },
    {
      id: 'block_mediakit',
      type: 'mediakit',
      title: 'Media Kit & Collabs',
      subtitle: 'Social audience reach, platform follower counts, and sponsor logos',
      enabled: true,
      order: 7,
    },
    {
      id: 'block_contact',
      type: 'contact',
      title: 'Inquiry & Direct Booking',
      subtitle: 'Direct WhatsApp project inquiry form and contact channels',
      enabled: true,
      order: 8,
    },
  ];
}

export const DEFAULT_PORTFOLIO_THEME: PortfolioThemeConfig = {
  primaryColor: '#4f46e5', // Modern Indigo
  accentColor: '#06b6d4',
  backgroundColor: '#ffffff',
  fontFamily: 'sans',
  cardStyle: 'bordered',
  borderRadius: 'xl',
  colorMode: 'light',
};

export const PRESET_PRIMARY_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Slate', value: '#334155' },
  { name: 'Obsidian', value: '#0f172a' },
];

export const PORTFOLIO_THEME_PALETTES: Array<{
  id: PortfolioThemeColor;
  name: string;
  primary: string;
  bg: string;
}> = [
  { id: 'default', name: 'Creator Indigo', primary: '#4f46e5', bg: '#F8FAFC' },
  { id: 'minimal', name: 'Warm Ivory', primary: '#18181b', bg: '#F9F9F8' },
  { id: 'dark', name: 'Modern Dark', primary: '#38bdf8', bg: '#0b0f17' },
  { id: 'photo', name: 'Studio Pure', primary: '#0f172a', bg: '#ffffff' },
  { id: 'rose', name: 'Chic Rose', primary: '#e11d48', bg: '#FFF7F7' },
  { id: 'emerald', name: 'Growth Green', primary: '#059669', bg: '#F0FDF4' },
  { id: 'amber', name: 'Editorial Amber', primary: '#d97706', bg: '#FFFBEB' },
  { id: 'indigo', name: 'Vibrant Violet', primary: '#7c3aed', bg: '#F5F3FF' },
];

export const CARD_STYLE_OPTIONS: Array<{
  id: PortfolioCardStyle;
  label: string;
  description: string;
}> = [
  {
    id: 'bordered',
    label: 'Clean Bordered',
    description: 'Crisp 1px outline with delicate hover accents',
  },
  {
    id: 'elevated',
    label: 'Elevated Float',
    description: 'Layered soft shadows with subtle hover lift',
  },
  {
    id: 'minimal',
    label: 'Minimalist Flush',
    description: 'Border-free clean layout focusing purely on imagery',
  },
  {
    id: 'glassmorphism',
    label: 'Frosted Glass',
    description: 'Translucent frosted backdrop with subtle reflection',
  },
  {
    id: 'brutalist',
    label: 'Neo-Brutalist',
    description: 'Solid 2px dark border with hard offset retro block shadow',
  },
];

export const PORTFOLIO_CARD_STYLES = CARD_STYLE_OPTIONS;

export const FONT_STYLE_OPTIONS: Array<{
  id: PortfolioFontStyle;
  label: string;
  sample: string;
  fontClass: string;
}> = [
  { id: 'sans', label: 'Modern Sans', sample: 'Clean, contemporary, & geometric', fontClass: 'font-sans' },
  { id: 'serif', label: 'Editorial Serif', sample: 'Timeless, literary, & refined', fontClass: 'font-serif' },
  { id: 'mono', label: 'Tech Monospace', sample: 'build.deploy.innovate()', fontClass: 'font-mono' },
  { id: 'display', label: 'Bold Display', sample: 'IMPACT & CHARACTER', fontClass: 'font-heading font-black' },
];

export const PORTFOLIO_FONT_OPTIONS = FONT_STYLE_OPTIONS;

export const BORDER_RADIUS_OPTIONS = [
  { id: 'none', label: 'Sharp (0px)' },
  { id: 'sm', label: 'Small (8px)' },
  { id: 'md', label: 'Medium (12px)' },
  { id: 'lg', label: 'Large (16px)' },
  { id: 'xl', label: 'Extra Large (24px)' },
  { id: '2xl', label: 'Curved (32px)' },
  { id: 'full', label: 'Pill Rounded' },
];

/**
 * Resolves the effective PortfolioThemeConfig for a business,
 * with fallbacks to legacy fields if themeConfig is not fully populated.
 */
export function getEffectivePortfolioTheme(business: BusinessProfile): PortfolioThemeConfig {
  const settings = business.portfolioSettings;
  const tc = settings?.themeConfig;

  // Derive palette default background and primary color
  let paletteBg = '#ffffff';
  let palettePrimary = '#4f46e5';
  const themeColor = settings?.themeColor || 'default';

  switch (themeColor) {
    case 'dark':
      paletteBg = '#0b0f17';
      palettePrimary = '#38bdf8';
      break;
    case 'minimal':
      paletteBg = '#F9F9F8';
      palettePrimary = '#18181b';
      break;
    case 'rose':
      paletteBg = '#FFF7F7';
      palettePrimary = '#e11d48';
      break;
    case 'indigo':
      paletteBg = '#F5F3FF';
      palettePrimary = '#4f46e5';
      break;
    case 'emerald':
      paletteBg = '#F0FDF4';
      palettePrimary = '#059669';
      break;
    case 'amber':
      paletteBg = '#FFFBEB';
      palettePrimary = '#d97706';
      break;
    case 'photo':
      paletteBg = '#ffffff';
      palettePrimary = '#0f172a';
      break;
    case 'default':
    default:
      paletteBg = '#f8fafc';
      palettePrimary = '#4f46e5';
      break;
  }

  const primaryColor = tc?.primaryColor || business.themeColor || business.accentColor || palettePrimary;
  const fontFamily = tc?.fontFamily || settings?.fontStyle || DEFAULT_PORTFOLIO_THEME.fontFamily;
  const cardStyle = tc?.cardStyle || DEFAULT_PORTFOLIO_THEME.cardStyle;
  const borderRadius = tc?.borderRadius || DEFAULT_PORTFOLIO_THEME.borderRadius;
  const colorMode = tc?.colorMode || (themeColor === 'dark' ? 'dark' : 'light');
  const backgroundColor = tc?.backgroundColor || paletteBg;

  return {
    primaryColor,
    accentColor: tc?.accentColor || DEFAULT_PORTFOLIO_THEME.accentColor,
    backgroundColor,
    fontFamily,
    cardStyle,
    borderRadius,
    colorMode,
  };
}

/**
 * Returns Tailwind class names for the card style.
 */
export function getCardStyleClasses(cardStyle: PortfolioCardStyle, isDark = false): string {
  switch (cardStyle) {
    case 'minimal':
      return isDark
        ? 'bg-slate-900 border-0 shadow-xs hover:shadow-md transition-all duration-300'
        : 'bg-white border-0 shadow-xs hover:shadow-md transition-all duration-300';
    case 'elevated':
      return isDark
        ? 'bg-slate-900 border-0 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300'
        : 'bg-white border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300';
    case 'glassmorphism':
      return isDark
        ? 'bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-md hover:shadow-xl hover:bg-slate-900/95 transition-all duration-300'
        : 'bg-white/80 backdrop-blur-md border border-white/60 shadow-md hover:shadow-xl hover:bg-white/95 transition-all duration-300';
    case 'brutalist':
      return isDark
        ? 'bg-slate-900 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200'
        : 'bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200';
    case 'bordered':
    default:
      return isDark
        ? 'bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-300'
        : 'bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-300';
  }
}

/**
 * Returns Tailwind font family class
 */
export function getFontFamilyClass(fontFamily: PortfolioFontStyle): string {
  switch (fontFamily) {
    case 'serif':
      return 'font-serif';
    case 'mono':
      return 'font-mono';
    case 'display':
      return 'font-heading font-black';
    case 'sans':
    default:
      return 'font-sans';
  }
}

/**
 * Returns Tailwind border-radius class
 */
export function getBorderRadiusClass(radius?: string): string {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-lg';
    case 'md':
      return 'rounded-xl';
    case 'lg':
      return 'rounded-2xl';
    case '2xl':
      return 'rounded-3xl';
    case 'full':
      return 'rounded-full';
    case 'xl':
    default:
      return 'rounded-2xl sm:rounded-3xl';
  }
}
