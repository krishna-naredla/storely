import { useLanguage } from '../../context/LanguageContext';
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
  Bell,
  ShieldAlert,
  Trash2, Plus, Share2,
} from 'lucide-react';
import { BusinessProfile, BusinessType } from '../../types';
import { updateBusinessProfile, permanentlyDeleteStoreAccount } from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { deleteImageFromStorage } from '../../services/cloudinary';
import { requestFcmNotificationPermission, showMerchantNotification } from '../../services/fcmPushService';
import { SeoManager } from './SeoManager';

interface StoreSettingsProps {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'seo'>('profile');
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
  const [socialLinks, setSocialLinks] = useState<{platform: string, url: string}[]>(business.socialLinks || []);
  const platforms = ['instagram', 'facebook', 'youtube', 'linkedin', 'twitter', 'website'];
  const [seoMetaTitle, setSeoMetaTitle] = useState(business.seoMetaTitle || '');
  const [seoMetaDescription, setSeoMetaDescription] = useState(business.seoMetaDescription || '');
  const [seoMetaImage, setSeoMetaImage] = useState(business.seoMetaImage || '');
  const [status, setStatus] = useState<any>(business.status || 'active');
  const [maintenanceMessage, setMaintenanceMessage] = useState(business.maintenanceMessage || 'We are currently undergoing scheduled maintenance or taking a short break. We will be back online shortly!');
  const [maintenanceImage, setMaintenanceImage] = useState(business.maintenanceImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingStore, setIsDeletingStore] = useState(false);

  const handleDeleteStorePermanent = async () => {
    if (deleteConfirmText.trim() !== business.name.trim()) {
      setError('Please type your exact store name to confirm permanent deletion.');
      return;
    }
    try {
      setIsDeletingStore(true);
      setError(null);
      await permanentlyDeleteStoreAccount(business);
      alert('Store and all associated images permanently deleted. Storage space freed successfully.');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Failed to delete store');
      setIsDeletingStore(false);
    }
  };

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
        socialLinks: socialLinks.filter(l => l.url.trim() !== ''),
        seoMetaTitle: seoMetaTitle.trim() || undefined,
        seoMetaDescription: seoMetaDescription.trim() || undefined,
        seoMetaImage: seoMetaImage.trim() || undefined,
        status,
        maintenanceMode: status === 'maintenance',
        maintenanceMessage: maintenanceMessage.trim() || undefined,
        maintenanceImage: maintenanceImage.trim() || undefined,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Store Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure branding, photos, contact numbers, and SEO.
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Store Profile
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'seo'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            SEO Manager
          </button>
        </div>
      </div>

      {activeTab === 'seo' ? (
        <SeoManager business={business} />
      ) : (
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              Brand Visuals (Cloudinary CDN)
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              CDN Optimized
            </span>
          </div>

          {/* Image Size & Performance Guidance Helper Component */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 border border-emerald-100/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-emerald-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-900">
                  Image Size & Performance Guidelines
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload photos under <strong className="text-emerald-700 font-bold">1MB</strong> for faster storefront loading and buttery-smooth customer experiences on mobile and desktop.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px] text-slate-600 border-t border-emerald-100/60 mt-2">
              <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl border border-emerald-100/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Logo:</strong> 500×500px (1:1 Square)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl border border-emerald-100/50">
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                <span><strong>Cover Banner:</strong> 1200×400px (16:5 Wide)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploadInput
              label="Store Logo"
              value={logo}
              onChange={setLogo}
              aspectRatio="square"
              suggestedPresetType="logo"
              helperText="Square icon (1:1) shown on cards, headers, and receipts. < 1MB recommended."
            />

            <ImageUploadInput
              label="Store Cover Banner"
              value={coverImage || business.banner || ''}
              onChange={(val) => setCoverImage(val)}
              aspectRatio="banner"
              suggestedPresetType="banner"
              helperText="Wide hero banner displayed on the top of your public storefront. < 1MB recommended."
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

                
        {/* Social Media Links */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            Social Media Links
          </h3>
          <div className="space-y-3">
            {socialLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={link.platform}
                  onChange={(e) => {
                    const newLinks = [...socialLinks];
                    newLinks[idx].platform = e.target.value;
                    setSocialLinks(newLinks);
                  }}
                  className="w-32 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                >
                  {platforms.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const newLinks = [...socialLinks];
                    newLinks[idx].url = e.target.value;
                    setSocialLinks(newLinks);
                  }}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newLinks = socialLinks.filter((_, i) => i !== idx);
                    setSocialLinks(newLinks);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSocialLinks([...socialLinks, { platform: 'instagram', url: '' }])}
              className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Social Link
            </button>
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

        {/* Browser & Push Notifications Permission Status */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">Browser & Push Notifications</h3>
                <p className="text-[11px] text-slate-500">Real-time alerts for new orders and bookings even when your app is in background.</p>
              </div>
            </div>
            <div>
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Notifications Enabled</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Action Required</span>
                </span>
              )}
            </div>
          </div>

          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span>Your browser is configured correctly to receive system push notifications for new orders and bookings.</span>
                <button
                  type="button"
                  onClick={() => showMerchantNotification(`🧪 Test Order #${Math.floor(1000 + Math.random() * 9000)}`, `Test order placed for ${business.name}`, business, 'order')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                >
                  Send Test Alert
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Browser notifications are currently blocked or not enabled.</span>
                </p>
                <p className="text-amber-800">
                  To ensure you never miss customer orders or appointment bookings when your dashboard is closed, please enable notifications using the guide below:
                </p>
              </div>

              {/* Browser Guides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Google Chrome / Edge</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Click the lock icon (🔒) or site settings icon next to the address bar &rarr; Find <strong>Notifications</strong> &rarr; Change from Block to <strong>Allow</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Apple Safari (Mac/iOS)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Open Safari Settings &rarr; Websites &rarr; Notifications &rarr; Locate this app and select <strong>Allow</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Mobile PWA (Android/iOS)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Open device App Info / Notification Settings for Storelly &rarr; Ensure <strong>Allow Notifications</strong> is enabled.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    const granted = await requestFcmNotificationPermission();
                    if (granted) {
                      alert('Notifications successfully enabled!');
                      window.location.reload();
                    } else {
                      alert('Permission was denied or blocked by your browser settings. Please follow the instructions above to unblock.');
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Enable Browser Notifications Now</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Maintenance Mode Section */}
        <div className="p-6 bg-amber-50/40 rounded-3xl border border-amber-200/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shop Maintenance & Closed Mode</h3>
                <p className="text-[11px] text-slate-600">Temporarily pause orders when closed for days, restocking, or holidays.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status === 'maintenance'}
                onChange={(e) => setStatus(e.target.checked ? 'maintenance' : 'active')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {status === 'maintenance' ? 'Maintenance ON' : 'Store Open'}
              </span>
            </label>
          </div>

          {status === 'maintenance' && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>When Maintenance Mode is active, visitors to your storefront will see your custom closed message with a friendly 2D illustration and cannot place new orders, preventing order cancellations.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Closed / Maintenance Message
                </label>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={2}
                  placeholder="e.g. We are currently closed for 2 days restocking fresh ingredients! Back on Friday."
                  className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <ImageUploadInput
                  label="Maintenance / Closed Illustration Image (Optional)"
                  value={maintenanceImage}
                  onChange={setMaintenanceImage}
                  aspectRatio="banner"
                  suggestedPresetType="banner"
                  helperText="Friendly 2D illustration or photo shown on your closed storefront."
                />
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone: Permanent Store Deletion & Storage Cleanup */}
        <div className="p-6 bg-red-50/40 rounded-3xl border border-red-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-700 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Danger Zone: Permanently Delete Store</h3>
                <p className="text-[11px] text-slate-600">Permanently delete your store, items, categories, orders, and wipe all images from cloud storage to save server bucket costs.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              Delete Store Permanently
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Permanent Store Deletion</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 leading-relaxed">
                This will permanently remove <strong>{business.name}</strong>, all products, orders, and delete all merchant logos, banners, and product images from Cloudinary and Firebase storage buckets to free up system storage.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type your exact store name <span className="text-red-600 font-extrabold">"{business.name}"</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={business.name}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingStore || deleteConfirmText.trim() !== business.name.trim()}
                  onClick={handleDeleteStorePermanent}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isDeletingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>I understand, Delete Store</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
      )}
    </div>
  );
};
