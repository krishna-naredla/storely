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
  Image as ImageIcon,
  Layers,
  Package,
  CheckCircle2,
  Loader2,
  Briefcase,
  Link as LinkIcon,
  ShoppingBag,
  CalendarCheck,
  FileText,
  Ticket,
  User,
  Instagram,
  Globe,
  Youtube,
  Twitter,
  Linkedin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { BusinessProfile, BusinessType, BusinessModuleConfig, ProfileType } from '../../types';
import { BUSINESS_TYPES, MODULE_DEFINITIONS } from '../../services/businessConfig';
import { generateSlug, createCategory, createCatalogItem, createBioLink } from '../../services/firebaseService';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface OnboardingWizardProps {
  onComplete: (business: BusinessProfile) => void;
  onCancel?: () => void;
  createBusinessFn: (data: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<BusinessProfile>;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onCancel,
  createBusinessFn,
}) => {
  // Step 0: Type Selection ('vendor' vs 'creator')
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType | null>(null);
  const [step, setStep] = useState<number>(0);
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
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Branding States
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  // Vendor-Specific States
  const [vendorType, setVendorType] = useState<BusinessType>('retail');
  const [vendorModules, setVendorModules] = useState<BusinessModuleConfig>(BUSINESS_TYPES.retail.defaultModules);
  const [initialCategoryName, setInitialCategoryName] = useState('Featured');
  const [initialItemName, setInitialItemName] = useState('');
  const [initialItemPrice, setInitialItemPrice] = useState<number>(199);
  const [initialItemImage, setInitialItemImage] = useState('');

  // Creator-Specific Module Toggles (Default: Portfolio & Universal Links enabled)
  const [creatorModules, setCreatorModules] = useState<BusinessModuleConfig>({
    universal_links: true,
    work_portfolio: true,
    portfolio: true,
    digital_products: false,
    booking_appointments: false,
    custom_quotes: false,
    events_tickets: false,
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
    setVendorModules(meta.defaultModules);
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

  const handleFinalSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      setStep(1);
      return;
    }
    if (!phone.trim() && !whatsapp.trim()) {
      setError('Contact phone / WhatsApp number is required');
      setStep(selectedProfileType === 'creator' ? 1 : 2);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const cleanPhone = phone.trim() || whatsapp.trim();
      const cleanWhatsApp = whatsapp.trim() || phone.trim();
      const isCreator = selectedProfileType === 'creator';

      const finalModules: BusinessModuleConfig = isCreator
        ? {
            universal_links: Boolean(creatorModules.universal_links),
            work_portfolio: Boolean(creatorModules.work_portfolio || creatorModules.portfolio),
            portfolio: Boolean(creatorModules.work_portfolio || creatorModules.portfolio),
            digital_products: Boolean(creatorModules.digital_products),
            booking_appointments: Boolean(creatorModules.booking_appointments),
            custom_quotes: Boolean(creatorModules.custom_quotes),
            events_tickets: Boolean(creatorModules.events_tickets),
            // Explicitly disable physical store modules for pure creators unless explicitly selected
            products: Boolean(creatorModules.digital_products),
            cart_ordering: Boolean(creatorModules.digital_products),
            table_delivery: false,
          }
        : vendorModules;

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
        email: email.trim() || '',
        address: isCreator ? '' : address.trim() || '',
        city: city.trim() || '',
        currency: currency || 'INR',
        currencySymbol: currencySymbol || '₹',
        deliveryAvailable: isCreator ? false : Boolean(vendorModules.table_delivery || vendorModules.cart_ordering),
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

      // Create initial category for vendors if provided
      if (!isCreator && initialCategoryName.trim()) {
        try {
          const cat = await createCategory(newBiz.id, {
            name: initialCategoryName.trim(),
            slug: generateSlug(initialCategoryName),
            sortOrder: 0,
            isActive: true,
          });

          if (initialItemName.trim()) {
            await createCatalogItem(newBiz.id, {
              slug: generateSlug(initialItemName),
              name: initialItemName.trim(),
              type: vendorType === 'restaurant' || vendorType === 'cafe' ? 'menu_item' : 'product',
              categoryId: cat.id,
              shortDescription: 'Freshly listed offering on Storelly',
              detailedDescription: '',
              price: initialItemPrice || 199,
              salePrice: initialItemPrice || 199,
              unit: 'item',
              images: initialItemImage ? [initialItemImage] : [],
              inStock: true,
              isFeatured: true,
              isOffer: false,
              isActive: true,
            });
          }
        } catch (catErr) {
          console.warn('Initial category creation non-blocking warning:', catErr);
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
          console.warn('Initial bio link creation warning:', linkErr);
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

  return (
    <div className="space-y-6">
      {/* Error notification banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          STEP 0: STORE TYPE SELECTION (VENDOR VS CREATOR)
         ========================================================================= */}
      {step === 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Step 1 of Setup
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              What type of profile are you creating?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your profile type to get a tailored workspace with the exact tools you need.
            </p>
          </div>

          {/* Large Two-Card Decision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* VENDOR CARD */}
            <div
              onClick={() => setSelectedProfileType('vendor')}
              className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                selectedProfileType === 'vendor'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-4 ring-emerald-500/15 shadow-xl shadow-emerald-600/10'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              {selectedProfileType === 'vendor' && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-in zoom-in">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition ${
                    selectedProfileType === 'vendor'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-emerald-50 text-emerald-700 group-hover:scale-105'
                  }`}>
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Physical &amp; Local Business
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1 font-heading">
                      Vendor
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  For shops, local businesses and service providers who want to sell products, manage catalog inventory, or accept customer orders directly.
                </p>

                <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Best suited for:
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Grocery, Kirana, Restaurants, Cafes, Bakeries, Boutiques, Retail Shops, Salons, Spas, Clinics, Hotels, Rental Services &amp; Local Merchants.
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Includes Digital Storefront &amp; WhatsApp Checkout
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition">→</span>
              </div>
            </div>

            {/* CREATOR CARD */}
            <div
              onClick={() => setSelectedProfileType('creator')}
              className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                selectedProfileType === 'creator'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-500/15 shadow-xl shadow-indigo-600/10'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              {selectedProfileType === 'creator' && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-in zoom-in">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition ${
                    selectedProfileType === 'creator'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-indigo-50 text-indigo-700 group-hover:scale-105'
                  }`}>
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Portfolio &amp; Digital Work
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1 font-heading">
                      Creator
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  For creators, professionals and individuals who want to showcase their work, share links, sell digital products or offer consultations.
                </p>

                <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Best suited for:
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    UI/UX Designers, Developers, Photographers, Video Editors, YouTubers, Influencers, Marketers, Freelancers, Consultants, Tutors &amp; Artists.
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Includes Portfolio, Bio Link &amp; Digital Store
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition">→</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
              >
                Cancel
              </button>
            )}
            <div className="ml-auto">
              <button
                type="button"
                disabled={!selectedProfileType}
                onClick={() => {
                  if (!selectedProfileType) return;
                  setStep(1);
                }}
                className={`px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer ${
                  selectedProfileType === 'creator'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                    : selectedProfileType === 'vendor'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                    : 'bg-slate-300 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>Continue as {selectedProfileType === 'creator' ? 'Creator' : selectedProfileType === 'vendor' ? 'Vendor' : '...'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VENDOR ONBOARDING FLOW
         ========================================================================= */}
      {selectedProfileType === 'vendor' && step > 0 && (
        <div className="space-y-6">
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Type
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Vendor Setup • Step {step} of 4
            </div>
          </div>

          {/* VENDOR STEP 1: Business Identity & Vertical */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Business Identity &amp; Type
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tell us about your store, business name, and what you sell.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store / Business Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Royal Spices & Pickles, Saffron Boutique, Urban Cafe"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Store URL Slug *
                    </label>
                    <div className="flex items-center text-xs border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                      <span className="pl-3 text-slate-400 font-mono">/store/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(generateSlug(e.target.value))}
                        placeholder="my-store-name"
                        className="w-full py-2.5 pr-3 text-xs bg-transparent focus:outline-hidden font-mono text-emerald-800 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tagline / One-liner
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Authentic Homemade Flavors Since 1998"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Business Type Selector Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Business Vertical *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                    {Object.values(BUSINESS_TYPES)
                      .filter((bt) => bt.id !== 'digital_creator')
                      .map((bt) => {
                        const isSelected = vendorType === bt.id;
                        return (
                          <button
                            key={bt.id}
                            type="button"
                            onClick={() => handleVendorTypeSelect(bt.id)}
                            className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs text-slate-900'
                                : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold truncate">{bt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                              {bt.description}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => {
                    if (!name.trim()) return;
                    setError(null);
                    setStep(2);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VENDOR STEP 2: Contact & Operating Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Contact &amp; WhatsApp Ordering
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Customers will send orders, inquiries, and booking confirmations directly to your WhatsApp.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp Number *
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => {
                          setWhatsapp(e.target.value);
                          if (!phone) setPhone(e.target.value);
                        }}
                        placeholder="e.g. +91 9876543210"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Include country code (e.g. +91)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Calling Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Bangalore, Hyderabad"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Currency
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
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store Address (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shop No, Street, Landmark, PIN code"
                      rows={2}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!whatsapp.trim() && !phone.trim()}
                  onClick={() => {
                    if (!whatsapp.trim() && !phone.trim()) return;
                    setError(null);
                    setStep(3);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VENDOR STEP 3: Store Branding */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Store Logo &amp; Banner
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Upload your store logo and banner image to build customer trust.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUploadInput
                  label="Store Logo / Profile Picture"
                  value={logo}
                  onChange={setLogo}
                  aspectRatio="square"
                  suggestedPresetType="logo"
                  helperText="Square 1:1 format recommended"
                />

                <ImageUploadInput
                  label="Store Header Banner"
                  value={banner}
                  onChange={setBanner}
                  aspectRatio="banner"
                  suggestedPresetType="banner"
                  helperText="16:9 banner displayed on storefront"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VENDOR STEP 4: Features & Initial Item */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Features &amp; First Item
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Select your active store modules and optionally add your first item to launch immediately.
                </p>
              </div>

              <div className="space-y-6">
                {/* Module selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enabled Features
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MODULE_DEFINITIONS
                      .filter((m) => m.key !== 'work_portfolio' && m.key !== 'universal_links')
                      .map((m) => {
                        const isEnabled = !!vendorModules[m.key];
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => handleVendorModuleToggle(m.key)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between cursor-pointer ${
                              isEnabled
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold truncate">{m.label}</span>
                              <span className="text-[9px] line-clamp-1 mt-0.5 opacity-70">{m.description}</span>
                            </div>
                            <span
                              className={`w-4 h-4 ml-2 shrink-0 rounded-full flex items-center justify-center text-[10px] ${
                                isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200'
                              }`}
                            >
                              {isEnabled ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Initial Item Setup */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    Add Your First Item / Offering (Optional)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                      <input
                        type="text"
                        value={initialCategoryName}
                        onChange={(e) => setInitialCategoryName(e.target.value)}
                        placeholder="e.g. Featured, Best Sellers, Specials"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Price ({currencySymbol})</label>
                      <input
                        type="number"
                        value={initialItemPrice}
                        onChange={(e) => setInitialItemPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={initialItemName}
                      onChange={(e) => setInitialItemName(e.target.value)}
                      placeholder="e.g. Signature Cold Coffee, Embroidered Kurti"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <ImageUploadInput
                    label="Item Photo (Optional)"
                    value={initialItemImage}
                    onChange={setInitialItemImage}
                    aspectRatio="square"
                    suggestedPresetType="item"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Storefront...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Launch Vendor Storefront</span>
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
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Type
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Creator Setup • Step {step} of 3
            </div>
          </div>

          {/* CREATOR STEP 1: Creator Identity & Handle */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Creator Identity &amp; Handle
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Set your creator brand name, public @handle, and professional title.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Creator / Brand Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Krishna Academy, Alex Rivera, DevStudio"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Public Handle @username *
                    </label>
                    <div className="flex items-center text-xs border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                      <span className="pl-3 text-slate-400 font-mono">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(generateSlug(e.target.value));
                          setSlug(generateSlug(e.target.value));
                        }}
                        placeholder="username"
                        className="w-full py-2.5 pr-3 text-xs bg-transparent focus:outline-hidden font-mono text-indigo-800 font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Profession / Headline *
                    </label>
                    <input
                      type="text"
                      value={professionTitle}
                      onChange={(e) => setProfessionTitle(e.target.value)}
                      placeholder="e.g. UI/UX Designer, Full-Stack Developer, Content Creator"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp / Contact Phone *
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => {
                          setWhatsapp(e.target.value);
                          if (!phone) setPhone(e.target.value);
                        }}
                        placeholder="e.g. +91 9876543210"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bio / Elevator Pitch (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Crafting high-conversion digital experiences and visual brand systems for startups and creators."
                    rows={2}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!name.trim() || !whatsapp.trim()}
                  onClick={() => {
                    if (!name.trim() || !whatsapp.trim()) return;
                    setError(null);
                    setStep(2);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* CREATOR STEP 2: Choose Creator Modules */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Select Your Creator Modules
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Choose the features you want active on your creator workspace. You can toggle these anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Portfolio */}
                <div
                  onClick={() => handleCreatorModuleToggle('work_portfolio')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    creatorModules.work_portfolio || creatorModules.portfolio
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Portfolio Website</h4>
                        <span className="text-[10px] text-indigo-700 font-bold uppercase">/portfolio/{slug || 'username'}</span>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      creatorModules.work_portfolio || creatorModules.portfolio ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {creatorModules.work_portfolio || creatorModules.portfolio ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Showcase your case studies, project galleries, skills, client testimonials, and media kit.
                  </p>
                </div>

                {/* 2. Universal Bio Link */}
                <div
                  onClick={() => handleCreatorModuleToggle('universal_links')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    creatorModules.universal_links
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Universal Bio Link</h4>
                        <span className="text-[10px] text-purple-700 font-bold uppercase">/@{slug || 'username'}</span>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      creatorModules.universal_links ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {creatorModules.universal_links ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Put all your social channels, resources, communities, and links in one sleek link-in-bio page.
                  </p>
                </div>

                {/* 3. Digital Products */}
                <div
                  onClick={() => handleCreatorModuleToggle('digital_products')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    creatorModules.digital_products
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Digital Products</h4>
                        <span className="text-[10px] text-teal-700 font-bold uppercase">PDFs, Code &amp; Assets</span>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      creatorModules.digital_products ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {creatorModules.digital_products ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Sell downloadable guides, templates, design kits, source code, and digital downloads.
                  </p>
                </div>

                {/* 4. 1:1 Consultations */}
                <div
                  onClick={() => handleCreatorModuleToggle('booking_appointments')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    creatorModules.booking_appointments
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">1:1 Consultations</h4>
                        <span className="text-[10px] text-blue-700 font-bold uppercase">Paid Calls &amp; Slots</span>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      creatorModules.booking_appointments ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {creatorModules.booking_appointments ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Offer 1-on-1 mentorship, technical reviews, consultation calls, and client appointments.
                  </p>
                </div>

                {/* 5. Custom Quotes */}
                <div
                  onClick={() => handleCreatorModuleToggle('custom_quotes')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    creatorModules.custom_quotes
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Custom Project Quotes</h4>
                        <span className="text-[10px] text-amber-700 font-bold uppercase">Bespoke Invoicing</span>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      creatorModules.custom_quotes ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {creatorModules.custom_quotes ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Receive project briefs, create customized quotes, and share direct payment links.
                  </p>
                </div>

                {/* 6. Events & Tickets */}
                <div
                  onClick={() => handleCreatorModuleToggle('events_tickets')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    creatorModules.events_tickets
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Events &amp; Workshops</h4>
                        <span className="text-[10px] text-pink-700 font-bold uppercase">Webinars &amp; Tickets</span>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      creatorModules.events_tickets ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {creatorModules.events_tickets ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Host online masterclasses, cohort meetups, and sell event passes with automated QR tickets.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* CREATOR STEP 3: Profile Photo, Banner & Socials */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
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

              {/* Social Channels */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Connect Social Channels (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      Instagram Username
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

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Creator Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Launch Creator Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
