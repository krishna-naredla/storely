import React from 'react';
import { BusinessProfile } from '../../types';
import { StorefrontView } from '../storefront/StorefrontView';
import { BioProfileView } from '../biolink/BioProfileView';
import { StandalonePortfolioView } from '../portfolio/StandalonePortfolioView';
import { StandaloneTrustCardView } from './StandaloneTrustCardView';
import { StandaloneConsultationView } from '../consultation/StandaloneConsultationView';
import { StandaloneEventsView } from '../events/StandaloneEventsView';
import { StandaloneQuoteView } from '../quotes/StandaloneQuoteView';
import { StandaloneReviewsView } from '../reviews/StandaloneReviewsView';
import { StandaloneDigitalStoreView } from '../digital/StandaloneDigitalStoreView';
import { StandaloneAffiliateView } from '../affiliate/StandaloneAffiliateView';
import { PublicStatusView } from './PublicStatusView';
import { evaluatePublicAvailability } from '../../utils/publicAvailability';
import { CanonicalPublicView } from '../../utils/publicRouteResolver';
import { isCreatorProfile } from '../../utils/profileHelper';
import { useAuth } from '../../context/AuthContext';
import { getAppLogo } from '../../utils/branding';
import { Loader2 } from 'lucide-react';

interface ViewRouterProps {
  viewMode:
    | 'dashboard'
    | 'storefront'
    | 'store'
    | 'portfolio'
    | 'biolink'
    | 'bio'
    | 'card'
    | 'consultations'
    | 'events'
    | 'quotes'
    | 'reviews'
    | 'recommendations'
    | 'affiliate';
  targetBusiness?: BusinessProfile | null;
  isOwner?: boolean;
  isExplicitPreview?: boolean;
  onBackToDashboard?: () => void;
  onOpenStorefront?: (slug: string, path: string) => void;
  onOpenDigitalCard?: () => void;
  children?: React.ReactNode;
}

export const StrictBusinessVerificationGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { authLoading, businessLoading, businessesLoaded, currentUser, resolved } = useAuth();

  // Block rendering until auth is initialized and business ownership lookup is completed
  if (authLoading || (currentUser && businessLoading) || (currentUser && !businessesLoaded) || !resolved) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center">
            <img src={getAppLogo()} alt="Storelly" className="w-full h-full object-contain" />
          </div>
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const ViewRouter: React.FC<ViewRouterProps> = ({
  viewMode,
  targetBusiness,
  isOwner = false,
  isExplicitPreview = false,
  onBackToDashboard,
  onOpenStorefront,
  onOpenDigitalCard,
  children,
}) => {
  const { authLoading, businessLoading, currentUser, businessesLoaded, resolved } = useAuth();

  // If in dashboard view or targetBusiness not yet resolved, verify auth state first
  if (viewMode === 'dashboard') {
    if (authLoading || (currentUser && businessLoading) || (currentUser && !businessesLoaded) || !resolved) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden">
          <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
            <img src={getAppLogo()} alt="Storelly" className="w-full h-full object-contain" />
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!targetBusiness) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden">
        <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          <img src={getAppLogo()} alt="Storelly" className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  // Enforce preview separation: owner preview controls ONLY show when isExplicitPreview is true, authenticated owner is verified, and business is not deleted
  const activePreview = Boolean(
    isExplicitPreview &&
    isOwner &&
    targetBusiness.status !== 'deleted'
  );

  // Normalize canonical target view
  const canonicalTargetView: CanonicalPublicView =
    viewMode === 'biolink' || viewMode === 'bio'
      ? 'bio'
      : viewMode === 'portfolio'
      ? 'portfolio'
      : viewMode === 'card'
      ? 'card'
      : viewMode === 'consultations'
      ? 'consultations'
      : viewMode === 'events'
      ? 'events'
      : viewMode === 'quotes'
      ? 'quotes'
      : viewMode === 'reviews'
      ? 'reviews'
      : viewMode === 'recommendations' || viewMode === 'affiliate'
      ? 'recommendations'
      : 'store';

  // 1. Universal Bio Link View
  if (canonicalTargetView === 'bio') {
    const result = evaluatePublicAvailability(targetBusiness, 'bio', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="bio"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <BioProfileView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        onOpenStorefront={
          onOpenStorefront
            ? () => onOpenStorefront(targetBusiness.slug, `/store/${targetBusiness.slug}`)
            : undefined
        }
      />
    );
  }

  // 2. Professional Portfolio View
  if (canonicalTargetView === 'portfolio') {
    const result = evaluatePublicAvailability(targetBusiness, 'portfolio', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="portfolio"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandalonePortfolioView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // 3. Digital Trust Card View
  if (canonicalTargetView === 'card') {
    const result = evaluatePublicAvailability(targetBusiness, 'card', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="card"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandaloneTrustCardView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        onOpenStorefront={
          onOpenStorefront
            ? () => onOpenStorefront(targetBusiness.slug, `/store/${targetBusiness.slug}`)
            : undefined
        }
        isOwner={activePreview}
      />
    );
  }

  // 4. 1:1 Consultations & Mentorship View
  if (canonicalTargetView === 'consultations') {
    const result = evaluatePublicAvailability(targetBusiness, 'consultations', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="consultations"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandaloneConsultationView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // 5. Events, Workshops & Webinars View
  if (canonicalTargetView === 'events') {
    const result = evaluatePublicAvailability(targetBusiness, 'events', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="events"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandaloneEventsView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // 6. Custom Project Quotes View
  if (canonicalTargetView === 'quotes') {
    const result = evaluatePublicAvailability(targetBusiness, 'quotes', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="quotes"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandaloneQuoteView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // 7. Client Reviews & Testimonials View
  if (canonicalTargetView === 'reviews') {
    const result = evaluatePublicAvailability(targetBusiness, 'reviews', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="reviews"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandaloneReviewsView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // 8. Affiliate & Recommended Products View
  if (canonicalTargetView === 'recommendations') {
    const result = evaluatePublicAvailability(targetBusiness, 'recommendations', activePreview);
    if (!result.isAvailable) {
      return (
        <PublicStatusView
          status={result.status}
          title={result.title}
          message={result.message}
          helperNote={result.helperNote}
          requestedSlug={targetBusiness.slug}
          targetView="recommendations"
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
          onGoToHome={() => { window.location.href = '/'; }}
          onRetry={() => { window.location.reload(); }}
        />
      );
    }

    return (
      <StandaloneAffiliateView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // 9. Digital Store View (For Creators) OR Commerce Storefront View (For Vendors)
  const isCreator = isCreatorProfile(targetBusiness);
  const result = evaluatePublicAvailability(targetBusiness, 'store', activePreview);
  if (!result.isAvailable) {
    return (
      <PublicStatusView
        status={result.status}
        title={result.title}
        message={result.message}
        helperNote={result.helperNote}
        requestedSlug={targetBusiness.slug}
        targetView="store"
        isExplicitPreview={activePreview}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        onGoToHome={() => { window.location.href = '/'; }}
        onRetry={() => { window.location.reload(); }}
      />
    );
  }

  if (isCreator) {
    return (
      <StandaloneDigitalStoreView
        business={targetBusiness}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        isOwner={activePreview}
      />
    );
  }

  // Vendor Commerce Storefront (Retail, Restaurant, Bakery, Hotel, Rental, etc.)
  return (
    <StorefrontView
      business={targetBusiness}
      initialView="store"
      onBackToDashboard={activePreview ? onBackToDashboard : undefined}
      onOpenDigitalCard={onOpenDigitalCard}
    />
  );
};
