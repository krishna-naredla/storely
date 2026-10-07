import React from 'react';

export interface BrandConfig {
  id: string;
  name: string;
  color: string;
  bgGradient?: string;
  textColor: string;
  defaultTitle: string;
  defaultSubtitle: string;
  placeholderUrl: string;
  iconBg: string;
}

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    textColor: '#FFFFFF',
    defaultTitle: 'Chat on WhatsApp',
    defaultSubtitle: 'Quickly connect with me',
    placeholderUrl: 'https://wa.me/91XXXXXXXXXX',
    iconBg: '#25D366',
  },
  whatsapp_community: {
    id: 'whatsapp_community',
    name: 'WhatsApp Group / Community',
    color: '#128C7E',
    textColor: '#FFFFFF',
    defaultTitle: 'Join WhatsApp Group',
    defaultSubtitle: 'Get daily updates & tips',
    placeholderUrl: 'https://chat.whatsapp.com/...',
    iconBg: '#128C7E',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    bgGradient: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
    textColor: '#FFFFFF',
    defaultTitle: 'Follow on Instagram',
    defaultSubtitle: 'Check my reels, posts & stories',
    placeholderUrl: 'https://instagram.com/username',
    iconBg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    textColor: '#FFFFFF',
    defaultTitle: 'YouTube Channel',
    defaultSubtitle: 'Subscribe & watch my videos',
    placeholderUrl: 'https://youtube.com/@channel',
    iconBg: '#FF0000',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    color: '#229ED9',
    textColor: '#FFFFFF',
    defaultTitle: 'Telegram Channel',
    defaultSubtitle: 'Join my Telegram community',
    placeholderUrl: 'https://t.me/username',
    iconBg: '#229ED9',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    textColor: '#FFFFFF',
    defaultTitle: 'Connect on LinkedIn',
    defaultSubtitle: 'My professional career & network',
    placeholderUrl: 'https://linkedin.com/in/username',
    iconBg: '#0A66C2',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    textColor: '#FFFFFF',
    defaultTitle: 'Follow on X',
    defaultSubtitle: 'Thoughts, insights & live threads',
    placeholderUrl: 'https://x.com/username',
    iconBg: '#000000',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    textColor: '#FFFFFF',
    defaultTitle: 'Facebook Page',
    defaultSubtitle: 'Like & follow my page',
    placeholderUrl: 'https://facebook.com/page',
    iconBg: '#1877F2',
  },
  website: {
    id: 'website',
    name: 'Website',
    color: '#0284C7',
    textColor: '#FFFFFF',
    defaultTitle: 'Visit My Website',
    defaultSubtitle: 'Check my portfolio & services',
    placeholderUrl: 'https://yourwebsite.com',
    iconBg: '#0284C7',
  },
  digital_store: {
    id: 'digital_store',
    name: 'Digital Products',
    color: '#0D9488',
    textColor: '#FFFFFF',
    defaultTitle: 'My Digital Products',
    defaultSubtitle: 'Notes, eBooks, Templates & more',
    placeholderUrl: 'https://...',
    iconBg: '#0D9488',
  },
  consultation: {
    id: 'consultation',
    name: '1:1 Consultation',
    color: '#D97706',
    textColor: '#FFFFFF',
    defaultTitle: 'Book a 1:1 Consultation',
    defaultSubtitle: 'Pick a slot that works for you',
    placeholderUrl: 'https://calendly.com/...',
    iconBg: '#D97706',
  },
  google_form: {
    id: 'google_form',
    name: 'Google Form',
    color: '#7248B9',
    textColor: '#FFFFFF',
    defaultTitle: 'Google Form',
    defaultSubtitle: 'Fill this form',
    placeholderUrl: 'https://forms.gle/...',
    iconBg: '#7248B9',
  },
  google_sheet: {
    id: 'google_sheet',
    name: 'Google Sheet',
    color: '#0F9D58',
    textColor: '#FFFFFF',
    defaultTitle: 'Google Sheets',
    defaultSubtitle: 'Open resources & spreadsheet',
    placeholderUrl: 'https://docs.google.com/spreadsheets/...',
    iconBg: '#0F9D58',
  },
  google_doc: {
    id: 'google_doc',
    name: 'Google Doc',
    color: '#4285F4',
    textColor: '#FFFFFF',
    defaultTitle: 'Google Docs',
    defaultSubtitle: 'Read shared document',
    placeholderUrl: 'https://docs.google.com/document/...',
    iconBg: '#4285F4',
  },
  email: {
    id: 'email',
    name: 'Email Me',
    color: '#EA4335',
    textColor: '#FFFFFF',
    defaultTitle: 'Email Me',
    defaultSubtitle: "Let's work together",
    placeholderUrl: 'mailto:you@example.com',
    iconBg: '#EA4335',
  },
  phone: {
    id: 'phone',
    name: 'Phone Call',
    color: '#16A34A',
    textColor: '#FFFFFF',
    defaultTitle: 'Call Me Directly',
    defaultSubtitle: 'Quick voice consultation',
    placeholderUrl: 'tel:+91XXXXXXXXXX',
    iconBg: '#16A34A',
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    color: '#6366F1',
    textColor: '#FFFFFF',
    defaultTitle: 'View My Portfolio',
    defaultSubtitle: 'Explore selected projects & case studies',
    placeholderUrl: 'https://...',
    iconBg: '#6366F1',
  },
  custom: {
    id: 'custom',
    name: 'Custom Link',
    color: '#8B5CF6',
    textColor: '#FFFFFF',
    defaultTitle: 'My Special Link',
    defaultSubtitle: 'Tap here to learn more',
    placeholderUrl: 'https://...',
    iconBg: '#8B5CF6',
  },
};

export const getBrandConfig = (type: string): BrandConfig => {
  return (
    BRAND_CONFIGS[type] || {
      id: type || 'custom',
      name: 'Link',
      color: '#0F172A',
      textColor: '#FFFFFF',
      defaultTitle: 'Open Link',
      defaultSubtitle: 'Click to open destination',
      placeholderUrl: 'https://...',
      iconBg: '#0F172A',
    }
  );
};

interface IconProps {
  type: string;
  className?: string;
  size?: number;
  mode?: 'raw' | 'badge'; // raw: just SVG with default color, badge: filled rounded circle/squircle
}

export const SocialBrandIcon: React.FC<IconProps> = ({
  type,
  className = 'w-5 h-5',
  size = 20,
  mode = 'raw',
}) => {
  const brand = getBrandConfig(type);

  const renderSvg = () => {
    switch (type) {
      case 'whatsapp':
      case 'whatsapp_community':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        );

      case 'instagram':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );

      case 'youtube':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );

      case 'telegram':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.941z" />
          </svg>
        );

      case 'linkedin':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        );

      case 'twitter':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );

      case 'facebook':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );

      case 'google_form':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 12h6" />
            <path d="M9 16h6" />
          </svg>
        );

      case 'google_sheet':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
          </svg>
        );

      case 'google_doc':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        );

      case 'website':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );

      case 'digital_store':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        );

      case 'consultation':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
          </svg>
        );

      case 'email':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        );

      case 'phone':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        );

      case 'portfolio':
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );

      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        );
    }
  };

  if (mode === 'badge') {
    const isInstagram = type === 'instagram';
    return (
      <div
        className="flex items-center justify-center rounded-full text-white shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{
          width: size * 2,
          height: size * 2,
          background: isInstagram ? brand.iconBg : brand.color,
        }}
      >
        {renderSvg()}
      </div>
    );
  }

  return renderSvg();
};

export interface BioThemePreset {
  id: string;
  name: string;
  category: 'Creator' | 'Tech & Dev' | 'Fashion & Luxury' | 'Fitness & Health' | 'Food & Cafe' | 'Business & Agency' | 'Vibrant & Pop';
  description: string;
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  subtitleColor: string;
  buttonStyle: 'rounded' | 'pill' | 'square' | 'glass' | 'brutalist' | 'neon' | 'floating';
  buttonColor: string;
  buttonTextColor: string;
  buttonSubtitleColor: string;
  buttonBorderColor: string;
  buttonHoverEffect?: 'lift' | 'scale' | 'glow' | 'shimmer';
  fontFamily?: 'modern' | 'serif' | 'mono' | 'rounded' | 'display';
  avatarShape?: 'circle' | 'squircle' | 'rounded' | 'hexagon';
  badgeBg: string;
  previewClass: string;
  previewGradient?: string;
  accentColor?: string;
}

export const BIO_THEME_PRESETS: Record<string, BioThemePreset> = {
  // --- SIGNATURE & CREATOR ---
  classic_green: {
    id: 'classic_green',
    name: 'Emerald Forest',
    category: 'Creator',
    description: 'Deep emerald forest aesthetic with crisp clean cards and verified badges',
    backgroundColor: '#064E3B',
    backgroundGradient: 'linear-gradient(180deg, #064E3B 0%, #022C22 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#A7F3D0',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#64748B',
    buttonBorderColor: 'rgba(255, 255, 255, 0.1)',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'circle',
    badgeBg: '#10B981',
    accentColor: '#10B981',
    previewClass: 'from-emerald-800 to-emerald-950',
    previewGradient: 'linear-gradient(135deg, #065F46, #022C22)',
  },
  aurora_creator: {
    id: 'aurora_creator',
    name: 'Cosmic Aurora',
    category: 'Creator',
    description: 'Breathtaking holographic teal and violet aurora mesh with frosted glass cards',
    backgroundColor: '#0F172A',
    backgroundGradient: 'radial-gradient(ellipse at 80% 0%, #06b6d4 0%, #3b82f6 30%, #7c3aed 70%, #090d16 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#C4B5FD',
    buttonStyle: 'glass',
    buttonColor: 'rgba(255, 255, 255, 0.12)',
    buttonTextColor: '#FFFFFF',
    buttonSubtitleColor: '#E2E8F0',
    buttonBorderColor: 'rgba(255, 255, 255, 0.25)',
    buttonHoverEffect: 'glow',
    fontFamily: 'rounded',
    avatarShape: 'squircle',
    badgeBg: '#8B5CF6',
    accentColor: '#06B6D4',
    previewClass: 'from-cyan-500 via-indigo-600 to-slate-950',
    previewGradient: 'linear-gradient(135deg, #06B6D4, #7C3AED, #090D16)',
  },
  sunset_glow: {
    id: 'sunset_glow',
    name: 'Golden Sunset',
    category: 'Creator',
    description: 'Radiant California golden hour gradient with amber glow highlights',
    backgroundColor: '#431407',
    backgroundGradient: 'linear-gradient(180deg, #EA580C 0%, #C2410C 45%, #380E04 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#FED7AA',
    buttonStyle: 'pill',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#78716C',
    buttonBorderColor: 'rgba(254, 215, 170, 0.3)',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'circle',
    badgeBg: '#F97316',
    accentColor: '#F97316',
    previewClass: 'from-orange-500 via-orange-700 to-amber-950',
    previewGradient: 'linear-gradient(135deg, #EA580C, #C2410C, #431407)',
  },
  royal_purple: {
    id: 'royal_purple',
    name: 'Royal Velvet',
    category: 'Creator',
    description: 'Regal violet and indigo gradient for digital creators, artists & mentors',
    backgroundColor: '#2E1065',
    backgroundGradient: 'linear-gradient(180deg, #6B21A8 0%, #3B0764 60%, #0F172A 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#E9D5FF',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#64748B',
    buttonBorderColor: 'rgba(233, 213, 255, 0.2)',
    buttonHoverEffect: 'scale',
    fontFamily: 'modern',
    avatarShape: 'squircle',
    badgeBg: '#A855F7',
    accentColor: '#C084FC',
    previewClass: 'from-purple-800 via-indigo-950 to-slate-950',
    previewGradient: 'linear-gradient(135deg, #7E22CE, #3B0764, #0F172A)',
  },
  gradient_pink: {
    id: 'gradient_pink',
    name: 'Fuchsia Horizon',
    category: 'Vibrant & Pop',
    description: 'Vibrant fuchsia to hot pink gradient with energetic high-sparkle styling',
    backgroundColor: '#500724',
    backgroundGradient: 'linear-gradient(180deg, #E11D48 0%, #9D174D 50%, #4C0519 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#FECDD3',
    buttonStyle: 'pill',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#701A75',
    buttonBorderColor: 'rgba(254, 205, 211, 0.3)',
    buttonHoverEffect: 'glow',
    fontFamily: 'rounded',
    avatarShape: 'circle',
    badgeBg: '#FB7185',
    accentColor: '#F43F5E',
    previewClass: 'from-pink-600 via-rose-800 to-purple-950',
    previewGradient: 'linear-gradient(135deg, #E11D48, #9D174D, #4C0519)',
  },

  // --- TECH, DEVELOPER & GAMING ---
  cyberpunk_neon: {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    category: 'Tech & Dev',
    description: 'Electric cyan and neon magenta accents over deep obsidian glass',
    backgroundColor: '#05070E',
    backgroundGradient: 'linear-gradient(180deg, #0A0F1D 0%, #05070E 100%)',
    textColor: '#00F0FF',
    subtitleColor: '#FF007F',
    buttonStyle: 'neon',
    buttonColor: 'rgba(10, 15, 29, 0.9)',
    buttonTextColor: '#FFFFFF',
    buttonSubtitleColor: '#94A3B8',
    buttonBorderColor: '#00F0FF',
    buttonHoverEffect: 'glow',
    fontFamily: 'mono',
    avatarShape: 'hexagon',
    badgeBg: '#00F0FF',
    accentColor: '#00F0FF',
    previewClass: 'from-cyan-900 via-slate-950 to-black',
    previewGradient: 'linear-gradient(135deg, #00F0FF, #FF007F, #05070E)',
  },
  matrix_phosphor: {
    id: 'matrix_phosphor',
    name: 'Hacker Matrix',
    category: 'Tech & Dev',
    description: 'Jet black terminal canvas with glowing lime phosphor and code fonts',
    backgroundColor: '#020B05',
    backgroundGradient: 'linear-gradient(180deg, #041F0C 0%, #010803 100%)',
    textColor: '#22C55E',
    subtitleColor: '#86EFAC',
    buttonStyle: 'square',
    buttonColor: '#051E0E',
    buttonTextColor: '#4ADE80',
    buttonSubtitleColor: '#86EFAC',
    buttonBorderColor: '#22C55E',
    buttonHoverEffect: 'shimmer',
    fontFamily: 'mono',
    avatarShape: 'squircle',
    badgeBg: '#22C55E',
    accentColor: '#22C55E',
    previewClass: 'from-emerald-950 to-black text-emerald-400',
    previewGradient: 'linear-gradient(135deg, #052E16, #020B05)',
  },
  glassmorphism_frost: {
    id: 'glassmorphism_frost',
    name: 'Frosted Glass',
    category: 'Tech & Dev',
    description: 'Multi-layer Apple-grade frosted glass with soft iridescent backdrop blur',
    backgroundColor: '#0F172A',
    backgroundGradient: 'radial-gradient(circle at top left, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
    textColor: '#F8FAFC',
    subtitleColor: '#94A3B8',
    buttonStyle: 'glass',
    buttonColor: 'rgba(255, 255, 255, 0.08)',
    buttonTextColor: '#FFFFFF',
    buttonSubtitleColor: '#94A3B8',
    buttonBorderColor: 'rgba(255, 255, 255, 0.18)',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'circle',
    badgeBg: '#38BDF8',
    accentColor: '#38BDF8',
    previewClass: 'from-indigo-950 via-slate-900 to-slate-950',
    previewGradient: 'linear-gradient(135deg, #312E81, #0F172A, #020617)',
  },
  dark_mode: {
    id: 'dark_mode',
    name: 'Obsidian Stealth',
    category: 'Tech & Dev',
    description: 'Pure stealth matte obsidian background with sleek dark slate cards',
    backgroundColor: '#090D16',
    backgroundGradient: 'linear-gradient(180deg, #111827 0%, #090D16 100%)',
    textColor: '#F8FAFC',
    subtitleColor: '#94A3B8',
    buttonStyle: 'rounded',
    buttonColor: '#1F2937',
    buttonTextColor: '#F8FAFC',
    buttonSubtitleColor: '#9CA3AF',
    buttonBorderColor: '#374151',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'squircle',
    badgeBg: '#10B981',
    accentColor: '#60A5FA',
    previewClass: 'from-slate-900 to-slate-950',
    previewGradient: 'linear-gradient(135deg, #1F2937, #090D16)',
  },

  // --- FASHION, LUXURY & BEAUTY ---
  luxury_gold: {
    id: 'luxury_gold',
    name: 'Midnight Gold',
    category: 'Fashion & Luxury',
    description: 'Black velvet canvas with champagne gold metallic accents and serif typography',
    backgroundColor: '#0A0A0A',
    backgroundGradient: 'linear-gradient(180deg, #17140B 0%, #0A0A0A 100%)',
    textColor: '#F5E6C8',
    subtitleColor: '#D4AF37',
    buttonStyle: 'rounded',
    buttonColor: '#1A1813',
    buttonTextColor: '#FDE68A',
    buttonSubtitleColor: '#D4AF37',
    buttonBorderColor: '#D4AF37',
    buttonHoverEffect: 'glow',
    fontFamily: 'serif',
    avatarShape: 'circle',
    badgeBg: '#D4AF37',
    accentColor: '#D4AF37',
    previewClass: 'from-amber-950 via-stone-900 to-black',
    previewGradient: 'linear-gradient(135deg, #78350F, #D4AF37, #0A0A0A)',
  },
  rose_glamour: {
    id: 'rose_glamour',
    name: 'Rose Glamour',
    category: 'Fashion & Luxury',
    description: 'Haute couture blush pink, rose gold borders and delicate silk curves',
    backgroundColor: '#FFF1F2',
    backgroundGradient: 'linear-gradient(180deg, #FFE4E6 0%, #FFF1F2 100%)',
    textColor: '#881337',
    subtitleColor: '#BE123C',
    buttonStyle: 'pill',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#881337',
    buttonSubtitleColor: '#BE123C',
    buttonBorderColor: '#FDA4AF',
    buttonHoverEffect: 'lift',
    fontFamily: 'serif',
    avatarShape: 'circle',
    badgeBg: '#E11D48',
    accentColor: '#E11D48',
    previewClass: 'from-pink-100 via-rose-200 to-pink-300 text-rose-900',
    previewGradient: 'linear-gradient(135deg, #FECDD3, #FDA4AF, #FFF1F2)',
  },
  monochrome_editorial: {
    id: 'monochrome_editorial',
    name: 'Parisian Vogue',
    category: 'Fashion & Luxury',
    description: 'High-contrast Parisian magazine editorial with bold serif headlines and crisp white cards',
    backgroundColor: '#FFFFFF',
    backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
    textColor: '#000000',
    subtitleColor: '#525252',
    buttonStyle: 'square',
    buttonColor: '#000000',
    buttonTextColor: '#FFFFFF',
    buttonSubtitleColor: '#D4D4D4',
    buttonBorderColor: '#000000',
    buttonHoverEffect: 'lift',
    fontFamily: 'display',
    avatarShape: 'circle',
    badgeBg: '#000000',
    accentColor: '#000000',
    previewClass: 'from-white to-neutral-200 text-black',
    previewGradient: 'linear-gradient(135deg, #FFFFFF, #E5E5E5, #000000)',
  },
  nordic_ivory: {
    id: 'nordic_ivory',
    name: 'Nordic Minimal',
    category: 'Fashion & Luxury',
    description: 'Scandinavian minimalist warmth with bone ivory background and soft charcoal cards',
    backgroundColor: '#FAF9F6',
    backgroundGradient: 'linear-gradient(180deg, #FAF9F6 0%, #F3F1EC 100%)',
    textColor: '#27272A',
    subtitleColor: '#71717A',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#18181B',
    buttonSubtitleColor: '#71717A',
    buttonBorderColor: '#E4E4E7',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'squircle',
    badgeBg: '#18181B',
    accentColor: '#52525B',
    previewClass: 'from-stone-50 via-stone-100 to-stone-200 text-stone-900',
    previewGradient: 'linear-gradient(135deg, #FAF9F6, #E7E5E4)',
  },

  // --- FITNESS, ATHLETICS & HEALTH ---
  electric_lime: {
    id: 'electric_lime',
    name: 'Hyper Lime Energy',
    category: 'Fitness & Health',
    description: 'High-octane carbon graphite canvas with vivid electric lime pulse',
    backgroundColor: '#0F172A',
    backgroundGradient: 'linear-gradient(180deg, #1E293B 0%, #0B1120 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#A3E635',
    buttonStyle: 'rounded',
    buttonColor: '#1E293B',
    buttonTextColor: '#F8FAFC',
    buttonSubtitleColor: '#94A3B8',
    buttonBorderColor: '#84CC16',
    buttonHoverEffect: 'glow',
    fontFamily: 'modern',
    avatarShape: 'squircle',
    badgeBg: '#84CC16',
    accentColor: '#84CC16',
    previewClass: 'from-slate-800 via-slate-900 to-black text-lime-400',
    previewGradient: 'linear-gradient(135deg, #365314, #84CC16, #0F172A)',
  },
  ocean_athletic: {
    id: 'ocean_athletic',
    name: 'Athletic Power',
    category: 'Fitness & Health',
    description: 'Dynamic cobalt blue and ultra cyan gradient for athletes, trainers & sports brands',
    backgroundColor: '#0C4A6E',
    backgroundGradient: 'linear-gradient(180deg, #0284C7 0%, #0369A1 40%, #082F49 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#BAE6FD',
    buttonStyle: 'pill',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#082F49',
    buttonSubtitleColor: '#64748B',
    buttonBorderColor: 'rgba(186, 230, 253, 0.3)',
    buttonHoverEffect: 'scale',
    fontFamily: 'modern',
    avatarShape: 'circle',
    badgeBg: '#38BDF8',
    accentColor: '#38BDF8',
    previewClass: 'from-sky-600 via-blue-800 to-sky-950',
    previewGradient: 'linear-gradient(135deg, #0284C7, #0369A1, #082F49)',
  },
  zen_matcha: {
    id: 'zen_matcha',
    name: 'Mindful Matcha',
    category: 'Fitness & Health',
    description: 'Organic botanical sage, matcha and calming cream for wellness, yoga & nutrition',
    backgroundColor: '#F2F6F3',
    backgroundGradient: 'linear-gradient(180deg, #E8F0EA 0%, #F2F6F3 100%)',
    textColor: '#1B3B2B',
    subtitleColor: '#4C735B',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#1B3B2B',
    buttonSubtitleColor: '#5C8A6F',
    buttonBorderColor: '#D1E0D6',
    buttonHoverEffect: 'lift',
    fontFamily: 'rounded',
    avatarShape: 'circle',
    badgeBg: '#4C735B',
    accentColor: '#4C735B',
    previewClass: 'from-emerald-50 via-teal-100 to-emerald-200 text-emerald-950',
    previewGradient: 'linear-gradient(135deg, #D1E0D6, #E8F0EA, #4C735B)',
  },

  // --- FOOD, CAFE & HOSPITALITY ---
  espresso_cafe: {
    id: 'espresso_cafe',
    name: 'Artisan Cafe',
    category: 'Food & Cafe',
    description: 'Rich roasted mocha, warm caramel and velvety cream for cafes, bakeries & chefs',
    backgroundColor: '#2C1810',
    backgroundGradient: 'linear-gradient(180deg, #4A2818 0%, #2C1810 100%)',
    textColor: '#FFF7ED',
    subtitleColor: '#FED7AA',
    buttonStyle: 'rounded',
    buttonColor: '#FFFBF5',
    buttonTextColor: '#431407',
    buttonSubtitleColor: '#78350F',
    buttonBorderColor: 'rgba(254, 215, 170, 0.25)',
    buttonHoverEffect: 'lift',
    fontFamily: 'serif',
    avatarShape: 'squircle',
    badgeBg: '#D97706',
    accentColor: '#F59E0B',
    previewClass: 'from-amber-900 via-amber-950 to-stone-950',
    previewGradient: 'linear-gradient(135deg, #78350F, #4A2818, #2C1810)',
  },
  terracotta_dune: {
    id: 'terracotta_dune',
    name: 'Tuscan Terracotta',
    category: 'Food & Cafe',
    description: 'Warm Tuscan terracotta, burnt sienna and warm sand for restaurants & culinary creators',
    backgroundColor: '#FDF8F5',
    backgroundGradient: 'linear-gradient(180deg, #FBEFE8 0%, #FDF8F5 100%)',
    textColor: '#7C2D12',
    subtitleColor: '#C2410C',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#7C2D12',
    buttonSubtitleColor: '#9A3412',
    buttonBorderColor: '#FDBA74',
    buttonHoverEffect: 'lift',
    fontFamily: 'serif',
    avatarShape: 'circle',
    badgeBg: '#EA580C',
    accentColor: '#EA580C',
    previewClass: 'from-orange-100 via-amber-100 to-stone-200 text-orange-950',
    previewGradient: 'linear-gradient(135deg, #FBEFE8, #FED7AA, #C2410C)',
  },

  // --- BUSINESS, AGENCY & REAL ESTATE ---
  executive_sapphire: {
    id: 'executive_sapphire',
    name: 'Executive Sapphire',
    category: 'Business & Agency',
    description: 'Deep navy with crisp corporate sapphire accents and sharp professional cards',
    backgroundColor: '#0F172A',
    backgroundGradient: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#93C5FD',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#64748B',
    buttonBorderColor: 'rgba(147, 197, 253, 0.25)',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'squircle',
    badgeBg: '#2563EB',
    accentColor: '#3B82F6',
    previewClass: 'from-blue-900 via-slate-900 to-slate-950',
    previewGradient: 'linear-gradient(135deg, #1E3A8A, #1E40AF, #0F172A)',
  },
  emerald_prestige: {
    id: 'emerald_prestige',
    name: 'Prestige Gold',
    category: 'Business & Agency',
    description: 'British racing green with fine gold hairline borders for consultancies & executives',
    backgroundColor: '#052E16',
    backgroundGradient: 'linear-gradient(180deg, #064E3B 0%, #022C22 100%)',
    textColor: '#ECFDF5',
    subtitleColor: '#FDE68A',
    buttonStyle: 'rounded',
    buttonColor: '#0A3F26',
    buttonTextColor: '#FDE68A',
    buttonSubtitleColor: '#D1FAE5',
    buttonBorderColor: '#F59E0B',
    buttonHoverEffect: 'glow',
    fontFamily: 'serif',
    avatarShape: 'circle',
    badgeBg: '#F59E0B',
    accentColor: '#F59E0B',
    previewClass: 'from-emerald-900 via-emerald-950 to-black',
    previewGradient: 'linear-gradient(135deg, #064E3B, #F59E0B, #022C22)',
  },
  neo_brutalist: {
    id: 'neo_brutalist',
    name: 'Neo-Brutalist',
    category: 'Vibrant & Pop',
    description: 'High-contrast stark black 3D hard-drop shadows with energetic canary yellow',
    backgroundColor: '#FEF08A',
    backgroundGradient: 'linear-gradient(180deg, #FDE047 0%, #FEF08A 100%)',
    textColor: '#000000',
    subtitleColor: '#18181B',
    buttonStyle: 'brutalist',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#000000',
    buttonSubtitleColor: '#52525B',
    buttonBorderColor: '#000000',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'rounded',
    badgeBg: '#000000',
    accentColor: '#000000',
    previewClass: 'from-yellow-300 via-yellow-400 to-amber-400 text-black',
    previewGradient: 'linear-gradient(135deg, #FDE047, #FEF08A, #000000)',
  },
  minimal_white: {
    id: 'minimal_white',
    name: 'Minimal White',
    category: 'Business & Agency',
    description: 'Clean high-contrast ivory canvas with soft border cards',
    backgroundColor: '#F8FAFC',
    backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
    textColor: '#0F172A',
    subtitleColor: '#64748B',
    buttonStyle: 'rounded',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#64748B',
    buttonBorderColor: '#E2E8F0',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'circle',
    badgeBg: '#10B981',
    accentColor: '#10B981',
    previewClass: 'from-slate-50 to-slate-100 text-slate-900',
    previewGradient: 'linear-gradient(135deg, #FFFFFF, #F1F5F9)',
  },
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    category: 'Creator',
    description: 'Deep marine navy gradient with glowing blue and white accents',
    backgroundColor: '#0F172A',
    backgroundGradient: 'linear-gradient(180deg, #0369A1 0%, #0C4A6E 40%, #0F172A 100%)',
    textColor: '#FFFFFF',
    subtitleColor: '#BAE6FD',
    buttonStyle: 'rounded',
    buttonColor: 'rgba(255, 255, 255, 0.95)',
    buttonTextColor: '#0F172A',
    buttonSubtitleColor: '#475569',
    buttonBorderColor: 'rgba(186, 230, 253, 0.25)',
    buttonHoverEffect: 'lift',
    fontFamily: 'modern',
    avatarShape: 'circle',
    badgeBg: '#0284C7',
    accentColor: '#0284C7',
    previewClass: 'from-sky-700 via-blue-900 to-slate-950',
    previewGradient: 'linear-gradient(135deg, #0369A1, #0C4A6E, #0F172A)',
  },
};
