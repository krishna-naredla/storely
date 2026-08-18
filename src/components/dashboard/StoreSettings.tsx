import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  Image as ImageIcon,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile, BusinessType } from '../../types';
import { updateBusinessProfile } from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { deleteImageFromStorage } from '../../services/cloudinary';

interface StoreSettingsProps {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const [name, setName] = useState(business.name);
  const [tagline, setTagline] = useState(business.tagline || '');
  const [type, setType] = useState<BusinessType>(business.type);
  const [description, setDescription] = useState(business.description || '');
  const [logo, setLogo] = useState(business.logo || '');
  const [coverImage, setCoverImage] = useState(business.coverImage || '');
  const [phone, setPhone] = useState(business.phone);
  const [whatsapp, setWhatsapp] = useState(business.whatsapp);
  const [email, setEmail] = useState(business.email || '');
  const [address, setAddress] = useState(business.address || '');
  const [city, setCity] = useState(business.city || '');
  const [currencySymbol, setCurrencySymbol] = useState(business.currencySymbol || '₹');
  const [deliveryFee, setDeliveryFee] = useState(business.deliveryFee ?? 0);
  const [minOrderValue, setMinOrderValue] = useState(business.minOrderValue ?? 0);
  const [taxRate, setTaxRate] = useState(business.taxRate ?? 0);
  const [enableCod, setEnableCod] = useState(business.enableCod ?? true);
  const [enableOnlinePayment, setEnableOnlinePayment] = useState(
    business.enableOnlinePayment ?? false
  );
  const [upiId, setUpiId] = useState(business.upiId || '');
  const [socialInstagram, setSocialInstagram] = useState(business.socials?.instagram || '');
  const [socialFacebook, setSocialFacebook] = useState(business.socials?.facebook || '');
  const [seoMetaTitle, setSeoMetaTitle] = useState(business.seoMetaTitle || '');
  const [seoMetaDescription, setSeoMetaDescription] = useState(business.seoMetaDescription || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Business name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload: Partial<BusinessProfile> = {
        name: name.trim(),
        tagline: tagline.trim() || undefined,
        type,
        description: description.trim() || undefined,
        logo: logo, // pass empty string to clear it in DB
        coverImage: coverImage, // pass empty string to clear it in DB
        banner: coverImage, 
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        currencySymbol: currencySymbol.trim() || '₹',
        deliveryFee: Number(deliveryFee) || 0,
        minOrderValue: Number(minOrderValue) || 0,
        taxRate: Number(taxRate) || 0,
        enableCod,
        enableOnlinePayment,
        upiId: upiId.trim() || undefined,
        socials: {
          instagram: socialInstagram.trim() || undefined,
          facebook: socialFacebook.trim() || undefined,
        },
        seoMetaTitle: seoMetaTitle.trim() || undefined,
        seoMetaDescription: seoMetaDescription.trim() || undefined,
      };

      // Clean up old images from storage if they were removed or replaced
      if (business.logo && business.logo !== logo) {
        deleteImageFromStorage(business.logo);
      }
      if (business.coverImage && business.coverImage !== coverImage) {
        deleteImageFromStorage(business.coverImage);
      } else if (business.banner && business.banner !== coverImage) {
        deleteImageFromStorage(business.banner);
      }

      await updateBusinessProfile(business.id, payload);
      onBusinessUpdated({
        ...business,
        ...payload,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save store settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
          Store Profile & Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure branding, photos, contact numbers, payment methods, and delivery terms.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Store settings saved successfully to Firestore!</span>
          </div>
        )}

        {/* Branding & Visuals */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            Brand Visuals (Cloudinary CDN)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploadInput
              label="Store Logo"
              value={logo}
              onChange={setLogo}
              aspectRatio="square"
              suggestedPresetType="logo"
              helperText="Square icon (1:1) shown on cards, headers, and receipts."
            />

            <ImageUploadInput
              label="Store Cover Banner"
              value={coverImage || business.banner || ''}
              onChange={(val) => setCoverImage(val)}
              aspectRatio="banner"
              suggestedPresetType="banner"
              helperText="Wide hero banner displayed on the top of your public storefront."
            />
          </div>
        </div>

        {/* Basic Business Details */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            Business Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store / Business Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business Type / Vertical
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as BusinessType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(BUSINESS_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Authentic Homemade Andhra Pickles & Podis"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Store Description / About
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell customers about your craftsmanship, hygiene standards, or story..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Contact & Address */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            Contact & Location Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Number *
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Include country code, e.g. +91 9876543210"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop 4, Market Road, Near City Center"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad, Bengaluru, Mumbai"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Commerce & Pricing Terms */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Commerce & Checkout Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="AED">AED</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Standard Delivery Fee
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min Order Amount
              </label>
              <input
                type="number"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax / GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={enableCod}
                onChange={(e) => setEnableCod(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Cash On Delivery (COD)</div>
                <div className="text-[10px] text-slate-500">Pay cash or UPI upon order delivery</div>
              </div>
            </label>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store UPI ID (e.g. yourstore@okhdfcbank)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="storename@upi"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SEO & Search Engine Indexing Section */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">SEO & Search Engine Indexing</h3>
              <p className="text-[11px] text-slate-500">Customize meta tags to rank higher on Google & Bing search results.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Storefront Meta Title</span>
                <span className="text-[10px] text-slate-400 font-normal">Recommended: 50-60 characters</span>
              </label>
              <input
                type="text"
                value={seoMetaTitle}
                onChange={(e) => setSeoMetaTitle(e.target.value)}
                placeholder={`${business.name} - Official Store`}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-slate-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Storefront Meta Description</span>
                <span className="text-[10px] text-slate-400 font-normal">Recommended: 150-160 characters</span>
              </label>
              <textarea
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                placeholder={`Shop the best products from ${business.name}. High quality, fast delivery & secure payments.`}
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-slate-50/50 font-medium leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Store Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
