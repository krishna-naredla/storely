import React from 'react';
import { BusinessProfile } from '../../types';
import { StorefrontView } from '../storefront/StorefrontView';
import { BioProfileView } from '../biolink/BioProfileView';
import { StandalonePortfolioView } from '../portfolio/StandalonePortfolioView';
import { StandaloneTrustCardView } from './StandaloneTrustCardView';
import { PublicStatusView } from './PublicStatusView';
import { evaluatePublicAvailability } from '../../utils/publicAvailability';
import { CanonicalPublicView } from '../../utils/publicRouteResolver';

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

  // 4. Module-specific or Storefront Views (consultations, events, quotes, reviews, digital store, vendor storefront)
  const moduleResult = evaluatePublicAvailability(targetBusiness, canonicalTargetView, activePreview);
  if (!moduleResult.isAvailable) {
    return (
      <PublicStatusView
        status={moduleResult.status}
        title={moduleResult.title}
        message={moduleResult.message}
        helperNote={moduleResult.helperNote}
        requestedSlug={targetBusiness.slug}
        targetView={canonicalTargetView}
        isExplicitPreview={activePreview}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
        onGoToHome={() => { window.location.href = '/'; }}
        onRetry={() => { window.location.reload(); }}
      />
    );
  }

  return (
    <StorefrontView
      business={targetBusiness}
      initialView={canonicalTargetView}
      onBackToDashboard={activePreview ? onBackToDashboard : undefined}
      onOpenDigitalCard={onOpenDigitalCard}
    />
  );
};
