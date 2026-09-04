import React from 'react';
import { BusinessProfile } from '../../types';

interface Props {
  business: BusinessProfile;
  moduleName: 'store' | 'bio' | 'portfolio';
  isOwner: boolean;
  children: React.ReactNode;
  onBackToDashboard?: () => void;
}

export const CreatorAuthGuard: React.FC<Props> = ({ business, moduleName, isOwner, children, onBackToDashboard }) => {
  const isCreator = business.type === 'creator';
  const modules = business.modules || {};

  let isEnabled = false;
  let moduleTitle = '';

  switch (moduleName) {
    case 'store':
      isEnabled = !!(modules.digital_products || modules.digitalProducts);
      moduleTitle = 'Digital Store';
      break;
    case 'bio':
      isEnabled = !!modules.universal_links;
      moduleTitle = 'Universal Bio Link';
      break;
    case 'portfolio':
      isEnabled = !!(modules.work_portfolio || modules.portfolio);
      moduleTitle = 'Professional Portfolio';
      break;
  }

  if (!isCreator && moduleName === 'store') {
    isEnabled = true;
  }

  if (!isEnabled && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h1 className="text-2xl font-black text-white">{moduleTitle} Unavailable</h1>
          <p className="text-sm text-slate-400">
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
