import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  QrCode,
  Share2,
  Eye,
  Loader2,
  MousePointerClick,
  Gift,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { BusinessProfile, AffiliateProductItem } from '../../types';
import {
  subscribeToAffiliateProducts,
  createAffiliateProduct,
  updateAffiliateProduct,
  deleteAffiliateProduct,
  uploadFileToStorage,
} from '../../services/firebaseService';
import { getCreatorModulePublicUrl, getCreatorModuleDisplayPath } from '../../utils/creatorModuleManager';
import { ModuleQrModal } from '../common/ModuleQrModal';
import { ConfirmActionModal } from '../common/ConfirmActionModal';

interface AffiliateManagerProps {
  business: BusinessProfile;
  onBusinessUpdated?: (updated: BusinessProfile) => void;
  onOpenStorefront?: (slug: string, path: string) => void;
}

const PRESET_CATEGORIES = [
  'Tech & Gear',
  'Software & Tools',
  'Books & Reading',
  'Design Assets',
  'Camera & Audio',
  'Home Office',
  'Courses & Learning',
  'Other',
];

const PRESET_PLATFORMS = ['Amazon', 'AppSumo', 'Notion', 'Gumroad', 'Figma', 'Shopify', 'Custom'];

export const AffiliateManager: React.FC<AffiliateManagerProps> = ({
  business,
  onBusinessUpdated,
  onOpenStorefront,
}) => {
  const [items, setItems] = useState<AffiliateProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliateProductItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AffiliateProductItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(PRESET_CATEGORIES[0]);
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAffiliateUrl, setFormAffiliateUrl] = useState('');
  const [formPlatform, setFormPlatform] = useState(PRESET_PLATFORMS[0]);
  const [formPriceDisplay, setFormPriceDisplay] = useState('');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formDiscountCode, setFormDiscountCode] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAffiliateProducts(business.id, (fetched) => {
      setItems(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [business.id]);

  const totalClicks = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.clicks) || 0), 0);
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.category) set.add(it.category.trim());
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.platform?.toLowerCase().includes(q) ||
        item.badgeText?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory(PRESET_CATEGORIES[0]);
    setFormCustomCategory('');
    setFormDescription('');
    setFormAffiliateUrl('');
    setFormPlatform(PRESET_PLATFORMS[0]);
    setFormPriceDisplay('');
    setFormBadgeText('');
    setFormDiscountCode('');
    setFormImageUrl('');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openEditModal = (item: AffiliateProductItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    if (PRESET_CATEGORIES.includes(item.category)) {
      setFormCategory(item.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Other');
      setFormCustomCategory(item.category);
    }
    setFormDescription(item.description || '');
    setFormAffiliateUrl(item.affiliateUrl);
    setFormPlatform(item.platform || PRESET_PLATFORMS[0]);
    setFormPriceDisplay(item.priceDisplay || '');
    setFormBadgeText(item.badgeText || '');
    setFormDiscountCode(item.discountCode || '');
    setFormImageUrl(item.imageUrl || '');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadFileToStorage(file, 'affiliate');
      setFormImageUrl(url);
    } catch (err) {
      console.error('Image upload failed:', err);
      setFormError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAffiliateUrl.trim()) {
      setFormError('Title and Affiliate URL are required.');
      return;
    }

    let resolvedCategory = formCategory;
    if (formCategory === 'Other' && formCustomCategory.trim()) {
      resolvedCategory = formCustomCategory.trim();
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        await updateAffiliateProduct(business.id, editingItem.id, {
          title: formTitle.trim(),
          category: resolvedCategory,
          description: formDescription.trim() || undefined,
          affiliateUrl: formAffiliateUrl.trim(),
          platform: formPlatform.trim() || undefined,
          priceDisplay: formPriceDisplay.trim() || undefined,
          badgeText: formBadgeText.trim() || undefined,
          discountCode: formDiscountCode.trim() || undefined,
          imageUrl: formImageUrl.trim() || undefined,
        });
      } else {
        await createAffiliateProduct(business.id, {
          title: formTitle.trim(),
          category: resolvedCategory,
          description: formDescription.trim() || undefined,
          affiliateUrl: formAffiliateUrl.trim(),
          platform: formPlatform.trim() || undefined,
          priceDisplay: formPriceDisplay.trim() || undefined,
          badgeText: formBadgeText.trim() || undefined,
          discountCode: formDiscountCode.trim() || undefined,
          imageUrl: formImageUrl.trim() || undefined,
        });
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save affiliate item:', err);
      setFormError(err.message || 'Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteAffiliateProduct(business.id, itemToDelete.id);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete affiliate item:', err);
    }
  };

  const publicUrl = getCreatorModulePublicUrl(business, 'affiliate_products');
  const publicPath = getCreatorModuleDisplayPath(business, 'affiliate_products');

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-[var(--r8)] bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-600" />
                Affiliate &amp; Recommendations Suite
              </span>
              <span className="px-2.5 py-1 rounded-[var(--r8)] bg-[var(--bg)] border border-[var(--border)] text-[var(--t2)] text-xs font-semibold">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} ({totalClicks} Total Clicks)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-[var(--t1)]">
              Affiliate &amp; Recommended Products
            </h2>
            <p className="text-[var(--t2)] text-xs sm:text-sm leading-relaxed">
              Curate and monetize your favorite gear, tech stack, software apps, and exclusive discount codes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="ds-btn-secondary min-h-[44px] px-4 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="ds-btn-secondary min-h-[44px] px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            {onOpenStorefront ? (
              <button
                type="button"
                onClick={() => onOpenStorefront(business.slug, publicPath)}
                className="ds-btn-secondary min-h-[44px] px-4 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Eye className="w-4 h-4 text-teal-600" />
                <span>Preview</span>
              </button>
            ) : (
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-btn-secondary min-h-[44px] px-4 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-4 h-4 text-teal-600" />
                <span>View Live</span>
              </a>
            )}

            <button
              type="button"
              onClick={openAddModal}
              className="ds-btn-primary min-h-[44px] px-4 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-[var(--shadow-xs)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recommendation</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[var(--border)]">
          <div className="p-3.5 rounded-[var(--r12)] bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--t3)]">Total Items</span>
            <div className="text-xl font-black text-[var(--t1)] mt-0.5">{items.length}</div>
          </div>
          <div className="p-3.5 rounded-[var(--r12)] bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--t3)]">Outbound Clicks</span>
            <div className="text-xl font-black text-teal-600 mt-0.5">{totalClicks}</div>
          </div>
          <div className="p-3.5 rounded-[var(--r12)] bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--t3)]">Categories</span>
            <div className="text-xl font-black text-[var(--t1)] mt-0.5">{categories.length}</div>
          </div>
          <div className="p-3.5 rounded-[var(--r12)] bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--t3)]">Public Path</span>
            <div className="text-xs font-mono font-bold text-[var(--t2)] mt-1 truncate">{publicPath}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--t3)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, tags, codes..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-[var(--r8)] text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--card)] text-[var(--t2)] hover:text-[var(--t1)] border border-[var(--border)]'
              }`}
            >
              All ({items.length})
            </button>
            {categories.map((c) => {
              const count = items.filter((i) => i.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-[var(--r8)] text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-teal-600 text-white'
                      : 'bg-[var(--card)] text-[var(--t2)] hover:text-[var(--t1)] border border-[var(--border)]'
                  }`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Items List / Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
          <p className="text-xs text-[var(--t2)]">Loading recommendations...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Tag className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[var(--t1)]">No recommendation items yet</h3>
            <p className="text-xs text-[var(--t2)]">
              Start adding your favorite gear, tools, and books to share your personalized recommendations and monetize clicks.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="ds-btn-primary min-h-[40px] px-5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Recommendation</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] hover:border-teal-500/40 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Tag className="w-6 h-6 text-teal-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.category}
                      </span>
                      {item.badgeText && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[var(--t1)] truncate mt-1">{item.title}</h4>
                    {item.priceDisplay && (
                      <p className="text-xs font-bold text-[var(--t2)] font-mono">{item.priceDisplay}</p>
                    )}
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-[var(--t2)] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.discountCode && (
                  <div className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[var(--t2)] flex items-center gap-1 font-mono font-bold text-teal-700">
                      <Gift className="w-3.5 h-3.5 text-teal-600" />
                      {item.discountCode}
                    </span>
                    <span className="text-[10px] text-[var(--t3)] font-semibold">Promo Code</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-[var(--t3)] font-mono">
                  <MousePointerClick className="w-3.5 h-3.5 text-teal-600" />
                  <span>{item.clicks || 0} clicks</span>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={item.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-[var(--bg)] text-[var(--t2)] hover:text-teal-600 rounded-lg transition"
                    title="Test Affiliate Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 hover:bg-[var(--bg)] text-[var(--t2)] hover:text-[var(--t1)] rounded-lg transition cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--r24)] shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold font-heading text-[var(--t1)] flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600" />
                <span>{editingItem ? 'Edit Recommendation' : 'Add Recommendation'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-[var(--t3)] hover:text-[var(--t1)] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                  Product / Tool Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Sony A7 IV Camera or Notion Pro"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                  Outbound Affiliate / Referral URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={formAffiliateUrl}
                  onChange={(e) => setFormAffiliateUrl(e.target.value)}
                  placeholder="https://amzn.to/example or https://referral.link"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] font-mono outline-none focus:border-teal-500 transition shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs"
                  >
                    {PRESET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                    Platform / Store
                  </label>
                  <input
                    type="text"
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    placeholder="e.g. Amazon, AppSumo"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {formCategory === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    placeholder="e.g. Mechanical Keyboards"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                    Price Tag
                  </label>
                  <input
                    type="text"
                    value={formPriceDisplay}
                    onChange={(e) => setFormPriceDisplay(e.target.value)}
                    placeholder="e.g. ₹2,499 or $49"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                    Badge Pill
                  </label>
                  <input
                    type="text"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    placeholder="e.g. Daily Driver"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    value={formDiscountCode}
                    onChange={(e) => setFormDiscountCode(e.target.value)}
                    placeholder="e.g. MANI10"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                  Description / Why I Recommend This
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Share a short sentence about how you use this tool or why you recommend it."
                  className="w-full px-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r12)] text-xs text-[var(--t1)] outline-none focus:border-teal-500 transition shadow-2xs"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  {formImageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] shrink-0">
                      <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="absolute top-0 right-0 p-1 bg-black/70 text-white hover:bg-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}

                  <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-[var(--bg)] border border-dashed border-[var(--border)] rounded-[var(--r12)] text-xs font-bold text-[var(--t2)] hover:text-teal-600 hover:border-teal-500 transition cursor-pointer">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                        <span>Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Product Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="ds-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="ds-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Add Item'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {itemToDelete && (
        <ConfirmActionModal
          isOpen={true}
          title="Delete Recommendation?"
          message={`Are you sure you want to remove "${itemToDelete.title}" from your recommendations? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {/* QR Modal */}
      {isQrModalOpen && (
        <ModuleQrModal
          isOpen={true}
          onClose={() => setIsQrModalOpen(false)}
          title="Affiliate & Recommendations QR"
          publicUrl={publicUrl}
          businessName={business.name}
        />
      )}
    </div>
  );
};
