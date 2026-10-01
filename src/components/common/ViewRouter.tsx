import React from 'react';
import { BusinessProfile } from '../../types';
import { StorefrontView } from '../storefront/StorefrontView';
import { BioProfileView } from '../biolink/BioProfileView';
import { StandalonePortfolioView } from '../portfolio/StandalonePortfolioView';
import { StandaloneTrustCardView } from './StandaloneTrustCardView';
import { PublicStatusView } from './PublicStatusView';
import { evaluatePublicAvailability } from '../../utils/publicAvailability';

interface ViewRouterProps {
  viewMode: 'dashboard' | 'storefront' | 'store' | 'portfolio' | 'biolink' | 'bio' | 'card';
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

  // 1. Universal Bio Link View
  if (viewMode === 'biolink' || viewMode === 'bio') {
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
  if (viewMode === 'portfolio') {
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
  if (viewMode === 'card') {
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

  // 4. Default Storefront View (Vendor storefront or Creator digital store)
  const storeResult = evaluatePublicAvailability(targetBusiness, 'store', activePreview);
  if (!storeResult.isAvailable) {
    return (
      <PublicStatusView
        status={storeResult.status}
        title={storeResult.title}
        message={storeResult.message}
        helperNote={storeResult.helperNote}
        requestedSlug={targetBusiness.slug}
        targetView="store"
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
      onBackToDashboard={activePreview ? onBackToDashboard : undefined}
      onOpenDigitalCard={onOpenDigitalCard}
    />
  );
};
