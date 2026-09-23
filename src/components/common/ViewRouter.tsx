import React from 'react';
import { BusinessProfile } from '../../types';
import { StorefrontView } from '../storefront/StorefrontView';
import { BioProfileView } from '../biolink/BioProfileView';
import { StandalonePortfolioView } from '../portfolio/StandalonePortfolioView';
import { StandaloneTrustCardView } from './StandaloneTrustCardView';
import { PublicModuleUnavailableView } from './PublicModuleUnavailableView';
import { verifyModuleAvailability } from '../../utils/publicRouteResolver';

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
  // Enforce preview separation: owner preview controls ONLY show when isExplicitPreview is true
  const activePreview = Boolean(isExplicitPreview && isOwner);

  // 1. Universal Bio Link View
  if (viewMode === 'biolink' || viewMode === 'bio') {
    const status = verifyModuleAvailability(targetBusiness, 'bio', activePreview);
    if (!status.isAvailable) {
      return (
        <PublicModuleUnavailableView
          business={targetBusiness}
          moduleType="bio"
          title={status.title}
          message={status.message}
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
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
    const status = verifyModuleAvailability(targetBusiness, 'portfolio', activePreview);
    if (!status.isAvailable) {
      return (
        <PublicModuleUnavailableView
          business={targetBusiness}
          moduleType="portfolio"
          title={status.title}
          message={status.message}
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
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
    const status = verifyModuleAvailability(targetBusiness, 'card', activePreview);
    if (!status.isAvailable) {
      return (
        <PublicModuleUnavailableView
          business={targetBusiness}
          moduleType="card"
          title={status.title}
          message={status.message}
          isExplicitPreview={activePreview}
          onBackToDashboard={activePreview ? onBackToDashboard : undefined}
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
  const storeStatus = verifyModuleAvailability(targetBusiness, 'store', activePreview);
  if (!storeStatus.isAvailable) {
    return (
      <PublicModuleUnavailableView
        business={targetBusiness}
        moduleType="store"
        title={storeStatus.title}
        message={storeStatus.message}
        isExplicitPreview={activePreview}
        onBackToDashboard={activePreview ? onBackToDashboard : undefined}
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
