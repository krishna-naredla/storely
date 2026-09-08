import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Tag,
  ShoppingBag,
  CalendarCheck,
  FolderTree,
  FileSpreadsheet,
  Briefcase,
  Star,
  ExternalLink,
  Sparkles,
  Store,
  ChevronRight,
  X
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { isCreatorProfile } from '../../utils/profileHelper';

export interface FloatingActionButtonProps {
  business: BusinessProfile | null;
  onSelectTab: (tab: string) => void;
  onOpenStorefront?: () => void;
  onOpenShareModal?: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  business,
  onSelectTab,
  onOpenStorefront,
  onOpenShareModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCreator = isCreatorProfile(business);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!business) return null;

  const displayImage = business.logo || business.profileImage || null;
  const initials = (business.name || (isCreator ? 'CR' : 'ST')).slice(0, 2).toUpperCase();

  const handleAction = (callback: () => void) => {
    setIsOpen(false);
    callback();
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40">
      {/* Quick Actions Menu Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-2.5 w-64 sm:w-72 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Header section tailored to profile type */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isCreator ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isCreator ? <Sparkles className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider block text-slate-500 truncate">
                  {isCreator ? 'Creator Actions' : 'Merchant Actions'}
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {business.name}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto p-0.5">
            {isCreator ? (
              // CREATOR QUICK ACTIONS
              <>
                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('portfolio'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <span>Add Project / Case Study</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('events'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Host Event / Workshop</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('quotes'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <span>Send Custom Quote</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('reviews'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                    <span>Client Testimonials</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500" />
                </button>

                {onOpenStorefront && (
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenStorefront)}
                    className="w-full px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50/80 rounded-xl transition flex items-center justify-between group cursor-pointer border-t border-slate-100 pt-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <span>View Live Portfolio</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                )}
              </>
            ) : (
              // MERCHANT / VENDOR QUICK ACTIONS
              <>
                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('catalog'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span>Add Product / Menu Item</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('offers'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <span>Create Offer / Coupon</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('orders'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <span>View Orders & Sales</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('bookings'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>New Appointment</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onSelectTab('categories'))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                      <FolderTree className="w-3.5 h-3.5" />
                    </div>
                    <span>Categories & Catalog</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-500" />
                </button>

                {onOpenStorefront && (
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenStorefront)}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50/80 rounded-xl transition flex items-center justify-between group cursor-pointer border-t border-slate-100 pt-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <span>Open Live Storefront</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Trigger Button with Dynamic Logo / Profile Image and Profile-specific Branding */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer shadow-xl border-2 border-white relative group ${
          isCreator
            ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/35 ring-4 ring-indigo-500/20'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/35 ring-4 ring-emerald-500/20'
        }`}
        title={`${business.name} — ${isCreator ? 'Creator' : 'Merchant'} Quick Actions`}
        aria-label="Quick Actions"
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={business.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-heading font-black text-sm text-white tracking-wider">
            {initials}
          </span>
        )}

        {/* Small corner indicator icon */}
        <div
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] shadow-sm ${
            isCreator ? 'bg-purple-600' : 'bg-emerald-600'
          }`}
        >
          {isCreator ? <Sparkles className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
        </div>
      </button>
    </div>
  );
};
