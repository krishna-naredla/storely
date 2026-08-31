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
  Tag,
  Share2,
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { CatalogItem, CatalogItemVariant, CatalogItemAddon, BusinessProfile } from '../../types';
import { useStorefrontCart } from '../../context/StorefrontCartContext';

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

  const isBookable =
    item.type === 'service' ||
    item.type === 'room' ||
    item.type === 'vehicle' ||
    item.type === 'package' ||
    item.productType === 'consultation_slot';

  const isDigital = item.productType === 'digital_file';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Main Image Banner / Carousel */}
          <div className="relative h-64 sm:h-72 bg-slate-100">
            {images.length > 0 ? (
              <SafeImage src={images[selectedImageIndex] || images[0]} alt={item.name} fallbackType="product" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                <ShoppingBag className="w-16 h-16 stroke-1" />
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {item.isOffer && (
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {item.offerText || 'Special Offer'}
                </span>
              )}
              {item.isFeatured && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
              {typeof item.isVeg === 'boolean' && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                    item.isVeg
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-700 text-white'
                  }`}
                >
                  {item.isVeg ? '🟢 Pure Veg' : '🔴 Non-Veg'}
                </span>
              )}
            </div>

            {/* Thumbnails row if multiple images */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                      selectedImageIndex === idx
                        ? 'border-emerald-500 shadow-md scale-105'
                        : 'border-white/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={img} alt={`Thumbnail ${idx}`} fallbackType="product" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6">
            {/* Title & Price Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                {item.name}
              </h2>

              <div className="flex items-baseline gap-3 mt-2">
                <div className="text-2xl font-extrabold text-emerald-700 font-heading">
                  {business.currencySymbol}
                  {currentPrice}
                  {item.unit && (
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      / {item.unit}
                    </span>
                  )}
                </div>

                {item.salePrice && item.salePrice < item.price && (
                  <div className="text-sm font-semibold text-slate-400 line-through">
                    {business.currencySymbol}
                    {item.price}
                  </div>
                )}

                {item.inStock === false && (
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Vertical specific specs */}
            {(
              (item.type === 'service' && item.durationMinutes) ||
              (item.type === 'menu_item' && (item.prepTimeMinutes || item.spiceLevel)) ||
              (item.type === 'room_stay' && (item.bedType || item.roomCapacity)) ||
              (item.type === 'rental_vehicle' && (item.vehicleModel || item.transmission || item.fuelType))
            ) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                {item.type === 'service' && item.durationMinutes && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Duration: {item.durationMinutes} mins</span>
                  </div>
                )}
                {item.type === 'menu_item' && item.prepTimeMinutes && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                    <span>Prep: ~{item.prepTimeMinutes} mins</span>
                  </div>
                )}
                {item.type === 'menu_item' && item.spiceLevel && (
                  <div className="flex items-center gap-1.5 text-slate-700 capitalize">
                    <span>🌶️ Spice: {item.spiceLevel}</span>
                  </div>
                )}
                {item.type === 'room_stay' && item.bedType && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <BedDouble className="w-4 h-4 text-blue-600" />
                    <span>Bed: {item.bedType}</span>
                  </div>
                )}
                {item.type === 'room_stay' && item.roomCapacity && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>👥 Max: {item.roomCapacity} guests</span>
                  </div>
                )}
                {item.type === 'rental_vehicle' && item.transmission && (
                  <div className="flex items-center gap-1.5 text-slate-700 capitalize">
                    <Car className="w-4 h-4 text-teal-600" />
                    <span>{item.transmission}</span>
                  </div>
                )}
                {item.type === 'rental_vehicle' && item.fuelType && (
                  <div className="flex items-center gap-1.5 text-slate-700 capitalize">
                    <span>⛽ {item.fuelType}</span>
                  </div>
                )}
              </div>
            )}

            {/* Amenities tags for stay/room */}
            {item.type === 'room_stay' && item.amenities && item.amenities.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Amenities Included
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.amenities.map((am, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/60 text-xs font-medium"
                    >
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(item.shortDescription || item.detailedDescription) && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.detailedDescription || item.shortDescription}
                </p>
              </div>
            )}

            {/* Variants Selector */}
            {item.variants && item.variants.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Choose Variant / Size
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {item.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(isSelected ? undefined : v)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs">{v.name}</span>
                        <span className="text-xs font-bold text-emerald-700">
                          {business.currencySymbol}
                          {v.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-ons Selector */}
            {item.addons && item.addons.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Custom Add-ons & Extras
                </span>
                <div className="space-y-2">
                  {item.addons.map((addon) => {
                    const isChecked = selectedAddons.some(
                      (a) => a.id === addon.id || a.name === addon.name
                    );
                    return (
                      <label
                        key={addon.id || addon.name}
                        onClick={() => handleAddonToggle(addon)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-xs ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && '✓'}
                          </div>
                          <span className="text-xs">{addon.name}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">
                          +{business.currencySymbol}
                          {addon.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
          {/* Quantity selector (for cart items) */}
          {!isBookable && (
            <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main CTA */}
          {isDigital ? (
            <button
              type="button"
              onClick={() => onBuyDigitalItem && onBuyDigitalItem(item)}
              className="flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{item.price === 0 ? 'Get File Now' : 'Buy File'}</span>
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md text-xs">
                {business.currencySymbol}{totalPrice}
              </span>
            </button>
          ) : isBookable ? (
            <button
              type="button"
              onClick={handleBookNow}
              className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book Appointment / Stay</span>
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md text-xs">
                {business.currencySymbol}
                {totalPrice}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={item.inStock === false}
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                addedSuccess
                  ? 'bg-teal-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20 disabled:opacity-50'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                  <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md text-xs">
                    {business.currencySymbol}
                    {totalPrice}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
