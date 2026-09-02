import React, { useState } from 'react';
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
  Briefcase,
} from 'lucide-react';
import { BusinessProfile, BusinessModules } from '../../types';
import { updateBusinessProfile } from '../../services/firebaseService';

interface ModuleManagerProps {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
}

interface ModuleDefinition {
  key: keyof BusinessModules;
  title: string;
  description: string;
  category: 'Catalog' | 'Ordering' | 'Bookings' | 'Marketing';
  icon: React.ReactNode;
}

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: 'catalog_products',
    title: 'Physical Products Catalog',
    description: 'Sell retail items, grocery, electronics, clothing with SKU, inventory & variants.',
    category: 'Catalog',
    icon: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: 'catalog_services',
    title: 'Services & Appointments',
    description: 'Display salon, spa, freelance, medical services with duration and pricing.',
    category: 'Catalog',
    icon: <Sparkles className="w-4 h-4 text-purple-600" />,
  },
  {
    key: 'catalog_menu',
    title: 'Restaurant & Food Menu',
    description: 'Food categories, veg/non-veg tags, spice levels, prep time & toppings.',
    category: 'Catalog',
    icon: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
  },
  {
    key: 'catalog_rooms',
    title: 'Hotel Rooms & Stays',
    description: 'Room guest capacities, bed types, amenities checklist & per-night pricing.',
    category: 'Catalog',
    icon: <BedDouble className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'catalog_vehicles',
    title: 'Vehicle Fleet & Rentals',
    description: 'Car/bike model, fuel type, transmission, seating capacity & daily rates.',
    category: 'Catalog',
    icon: <Car className="w-4 h-4 text-teal-600" />,
  },
  {
    key: 'cart_orders',
    title: 'Direct Cart & Checkout',
    description: 'Allow customers to add items to cart, select delivery/takeaway, and place orders.',
    category: 'Ordering',
    icon: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: 'dine_in_ordering',
    title: 'Dine-In / Table QR Ordering',
    description: 'Let customers enter table number for contactless in-restaurant ordering.',
    category: 'Ordering',
    icon: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
  },
  {
    key: 'whatsapp_ordering',
    title: 'Direct WhatsApp Checkout',
    description: 'One-click checkout that sends formatted order details directly to your WhatsApp.',
    category: 'Ordering',
    icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: 'booking_appointments',
    title: 'Appointment Booking Engine',
    description: 'Allow clients to pick dates and available time slots for salon/consulting.',
    category: 'Bookings',
    icon: <CalendarCheck className="w-4 h-4 text-purple-600" />,
  },
  {
    key: 'stay_booking',
    title: 'Room Reservation Engine',
    description: 'Check-in and check-out dates selector for homestays, resorts and hotels.',
    category: 'Bookings',
    icon: <BedDouble className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'rental_booking',
    title: 'Vehicle Rental Booking',
    description: 'Trip start and end dates selector for car, bike, and equipment rental.',
    category: 'Bookings',
    icon: <Car className="w-4 h-4 text-teal-600" />,
  },
  {
    key: 'customer_reviews',
    title: 'Storefront Customer Reviews',
    description: 'Allow buyers to submit ratings, reviews, and read your vendor responses.',
    category: 'Marketing',
    icon: <Star className="w-4 h-4 text-amber-600" />,
  },
  {
    key: 'offers_promotions',
    title: 'Promotions & Discount Coupons',
    description: 'Display percentage/flat promo banners and discount codes on storefront.',
    category: 'Marketing',
    icon: <Tag className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: 'work_portfolio',
    title: 'Work Portfolio / Showcase',
    description: 'Showcase showreels, galleries, case studies, client reviews, and media kit stats.',
    category: 'Marketing',
    icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
  },
];

export const ModuleManager: React.FC<ModuleManagerProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const [modules, setModules] = useState<BusinessModules>(business.modules);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleToggle = async (key: keyof BusinessModules) => {
    const updated = {
      ...modules,
      [key]: !modules[key],
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
      console.error('Error updating modules:', err);
      // Revert on error
      setModules(business.modules);
    } finally {
      setSavingKey(null);
    }
  };

  const categories = ['Catalog', 'Ordering', 'Bookings', 'Marketing'] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
          Dynamic Business Modules
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Enable or disable capabilities on the fly. Your storefront and dashboard navigation update instantly.
        </p>
      </div>

      {/* Module Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catModules = MODULE_DEFINITIONS.filter((m) => m.category === cat);
          return (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                          ? 'bg-white border-emerald-300 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-70'
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
                        onClick={() => handleToggle(mod.key)}
                        className={`p-1 rounded-xl transition cursor-pointer shrink-0 ${
                          isEnabled ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                        }`}
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
    </div>
  );
};
