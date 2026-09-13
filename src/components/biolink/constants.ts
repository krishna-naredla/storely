export interface BioThemeConfig {
  backgroundGradient: string;
  backgroundColor: string;
  textColor: string;
  subtitleColor: string;
  buttonStyle: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonSubtitleColor: string;
  buttonBorderColor: string;
  buttonHoverEffect: string;
  fontFamily: string;
  avatarShape: string;
  avatarBorder: boolean;
  showVerifiedBadge: boolean;
  profession: string;
  showSocialIconsBar: boolean;
}

export const DEFAULT_BIO_THEME: BioThemeConfig = {
  backgroundGradient: 'linear-gradient(180deg, #064E3B 0%, #022C22 100%)',
  backgroundColor: '#064E3B',
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
  avatarBorder: true,
  showVerifiedBadge: true,
  profession: 'Entrepreneur | Content Creator',
  showSocialIconsBar: true,
};
