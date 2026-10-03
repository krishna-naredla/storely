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
import { PublicStatusView } from './PublicStatusView';
import { evaluatePublicAvailability } from '../../utils/publicAvailability';
import { CanonicalPublicView } from '../../utils/publicRouteResolver';
import { isCreatorProfile } from '../../utils/profileHelper';

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
    | 'reviews';
  targetBusiness: BusinessProfile;
  isOwner?: boolean;
  isExplicitPreview?: boolean;
  onBackToDashboard?: () => void;
  onOpenStorefront?: (slug: string, path: string) => void;
  onOpenDigitalCard?: () => void;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  viewMode,
  targetBusiness,
  isOwner = false,
  isExplicitPreview = false,
  onBackToDashboard,
  onOpenStorefront,
  onOpenDigitalCard,
}) => {
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

  // 8. Digital Store View (For Creators) OR Commerce Storefront View (For Vendors)
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
