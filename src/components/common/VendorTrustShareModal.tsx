import React, { useState } from 'react';
import { X, Sparkles, QrCode, Smartphone, Share2, Layers } from 'lucide-react';
import { BusinessProfile } from '../../types';
import { VendorTrustShareCard } from './VendorTrustShareCard';
import { ModuleQrModal } from './ModuleQrModal';
import { getStorefrontUrl } from '../../services/firebaseService';

interface VendorTrustShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessProfile;
  onOpenStore?: () => void;
}

export const VendorTrustShareModal: React.FC<VendorTrustShareModalProps> = ({
  isOpen,
  onClose,
  business,
  onOpenStore,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-heading text-white">
                  Rich Storefront Trust Card
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Share this high-conversion rich card on WhatsApp to boost customer trust & orders.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-1 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Trust Card (Sri Lakshmi Style)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Standee QR Code</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">1-Click WhatsApp Share</span>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <VendorTrustShareCard
            business={business}
            onOpenStore={() => {
              onClose();
              if (onOpenStore) onOpenStore();
            }}
            onCloseModal={onClose}
          />
        </div>
      </div>

      {/* Standee QR modal */}
      {isQrModalOpen && (
        <ModuleQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title={`${business.name} Official Storefront QR`}
          subtitle={`Let customers scan your official QR code to browse products, view offers, and place WhatsApp orders.`}
          badge="Verified Digital Store"
          url={getStorefrontUrl(business)}
          businessName={business.name}
          logoUrl={business.logo || business.profileImage}
          accentColor="emerald"
        />
      )}
    </div>
  );
};
