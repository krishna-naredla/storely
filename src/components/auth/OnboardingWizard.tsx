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
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Identity & Type
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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

  // Bio Links
  const [onboardingLinks, setOnboardingLinks] = useState<Array<{type: string, title: string, url: string, id: string}>>([]);
  const [newLinkType, setNewLinkType] = useState('instagram');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  // Auto-slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
    if (!username || username === generateSlug(name)) {
      setUsername(generateSlug(val));
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
        username: username.trim() || generateSlug(name),
        slug: slug.trim() || generateSlug(name),
        type,
        category: type,
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
            const isDigital = !!modules.digital_products;
            await createCatalogItem(newBiz.id, {
              name: initialItemName.trim(),
              slug: generateSlug(initialItemName),
              categoryId: cat.id,
              type: meta.defaultItemType || 'product',
              productType: isDigital ? 'digital_file' : undefined,
              isFree: isDigital && Number(initialItemPrice) === 0 ? true : undefined,
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

      // Create Bio Links
      if (modules.universal_links && onboardingLinks.length > 0) {
        for (let i = 0; i < onboardingLinks.length; i++) {
          try {
            await createBioLink(newBiz.id, {
              type: onboardingLinks[i].type,
              title: onboardingLinks[i].title,
              url: onboardingLinks[i].url,
              enabled: true,
              order: i
            });
          } catch (linkErr) {
            console.warn('Link creation handled:', linkErr);
          }
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
    <div className="w-full space-y-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    Creator @Username *
                  </label>
                  <div className="flex items-center text-xs border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                    <span className="pl-3 text-slate-400 font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(generateSlug(e.target.value))}
                      placeholder="username"
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
                Choose Your Store Features
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select the features you need for your Storelly page. You can add or change them anytime from your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Quick module toggles */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enabled Business Features
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                    {MODULE_DEFINITIONS.map((m) => {
                      const isEnabled = !!modules[m.key];
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => handleModuleToggle(m.key)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                            isEnabled
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
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

                {/* Bio Links Setup */}
                {modules.universal_links && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Add Universal Links (Optional)
                    </h3>
                    
                    <div className="flex gap-2">
                      <select 
                        value={newLinkType}
                        onChange={(e) => setNewLinkType(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-1/3"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="whatsapp_community">WA Community</option>
                        <option value="telegram">Telegram</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">X / Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="website">Website</option>
                        <option value="custom">Custom URL</option>
                      </select>
                      
                      <input
                        type="text"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (!newLinkUrl.trim()) return;
                          setOnboardingLinks([
                            ...onboardingLinks, 
                            { 
                              id: Math.random().toString(36).substring(7),
                              type: newLinkType, 
                              title: newLinkTitle || (newLinkType.charAt(0).toUpperCase() + newLinkType.slice(1).replace('_', ' ')), 
                              url: newLinkUrl 
                            }
                          ]);
                          setNewLinkUrl('');
                          setNewLinkTitle('');
                        }}
                        className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-xs rounded-lg transition"
                      >
                        Add
                      </button>
                    </div>
                    
                    {onboardingLinks.length > 0 && (
                      <div className="space-y-2 mt-3 max-h-32 overflow-y-auto">
                        {onboardingLinks.map((link) => (
                          <div key={link.id} className="flex items-center justify-between bg-white p-2 border border-slate-100 rounded-lg text-xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="font-semibold text-slate-800 capitalize">{link.type.replace('_', ' ')}</span>
                              <span className="text-slate-500 truncate text-[10px]">{link.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOnboardingLinks(onboardingLinks.filter(l => l.id !== link.id))}
                              className="text-red-500 hover:text-red-700 px-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Initial Item Setup */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    {modules.digital_products ? 'Add Your First Digital Product' : modules.menu ? 'Add Your First Menu Item' : modules.services ? 'Add Your First Service' : 'Add Your First Product / Offering'} (Optional)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                      <input
                        type="text"
                        value={initialCategoryName}
                        onChange={(e) => setInitialCategoryName(e.target.value)}
                        placeholder="e.g. E-Books, Best Sellers, Services"
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
                      placeholder={modules.digital_products ? "e.g. Masterclass Video" : "e.g. Premium Item"}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  {modules.digital_products && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Upload Digital File (PDF/ZIP)</label>
                      <input
                        type="file"
                        className="w-full text-xs"
                      />
                    </div>
                  )}

                  <ImageUploadInput
                    label="Item Photo (Optional)"
                    value={initialItemImage}
                    onChange={setInitialItemImage}
                    aspectRatio="square"
                    suggestedPresetType="item"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col hidden lg:flex">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Your Storelly Page</h3>
                <div className="bg-white rounded-xl shadow-xs border border-slate-100 flex-1 overflow-hidden flex flex-col relative">
                  {banner ? (
                     <img src={banner} className="w-full h-20 object-cover" alt="Banner" />
                  ) : (
                     <div className="w-full h-20 bg-slate-200"></div>
                  )}
                  <div className="px-4 pb-4 flex flex-col items-center -mt-8 relative z-10">
                    {logo ? (
                      <img src={logo} className="w-16 h-16 rounded-full border-4 border-white object-cover bg-white shadow-sm" alt="Logo" />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-sm">{name.charAt(0)}</div>
                    )}
                    <div className="font-bold text-sm text-slate-900 mt-2 text-center">{name || 'Your Name'}</div>
                    {tagline && <div className="text-[10px] text-slate-500 text-center mt-0.5">{tagline}</div>}
                    
                    {modules.universal_links && (
                      <div className="w-full space-y-1.5 mt-4">
                        <div className="w-full h-7 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-500">WhatsApp</div>
                        <div className="w-full h-7 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-500">Instagram</div>
                      </div>
                    )}

                    {modules.digital_products && (
                      <div className="w-full mt-4">
                        <div className="text-[10px] font-bold mb-1">Digital Products</div>
                        <div className="w-full h-12 bg-slate-50 border border-slate-100 rounded-lg"></div>
                      </div>
                    )}

                    {modules.products && !modules.digital_products && (
                      <div className="w-full mt-4">
                        <div className="text-[10px] font-bold mb-1">Products</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="h-16 bg-slate-50 border border-slate-100 rounded-lg"></div>
                          <div className="h-16 bg-slate-50 border border-slate-100 rounded-lg"></div>
                        </div>
                      </div>
                    )}

                    {modules.booking_appointments && (
                      <div className="w-full mt-4">
                        <div className="w-full h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg flex items-center justify-center text-[10px] font-bold">Book Consultation</div>
                      </div>
                    )}
                  </div>
                </div>
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
                    <span>Launch My Storelly Page</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
  );
};
