import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Sparkles,
  BedDouble,
  Car,
  UtensilsCrossed,
  Check,
  CheckCircle2,
  Tag,
  Share2,
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { CatalogItem, CatalogItemVariant, CatalogItemAddon, BusinessProfile } from '../../types';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { resolveItemAction } from '../../utils/itemActionResolver';

interface ItemDetailModalProps {

  item: CatalogItem | null;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onBookItem?: (item: CatalogItem) => void;
  onBuyDigitalItem?: (item: CatalogItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  business,
  isOpen,
  onClose,
  onBookItem,
  onBuyDigitalItem,
}) => {
  const { addItem } = useStorefrontCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<CatalogItemVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<CatalogItemAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const images = item.images && item.images.length > 0 ? item.images : [];
  const currentPrice = selectedVariant?.price ?? (item.salePrice || item.price);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = currentPrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  // Authoritative Canonical Action Resolver
  const actionResult = resolveItemAction(item);
  const isBookable = actionResult.isBooking;
  const isDigital = actionResult.isDigital;
  const isCartable = actionResult.isCartable;

  const handleAddonToggle = (addon: CatalogItemAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id || a.name === addon.name);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id && a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    addItem(item, quantity, selectedVariant, selectedAddons);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleBookNow = () => {
    onClose();
    if (onBookItem) {
      onBookItem(item);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-slate-900 backdrop-blur-md transition-all flex items-center justify-center group cursor-pointer"
        >
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Section */}
            <div className="w-full md:w-[45%] h-[300px] md:h-auto bg-slate-50 relative shrink-0">
              {images.length > 0 ? (
                <SafeImage 
                  src={images[selectedImageIndex] || images[0]} 
                  alt={item.name} 
                  fallbackType="product" 
                  className="w-full h-full object-cover md:object-center" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                  <ShoppingBag className="w-16 h-16 stroke-1" />
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-5 left-5 flex flex-col gap-2">
                {item.isOffer && (
                  <span className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {item.offerText || 'Offer'}
                  </span>
                )}
                {item.isFeatured && (
                  <span className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured
                  </span>
                )}
              </div>

              {/* Thumbnails row if multiple images */}
              {images.length > 1 && (
                <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-105'
                          : 'border-white opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <SafeImage src={img} alt={`Thumbnail ${idx}`} fallbackType="product" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex-1 p-6 sm:p-8 space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    {typeof item.isVeg === 'boolean' && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                        item.isVeg ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {item.category || 'Product'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading leading-tight">
                    {item.name}
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-emerald-700 font-heading tracking-tight">
                    {business.currencySymbol}{currentPrice}
                    {item.unit && (
                      <span className="text-sm font-bold text-slate-400 ml-1">
                        / {item.unit}
                      </span>
                    )}
                  </div>

                  {item.salePrice && item.salePrice < item.price && (
                    <div className="text-base font-bold text-slate-300 line-through">
                      {business.currencySymbol}{item.price}
                    </div>
                  )}

                  {item.inStock === false && (
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>

              {/* Specs Grid */}
              {(
                (item.type === 'service' && item.durationMinutes) ||
                (item.type === 'menu_item' && (item.prepTimeMinutes || item.spiceLevel)) ||
                ((item.type === 'room' || item.type === 'room_stay') && (item.bedType || item.roomCapacity)) ||
                ((item.type === 'vehicle' || item.type === 'rental_vehicle') && (item.vehicleModel || item.transmission || item.fuelType))
              ) && (
                <div className="grid grid-cols-2 gap-3">
                  {item.type === 'service' && item.durationMinutes && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Duration</p>
                        <p className="text-xs font-bold text-slate-700 mt-1 truncate">{item.durationMinutes} mins</p>
                      </div>
                    </div>
                  )}
                  {item.type === 'menu_item' && item.prepTimeMinutes && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Prep Time</p>
                        <p className="text-xs font-bold text-slate-700 mt-1 truncate">~{item.prepTimeMinutes} mins</p>
                      </div>
                    </div>
                  )}
                  {(item.type === 'room' || item.type === 'room_stay') && (item.bedType || item.roomCapacity) && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <BedDouble className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Stay Details</p>
                        <p className="text-xs font-bold text-slate-700 mt-1 truncate">
                          {item.bedType || 'Standard Room'} {item.roomCapacity ? `• ${item.roomCapacity} Guests` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  {(item.type === 'vehicle' || item.type === 'rental_vehicle') && (item.vehicleModel || item.transmission) && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Vehicle Specs</p>
                        <p className="text-xs font-bold text-slate-700 mt-1 truncate">
                          {item.vehicleModel || 'Standard'} {item.transmission ? `• ${item.transmission}` : ''} {item.seatingCapacity ? `• ${item.seatingCapacity} Seater` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {(item.shortDescription || item.detailedDescription) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    The Detail
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {item.detailedDescription || item.shortDescription}
                  </p>
                </div>
              )}

              {/* Variants Selector */}
              {item.variants && item.variants.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Selection Options
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(isSelected ? undefined : v)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-600 ring-4 ring-emerald-500/10'
                              : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className={`text-xs block truncate ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-700 font-bold'}`}>
                              {v.name}
                            </span>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {business.currencySymbol}{v.price}
                            </span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 scale-110 shadow-sm' : 'border-slate-200'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons Selector */}
              {item.addons && item.addons.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Custom Extras
                  </h4>
                  <div className="space-y-2">
                    {item.addons.map((addon) => {
                      const isChecked = selectedAddons.some(
                        (a) => a.id === addon.id || a.name === addon.name
                      );
                      return (
                        <button
                          key={addon.id || addon.name}
                          type="button"
                          onClick={() => handleAddonToggle(addon)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isChecked ? 'bg-emerald-600 border-emerald-600 shadow-sm' : 'border-slate-200'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                            <span className={`text-xs ${isChecked ? 'text-emerald-950 font-black' : 'text-slate-700 font-bold'}`}>
                              {addon.name}
                            </span>
                          </div>
                          <span className={`text-xs font-black ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>
                            +{business.currencySymbol}{addon.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-6 sm:p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-4">
          {/* Quantity selector - for physical and cartable items */}
          {isCartable && (
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-emerald-600 transition-all cursor-pointer active:scale-90"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="flex-1 sm:w-12 text-center text-sm font-black text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-emerald-600 transition-all cursor-pointer active:scale-90"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Main Action Button */}
          <div className="flex-1 w-full">
            {isDigital ? (
              <button
                type="button"
                onClick={() => onBuyDigitalItem && onBuyDigitalItem(item)}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>{item.price === 0 ? 'Get Access' : 'Purchase Access'}</span>
                <div className="h-6 w-px bg-white/20 mx-1" />
                <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-xs group-hover:bg-white/20">
                  {business.currencySymbol}{totalPrice}
                </span>
              </button>
            ) : isBookable ? (
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black active:bg-slate-800 text-white font-black text-sm shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>{actionResult.label}</span>
                <div className="h-6 w-px bg-white/20 mx-1" />
                <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-xs group-hover:bg-white/20">
                  {business.currencySymbol}{totalPrice}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={item.inStock === false}
                onClick={handleAddToCart}
                className={`w-full h-14 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-950 text-white shadow-emerald-700/20 disabled:opacity-50'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Add to Cart</span>
                    <div className="h-6 w-px bg-white/20 mx-1" />
                    <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-xs group-hover:bg-white/20">
                      {business.currencySymbol}{totalPrice}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
