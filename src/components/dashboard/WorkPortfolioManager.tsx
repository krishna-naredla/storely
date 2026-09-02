import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Film,
  Video,
  ExternalLink,
  Sparkles,
  Star,
  MessageCircle,
  Calendar,
  Layers,
  Check,
  X,
  Loader2,
  Upload,
  AlertCircle,
  Award,
  BarChart2,
  TrendingUp,
  Share2,
  Copy,
  FolderPlus,
  Play,
  FileText,
  UserCheck,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Globe,
  Settings2,
} from 'lucide-react';
import {
  BusinessProfile,
  PortfolioItem,
  PortfolioCategory,
  PortfolioMediaType,
  Testimonial,
  PlatformStat,
  BrandCollab,
  PortfolioSettings,
  CatalogItem,
} from '../../types';
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  reorderPortfolioItems,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  updatePortfolioSettings,
  getCatalogItems,
} from '../../services/firebaseService';
import {
  uploadToCloudinary,
  uploadDigitalFileToCloudinary,
  deleteImageFromStorage,
} from '../../services/cloudinary';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SafeImage } from '../common/SafeImage';

interface WorkPortfolioManagerProps {
  business: BusinessProfile;
  onBusinessUpdated?: (updated: BusinessProfile) => void;
}

const CATEGORIES: PortfolioCategory[] = [
  'Photography',
  'Video/Motion',
  'Design',
  'Development',
  'Writing',
  'Coaching',
  'Events',
  'Beauty',
  'Handmade/Art',
  'Other',
];

const PLATFORMS = [
  { name: 'Instagram', icon: Instagram },
  { name: 'YouTube', icon: Youtube },
  { name: 'TikTok', icon: Video },
  { name: 'Twitter / X', icon: Twitter },
  { name: 'LinkedIn', icon: Linkedin },
  { name: 'Spotify / Podcast', icon: Globe },
  { name: 'Website / Blog', icon: Globe },
];

export const WorkPortfolioManager: React.FC<WorkPortfolioManagerProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'mediakit' | 'testimonials' | 'cta'>('items');
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [consultationItems, setConsultationItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Item Form Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PortfolioItem | null>(null);

  // Item Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<PortfolioCategory>('Photography');
  const [itemCoverImage, setItemCoverImage] = useState('');
  const [itemMediaType, setItemMediaType] = useState<PortfolioMediaType>('image');
  const [itemMediaUrls, setItemMediaUrls] = useState<string[]>([]);
  const [itemExternalUrl, setItemExternalUrl] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemTags, setItemTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [itemClientName, setItemClientName] = useState('');
  const [itemProjectOutcome, setItemProjectOutcome] = useState('');
  const [itemIsActive, setItemIsActive] = useState(true);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Testimonials State
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialClientName, setTestimonialClientName] = useState('');
  const [testimonialClientRole, setTestimonialClientRole] = useState('');
  const [testimonialClientPhoto, setTestimonialClientPhoto] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialRating, setTestimonialRating] = useState<number>(5);
  const [isSavingTestimonial, setIsSavingTestimonial] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  // Media Kit State
  const [mediaKitEnabled, setMediaKitEnabled] = useState(business.portfolioSettings?.mediaKit?.enabled ?? true);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>(
    business.portfolioSettings?.mediaKit?.platformStats || []
  );
  const [brandCollabs, setBrandCollabs] = useState<BrandCollab[]>(
    business.portfolioSettings?.mediaKit?.brandCollabs || []
  );
  const [isSavingMediaKit, setIsSavingMediaKit] = useState(false);
  const [mediaKitSuccessMessage, setMediaKitSuccessMessage] = useState(false);

  // CTA & Enquiry Settings State
  const [ctaMode, setCtaMode] = useState<'whatsapp' | 'booking'>(
    business.portfolioSettings?.ctaMode || 'whatsapp'
  );
  const [customCtaText, setCustomCtaText] = useState(
    business.portfolioSettings?.customCtaText || ''
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    business.portfolioSettings?.whatsappMessage ||
      `Hi ${business.name}, I saw your portfolio on Storelly and would love to discuss working together on a project!`
  );
  const [selectedBookingItemId, setSelectedBookingItemId] = useState(
    business.portfolioSettings?.bookingItemId || ''
  );
  const [isSavingCta, setIsSavingCta] = useState(false);
  const [ctaSuccessMessage, setCtaSuccessMessage] = useState(false);

  // Load Portfolio Data
  const loadPortfolioData = async () => {
    setIsLoading(true);
    try {
      const [fetchedItems, fetchedTestimonials, catalogList] = await Promise.all([
        getPortfolioItems(business.id),
        getTestimonials(business.id),
        getCatalogItems(business.id),
      ]);
      setItems(fetchedItems);
      setTestimonials(fetchedTestimonials);
      setConsultationItems(
        catalogList.filter(
          (i) =>
            i.type === 'service' ||
            i.productType === 'consultation_slot' ||
            i.type === 'package'
        )
      );
    } catch (err) {
      console.error('Error loading portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [business.id]);

  // Open Create Item Modal
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemCategory('Photography');
    setItemCoverImage('');
    setItemMediaType('image');
    setItemMediaUrls([]);
    setItemExternalUrl('');
    setItemDescription('');
    setItemTags([]);
    setTagInput('');
    setItemClientName('');
    setItemProjectOutcome('');
    setItemIsActive(true);
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemCategory(item.category || 'Photography');
    setItemCoverImage(item.coverImage || '');
    setItemMediaType(item.mediaType || 'image');
    setItemMediaUrls(item.mediaUrls || []);
    setItemExternalUrl(item.externalUrl || '');
    setItemDescription(item.description || '');
    setItemTags(item.tags || []);
    setTagInput('');
    setItemClientName(item.clientName || '');
    setItemProjectOutcome(item.projectOutcome || '');
    setItemIsActive(item.isActive !== false);
    setIsItemModalOpen(true);
  };

  // Add Tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().toLowerCase();
    if (!itemTags.includes(cleanTag)) {
      setItemTags([...itemTags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setItemTags(itemTags.filter((t) => t !== tagToRemove));
  };

  // Upload Cover Image
  const handleUploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadProgress(10);
    try {
      const url = await uploadToCloudinary(file, (p) => setUploadProgress(p));
      setItemCoverImage(url);
    } catch (err) {
      console.error('Error uploading cover image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  // Upload Gallery Images
  const handleUploadGalleryImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    setUploadProgress(10);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
      }
      setItemMediaUrls((prev) => [...prev, ...uploadedUrls]);
      if (!itemCoverImage && uploadedUrls.length > 0) {
        setItemCoverImage(uploadedUrls[0]);
      }
    } catch (err) {
      console.error('Error uploading gallery images:', err);
      alert('Error uploading one or more images.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  // Upload Video File
  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadProgress(10);
    try {
      const res = await uploadDigitalFileToCloudinary(file, (p) => setUploadProgress(p));
      setItemMediaUrls([res.url]);
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Failed to upload video file.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  // Save Portfolio Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      alert('Please enter a project title');
      return;
    }
    if (!itemCoverImage.trim()) {
      alert('Please upload a cover thumbnail image');
      return;
    }

    if (itemMediaType === 'external_video' || itemMediaType === 'external_link') {
      if (!itemExternalUrl.trim()) {
        alert('Please provide a valid destination URL (YouTube, Vimeo, Figma, or website link)');
        return;
      }
      try {
        new URL(itemExternalUrl.trim());
      } catch {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
      }
    }

    setIsSavingItem(true);
    try {
      const payload = {
        title: itemTitle.trim(),
        category: itemCategory,
        coverImage: itemCoverImage.trim(),
        mediaType: itemMediaType,
        mediaUrls: itemMediaUrls,
        externalUrl: itemExternalUrl.trim() || undefined,
        description: itemDescription.trim(),
        tags: itemTags,
        clientName: itemClientName.trim() || undefined,
        projectOutcome: itemProjectOutcome.trim() || undefined,
        isActive: itemIsActive,
        order: editingItem ? editingItem.order : items.length,
      };

      if (editingItem) {
        await updatePortfolioItem(business.id, editingItem.id, payload);
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...payload } : i))
        );
      } else {
        const created = await createPortfolioItem(business.id, payload);
        setItems((prev) => [...prev, created]);
      }

      setIsItemModalOpen(false);
    } catch (err) {
      console.error('Error saving portfolio item:', err);
      alert('Failed to save portfolio item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  // Toggle Active Status
  const handleToggleItemActive = async (item: PortfolioItem) => {
    try {
      const updatedStatus = !item.isActive;
      await updatePortfolioItem(business.id, item.id, { isActive: updatedStatus });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: updatedStatus } : i))
      );
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  // Delete Portfolio Item
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deletePortfolioItem(business.id, itemToDelete.id, itemToDelete);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      alert('Failed to delete item.');
    }
  };

  // Reorder Item
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    const reordered = newItems.map((item, idx) => ({ ...item, order: idx }));
    setItems(reordered);

    try {
      await reorderPortfolioItems(
        business.id,
        reordered.map((i) => ({ id: i.id, order: i.order }))
      );
    } catch (err) {
      console.error('Error reordering items:', err);
    }
  };

  // ==========================================
  // TESTIMONIALS HANDLERS
  // ==========================================
  const handleOpenCreateTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialClientName('');
    setTestimonialClientRole('');
    setTestimonialClientPhoto('');
    setTestimonialQuote('');
    setTestimonialRating(5);
    setIsTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (t: Testimonial) => {
    setEditingTestimonial(t);
    setTestimonialClientName(t.clientName);
    setTestimonialClientRole(t.clientRole || '');
    setTestimonialClientPhoto(t.clientPhoto || '');
    setTestimonialQuote(t.quote);
    setTestimonialRating(t.rating || 5);
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialClientName.trim() || !testimonialQuote.trim()) {
      alert('Client Name and Quote are required.');
      return;
    }
    setIsSavingTestimonial(true);
    try {
      const payload = {
        clientName: testimonialClientName.trim(),
        clientRole: testimonialClientRole.trim() || undefined,
        clientPhoto: testimonialClientPhoto.trim() || undefined,
        quote: testimonialQuote.trim(),
        rating: testimonialRating,
        order: editingTestimonial ? editingTestimonial.order : testimonials.length,
        isActive: true,
      };

      if (editingTestimonial) {
        await updateTestimonial(business.id, editingTestimonial.id, payload);
        setTestimonials((prev) =>
          prev.map((t) =>
            t.id === editingTestimonial.id ? { ...t, ...payload } : t
          )
        );
      } else {
        const created = await createTestimonial(business.id, payload);
        setTestimonials((prev) => [...prev, created]);
      }
      setIsTestimonialModalOpen(false);
    } catch (err) {
      console.error('Error saving testimonial:', err);
      alert('Failed to save testimonial.');
    } finally {
      setIsSavingTestimonial(false);
    }
  };

  const handleConfirmDeleteTestimonial = async () => {
    if (!testimonialToDelete) return;
    try {
      await deleteTestimonial(
        business.id,
        testimonialToDelete.id,
        testimonialToDelete.clientPhoto
      );
      setTestimonials((prev) =>
        prev.filter((t) => t.id !== testimonialToDelete.id)
      );
      setTestimonialToDelete(null);
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  // ==========================================
  // MEDIA KIT HANDLERS
  // ==========================================
  const handleAddPlatformStat = () => {
    const newStat: PlatformStat = {
      id: `stat-${Date.now()}`,
      platform: 'Instagram',
      count: '10K',
      engagementRate: '4.5%',
      label: 'Followers',
    };
    setPlatformStats([...platformStats, newStat]);
  };

  const handleUpdatePlatformStat = (id: string, field: keyof PlatformStat, value: string) => {
    setPlatformStats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemovePlatformStat = (id: string) => {
    setPlatformStats(platformStats.filter((s) => s.id !== id));
  };

  const handleAddBrandCollab = () => {
    const newCollab: BrandCollab = {
      id: `collab-${Date.now()}`,
      brandName: 'Brand Name',
      description: 'Campaign / Product Showcase',
      collabYear: '2026',
    };
    setBrandCollabs([...brandCollabs, newCollab]);
  };

  const handleUpdateBrandCollab = (id: string, field: keyof BrandCollab, value: string) => {
    setBrandCollabs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveBrandCollab = (id: string) => {
    setBrandCollabs(brandCollabs.filter((c) => c.id !== id));
  };

  const handleSaveMediaKit = async () => {
    setIsSavingMediaKit(true);
    try {
      const currentSettings = business.portfolioSettings || { ctaMode: 'whatsapp' };
      const updatedSettings: PortfolioSettings = {
        ...currentSettings,
        mediaKit: {
          enabled: mediaKitEnabled,
          platformStats,
          brandCollabs,
        },
      };

      await updatePortfolioSettings(business.id, updatedSettings);
      if (onBusinessUpdated) {
        onBusinessUpdated({
          ...business,
          portfolioSettings: updatedSettings,
        });
      }
      setMediaKitSuccessMessage(true);
      setTimeout(() => setMediaKitSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error updating media kit:', err);
      alert('Failed to save Media Kit settings.');
    } finally {
      setIsSavingMediaKit(false);
    }
  };

  // ==========================================
  // CTA / ENQUIRY SETTINGS HANDLER
  // ==========================================
  const handleSaveCtaSettings = async () => {
    setIsSavingCta(true);
    try {
      const currentSettings = business.portfolioSettings || { ctaMode: 'whatsapp' };
      const updatedSettings: PortfolioSettings = {
        ...currentSettings,
        ctaMode,
        customCtaText: customCtaText.trim() || undefined,
        whatsappMessage: whatsappMessage.trim() || undefined,
        bookingItemId: selectedBookingItemId || undefined,
      };

      await updatePortfolioSettings(business.id, updatedSettings);
      if (onBusinessUpdated) {
        onBusinessUpdated({
          ...business,
          portfolioSettings: updatedSettings,
        });
      }
      setCtaSuccessMessage(true);
      setTimeout(() => setCtaSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error saving CTA settings:', err);
      alert('Failed to save CTA configuration.');
    } finally {
      setIsSavingCta(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchTag;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              Work Portfolio & Showcase
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              Module 3
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showcase showreels, photography galleries, design case studies, and live demo links to win clients and booking inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateItem}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Work Sample
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'items'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Work Samples ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('mediakit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'mediakit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Media Kit & Stats (
          {platformStats.length + brandCollabs.length})
        </button>

        <button
          onClick={() => setActiveTab('testimonials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'testimonials'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Star className="w-4 h-4" /> Client Testimonials ({testimonials.length})
        </button>

        <button
          onClick={() => setActiveTab('cta')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'cta'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Settings2 className="w-4 h-4" /> Enquiry & CTA Setup
        </button>
      </div>

      {/* ===================================================== */}
      {/* TAB 1: WORK SAMPLES / PORTFOLIO ITEMS */}
      {/* ===================================================== */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            {/* Category Filter Horizontal Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({items.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = items.filter((i) => i.category === cat).length;
                if (count === 0 && selectedCategoryFilter !== cat) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search work samples by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Items Grid / Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-white border border-slate-200 p-4 h-64 animate-pulse"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  No work samples found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add projects, case studies, showreels, and photo galleries to show off your capabilities.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateItem}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Your First Work Sample
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item, index) => {
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl sm:rounded-3xl bg-white border transition-all overflow-hidden flex flex-col justify-between group ${
                      item.isActive
                        ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                        : 'border-slate-200 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Cover Thumbnail with Media Badge */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <SafeImage
                        src={item.coverImage}
                        alt={item.title}
                        fallbackType="product"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Category Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {item.category}
                        </span>
                      </div>

                      {/* Media Type Icon Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          {item.mediaType === 'image' && <ImageIcon className="w-3 h-3" />}
                          {item.mediaType === 'gallery' && (
                            <>
                              <Layers className="w-3 h-3" />
                              <span>{item.mediaUrls?.length || 0} Photos</span>
                            </>
                          )}
                          {item.mediaType === 'video_file' && <Film className="w-3 h-3" />}
                          {item.mediaType === 'external_video' && <Play className="w-3 h-3" />}
                          {item.mediaType === 'external_link' && <ExternalLink className="w-3 h-3" />}
                          {item.mediaType === 'video_file' || item.mediaType === 'external_video'
                            ? 'Video'
                            : item.mediaType === 'external_link'
                            ? 'Live Demo'
                            : item.mediaType === 'image'
                            ? 'Photo'
                            : ''}
                        </span>
                      </div>

                      {/* Status indicator */}
                      {!item.isActive && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                          <span className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                            Hidden from Public
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Client / Outcome metadata */}
                        {(item.clientName || item.projectOutcome) && (
                          <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                            {item.clientName && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                👤 {item.clientName}
                              </span>
                            )}
                            {item.projectOutcome && (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                                🏆 {item.projectOutcome}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Controls Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                        {/* Order Movers */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === filteredItems.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleItemActive(item)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              item.isActive
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={item.isActive ? 'Hide item' : 'Make item public'}
                          >
                            {item.isActive ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Sample"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Sample"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 2: MEDIA KIT & SOCIAL STATS (OPTIONAL BLOCK) */}
      {/* ===================================================== */}
      {activeTab === 'mediakit' && (
        <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Media Kit & Stats Block
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Display verified follower counts, engagement metrics, and past brand collaborations for sponsorships. If left empty, this section automatically hides on your public portfolio.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaKitEnabled}
                  onChange={(e) => setMediaKitEnabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">
                  Enable Media Kit on Portfolio
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveMediaKit}
                disabled={isSavingMediaKit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingMediaKit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Media Kit</span>
              </button>
            </div>
          </div>

          {mediaKitSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Media kit stats and brand collaborations updated successfully!
            </div>
          )}

          {/* Section 1: Platform Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" /> Platform Audience & Engagement Stats
              </h4>
              <button
                type="button"
                onClick={handleAddPlatformStat}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stat Row
              </button>
            </div>

            {platformStats.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
                No audience stats added yet. Click "+ Add Stat Row" to showcase your reach.
              </div>
            ) : (
              <div className="space-y-2">
                {platformStats.map((stat) => (
                  <div
                    key={stat.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <div className="w-full sm:w-1/4">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Platform
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Instagram, YouTube"
                        value={stat.platform}
                        onChange={(e) =>
                          handleUpdatePlatformStat(stat.id, 'platform', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-1/4">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Followers / Subscribers
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 150K, 1.2M"
                        value={stat.count}
                        onChange={(e) =>
                          handleUpdatePlatformStat(stat.id, 'count', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                      />
                    </div>

                    <div className="w-full sm:w-1/4">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Avg Engagement Rate
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4.8%"
                        value={stat.engagementRate || ''}
                        onChange={(e) =>
                          handleUpdatePlatformStat(stat.id, 'engagementRate', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-emerald-700 font-bold"
                      />
                    </div>

                    <div className="w-full sm:w-1/4 flex items-end justify-between gap-2">
                      <div className="w-full">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Followers"
                          value={stat.label || ''}
                          onChange={(e) =>
                            handleUpdatePlatformStat(stat.id, 'label', e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePlatformStat(stat.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Past Brand Collaborations */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Past Brand Collaborations & Clients
              </h4>
              <button
                type="button"
                onClick={handleAddBrandCollab}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Brand Collab
              </button>
            </div>

            {brandCollabs.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
                No past brand collaborations added yet. Click "+ Add Brand Collab" to showcase your client history.
              </div>
            ) : (
              <div className="space-y-2">
                {brandCollabs.map((collab) => (
                  <div
                    key={collab.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <div className="w-full sm:w-1/3">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Brand / Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nike, Spotify, Canon"
                        value={collab.brandName}
                        onChange={(e) =>
                          handleUpdateBrandCollab(collab.id, 'brandName', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Collaboration Description / Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lead cinematographer for launch campaign, Sponsored reel series"
                        value={collab.description}
                        onChange={(e) =>
                          handleUpdateBrandCollab(collab.id, 'description', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="w-full sm:w-1/6 flex items-end justify-between gap-2">
                      <div className="w-full">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          placeholder="2026"
                          value={collab.collabYear || ''}
                          onChange={(e) =>
                            handleUpdateBrandCollab(collab.id, 'collabYear', e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBrandCollab(collab.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Remove collaboration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 3: TESTIMONIALS */}
      {/* ===================================================== */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Client Testimonials
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Collect and showcase praise from past clients to build immediate trust.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateTestimonial}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>

          {testimonials.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No testimonials yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add reviews from your previous clients, brides, brand partners, or students.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateTestimonial}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + Add Client Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-sm transition"
                >
                  <div className="space-y-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (t.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{t.quote}"
                    </p>
                  </div>

                  {/* Client Info & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {t.clientPhoto ? (
                        <img
                          src={t.clientPhoto}
                          alt={t.clientName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {t.clientName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.clientName}</div>
                        {t.clientRole && (
                          <div className="text-[10px] text-slate-500">{t.clientRole}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTestimonial(t)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestimonialToDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 4: ENQUIRY & CTA SETTINGS (PART D) */}
      {/* ===================================================== */}
      {activeTab === 'cta' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-black text-slate-900 font-heading">
              Enquiry & Booking Call-to-Action
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose how prospective clients convert when viewing your work showcase.
            </p>
          </div>

          {ctaSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              CTA and conversion settings saved successfully!
            </div>
          )}

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mode 1: WhatsApp */}
            <div
              onClick={() => setCtaMode('whatsapp')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                ctaMode === 'whatsapp'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. "Enquire on WhatsApp" Mode
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direct one-click button that opens a WhatsApp conversation with your business number and a customizable pre-filled message.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <input
                  type="radio"
                  name="ctaMode"
                  checked={ctaMode === 'whatsapp'}
                  onChange={() => setCtaMode('whatsapp')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Active Mode</span>
              </div>
            </div>

            {/* Mode 2: Book a Slot */}
            <div
              onClick={() => setCtaMode('booking')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                ctaMode === 'booking'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. "Book a Slot" Mode
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Reuses the consultation booking system (Module 1) for 1:1 discovery calls, portfolio reviews, or discovery sessions.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                <input
                  type="radio"
                  name="ctaMode"
                  checked={ctaMode === 'booking'}
                  onChange={() => setCtaMode('booking')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Active Mode</span>
              </div>
            </div>
          </div>

          {/* Mode-specific configuration inputs */}
          {ctaMode === 'whatsapp' ? (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom CTA Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chat on WhatsApp / Inquire for Project"
                  value={customCtaText}
                  onChange={(e) => setCustomCtaText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pre-filled WhatsApp Inquiry Message
                </label>
                <textarea
                  rows={3}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When visitors click this button, WhatsApp will open with this text pre-typed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Book 30-Min Discovery Call"
                  value={customCtaText}
                  onChange={(e) => setCustomCtaText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Attach to Specific Consultation Offering
                </label>
                <select
                  value={selectedBookingItemId}
                  onChange={(e) => setSelectedBookingItemId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- General Discovery Session --</option>
                  {consultationItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({business.currencySymbol}{item.price})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Reuses the interactive date-picker, calendar slots, and payment system configured in your catalog.
                </p>
              </div>
            </div>
          )}

          {/* Save CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveCtaSettings}
              disabled={isSavingCta}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingCta ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save Call-to-Action Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL: ADD / EDIT WORK SAMPLE */}
      {/* ===================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  {editingItem ? 'Edit Work Sample' : 'Add Work Sample to Showcase'}
                </h3>
                <p className="text-xs text-slate-500">
                  Add high-resolution media, project context, and client results.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arjun & Priya Wedding Film"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Discipline / Category *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as PortfolioCategory)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover Thumbnail Image */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cover Thumbnail (Required) *
                </label>
                <div className="flex items-center gap-4">
                  {itemCoverImage ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                      <SafeImage
                        src={itemCoverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setItemCoverImage('')}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{itemCoverImage ? 'Replace Cover Image' : 'Upload Cover Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCoverImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP. Optimized automatically via Cloudinary.
                    </p>
                  </div>
                </div>
              </div>

              {/* Media Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Media Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { type: 'image' as PortfolioMediaType, label: 'Single Photo', icon: ImageIcon },
                    { type: 'gallery' as PortfolioMediaType, label: 'Photo Gallery', icon: Layers },
                    { type: 'video_file' as PortfolioMediaType, label: 'Uploaded Video', icon: Film },
                    { type: 'external_video' as PortfolioMediaType, label: 'YouTube / Vimeo', icon: Play },
                    { type: 'external_link' as PortfolioMediaType, label: 'Live Link / Figma', icon: ExternalLink },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = itemMediaType === m.type;
                    return (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => setItemMediaType(m.type)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Media Type Inputs */}
              {itemMediaType === 'gallery' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Gallery Images ({itemMediaUrls.length})
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUploadGalleryImages}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {itemMediaUrls.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {itemMediaUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative h-16 rounded-lg overflow-hidden border border-slate-200 group"
                        >
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setItemMediaUrls(itemMediaUrls.filter((_, i) => i !== idx))
                            }
                            className="absolute top-0.5 right-0.5 p-1 bg-red-600 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Upload multiple high-resolution photos for clients to browse in a fullscreen lightbox.
                    </p>
                  )}
                </div>
              )}

              {itemMediaType === 'video_file' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    Upload Video File (MP4, MOV)
                  </label>
                  {itemMediaUrls[0] ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Film className="w-4 h-4 text-indigo-600" />
                        <span>Video Uploaded</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemMediaUrls([])}
                        className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 transition">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-indigo-600">
                        Click to upload video file
                      </span>
                      <span className="text-[11px] text-slate-400">
                        MP4, WEBM or MOV files
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleUploadVideoFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {(itemMediaType === 'external_video' || itemMediaType === 'external_link') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {itemMediaType === 'external_video'
                      ? 'YouTube / Vimeo Video URL *'
                      : 'Project / Live App / Figma URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={
                      itemMediaType === 'external_video'
                        ? 'https://www.youtube.com/watch?v=...'
                        : 'https://figma.com/file/... or https://myapp.com'
                    }
                    value={itemExternalUrl}
                    onChange={(e) => setItemExternalUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Project Description / Case Study
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the project scope, artistic direction, deliverables, and outcome..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Client & Outcome Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Client / Brand Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vogue India, Acme Corp"
                    value={itemClientName}
                    onChange={(e) => setItemClientName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Key Outcome (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5M+ Views, 40% Conversion Lift"
                    value={itemProjectOutcome}
                    onChange={(e) => setItemProjectOutcome(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tags (Free text)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. bridal, 4k, mobile-app (Hit Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Add Tag
                  </button>
                </div>
                {itemTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {itemTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemIsActive}
                    onChange={(e) => setItemIsActive(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Visible on Public Portfolio Showcase
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem || isUploadingMedia}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingItem ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingItem ? 'Save Changes' : 'Publish Sample'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL: ADD / EDIT TESTIMONIAL */}
      {/* ===================================================== */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 font-heading">
                {editingTestimonial ? 'Edit Testimonial' : 'Add Client Testimonial'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTestimonialModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Reddy"
                  value={testimonialClientName}
                  onChange={(e) => setTestimonialClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client Title / Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bride, Head of Growth at Swiggy"
                  value={testimonialClientRole}
                  onChange={(e) => setTestimonialClientRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Star Rating (1-5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTestimonialRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= testimonialRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client Quote / Review *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="What was the client's experience working with you?"
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTestimonial}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Work Sample?"
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}"? Any associated media files in Cloudinary storage will also be cleaned up.`}
        confirmText="Delete Sample"
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Delete Testimonial Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!testimonialToDelete}
        title="Delete Testimonial?"
        message={`Are you sure you want to delete the testimonial from "${testimonialToDelete?.clientName}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteTestimonial}
        onCancel={() => setTestimonialToDelete(null)}
      />
    </div>
  );
};
