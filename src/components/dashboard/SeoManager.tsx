import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle,
  Share2,
  ExternalLink,
  Eye
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { updateBusinessProfile } from '../../services/firebaseService';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface SeoManagerProps {
  business: BusinessProfile;
}

export const SeoManager: React.FC<SeoManagerProps> = ({ business }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(business.seoMetaTitle || business.name);
  const [description, setDescription] = useState(business.seoMetaDescription || business.tagline || '');
  const [keywords, setKeywords] = useState(business.seoMetaKeywords || '');
  const [socialImage, setSocialImage] = useState(business.seoMetaImage || business.logo || '');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      await updateBusinessProfile(business.id, {
        seoMetaTitle: title,
        seoMetaDescription: description,
        seoMetaKeywords: keywords,
        seoMetaImage: socialImage,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save SEO settings');
    } finally {
      setIsSaving(false);
    }
  };

  const storefrontUrl = `${window.location.origin}/@${business.username || business.slug}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">SEO Manager</h2>
          <p className="text-sm text-slate-500">Optimize how your store appears in Google and Social Media.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save SEO Settings'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              Search Engine Optimization
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Page Title (Max 60 characters)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="e.g. Best Handmade Sweets in Jaipur | Storelly"
                />
                <div className="mt-1 flex justify-end">
                  <span className={`text-[10px] font-bold ${title.length > 55 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {title.length}/60
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Meta Description (Max 160 characters)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Describe your business for search results..."
                />
                <div className="mt-1 flex justify-end">
                  <span className={`text-[10px] font-bold ${description.length > 150 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {description.length}/160
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="e.g. sweets, bakery, jaipur, delivery"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-600" />
              Social Sharing Image
            </h3>
            
            <ImageUploadInput
              label="OG Image (1200x630 recommended)"
              value={socialImage}
              onChange={setSocialImage}
              aspectRatio="video"
              helperText="This image appears when you share your link on WhatsApp, Instagram, or Twitter."
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          {/* Google Preview */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              Google Search Preview
            </h3>
            <div className="max-w-[500px]">
              <div className="text-[12px] text-slate-600 mb-0.5 flex items-center gap-1">
                {window.location.hostname}
                <span className="text-[10px] opacity-50">› @{business.username || business.slug}</span>
              </div>
              <div className="text-[18px] text-[#1a0dab] font-medium hover:underline cursor-pointer leading-tight mb-1">
                {title || 'Your Store Page Title'}
              </div>
              <div className="text-[13px] text-[#4d5156] line-clamp-2 leading-snug">
                {description || 'Provide a compelling description of your products and services to attract more customers from search results.'}
              </div>
            </div>
          </div>

          {/* WhatsApp / Social Preview */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" />
              Social Media Preview
            </h3>
            <div className="max-w-[400px] border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
              <div className="aspect-video bg-slate-100 relative">
                {socialImage ? (
                  <img src={socialImage} alt="Social Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-bold">No Image Selected</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/40 backdrop-blur-md rounded text-[9px] font-bold text-white uppercase tracking-widest">
                  Preview
                </div>
              </div>
              <div className="p-3 space-y-1 border-t border-slate-100 bg-white">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{window.location.hostname.toUpperCase()}</div>
                <div className="text-[13px] font-bold text-slate-900 leading-tight line-clamp-1">{title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{description}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-900">Your Store is Live</h4>
                <p className="text-[11px] text-emerald-700 font-medium">Any changes you save here will be updated across search engines as they re-crawl your site.</p>
              </div>
            </div>
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-3 bg-white rounded-2xl border border-emerald-200 group hover:border-emerald-400 transition-all"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">{storefrontUrl}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Visit Store</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
