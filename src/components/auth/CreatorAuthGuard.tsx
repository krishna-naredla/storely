import React from 'react';
import { BusinessProfile } from '../../types';
import { isCreatorProfile } from '../../utils/profileHelper';

interface Props {
  business: BusinessProfile;
  currentBusinessId?: string;
  moduleName: 'store' | 'bio' | 'portfolio';
  isOwner: boolean;
  children: React.ReactNode;
  onBackToDashboard?: () => void;
}

export const CreatorAuthGuard: React.FC<Props> = ({ business, currentBusinessId, moduleName, isOwner, children, onBackToDashboard }) => {
  if (currentBusinessId && business && business.id !== currentBusinessId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-4">
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-500">
            The requested business context does not match your active session.
          </p>
        </div>
      </div>
    );
  }
  const isCreator = isCreatorProfile(business);
  const modules = business.modules || {};

  let isEnabled = false;
  let moduleTitle = '';

  switch (moduleName) {
    case 'store':
      isEnabled = !isCreator || !!(
        modules.digital_products ||
        modules.digitalProducts ||
        modules.products ||
        modules.catalog ||
        modules.booking_appointments ||
        modules.custom_quotes ||
        modules.events_tickets
      );
      moduleTitle = 'Digital Store';
      break;
    case 'bio':
      isEnabled = !!(modules.universal_links || modules.bio_links || modules.biolink);
      moduleTitle = 'Universal Bio Link';
      break;
    case 'portfolio':
      isEnabled = !!(modules.work_portfolio || modules.portfolio);
      moduleTitle = 'Professional Portfolio';
      break;
  }

  if (!isEnabled && !isOwner) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-4">
          <h1 className="text-xl font-bold text-slate-900">{moduleTitle} Unavailable</h1>
          <p className="text-sm text-slate-500">
            This module is currently unavailable or disabled by the creator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isEnabled && isOwner && (
        <div className="bg-amber-500 text-amber-950 p-2 text-center text-xs font-bold z-[100] sticky top-0 shadow-md">
          ⚠️ You are previewing an unpublished module. The public cannot see this until you enable it in your dashboard.
        </div>
      )}
      {children}
    </>
  );
};
