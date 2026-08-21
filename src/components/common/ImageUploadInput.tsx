import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { uploadToCloudinary, compressImageToDataUrl, isValidImageUrl } from '../../services/cloudinary';

// Curated high quality royalty-free presets
const SAMPLE_PRESETS: { title: string; category: string; url: string }[] = [
  {
    title: 'Modern Retail Store',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Gourmet Cafe & Dining',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Luxury Hotel & Resort',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Salon & Spa Studio',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Fashion & Boutique',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Fresh Grocery & Organics',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Artisan Coffee & Bakery',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Car & Fleet Rental',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Retail Store Logo',
    category: 'logo',
    url: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=500&auto=format&fit=crop&q=80',
  },
  {
    title: 'Cafe / Resto Logo',
    category: 'logo',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
  },
  {
    title: 'Handcrafted Product',
    category: 'item',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Chef Special Pizza',
    category: 'item',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Deluxe Suite Room',
    category: 'item',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Spa Facial Treatment',
    category: 'item',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
  },
];

interface ImageUploadInputProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
  helperText?: string;
  suggestedPresetType?: 'banner' | 'logo' | 'item';
  onFileSizeChange?: (size: number) => void;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label = 'Image',
  value = '',
  onChange,
  placeholder = 'Enter HTTPS image URL or upload...',
  aspectRatio = 'square',
  helperText,
  suggestedPresetType,
  onFileSizeChange,
}) => {
  const [tab, setTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when prop changes
  useEffect(() => {
    if (value !== urlInput && !isUploading) {
      setUrlInput(value || '');
    }
  }, [value]);

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, SVG)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image size must be less than 15MB');
      return;
    }

    if (onFileSizeChange) {
      onFileSizeChange(file.size);
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(15);

      const isLogoOrBanner = suggestedPresetType === 'logo' || suggestedPresetType === 'banner';
      let finalUrl = '';

      if (isLogoOrBanner) {
        // Upload to Cloudinary CDN specifically for vendor logo and banner
        finalUrl = await uploadToCloudinary(file, (percent) => {
          setUploadProgress(percent);
        });
      } else {
        // For catalog items, services and other assets, store as compressed Base64 data URL
        finalUrl = await compressImageToDataUrl(file, 800, 800, 0.8);
        setUploadProgress(100);
      }

      onChange(finalUrl);
      setUrlInput(finalUrl);
    } catch (err: any) {
      console.warn('Upload error handled:', err);
      setError(err.message || 'Image upload failed. Please try another file or enter an image URL.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConvertToCloudinary = async () => {
    if (!value || !value.startsWith('data:image/')) return;
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(25);
      const res = await fetch(value);
      const blob = await res.blob();
      const file = new File([blob], 'store-brand.jpg', { type: blob.type || 'image/jpeg' });
      setUploadProgress(50);
      const secureUrl = await uploadToCloudinary(file, (p) => setUploadProgress(p));
      onChange(secureUrl);
      setUrlInput(secureUrl);
    } catch (err: any) {
      setError('Failed to upload to Cloudinary: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processAndUploadFile(files[0]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlChange = (newVal: string) => {
    setUrlInput(newVal);
    setError(null);
    // Auto-apply if it's a valid pasted URL to prevent Save button race conditions
    if (isValidImageUrl(newVal.trim())) {
      onChange(newVal.trim());
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError(null);
      onChange('');
      return;
    }
    if (isValidImageUrl(trimmed)) {
      setError(null);
      onChange(trimmed);
    } else {
      setError('Please enter a valid HTTP/HTTPS image URL');
    }
  };

  const handleUrlBlur = () => {
    // Only auto-apply if it's already a valid url and not empty, otherwise let user keep typing
    const trimmed = urlInput.trim();
    if (trimmed && isValidImageUrl(trimmed)) {
      handleApplyUrl();
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrlInput(presetUrl);
    onChange(presetUrl);
    setError(null);
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClass =
    aspectRatio === 'banner'
      ? 'h-36 sm:h-44 w-full'
      : aspectRatio === 'square'
      ? 'h-32 w-32 sm:h-36 sm:w-36'
      : 'h-36 w-full';

  const filteredPresets = suggestedPresetType
    ? SAMPLE_PRESETS.filter((p) => p.category === suggestedPresetType)
    : SAMPLE_PRESETS;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                tab === 'upload' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                tab === 'url' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setTab('presets')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                tab === 'presets' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Presets
            </button>
          </div>
        </div>
      )}

      {/* Preview Card if image exists */}
      {value ? (
        <div className="space-y-2">
          <div className={`relative ${aspectClass} rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group shadow-xs`}>
            <img
              src={value}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => (tab === 'upload' ? fileInputRef.current?.click() : setTab('url'))}
                className="px-3 py-1.5 bg-white text-xs font-bold text-slate-900 rounded-lg shadow-sm hover:bg-slate-100 transition cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <Check className="w-3 h-3" /> Image Active
            </div>
          </div>

          {/* One-click upload to Cloudinary for base64 logos and banners */}
          {value.startsWith('data:image/') && (suggestedPresetType === 'logo' || suggestedPresetType === 'banner') && (
            <button
              type="button"
              onClick={handleConvertToCloudinary}
              disabled={isUploading}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isUploading ? `Uploading to Cloudinary... ${uploadProgress}%` : 'Upload to Cloudinary CDN for Rich WhatsApp Previews'}</span>
            </button>
          )}
        </div>
      ) : tab === 'upload' ? (
        /* Upload Area */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40'
          } ${aspectRatio === 'banner' ? 'h-36 sm:h-40' : aspectRatio === 'square' ? 'h-32 w-32 sm:h-36 sm:w-36' : 'h-36'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-700">Uploading image... {uploadProgress}%</p>
              <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800">Click or Drag & Drop</p>
                <p className="text-[10px] text-slate-600">JPG, PNG, WEBP up to 15MB</p>
              </div>
            </>
          )}
        </div>
      ) : tab === 'url' ? (
        /* URL Input Area */
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                onBlur={handleUrlBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            {urlInput && (
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Apply
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-600">
            Paste any direct image link from Unsplash, Google Photos, Imgur, or your website.
          </p>
        </div>
      ) : (
        /* Presets Tab */
        <div className="space-y-2">
          <p className="text-[11px] text-slate-600">Choose a high-resolution sample photo:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {filteredPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p.url)}
                className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 text-left transition cursor-pointer shadow-xs aspect-video"
              >
                <img
                  src={p.url}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                  <span className="text-[9px] font-bold text-white line-clamp-1">{p.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-600">{helperText}</p>}
      
      {/* Optimized Image Benefit Tip */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
        <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Tip: Using optimized images under 1MB ensures lightning-fast storefront loading and crisp WhatsApp preview cards.</span>
      </div>
    </div>
  );
};

