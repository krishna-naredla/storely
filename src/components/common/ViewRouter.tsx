import React from 'react';
import { BusinessProfile } from '../../types';
import { isCreatorProfile } from '../../utils/profileHelper';
import { CreatorAuthGuard } from '../auth/CreatorAuthGuard';
import { StorefrontView } from '../storefront/StorefrontView';
import { BioProfileView } from '../biolink/BioProfileView';
import { StandalonePortfolioView } from '../portfolio/StandalonePortfolioView';

interface ViewRouterProps {
  viewMode: 'dashboard' | 'storefront' | 'portfolio' | 'biolink';
  targetBusiness: BusinessProfile;
  isOwner: boolean;
  onBackToDashboard?: () => void;
  onOpenStorefront?: (slug: string, path: string) => void;
  onOpenDigitalCard?: () => void;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  viewMode,
  targetBusiness,
  isOwner,
  onBackToDashboard,
  onOpenStorefront,
  onOpenDigitalCard,
}) => {
  const isCreator = isCreatorProfile(targetBusiness);
  const primaryPref = targetBusiness.primaryDestination;

  const portfolioEnabled = Boolean(
    targetBusiness.modules?.work_portfolio || targetBusiness.modules?.portfolio
  );
  const bioEnabled = Boolean(
    targetBusiness.modules?.universal_links || targetBusiness.modules?.bio_links || targetBusiness.modules?.biolink
  );
  const digitalEnabled = Boolean(
    targetBusiness.modules?.digital_products ||
    targetBusiness.modules?.digitalProducts ||
    targetBusiness.modules?.products
  );

  let shouldRenderBio = viewMode === 'biolink';
  let shouldRenderPortfolio = viewMode === 'portfolio';
  let shouldRenderStore = viewMode === 'storefront';

  if (!shouldRenderBio && !shouldRenderPortfolio && !shouldRenderStore && isCreator) {
    if (primaryPref === 'biolink' && bioEnabled) {
      shouldRenderBio = true;
    } else if (primaryPref === 'store' && digitalEnabled) {
      shouldRenderStore = true;
    } else if (portfolioEnabled) {
      shouldRenderPortfolio = true;
    } else if (bioEnabled) {
      shouldRenderBio = true;
    } else if (digitalEnabled) {
      shouldRenderStore = true;
    } else {
      shouldRenderPortfolio = true;
    }
  }

  if (shouldRenderBio) {
    return (
      <CreatorAuthGuard business={targetBusiness} currentBusinessId={targetBusiness.id} moduleName="bio" isOwner={isOwner}>
        <BioProfileView
          business={targetBusiness}
          onBackToDashboard={isOwner ? onBackToDashboard : undefined}
          onOpenStorefront={onOpenStorefront ? () => onOpenStorefront(targetBusiness.slug, `/store/${targetBusiness.slug}`) : undefined}
        />
      </CreatorAuthGuard>
    );
  }

  if (shouldRenderPortfolio) {
    return (
      <CreatorAuthGuard business={targetBusiness} currentBusinessId={targetBusiness.id} moduleName="portfolio" isOwner={isOwner}>
        <StandalonePortfolioView
          business={targetBusiness}
          onBackToDashboard={isOwner ? onBackToDashboard : undefined}
          isOwner={isOwner}
        />
      </CreatorAuthGuard>
    );
  }

  return (
    <CreatorAuthGuard business={targetBusiness} currentBusinessId={targetBusiness.id} moduleName="store" isOwner={isOwner}>
      <StorefrontView
        business={targetBusiness}
        onBackToDashboard={isOwner ? onBackToDashboard : undefined}
        onOpenDigitalCard={onOpenDigitalCard}
      />
    </CreatorAuthGuard>
  );
};
