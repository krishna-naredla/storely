import { useEffect, useRef, useCallback } from 'react';
import { CanonicalAnalyticsEventType } from '../types';
import { trackEvent } from '../utils/analytics';

interface UseModuleAnalyticsOptions {
  businessId?: string;
  moduleName: string;
  viewEventType?: CanonicalAnalyticsEventType;
  viewMetadata?: Record<string, any>;
  disableAutoView?: boolean;
}

export function useModuleAnalytics({
  businessId,
  moduleName,
  viewEventType,
  viewMetadata,
  disableAutoView = false,
}: UseModuleAnalyticsOptions) {
  const hasTrackedView = useRef(false);

  // Automatic view event tracking on mount with deduplication
  useEffect(() => {
    if (!businessId || disableAutoView || !viewEventType || hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackEvent(businessId, viewEventType, {
      module: moduleName,
      ...viewMetadata,
    });
  }, [businessId, moduleName, viewEventType, disableAutoView, JSON.stringify(viewMetadata)]);

  // Generic canonical event logger
  const logEvent = useCallback(
    async (eventType: CanonicalAnalyticsEventType, metadata: Record<string, any> = {}) => {
      if (!businessId) return;
      await trackEvent(businessId, eventType, {
        module: moduleName,
        ...metadata,
      });
    },
    [businessId, moduleName]
  );

  // Canonical 'profile_view' event tracker
  const trackProfileView = useCallback(
    async (metadata: Record<string, any> = {}) => {
      if (!businessId) return;
      await trackEvent(businessId, 'profile_view', {
        module: moduleName,
        ...metadata,
      });
    },
    [businessId, moduleName]
  );

  // Canonical 'module_click' event tracker
  const trackModuleClick = useCallback(
    async (targetNameOrMetadata: string | Record<string, any>, extraMetadata: Record<string, any> = {}) => {
      if (!businessId) return;
      const metadata = typeof targetNameOrMetadata === 'string'
        ? { target: targetNameOrMetadata, ...extraMetadata }
        : { ...targetNameOrMetadata, ...extraMetadata };

      await trackEvent(businessId, 'module_click', {
        module: moduleName,
        ...metadata,
      });
    },
    [businessId, moduleName]
  );

  // Canonical 'conversion' event tracker
  const trackConversion = useCallback(
    async (goalOrMetadata: string | Record<string, any>, extraMetadata: Record<string, any> = {}) => {
      if (!businessId) return;
      const metadata = typeof goalOrMetadata === 'string'
        ? { goal: goalOrMetadata, ...extraMetadata }
        : { ...goalOrMetadata, ...extraMetadata };

      await trackEvent(businessId, 'conversion', {
        module: moduleName,
        ...metadata,
      });
    },
    [businessId, moduleName]
  );

  return {
    logEvent,
    trackProfileView,
    trackModuleClick,
    trackConversion,
  };
}

