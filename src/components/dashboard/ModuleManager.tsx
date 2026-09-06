import React, { useState } from "react";
import {
  Sparkles,
  Check,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShoppingBag,
  CalendarCheck,
  MessageCircle,
  CreditCard,
  Star,
  Tag,
  Loader2,
  UtensilsCrossed,
  BedDouble,
  Car,
  Layers,
  Share2,
  Box,
  Sliders,
} from "lucide-react";
import { BusinessProfile, BusinessModules } from "../../types";
import { updateBusinessProfile } from "../../services/firebaseService";
import { ConfirmActionModal } from "../common/ConfirmActionModal";
import { isCreatorProfile } from "../../utils/profileHelper";

interface ModuleManagerProps {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
  onNavigateTab?: (tab: any) => void;
}

interface ModuleDefinition {
  key: keyof BusinessModules;
  title: string;
  description: string;
  category: "Catalog" | "Ordering" | "Bookings" | "Marketing";
  icon: React.ReactNode;
}

const COMMERCE_MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: "products",
    title: "Physical Products Catalog",
    description:
      "Sell retail goods, groceries, electronics, apparel with variants, SKUs and inventory tracking.",
    category: "Catalog",
    icon: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: "menu",
    title: "Restaurant & Food Menu",
    description:
      "Digital food menu with veg/non-veg tags, spice levels, preparation times & custom toppings.",
    category: "Catalog",
    icon: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
  },
  {
    key: "services",
    title: "Services & Rates",
    description:
      "Display salon, spa, freelance, medical, and repair services with duration and transparent pricing.",
    category: "Catalog",
    icon: <Sparkles className="w-4 h-4 text-purple-600" />,
  },
  {
    key: "rooms",
    title: "Hotel Rooms & Stays",
    description:
      "Room guest capacities, bed types, amenities checklist & per-night pricing for hotels and homestays.",
    category: "Catalog",
    icon: <BedDouble className="w-4 h-4 text-blue-600" />,
  },
  {
    key: "vehicles",
    title: "Vehicle Fleet & Rentals",
    description:
      "Car and bike model listings, fuel types, transmission, seating capacity & daily rates.",
    category: "Catalog",
    icon: <Car className="w-4 h-4 text-teal-600" />,
  },
  {
    key: "inventory_tracking",
    title: "Inventory & Stock Tracking",
    description:
      "Track real-time stock levels, low-stock warnings, and out-of-stock badges on product items.",
    category: "Catalog",
    icon: <Box className="w-4 h-4 text-indigo-600" />,
  },
  {
    key: "cart_ordering",
    title: "Direct Cart & Checkout",
    description:
      "Allow buyers to add multiple items to cart, choose delivery or pickup, and place orders online.",
    category: "Ordering",
    icon: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: "table_delivery",
    title: "Dine-In / Table QR Ordering",
    description:
      "Let in-house diners scan a table QR code and submit contactless kitchen food orders.",
    category: "Ordering",
    icon: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
  },
  {
    key: "inquiries",
    title: "Direct WhatsApp Checkout",
    description:
      "One-click ordering button that sends item summary and customer details straight to your WhatsApp.",
    category: "Ordering",
    icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: "booking_appointments",
    title: "Appointment Booking Engine",
    description:
      "Allow clients to select dates and choose available time slots for service sessions.",
    category: "Bookings",
    icon: <CalendarCheck className="w-4 h-4 text-purple-600" />,
  },
  {
    key: "stay_booking",
    title: "Room Reservation Engine",
    description:
      "Check-in and check-out date picker for homestays, resorts, boutique hotels and villas.",
    category: "Bookings",
    icon: <BedDouble className="w-4 h-4 text-blue-600" />,
  },
  {
    key: "rental_booking",
    title: "Vehicle Rental Booking",
    description:
      "Trip start and end date selector for rental cars, bikes, cameras, and equipment.",
    category: "Bookings",
    icon: <Car className="w-4 h-4 text-teal-600" />,
  },
  {
    key: "reviews",
    title: "Customer Reviews & Ratings",
    description:
      "Allow verified buyers to submit star ratings, reviews, and read vendor replies on your store.",
    category: "Marketing",
    icon: <Star className="w-4 h-4 text-amber-600" />,
  },
  {
    key: "offers",
    title: "Promotions & Discount Coupons",
    description:
      "Display banner promotions, percentage discounts, and coupon code entry during checkout.",
    category: "Marketing",
    icon: <Tag className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: "digital_card",
    title: "Digital Visiting Card & QR",
    description:
      "Generate shareable digital business cards with your contact details, map location, and QR code.",
    category: "Marketing",
    icon: <Share2 className="w-4 h-4 text-indigo-600" />,
  },
];

export const ModuleManager: React.FC<ModuleManagerProps> = ({
  business,
  onBusinessUpdated,
  onNavigateTab,
}) => {
  const [modules, setModules] = useState<BusinessModules>(business.modules);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [moduleToDisable, setModuleToDisable] = useState<ModuleDefinition | null>(null);

  const applyToggle = async (key: keyof BusinessModules, nextValue: boolean) => {
    const updated = {
      ...modules,
      [key]: nextValue,
    };
    setModules(updated);
    setSavingKey(key);

    try {
      await updateBusinessProfile(business.id, { modules: updated });
      onBusinessUpdated({
        ...business,
        modules: updated,
      });
    } catch (err) {
      console.error("Error updating modules:", err);
      // Revert on error
      setModules(business.modules);
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleClick = (mod: ModuleDefinition) => {
    const isCurrentlyEnabled = !!modules[mod.key];
    if (isCurrentlyEnabled) {
      // Opening confirm dialog before disabling
      setModuleToDisable(mod);
    } else {
      // Enable immediately
      applyToggle(mod.key, true);
    }
  };

  const confirmDisableModule = () => {
    if (moduleToDisable) {
      applyToggle(moduleToDisable.key, false);
      setModuleToDisable(null);
    }
  };

  const categories = ["Catalog", "Ordering", "Bookings", "Marketing"] as const;
  const isCreator = isCreatorProfile(business);

  if (isCreator) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Creator Account Detected
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
              Creator Modules Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              This profile is registered as a Creator account. Manage your Portfolio Showcase, Bio Links, Digital Downloads, and 1:1 Bookings in the Creator Modules Hub.
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('modules')}
              className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>Open Creator Modules</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Vendor Commerce Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
            Dynamic Store Modules
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Configure business capabilities for your retail storefront. Activated features immediately reflect on your navigation sidebar and live store.
          </p>
        </div>
      </div>

      {/* Module Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catModules = COMMERCE_MODULE_DEFINITIONS.filter(
            (m) => m.category === cat,
          );
          return (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {cat} Capabilities
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {catModules.map((mod) => {
                  const isEnabled = !!modules[mod.key];
                  const isSavingThis = savingKey === mod.key;

                  return (
                    <div
                      key={mod.key}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        isEnabled
                          ? "bg-white border-emerald-300 shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 opacity-70"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          {mod.icon}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{mod.title}</span>
                            {isEnabled && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Active
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleToggleClick(mod)}
                        className={`p-1 rounded-xl transition cursor-pointer shrink-0 ${
                          isEnabled
                            ? "text-emerald-600"
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                        title={isEnabled ? "Click to disable module" : "Click to enable module"}
                      >
                        {isSavingThis ? (
                          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                        ) : isEnabled ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog for Disabling Module */}
      <ConfirmActionModal
        isOpen={!!moduleToDisable}
        title={`Deactivate ${moduleToDisable?.title || "Module"}?`}
        message={`Are you sure you want to turn off "${moduleToDisable?.title}"? This will hide the corresponding capability from your storefront and dashboard until you enable it again.`}
        confirmText="Deactivate Module"
        cancelText="Keep Active"
        isDestructive={true}
        onConfirm={confirmDisableModule}
        onCancel={() => setModuleToDisable(null)}
      />
    </div>
  );
};
