import React, { useState } from 'react';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Phone,
  MessageCircle,
  MapPin,
  Image as ImageIcon,
  Layers,
  Package,
  Sliders,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { BusinessProfile, BusinessType, BusinessModuleConfig } from '../../types';
import { BUSINESS_TYPES, MODULE_DEFINITIONS } from '../../services/businessConfig';
import { generateSlug, createCategory, createCatalogItem } from '../../services/firebaseService';
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
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Identity & Type
  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('retail');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Contact & Operating Details
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Step 3: Branding & Media
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  // Step 4: Modules & Initial Item
  const [modules, setModules] = useState<BusinessModuleConfig>(BUSINESS_TYPES.retail.defaultModules);
  const [initialCategoryName, setInitialCategoryName] = useState('Featured');
  const [initialItemName, setInitialItemName] = useState('');
  const [initialItemPrice, setInitialItemPrice] = useState<number>(199);
  const [initialItemImage, setInitialItemImage] = useState('');

  // Auto-slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
  };

  const handleTypeSelect = (selectedType: BusinessType) => {
    setType(selectedType);
    const meta = BUSINESS_TYPES[selectedType];
    setModules(meta.defaultModules);
    if (meta.suggestedCategories && meta.suggestedCategories.length > 0) {
      setInitialCategoryName(meta.suggestedCategories[0]);
    }
  };

  const handleModuleToggle = (key: keyof BusinessModuleConfig) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFinalSubmit = async () => {
    if (!name.trim()) {
      setError('Business name is required');
      setStep(1);
      return;
    }
    if (!phone.trim() && !whatsapp.trim()) {
      setError('At least one contact phone / WhatsApp number is required');
      setStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const cleanPhone = phone.trim() || whatsapp.trim();
      const cleanWhatsApp = whatsapp.trim() || phone.trim();

      const businessData: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        type,
        tagline: tagline.trim() || '',
        description: description.trim() || '',
        logo: logo.trim() || '',
        banner: banner.trim() || '',
        phone: cleanPhone,
        whatsapp: cleanWhatsApp,
        email: email.trim() || '',
        address: address.trim() || '',
        city: city.trim() || '',
        currency: currency || 'INR',
        currencySymbol: currencySymbol || '₹',
        deliveryAvailable: Boolean(modules.table_delivery || modules.cart_ordering),
        modules,
        status: 'active',
      };

      const newBiz = await createBusinessFn(businessData);

      // Create initial category if provided
      if (initialCategoryName.trim()) {
        try {
          const cat = await createCategory(newBiz.id, {
            name: initialCategoryName.trim(),
            slug: generateSlug(initialCategoryName),
            sortOrder: 0,
            isActive: true,
          });

          // Create first catalog item if provided
          if (initialItemName.trim()) {
            const meta = BUSINESS_TYPES[type] || BUSINESS_TYPES.retail;
            await createCatalogItem(newBiz.id, {
              name: initialItemName.trim(),
              slug: generateSlug(initialItemName),
              categoryId: cat.id,
              type: meta.defaultItemType || 'product',
              price: Number(initialItemPrice) || 0,
              images: initialItemImage.trim() ? [initialItemImage.trim()] : [],
              inStock: true,
              isActive: true,
            });
          }
        } catch (subErr) {
          console.warn('Initial category/item creation handled:', subErr);
        }
      }

      onComplete(newBiz);
    } catch (err: any) {
      console.error('Failed to create digital store:', err);
      setError(err.message || 'Failed to create business. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
        {/* Progress Bar & Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1
                ? 'Business Identity'
                : step === 2
                ? 'Contact & Location'
                : step === 3
                ? 'Store Branding'
                : 'Modules & Initial Item'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* STEP 1: Business Identity & Type */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Create Your Digital Store
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tell us about your business. We'll set up your instant digital card, catalog, and public storefront.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name *
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
                    placeholder="e.g. Authentic Homemade Recipes Since 1998"
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
                  {Object.values(BUSINESS_TYPES).map((bt) => {
                    const isSelected = type === bt.id;
                    return (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() => handleTypeSelect(bt.id)}
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

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => {
                  if (!name.trim()) return;
                  setError(null);
                  setStep(2);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Contact & Operating Details */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Contact & WhatsApp Ordering
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
                    placeholder="e.g. Mumbai, Bangalore, Jaipur"
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
                  Full Store Address (Optional)
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
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Store Branding */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Store Logo & Banner
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Upload your business logo and banner image. Images are uploaded to Cloudinary CDN for ultra-fast loading.
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
                helperText="16:9 banner displayed on visiting card & storefront"
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
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Modules & Initial Item */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Modules & First Catalog Item
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Customize enabled features for your store and optionally add your first item to launch immediately.
              </p>
            </div>

            {/* Quick module toggles */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Enabled Business Features
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MODULE_DEFINITIONS.slice(0, 6).map((m) => {
                  const isEnabled = !!modules[m.key];
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => handleModuleToggle(m.key)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                        isEnabled
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300'
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
                First Offering / Item (Optional)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={initialCategoryName}
                    onChange={(e) => setInitialCategoryName(e.target.value)}
                    placeholder="e.g. Special Collection, Best Sellers"
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item / Service Name</label>
                <input
                  type="text"
                  value={initialItemName}
                  onChange={(e) => setInitialItemName(e.target.value)}
                  placeholder="e.g. Premium Mango Pickle 500g, Hair Spa Treatment, Deluxe Room"
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

            <div className="flex justify-between pt-4">
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
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Launch My Digital Store</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
