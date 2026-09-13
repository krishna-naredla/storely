import React from 'react';
import { BusinessProfile } from '../../types';
import { isCreatorProfile } from '../../utils/profileHelper';

interface Props {
  business: BusinessProfile | null;
  currentBusinessId?: string;
  moduleName?: string;
  isOwner?: boolean;
  children: React.ReactNode;
}

export const VendorAuthGuard: React.FC<Props> = ({ business, currentBusinessId, moduleName, isOwner, children }) => {
  const isCreator = business ? isCreatorProfile(business) : false;

  if (isCreator && moduleName && ['products', 'catalog', 'menu', 'rooms', 'vehicles', 'orders'].includes(moduleName)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h1 className="text-2xl font-black text-white">Vendor Module Restricted</h1>
          <p className="text-sm text-slate-400">
            This account is registered as a Creator profile. Vendor inventory and physical ordering modules are not available for Creator accounts.
          </p>
        </div>
      </div>
    );
  }

  if (currentBusinessId && business && business.id !== currentBusinessId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h1 className="text-2xl font-black text-white">Unauthorized Business Context</h1>
          <p className="text-sm text-slate-400">
            The requested business ID does not match your active active session context.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
