import React from 'react';
import { BusinessProfile } from '../../types';
import { VendorTrustShareCard } from './VendorTrustShareCard';
import { ArrowLeft, Store, ShieldCheck } from 'lucide-react';
import { getStorefrontUrl } from '../../services/firebaseService';

interface StandaloneTrustCardViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  onOpenStorefront?: () => void;
  isOwner?: boolean;
}

export const StandaloneTrustCardView: React.FC<StandaloneTrustCardViewProps> = ({
  business,
  onBackToDashboard,
  onOpenStorefront,
  isOwner,
}) => {
  const storeUrl = getStorefrontUrl(business);

  const handleOpenStore = () => {
    if (onOpenStorefront) {
      onOpenStorefront();
    } else {
      window.location.href = storeUrl;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/5 via-slate-100 to-slate-200/60 py-6 sm:py-10 px-3 sm:px-4 flex flex-col items-center justify-start">
      {/* Top Floating Bar */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between gap-2 px-1">
        {onBackToDashboard ? (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Official Merchant</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenStore}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Open Full Catalog</span>
        </button>
      </div>

      {/* The Central Trust Card */}
      <div className="w-full max-w-lg">
        <VendorTrustShareCard
          business={business}
          onOpenStore={handleOpenStore}
          standalone={false}
        />
      </div>

      {/* Trust Notice Footer */}
      <div className="mt-8 text-center text-xs text-slate-600 space-y-1">
        <p>This is the verified digital storefront and trust badge for <strong className="text-slate-800 font-bold">{business.name}</strong>.</p>
        <p className="text-[11px] text-slate-600">All orders placed via WhatsApp are protected and fulfilled directly by the merchant.</p>
      </div>
    </div>
  );
};
