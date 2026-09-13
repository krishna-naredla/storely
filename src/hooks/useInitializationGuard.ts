import { useEffect } from 'react';
import { BusinessProfile } from '../types';

interface InitializationGuardParams {
  currentUser: any;
  loadingUser: boolean;
  selectedBusiness: BusinessProfile | null;
  isInitializingBusiness: boolean;
  publicBusiness: BusinessProfile | null;
  isLoadingPublicStore: boolean;
  isPublicRoute: boolean;
}

export function useInitializationGuard({
  currentUser,
  loadingUser,
  selectedBusiness,
  isInitializingBusiness,
  publicBusiness,
  isLoadingPublicStore,
  isPublicRoute,
}: InitializationGuardParams) {
  useEffect(() => {
    console.log('[InitializationGuard] State Update:', {
      currentUser: currentUser ? currentUser.uid : null,
      loadingUser,
      selectedBusinessId: selectedBusiness?.id || null,
      isInitializingBusiness,
      publicBusinessSlug: publicBusiness?.slug || null,
      isLoadingPublicStore,
      isPublicRoute,
    });
  }, [currentUser, loadingUser, selectedBusiness, isInitializingBusiness, publicBusiness, isLoadingPublicStore, isPublicRoute]);

  if (loadingUser) {
    return { isReady: false, isBooting: true, bootStatusMessage: 'Authenticating user session...' };
  }

  if (isPublicRoute) {
    if (isLoadingPublicStore) {
      return { isReady: false, isBooting: true, bootStatusMessage: 'Loading public storefront...' };
    }
    return { isReady: true, isBooting: false, bootStatusMessage: 'Ready' };
  }

  if (currentUser) {
    if (isInitializingBusiness) {
      return { isReady: false, isBooting: true, bootStatusMessage: 'Loading business profile & modules...' };
    }
  }

  return { isReady: true, isBooting: false, bootStatusMessage: 'Ready' };
}
