import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  Film,
  Globe,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  Calendar,
  User,
  Award,
  Github,
  Figma,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  PortfolioItem,
  PortfolioMediaType,
  PortfolioCategory,
  BusinessProfile,
} from '../../types';
import { uploadToCloudinary } from '../../services/cloudinary';
import { SafeImage } from '../common/SafeImage';

const DEFAULT_PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
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

interface PortfolioItemModalProps {
  isOpen: boolean;
  editingItem: PortfolioItem | null;
  business: BusinessProfile;
  categories?: string[];
  existingCategories?: string[];
  onClose: () => void;
  onSave: (itemData: Omit<PortfolioItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>;
}

export const PortfolioItemModal: React.FC<PortfolioItemModalProps> = ({
  isOpen,
  editingItem,
  business,
  categories,
  existingCategories,
  onClose,
  onSave,
}) => {
  const categoryOptions =
    categories && categories.length > 0
      ? categories
      : existingCategories && existingCategories.length > 0
      ? existingCategories
      : DEFAULT_PORTFOLIO_CATEGORIES;

  const defaultCategory = categoryOptions[0] || 'Photography';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [coverImage, setCoverImage] = useState('');
  const [mediaType, setMediaType] = useState<PortfolioMediaType>('image');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectYear, setProjectYear] = useState('');
  const [role, setRole] = useState('');
  const [projectOutcome, setProjectOutcome] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [readTime, setReadTime] = useState('');
  const [videoViews, setVideoViews] = useState('');
  const [caseStudyStory, setCaseStudyStory] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setCategory(editingItem.category || defaultCategory);
      setCoverImage(editingItem.coverImage || '');
      setMediaType(editingItem.mediaType || 'image');
      setMediaUrls(editingItem.mediaUrls || []);
      setExternalUrl(editingItem.externalUrl || '');
      setDescription(editingItem.description || '');
      setTags(editingItem.tags || []);
      setClientName(editingItem.clientName || '');
      setProjectYear(editingItem.projectYear || '');
      setRole(editingItem.role || '');
      setProjectOutcome(editingItem.projectOutcome || '');
      setLiveDemoUrl(editingItem.liveDemoUrl || '');
      setGithubUrl(editingItem.githubUrl || '');
      setFigmaUrl(editingItem.figmaUrl || '');
      setReadTime(editingItem.readTime || '');
      setVideoViews(editingItem.videoViews || '');
      setCaseStudyStory(editingItem.caseStudyStory || '');
      setIsActive(editingItem.isActive !== false);
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setCoverImage('');
      setMediaType('image');
      setMediaUrls([]);
      setExternalUrl('');
      setDescription('');
      setTags([]);
      setClientName('');
      setProjectYear(new Date().getFullYear().toString());
      setRole('');
      setProjectOutcome('');
      setLiveDemoUrl('');
      setGithubUrl('');
      setFigmaUrl('');
      setReadTime('');
      setVideoViews('');
      setCaseStudyStory('');
      setIsActive(true);
    }
  }, [editingItem, isOpen, categories]);

  if (!isOpen) return null;

  // Handle Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file);
      if (url) {
        setCoverImage(url);
      }
    } catch (err) {
      console.error('Failed to upload cover image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Gallery Images Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map((f: File) =>
        uploadToCloudinary(f)
      );
      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter((url): url is string => Boolean(url));
      setMediaUrls((prev) => [...prev, ...validUrls]);
    } catch (err) {
      console.error('Failed to upload gallery images:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        mediaType,
        mediaUrls,
        externalUrl: externalUrl.trim() || undefined,
        description: description.trim(),
        tags,
        clientName: clientName.trim() || undefined,
        projectYear: projectYear.trim() || undefined,
        role: role.trim() || undefined,
        projectOutcome: projectOutcome.trim() || undefined,
        liveDemoUrl: liveDemoUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        figmaUrl: figmaUrl.trim() || undefined,
        readTime: readTime.trim() || undefined,
        videoViews: videoViews.trim() || undefined,
        caseStudyStory: caseStudyStory.trim() || undefined,
        isActive,
      });
      onClose();
    } catch (err) {
      console.error('Error saving portfolio item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-6 text-slate-900 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 font-heading">
              {editingItem ? 'Edit Work Sample' : 'Add New Work Sample'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showcase high-resolution media, case study outcomes, and project links.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Royal Jaipur Palace Wedding Film / FinTech Design System"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Media Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Media Showcase Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'image', label: 'Single Photo', icon: ImageIcon },
                { id: 'gallery', label: 'Multi Photo Gallery', icon: Layers },
                { id: 'external_video', label: 'YouTube / Vimeo Video', icon: Film },
                { id: 'external_link', label: 'External Project Link', icon: Globe },
              ].map((m) => {
                const isSelected = mediaType === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMediaType(m.id as PortfolioMediaType)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Cover Image Upload or URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Cover Thumbnail Image <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-44 h-28 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {coverImage ? (
                  <SafeImage
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center text-[10px]">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    No cover uploaded
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">or enter image URL:</span>
                </div>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* If Multi-Gallery: Gallery Image Uploader */}
          {mediaType === 'gallery' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Additional Gallery Photos ({mediaUrls.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Clients can swipe or click through this gallery in the lightbox.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer shadow-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {mediaUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group w-full h-16 rounded-xl overflow-hidden border border-slate-200"
                    >
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* If Video: Video URL Input */}
          {mediaType === 'external_video' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                YouTube or Vimeo Video URL
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Description & Outcome */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Summary / Context
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the client's problem, creative concept, shoot style, or technical challenges tackled..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Result / Project Outcome</span>
                </label>
                <input
                  type="text"
                  value={projectOutcome}
                  onChange={(e) => setProjectOutcome(e.target.value)}
                  placeholder="e.g. 2.4M Impressions / Delivered in 3 weeks / Featured on Vogue"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Client / Brand Name</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Sony Music / Rahul & Anjali / Acme Inc."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Lead Cinematographer / UI Architect"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Year
                </label>
                <input
                  type="text"
                  value={projectYear}
                  onChange={(e) => setProjectYear(e.target.value)}
                  placeholder="2025"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Read Time / Video Views (Optional)
                </label>
                <input
                  type="text"
                  value={readTime || videoViews}
                  onChange={(e) => {
                    setReadTime(e.target.value);
                    setVideoViews(e.target.value);
                  }}
                  placeholder="e.g. 5 min read / 125K views"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* External Links (Live Demo, GitHub, Figma) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Project Links & References
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live Demo URL
                </label>
                <input
                  type="url"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                  placeholder="https://mysite.com"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Github className="w-3 h-3" /> GitHub Repo
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Figma className="w-3 h-3" /> Figma Design
                </label>
                <input
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://figma.com/..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keywords & Tags
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Candid, Next.js, Figma, Drone)..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded-sm text-indigo-600 focus:ring-indigo-500"
              />
              <span>Published & visible on public portfolio</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingItem ? 'Update Work Sample' : 'Save & Publish'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
