import React, { useState } from 'react';
import {
  Store,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  Package,
  CheckCircle2,
  Loader2,
  Briefcase,
  Link as LinkIcon,
  ShoppingBag,
  CalendarCheck,
  FileText,
  Ticket,
  Instagram,
  Globe,
  ShoppingCart,
  UtensilsCrossed,
  Cake,
  Scissors,
  Stethoscope,
  Hotel,
  Car,
  Building2,
  Shirt,
  Gem,
  Smartphone,
  Armchair,
  GraduationCap,
  Wrench,
  Laptop,
  BedDouble,
  Tag,
  Boxes,
  QrCode,
  Star,
  Key,
  X,
  LogOut,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { BusinessProfile, BusinessType, BusinessModuleConfig, ProfileType } from '../../types';
import {
  BUSINESS_TYPES,
  MODULE_DEFINITIONS,
  VERTICAL_RELEVANT_MODULES,
  getRelevantModulesForVertical,
} from '../../services/businessConfig';
import { generateSlug, createCategory, createCatalogItem, createBioLink } from '../../services/firebaseService';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { getAppLogo } from '../../utils/branding';

interface OnboardingWizardProps {
  onComplete: (business: BusinessProfile) => void;
  onCancel?: () => void;
  createBusinessFn: (data: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<BusinessProfile>;
  currentUserEmail?: string;
  currentUserName?: string;
  onSignOut?: () => void;
}

// 17 Vendor Verticals in exact required sequence
const VENDOR_VERTICAL_KEYS: BusinessType[] = [
  'retail',
  'restaurant',
  'grocery',
  'bakery',
  'salon',
  'clinic',
  'hotel',
  'rental',
  'real_estate',
  'fashion',
  'jewellery',
  'electronics',
  'furniture',
  'education',
  'services',
  'agency',
  'custom',
];

const getVerticalIcon = (verticalId: BusinessType) => {
  switch (verticalId) {
    case 'retail':
      return ShoppingBag;
    case 'restaurant':
      return UtensilsCrossed;
    case 'grocery':
      return Store;
    case 'bakery':
      return Cake;
    case 'salon':
      return Scissors;
    case 'clinic':
      return Stethoscope;
    case 'hotel':
      return Hotel;
    case 'rental':
      return Car;
    case 'real_estate':
      return Building2;
    case 'fashion':
      return Shirt;
    case 'jewellery':
      return Gem;
    case 'electronics':
      return Smartphone;
    case 'furniture':
      return Armchair;
    case 'education':
      return GraduationCap;
    case 'services':
      return Wrench;
    case 'agency':
      return Laptop;
    case 'custom':
      return Briefcase;
    default:
      return Store;
  }
};

const getModuleIcon = (moduleKey: keyof BusinessModuleConfig) => {
  switch (moduleKey) {
    case 'products':
      return Package;
    case 'menu':
      return UtensilsCrossed;
    case 'services':
      return Sparkles;
    case 'rooms':
      return BedDouble;
    case 'vehicles':
      return Car;
    case 'cart_ordering':
      return ShoppingCart;
    case 'table_delivery':
      return UtensilsCrossed;
    case 'booking_appointments':
      return CalendarCheck;
    case 'stay_booking':
      return Hotel;
    case 'rental_booking':
      return Key;
    case 'inquiries':
      return MessageCircle;
    case 'reviews':
      return Star;
    case 'offers':
      return Tag;
    case 'digital_card':
      return QrCode;
    case 'inventory_tracking':
      return Boxes;
    case 'digital_products':
      return FileText;
    default:
      return Sliders;
  }
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onCancel,
  createBusinessFn,
  currentUserEmail,
  currentUserName,
  onSignOut,
}) => {
  // Step 0: Profile Type ('vendor' vs 'creator'). Default to vendor
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType>('vendor');
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common Identity States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [professionTitle, setProfessionTitle] = useState('Designer / Creator');

  // Contact States
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(currentUserEmail || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Branding States
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  // Vendor-Specific States
  const [vendorType, setVendorType] = useState<BusinessType>('retail');
  // Initialize vendorModules strictly from retail's relevant modules
  const [vendorModules, setVendorModules] = useState<BusinessModuleConfig>(() => {
    const meta = BUSINESS_TYPES.retail;
    const relevant = VERTICAL_RELEVANT_MODULES.retail;
    const initialConfig: BusinessModuleConfig = {};
    for (const key of relevant) {
      initialConfig[key] = meta.defaultModules[key] !== undefined ? meta.defaultModules[key] : true;
    }
    return initialConfig;
  });

  const [initialCategoryName, setInitialCategoryName] = useState('Featured');
  const [initialItemName, setInitialItemName] = useState('');
  const [initialItemPrice, setInitialItemPrice] = useState<number>(199);
  const [initialItemImage, setInitialItemImage] = useState('');
  // Vertical-specific initial item fields
  const [initialItemDuration, setInitialItemDuration] = useState<number>(30);
  const [initialItemIsVeg, setInitialItemIsVeg] = useState<boolean>(true);
  const [initialItemSpice, setInitialItemSpice] = useState<'mild' | 'medium' | 'hot'>('mild');
  const [initialItemPrepTime, setInitialItemPrepTime] = useState<number>(20);
  const [initialItemRoomCapacity, setInitialItemRoomCapacity] = useState<number>(2);
  const [initialItemBedType, setInitialItemBedType] = useState<string>('King Bed');
  const [initialItemVehicleModel, setInitialItemVehicleModel] = useState<string>('');
  const [initialItemFuelType, setInitialItemFuelType] = useState<'petrol' | 'diesel' | 'electric' | 'cng'>('petrol');
  const [initialItemTransmission, setInitialItemTransmission] = useState<'manual' | 'automatic'>('manual');
  const [initialItemStock, setInitialItemStock] = useState<number>(50);
  const [initialItemUnit, setInitialItemUnit] = useState<string>('pcs');

  // Creator-Specific Module Toggles
  const [creatorModules, setCreatorModules] = useState<BusinessModuleConfig>({
    universal_links: true,
    work_portfolio: true,
    portfolio: true,
    digital_products: false,
    booking_appointments: false,
    custom_quotes: false,
    events_tickets: false,
    reviews: true,
    products: false,
    cart_ordering: false,
    table_delivery: false,
  });

  // Creator Social Links
  const [instagramHandle, setInstagramHandle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Auto-slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
    if (!username || username === generateSlug(name)) {
      setUsername(generateSlug(val));
    }
  };

  const handleVendorTypeSelect = (selectedType: BusinessType) => {
    setVendorType(selectedType);
    const meta = BUSINESS_TYPES[selectedType];
    const relevantKeys = getRelevantModulesForVertical(selectedType);

    // Build module config containing ONLY the relevant modules for this vertical
    const newConfig: BusinessModuleConfig = {};
    for (const key of relevantKeys) {
      newConfig[key] = meta.defaultModules[key] !== undefined ? meta.defaultModules[key] : true;
    }
    setVendorModules(newConfig);

    if (meta.suggestedCategories && meta.suggestedCategories.length > 0) {
      setInitialCategoryName(meta.suggestedCategories[0]);
    }
  };

  const handleVendorModuleToggle = (key: keyof BusinessModuleConfig) => {
    setVendorModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCreatorModuleToggle = (key: keyof BusinessModuleConfig) => {
    setCreatorModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const currentVerticalMeta = BUSINESS_TYPES[vendorType] || BUSINESS_TYPES.retail;
  const relevantModuleKeys = getRelevantModulesForVertical(vendorType);

  const handleFinalSubmit = async () => {
    if (!name.trim()) {
      setError('Business name is required');
      setStep(1);
      return;
    }
    if (!whatsapp.trim() && !phone.trim()) {
      setError('WhatsApp or phone number is required to receive customer orders');
      setStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const cleanPhone = phone.trim() || whatsapp.trim();
      const cleanWhatsApp = whatsapp.trim() || phone.trim();
      const isCreator = selectedProfileType === 'creator';

      let finalModules: BusinessModuleConfig;

      if (isCreator) {
        finalModules = {
          universal_links: Boolean(creatorModules.universal_links),
          work_portfolio: Boolean(creatorModules.work_portfolio || creatorModules.portfolio),
          portfolio: Boolean(creatorModules.work_portfolio || creatorModules.portfolio),
          digital_products: Boolean(creatorModules.digital_products),
          booking_appointments: Boolean(creatorModules.booking_appointments),
          custom_quotes: Boolean(creatorModules.custom_quotes),
          events_tickets: Boolean(creatorModules.events_tickets),
          reviews: true,
          products: false,
          cart_ordering: false,
          table_delivery: false,
          analytics: true,
        };
      } else {
        // Strict Vendor module saving:
        // Initialize ALL unrelated modules as explicitly false
        const relevantKeysSet = new Set(getRelevantModulesForVertical(vendorType));
        finalModules = {
          products: false,
          services: false,
          menu: false,
          rooms: false,
          vehicles: false,
          cart_ordering: false,
          table_delivery: false,
          booking_appointments: false,
          stay_booking: false,
          rental_booking: false,
          inquiries: false,
          reviews: false,
          offers: false,
          digital_card: false,
          inventory_tracking: false,
          digital_products: false,
          universal_links: false,
          work_portfolio: false,
          portfolio: false,
          custom_quotes: false,
          events_tickets: false,
          analytics: true,
        };

        // Enable ONLY relevant modules that the vendor toggled on
        for (const key of relevantKeysSet) {
          if (vendorModules[key]) {
            finalModules[key] = true;
          }
        }
      }

      const businessData: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        username: username.trim() || generateSlug(name),
        slug: slug.trim() || generateSlug(name),
        profileType: isCreator ? 'creator' : 'vendor',
        storeType: isCreator ? 'creator' : 'vendor',
        type: isCreator ? 'digital_creator' : vendorType,
        category: isCreator ? 'creator' : vendorType,
        tagline: tagline.trim() || (isCreator ? professionTitle : ''),
        description: description.trim() || '',
        bio: isCreator ? description.trim() || tagline.trim() : undefined,
        logo: logo.trim() || '',
        profileImage: isCreator ? logo.trim() || '' : undefined,
        banner: banner.trim() || '',
        coverImage: banner.trim() || '',
        phone: cleanPhone,
        whatsapp: cleanWhatsApp,
        email: email.trim() || currentUserEmail || '',
        address: isCreator ? '' : address.trim() || '',
        city: city.trim() || '',
        currency: currency || 'INR',
        currencySymbol: currencySymbol || '₹',
        deliveryAvailable: isCreator ? false : Boolean(finalModules.table_delivery || finalModules.cart_ordering),
        modules: finalModules,
        status: 'active',
        socials: {
          instagram: instagramHandle ? `https://instagram.com/${instagramHandle.replace('@', '')}` : '',
          youtube: youtubeUrl,
          website: websiteUrl,
          linkedin: linkedinUrl,
        },
        portfolioSettings: isCreator
          ? {
              profession: 'custom',
              themeColor: 'indigo',
              template: 'designer',
              ctaMode: 'whatsapp',
            }
          : undefined,
      };

      const newBiz = await createBusinessFn(businessData);

      // Create initial category and item for vendors if provided
      if (!isCreator && initialCategoryName.trim()) {
        try {
          const cat = await createCategory(newBiz.id, {
            name: initialCategoryName.trim(),
            slug: generateSlug(initialCategoryName),
            sortOrder: 0,
            isActive: true,
          });

          if (initialItemName.trim()) {
            const isFood = vendorType === 'restaurant' || vendorType === 'bakery';
            const isHotel = vendorType === 'hotel';
            const isRental = vendorType === 'rental';
            const isService = vendorType === 'salon' || vendorType === 'clinic' || vendorType === 'services' || vendorType === 'agency';

            await createCatalogItem(newBiz.id, {
              slug: generateSlug(initialItemName),
              name: initialItemName.trim(),
              type: isFood
                ? 'menu_item'
                : isHotel
                ? 'room'
                : isRental
                ? 'vehicle'
                : isService
                ? 'service'
                : 'product',
              categoryId: cat.id,
              shortDescription: `Freshly listed offering for ${name.trim()}`,
              detailedDescription: '',
              price: initialItemPrice || 199,
              salePrice: initialItemPrice || 199,
              unit: isHotel ? 'night' : isRental ? 'day' : isFood ? 'portion' : isService ? 'session' : initialItemUnit || currentVerticalMeta.itemLabel.toLowerCase(),
              images: initialItemImage ? [initialItemImage] : [],
              inStock: true,
              stockQuantity: !isService && !isHotel && !isFood ? initialItemStock : undefined,
              durationMinutes: isService ? initialItemDuration : undefined,
              isVeg: isFood ? initialItemIsVeg : undefined,
              spiceLevel: isFood ? initialItemSpice : undefined,
              prepTimeMinutes: isFood ? initialItemPrepTime : undefined,
              roomCapacity: isHotel ? initialItemRoomCapacity : undefined,
              bedType: isHotel ? initialItemBedType : undefined,
              vehicleModel: isRental ? initialItemVehicleModel || undefined : undefined,
              fuelType: isRental ? initialItemFuelType : undefined,
              transmission: isRental ? initialItemTransmission : undefined,
              isFeatured: true,
              isOffer: false,
              isActive: true,
            });
          }
        } catch (catErr) {
          console.warn('Initial category creation non-blocking notice:', catErr);
        }
      }

      // If creator added Instagram or WhatsApp, create initial Bio Links
      if (isCreator && creatorModules.universal_links) {
        try {
          if (cleanWhatsApp) {
            await createBioLink(newBiz.id, {
              businessId: newBiz.id,
              type: 'whatsapp',
              title: 'Chat on WhatsApp',
              url: `https://wa.me/${cleanWhatsApp.replace(/[^0-9]/g, '')}`,
              enabled: true,
              clicks: 0,
            });
          }
          if (instagramHandle) {
            await createBioLink(newBiz.id, {
              businessId: newBiz.id,
              type: 'instagram',
              title: 'Follow on Instagram',
              url: `https://instagram.com/${instagramHandle.replace('@', '')}`,
              enabled: true,
              clicks: 0,
            });
          }
        } catch (linkErr) {
          console.warn('Initial bio link creation notice:', linkErr);
        }
      }

      onComplete(newBiz);
    } catch (err: any) {
      console.error('Failed to create store:', err);
      setError(err?.message || 'Failed to initialize store profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = selectedProfileType === 'creator' ? 3 : 4;

  const vendorStepTitles = [
    { num: 1, title: 'Identity & Vertical' },
    { num: 2, title: 'Contact & WhatsApp' },
    { num: 3, title: 'Store Branding' },
    { num: 4, title: 'Modules & Launch' },
  ];

  const creatorStepTitles = [
    { num: 1, title: 'Handle & Identity' },
    { num: 2, title: 'Creator Modules' },
    { num: 3, title: 'Avatar & Socials' },
  ];

  const currentStepList = selectedProfileType === 'creator' ? creatorStepTitles : vendorStepTitles;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* =========================================================================
          FULL-PAGE SAAS TOP HEADER
         ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center bg-white p-1">
            <img src={getAppLogo()} alt="Storelly" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-900 font-heading">Storelly</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/60">
                Setup Wizard
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {selectedProfileType === 'creator' ? 'Creator Studio Setup' : 'Vendor Merchant Store Setup'}
            </p>
          </div>
        </div>

        {/* Center: Desktop / Tablet Step Stepper */}
        {step > 0 && (
          <nav aria-label="Progress" className="hidden md:flex items-center gap-2">
            {currentStepList.map((s, idx) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <React.Fragment key={s.num}>
                  {idx > 0 && (
                    <div
                      className={`h-0.5 w-6 transition-colors ${
                        isPassed ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isPassed) setStep(s.num);
                    }}
                    disabled={!isPassed}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isCurrent
                        ? selectedProfileType === 'creator'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : isPassed
                        ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.num}
                    </span>
                    <span className="hidden lg:inline">{s.title}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Right: Actions (Exit or Sign Out) */}
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Type</span>
            </button>
          )}

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Setup</span>
            </button>
          ) : onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Mobile Step Progress Indicator */}
      {step > 0 && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                selectedProfileType === 'creator' ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
            />
            <span className="font-bold text-slate-800">
              Step {step} of {totalSteps}: {currentStepList[step - 1]?.title}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
      )}

      {/* =========================================================================
          MAIN FULL-PAGE SAAS CONTAINER
         ========================================================================= */}
      <main className="flex-1 flex flex-col justify-start max-w-4xl lg:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between animate-in fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-100 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-8 md:p-10 space-y-8">
          {/* =========================================================================
              STEP 0: PROFILE TYPE SELECTION (VENDOR VS CREATOR)
             ========================================================================= */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Workspace Setup • Choose Profile Type
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                  What kind of business are you launching?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                  Select your profile type to configure the right modules, checkout flow, and catalog structure.
                </p>
              </div>

              {/* Two Decision Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full pt-2">
                {/* VENDOR CARD */}
                <div
                  onClick={() => setSelectedProfileType('vendor')}
                  className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full relative bg-white group ${
                    selectedProfileType === 'vendor'
                      ? 'border-emerald-600 ring-4 ring-emerald-500/15 shadow-xl shadow-emerald-600/10'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  {selectedProfileType === 'vendor' && (
                    <div className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-in zoom-in">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        Physical Commerce &amp; Local Business
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 font-heading tracking-tight mt-2">
                        Vendor / Merchant Store
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        For physical stores, retail shops, restaurants, salons, hotels, clinics, and service providers. Receive orders directly on WhatsApp.
                      </p>
                    </div>

                    <div className="w-full aspect-[16/9] rounded-2xl bg-slate-50 border border-slate-200/90 overflow-hidden flex items-center justify-center relative p-2 shadow-2xs">
                      <img
                        src="/storelly6.jpg"
                        alt="Vendor Store"
                        className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/storelly6.jpg.jpeg';
                        }}
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Includes tailored modules for:</span>
                        <span className="text-emerald-700 text-[10px] font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                          17 Verticals
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Retail, Food &amp; Grocery</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Salons, Spas &amp; Clinics</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Hotels, Stays &amp; Rentals</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">WhatsApp Ordering &amp; QR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfileType('vendor');
                        setStep(1);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue as Vendor Merchant</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CREATOR CARD */}
                <div
                  onClick={() => setSelectedProfileType('creator')}
                  className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full relative bg-white group ${
                    selectedProfileType === 'creator'
                      ? 'border-indigo-600 ring-4 ring-indigo-500/15 shadow-xl shadow-indigo-600/10'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {selectedProfileType === 'creator' && (
                    <div className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-in zoom-in">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                        Digital Portfolio &amp; Downloads
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 font-heading tracking-tight mt-2">
                        Creator &amp; Portfolio Studio
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        For designers, consultants, agencies, developers, and educators. Showcase case studies, share bio links, and sell digital files.
                      </p>
                    </div>

                    <div className="w-full aspect-[16/9] rounded-2xl bg-slate-50 border border-slate-200/90 overflow-hidden flex items-center justify-center relative p-2 shadow-2xs">
                      <img
                        src="/cteatorlink.jpeg"
                        alt="Creator Studio"
                        className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Includes creator capabilities:</span>
                        <span className="text-indigo-700 text-[10px] font-bold bg-indigo-100 px-2 py-0.5 rounded-md">
                          Studio Suite
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">Portfolio Showcase</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">Universal Bio Link Hub</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">Digital Products / PDFs</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">1:1 Paid Consultations</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfileType('creator');
                        setStep(1);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue as Creator Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VENDOR ONBOARDING FLOW
             ========================================================================= */}
          {selectedProfileType === 'vendor' && step > 0 && (
            <div className="space-y-6">
              {/* VENDOR STEP 1: Business Identity & Business Vertical */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Business Identity &amp; Vertical
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Set your store name, URL slug, and select your business vertical.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Business Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder={`e.g. ${currentVerticalMeta.label} Store`}
                        className="w-full px-4 py-3 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                        required
                      />
                    </div>

                    {/* Slug & Tagline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Store URL Slug *
                        </label>
                        <div className="flex items-center text-xs border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition">
                          <span className="pl-3.5 text-slate-400 font-mono select-none">storelly.app/store/</span>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(generateSlug(e.target.value))}
                            placeholder="store-slug"
                            className="w-full py-3 pr-3 text-xs bg-transparent focus:outline-hidden font-mono text-emerald-800 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Tagline / One-liner
                        </label>
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          placeholder="e.g. Quality You Can Trust"
                          className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                        />
                      </div>
                    </div>

                    {/* Business Vertical Selection (17 Verticals Grid) */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Business Vertical * ({VENDOR_VERTICAL_KEYS.length} Verticals Available)
                        </label>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Selected: {currentVerticalMeta.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/70">
                        {VENDOR_VERTICAL_KEYS.map((vertId) => {
                          const vertMeta = BUSINESS_TYPES[vertId];
                          if (!vertMeta) return null;
                          const isSelected = vendorType === vertId;
                          const IconComp = getVerticalIcon(vertId);

                          return (
                            <button
                              key={vertId}
                              type="button"
                              onClick={() => handleVendorTypeSelect(vertId)}
                              className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between min-h-[92px] cursor-pointer group ${
                                isSelected
                                  ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/25 shadow-md text-slate-900'
                                  : 'bg-white/80 border-slate-200/90 text-slate-700 hover:border-emerald-300 hover:bg-white hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between w-full mb-1.5">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="text-xs font-bold leading-tight truncate">{vertMeta.label}</h3>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                                  {vertMeta.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Modules and first item fields will automatically tailor to your selected vertical.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Type</span>
                    </button>

                    <button
                      type="button"
                      disabled={!name.trim()}
                      onClick={() => {
                        if (!name.trim()) {
                          setError('Please enter your business name');
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Contact</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* VENDOR STEP 2: Contact & WhatsApp Ordering */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Contact &amp; WhatsApp Ordering
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Customer orders, inquiries, and booking confirmations will be dispatched directly to your WhatsApp.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          WhatsApp Order Number *
                        </label>
                        <div className="relative">
                          <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                          <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => {
                              setWhatsapp(e.target.value);
                              if (!phone) setPhone(e.target.value);
                            }}
                            placeholder="e.g. +91 9876543210"
                            className="w-full pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                            required
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Orders from storefront cart will open directly in this WhatsApp chat
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Calling Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +91 9876543210"
                            className="w-full pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          City / Locality
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Mumbai, Bengaluru, Delhi"
                          className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Store Currency
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => {
                            setCurrency(e.target.value);
                            setCurrencySymbol(
                              e.target.value === 'INR'
                                ? '₹'
                                : e.target.value === 'USD'
                                ? '$'
                                : e.target.value === 'EUR'
                                ? '€'
                                : e.target.value === 'GBP'
                                ? '£'
                                : '₹'
                            );
                          }}
                          className="w-full px-4 py-3 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white transition"
                        >
                          <option value="INR">INR (₹ - Indian Rupee)</option>
                          <option value="USD">USD ($ - US Dollar)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                          <option value="GBP">GBP (£ - British Pound)</option>
                          <option value="AED">AED (AED - UAE Dirham)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Physical Store / Office Address (Optional)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Shop / Unit Number, Street Name, Landmark, PIN Code"
                          rows={2}
                          className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      disabled={!whatsapp.trim() && !phone.trim()}
                      onClick={() => {
                        if (!whatsapp.trim() && !phone.trim()) {
                          setError('WhatsApp order number is required');
                          return;
                        }
                        setError(null);
                        setStep(3);
                      }}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Branding</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* VENDOR STEP 3: Store Branding */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Store Branding &amp; Visuals
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Upload your store logo and banner image to build credibility with buyers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ImageUploadInput
                      label="Store Logo / Profile Picture"
                      value={logo}
                      onChange={setLogo}
                      aspectRatio="square"
                      suggestedPresetType="logo"
                      helperText="Square 1:1 image displayed on your storefront and WhatsApp shares"
                    />

                    <ImageUploadInput
                      label="Store Header Banner"
                      value={banner}
                      onChange={setBanner}
                      aspectRatio="banner"
                      suggestedPresetType="banner"
                      helperText="16:9 banner displayed across the top of your digital store"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Modules</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* VENDOR STEP 4: Tailored Modules & Launch */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                        Tailored for {currentVerticalMeta.label}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-1">
                      Relevant Modules &amp; Launch
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      We’ve activated only the modules built for your vertical. Unrelated features are automatically disabled.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* ONLY RELEVANT MODULES DISPLAYED */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Active Store Modules ({relevantModuleKeys.length} Relevant for {currentVerticalMeta.label})
                        </label>
                        <span className="text-[10px] text-slate-400">Toggle any module on/off</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {relevantModuleKeys.map((modKey) => {
                          const modDef = MODULE_DEFINITIONS.find((m) => m.key === modKey);
                          const isEnabled = Boolean(vendorModules[modKey]);
                          const IconComp = getModuleIcon(modKey);

                          return (
                            <button
                              key={modKey}
                              type="button"
                              onClick={() => handleVendorModuleToggle(modKey)}
                              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                                isEnabled
                                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20 text-emerald-950 shadow-xs'
                                  : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                    isEnabled
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                    isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}
                                >
                                  {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-bold text-xs truncate">
                                  {modDef?.label || String(modKey).replace(/_/g, ' ')}
                                </h3>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-tight">
                                  {modDef?.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* First Offering / Item Tailored to Vertical */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>Add Your First {currentVerticalMeta.itemLabel} (Optional)</span>
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Can be updated anytime
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            {currentVerticalMeta.categoryName} *
                          </label>
                          <input
                            type="text"
                            value={initialCategoryName}
                            onChange={(e) => setInitialCategoryName(e.target.value)}
                            placeholder={`e.g. ${currentVerticalMeta.suggestedCategories[0] || 'Featured'}`}
                            className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Price ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            value={initialItemPrice}
                            onChange={(e) => setInitialItemPrice(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {currentVerticalMeta.itemLabel} Name
                        </label>
                        <input
                          type="text"
                          value={initialItemName}
                          onChange={(e) => setInitialItemName(e.target.value)}
                          placeholder={`e.g. Signature ${currentVerticalMeta.itemLabel}`}
                          className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <ImageUploadInput
                        label={`${currentVerticalMeta.itemLabel} Photo (Optional)`}
                        value={initialItemImage}
                        onChange={setInitialItemImage}
                        aspectRatio="square"
                        suggestedPresetType="item"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep(3)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSubmit}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Setting Up Storefront...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Launch {name || 'Store'} Storefront</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              CREATOR ONBOARDING FLOW
             ========================================================================= */}
          {selectedProfileType === 'creator' && step > 0 && (
            <div className="space-y-6">
              {/* CREATOR STEP 1 */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Creator Identity &amp; Handle
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Set your creator brand name, public @handle, and professional title.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Creator / Brand Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. Alex Rivera, DevStudio"
                          className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Public Handle @username *
                        </label>
                        <div className="flex items-center text-xs border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                          <span className="pl-3.5 text-slate-400 font-mono">@</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                              setUsername(generateSlug(e.target.value));
                              setSlug(generateSlug(e.target.value));
                            }}
                            placeholder="username"
                            className="w-full py-3 pr-3 text-xs bg-transparent focus:outline-hidden font-mono text-indigo-800 font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Profession / Headline *
                        </label>
                        <input
                          type="text"
                          value={professionTitle}
                          onChange={(e) => setProfessionTitle(e.target.value)}
                          placeholder="e.g. UI/UX Designer, Growth Consultant"
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          WhatsApp / Contact Phone *
                        </label>
                        <div className="relative">
                          <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                          <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => {
                              setWhatsapp(e.target.value);
                              if (!phone) setPhone(e.target.value);
                            }}
                            placeholder="e.g. +91 9876543210"
                            className="w-full pl-10 pr-4 py-3 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Bio / Elevator Pitch (Optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Helping startups craft conversion-focused digital products and brand systems."
                        rows={2}
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Type</span>
                    </button>
                    <button
                      type="button"
                      disabled={!name.trim() || !whatsapp.trim()}
                      onClick={() => {
                        if (!name.trim() || !whatsapp.trim()) {
                          setError('Name and contact number are required');
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Modules</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* CREATOR STEP 2 */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Select Your Creator Modules
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Choose the features you want active on your creator workspace.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Portfolio */}
                    <div
                      onClick={() => handleCreatorModuleToggle('work_portfolio')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        creatorModules.work_portfolio || creatorModules.portfolio
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">Portfolio Website</h3>
                            <span className="text-[10px] text-indigo-700 font-bold uppercase">
                              /portfolio/{slug || 'username'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            creatorModules.work_portfolio || creatorModules.portfolio
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {(creatorModules.work_portfolio || creatorModules.portfolio) && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        Showcase case studies, project galleries, skills, client testimonials, and services.
                      </p>
                    </div>

                    {/* Bio Link */}
                    <div
                      onClick={() => handleCreatorModuleToggle('universal_links')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        creatorModules.universal_links
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                            <LinkIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">Universal Bio Link</h3>
                            <span className="text-[10px] text-purple-700 font-bold uppercase">
                              /@{slug || 'username'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            creatorModules.universal_links ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {creatorModules.universal_links && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        All your social channels, resources, communities, and links in one link-in-bio hub.
                      </p>
                    </div>

                    {/* Digital Products */}
                    <div
                      onClick={() => handleCreatorModuleToggle('digital_products')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        creatorModules.digital_products
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">Digital Products</h3>
                            <span className="text-[10px] text-teal-700 font-bold uppercase">PDFs &amp; Files</span>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            creatorModules.digital_products ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {creatorModules.digital_products && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        Sell downloadable templates, design kits, codes, e-books, and guides.
                      </p>
                    </div>

                    {/* Consultations */}
                    <div
                      onClick={() => handleCreatorModuleToggle('booking_appointments')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        creatorModules.booking_appointments
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <CalendarCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">1:1 Consultations</h3>
                            <span className="text-[10px] text-blue-700 font-bold uppercase">Paid Calls</span>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            creatorModules.booking_appointments
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {creatorModules.booking_appointments && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        Offer 1-on-1 mentorship, strategy audits, and consultation appointments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Branding</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* CREATOR STEP 3 */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Profile Photo &amp; Social Links
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Upload your avatar photo and connect your social handles.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ImageUploadInput
                      label="Creator Avatar / Photo"
                      value={logo}
                      onChange={setLogo}
                      aspectRatio="square"
                      suggestedPresetType="logo"
                      helperText="Square 1:1 headshot or brand mark"
                    />

                    <ImageUploadInput
                      label="Cover Banner (Optional)"
                      value={banner}
                      onChange={setBanner}
                      aspectRatio="banner"
                      suggestedPresetType="banner"
                      helperText="16:9 banner displayed on portfolio & bio"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Connect Social Channels (Optional)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                          <Instagram className="w-3.5 h-3.5 text-pink-600" />
                          Instagram Handle
                        </label>
                        <input
                          type="text"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          placeholder="@username"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-600" />
                          Website URL
                        </label>
                        <input
                          type="text"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://mywebsite.com"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep(2)}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSubmit}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Creator Studio...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Launch Creator Studio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
