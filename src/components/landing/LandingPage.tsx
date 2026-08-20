import React, { useEffect } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './sections/HeroSection';
import { TrustSection } from './sections/TrustSection';
import { ClientLogosSection } from './sections/ClientLogosSection';
import { AboutSection } from './sections/AboutSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { ZigzagGallerySection } from './sections/ZigzagGallerySection';
import { PricingSection } from './sections/PricingSection';
import { VendorGallerySection } from './sections/VendorGallerySection';
import { FAQSection } from './sections/FAQSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onExploreDemoStore: (slug: string) => void;
  onOpenMasterAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onOpenMasterAdmin }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f5] font-sans text-[#14201a] selection:bg-[#eaf6ee] selection:text-[#155330]">
      {/* 1. STICKY HEADER */}
      <LandingNavbar onOpenAuth={onOpenAuth} />
      
      <main>
        {/* 2. HERO + TRUST STRIP CARD */}
        <HeroSection onOpenAuth={onOpenAuth} />
        <TrustSection />

        {/* 3. CLIENT LOGOS MARQUEE TICKER (Trusted by Top-Performing Local Brands) */}
        <ClientLogosSection />

        {/* 4. ABOUT (3-column) */}
        <AboutSection />

        {/* 5. ZIGZAG FULL-VISIBILITY SHOWCASE OF ALL UPLOADED IMAGES */}
        <ZigzagGallerySection onOpenAuth={onOpenAuth} />

        {/* 6. FEATURES GRID */}
        <FeaturesSection />

        {/* 7. PRICING + 3 STACKED TESTIMONIALS */}
        <PricingSection onOpenAuth={onOpenAuth} />

        {/* VENDOR GALLERY SHOWCASE (All user uploaded storelly images) */}
        <VendorGallerySection />

        {/* 8. FAQ + CONTACT + NEWSLETTER */}
        <FAQSection />
      </main>

      {/* 9. FOOTER */}
      <LandingFooter onOpenMasterAdmin={onOpenMasterAdmin} />
    </div>
  );
};

