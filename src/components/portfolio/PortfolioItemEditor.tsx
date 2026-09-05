import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
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
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Play,
} from 'lucide-react';
import {
  PortfolioItem,
  PortfolioMediaType,
  PortfolioCategory,
  BusinessProfile,
} from '../../types';
import { uploadToCloudinary, uploadDigitalFileToCloudinary } from '../../services/cloudinary';
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

interface PortfolioItemEditorProps {
  business: BusinessProfile;
  editingItem: PortfolioItem | null;
  categories?: string[];
  onBack: () => void;
  onSave: (itemData: Omit<PortfolioItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>;
}

export const PortfolioItemEditor: React.FC<PortfolioItemEditorProps> = ({
  business,
  editingItem,
  categories,
  onBack,
  onSave,
}) => {
  const categoryOptions =
    categories && categories.length > 0 ? categories : DEFAULT_PORTFOLIO_CATEGORIES;
  const defaultCategory = categoryOptions[0] || 'Photography';

  const [title, setTitle] = useState(editingItem?.title || '');
  const [category, setCategory] = useState<string>(editingItem?.category || defaultCategory);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

  const [coverImage, setCoverImage] = useState(editingItem?.coverImage || '');
  const [mediaType, setMediaType] = useState<PortfolioMediaType>(editingItem?.mediaType || 'image');
  const [mediaUrls, setMediaUrls] = useState<string[]>(editingItem?.mediaUrls || []);
  const [externalUrl, setExternalUrl] = useState(editingItem?.externalUrl || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [tags, setTags] = useState<string[]>(editingItem?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Rich Case Study Details
  const [clientName, setClientName] = useState(editingItem?.clientName || '');
  const [projectYear, setProjectYear] = useState(
    editingItem?.projectYear || editingItem?.year || new Date().getFullYear().toString()
  );
  const [role, setRole] = useState(editingItem?.role || '');
  const [projectOutcome, setProjectOutcome] = useState(editingItem?.projectOutcome || '');
  const [liveDemoUrl, setLiveDemoUrl] = useState(editingItem?.liveDemoUrl || '');
  const [githubUrl, setGithubUrl] = useState(editingItem?.githubUrl || '');
  const [figmaUrl, setFigmaUrl] = useState(editingItem?.figmaUrl || '');
  const [readTime, setReadTime] = useState(editingItem?.readTime || '');
  const [videoViews, setVideoViews] = useState(editingItem?.videoViews || '');
  const [caseStudyStory, setCaseStudyStory] = useState(
    editingItem?.caseStudyStory || editingItem?.caseStudyNarrative || ''
  );
  const [isActive, setIsActive] = useState(editingItem?.isActive !== false);

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state if editingItem changes
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
      setProjectYear(editingItem.projectYear || editingItem.year || new Date().getFullYear().toString());
      setRole(editingItem.role || '');
      setProjectOutcome(editingItem.projectOutcome || '');
      setLiveDemoUrl(editingItem.liveDemoUrl || '');
      setGithubUrl(editingItem.githubUrl || '');
      setFigmaUrl(editingItem.figmaUrl || '');
      setReadTime(editingItem.readTime || '');
      setVideoViews(editingItem.videoViews || '');
      setCaseStudyStory(editingItem.caseStudyStory || editingItem.caseStudyNarrative || '');
      setIsActive(editingItem.isActive !== false);
    }
  }, [editingItem, defaultCategory]);

  // Handle Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      setValidationError(null);
      const url = await uploadToCloudinary(file);
      setCoverImage(url);
    } catch (err: any) {
      console.error('Error uploading cover image:', err);
      setValidationError('Failed to upload cover image. Please check image format or try again.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle Multi-Gallery Photo Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingGallery(true);
      setValidationError(null);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToCloudinary(files[i]);
        newUrls.push(url);
      }
      setMediaUrls((prev) => [...prev, ...newUrls]);
      if (!coverImage && newUrls.length > 0) {
        setCoverImage(newUrls[0]);
      }
    } catch (err: any) {
      console.error('Error uploading gallery photos:', err);
      setValidationError('Failed to upload some gallery photos.');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Handle Video File Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingVideo(true);
      setValidationError(null);
      const res = await uploadDigitalFileToCloudinary(file);
      setMediaUrls([res.url]);
    } catch (err: any) {
      console.error('Error uploading video:', err);
      setValidationError('Failed to upload video file. Please check video file size or try again.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveMediaUrl = (indexToRemove: number) => {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Tags Handler
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Validation and Save
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please enter a project or work sample title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const effectiveCategory = isCustomCategoryMode && customCategory.trim()
      ? customCategory.trim()
      : category.trim();

    if (!effectiveCategory) {
      setValidationError('Please select or specify a category.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Cover image validation
    let effectiveCover = coverImage.trim();
    if (!effectiveCover && mediaUrls.length > 0) {
      effectiveCover = mediaUrls[0];
      setCoverImage(effectiveCover);
    }

    if (!effectiveCover) {
      setValidationError('Please upload a cover image or thumbnail for this work sample.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // External URL validation if needed
    if (mediaType === 'external_video' && !externalUrl.trim()) {
      setValidationError('Please enter a YouTube, Vimeo, or video stream URL.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        category: effectiveCategory,
        coverImage: effectiveCover,
        mediaType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        externalUrl: externalUrl.trim() || undefined,
        description: description.trim(),
        tags: tags.length > 0 ? tags : undefined,
        clientName: clientName.trim() || undefined,
        projectYear: projectYear.trim() || undefined,
        year: projectYear.trim() || undefined,
        role: role.trim() || undefined,
        projectOutcome: projectOutcome.trim() || undefined,
        liveDemoUrl: liveDemoUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        figmaUrl: figmaUrl.trim() || undefined,
        readTime: readTime.trim() || undefined,
        videoViews: videoViews.trim() || undefined,
        caseStudyStory: caseStudyStory.trim() || undefined,
        caseStudyNarrative: caseStudyStory.trim() || undefined,
        isActive,
      });
      onBack();
    } catch (err: any) {
      console.error('Error saving portfolio item:', err);
      setValidationError(err.message || 'Failed to persist portfolio item to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Header Sticky Action Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shrink-0"
            title="Back to Portfolio List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Portfolio Dashboard
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-500">
                {editingItem ? 'Edit Sample' : 'New Sample'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
              {editingItem ? `Edit: ${editingItem.title}` : 'Add New Work Sample'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {/* Active / Hidden Status Pill */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isActive ? 'Published' : 'Hidden / Draft'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving || isUploadingCover || isUploadingGallery || isUploadingVideo}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'Save Changes' : 'Publish Work Sample'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Error Alert Banner */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-500 hover:text-rose-800 p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Primary Details, Narrative, & Case Study */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Basic Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Work Sample Overview
              </h2>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Project / Piece Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {title.length}/120
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Vogue Editorial Fashion Shoot, Storelly Mobile App UI, 4K Travel Film"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Category Tagging <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {isCustomCategoryMode ? 'Select from standard categories' : '+ Custom Category'}
                </button>
              </div>

              {isCustomCategoryMode ? (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name (e.g., Drone Footage, Brand Identity)"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        category === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Short Summary Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Summary & Project Brief
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {description.length}/1000
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain what this project was about, the creative vision, and the goals accomplished..."
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Tagging */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Search Tags & Skills</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  placeholder="Type a tag and press Enter (e.g., React, Portrait, GoldenHour)..."
                  className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add Tag
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-indigo-400 hover:text-indigo-700 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Extended Case Study & Client Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Case Study, Client & Metrics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Client / Brand
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Vogue, Nike, Acme Inc., Private Bride"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Project Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Year Completed
                </label>
                <input
                  type="text"
                  value={projectYear}
                  onChange={(e) => setProjectYear(e.target.value)}
                  placeholder="e.g., 2026"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Creator Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Your Role on Project
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Lead Art Director, Drone Pilot, Full-Stack Dev"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Project Outcome / Key Metric */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" /> Key Metric / Outcome
                </label>
                <input
                  type="text"
                  value={projectOutcome}
                  onChange={(e) => setProjectOutcome(e.target.value)}
                  placeholder="e.g., +140% Conversion, 500K Views, #1 on Product Hunt"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-indigo-700 font-semibold"
                />
              </div>
            </div>

            {/* Live URLs: Demo, Github, Figma */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-800">
                Interactive Proof & Project Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-indigo-500" /> Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder="https://mysite.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Github className="w-3 h-3 text-slate-900" /> GitHub Repository
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Figma className="w-3 h-3 text-purple-600" /> Figma Prototype
                  </label>
                  <input
                    type="url"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    placeholder="https://figma.com/..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Extended Case Study Story */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Full Case Study Story (Problem, Execution, Result)
                </label>
                <span className="text-[11px] text-slate-400">Optional deep-dive</span>
              </div>
              <textarea
                rows={5}
                value={caseStudyStory}
                onChange={(e) => setCaseStudyStory(e.target.value)}
                placeholder="Walk clients through your methodology, the challenges faced, how you overcame them, and the client's enthusiastic feedback..."
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Media Assets, Cover Image, & Preview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cover Image Upload Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Cover Thumbnail <span className="text-rose-500">*</span>
                </h3>
              </div>
            </div>

            {/* Preview Box */}
            <div className="relative h-48 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden group">
              {coverImage ? (
                <>
                  <SafeImage
                    src={coverImage}
                    alt="Cover preview"
                    fallbackType="product"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100 transition">
                      Replace Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer"
                      title="Remove Cover Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Upload Cover Image</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB</p>
                  <label className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer">
                    {isUploadingCover ? 'Uploading...' : 'Browse Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {isUploadingCover && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-indigo-900">Uploading cover...</span>
                </div>
              )}
            </div>

            {/* Direct URL input fallback */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Or Paste Image Web URL
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Media Format & Assets Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Media Format
              </h3>
            </div>

            {/* Media Type Selector Pills */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mediaType === 'image'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Single Photo
              </button>

              <button
                type="button"
                onClick={() => setMediaType('gallery')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mediaType === 'gallery'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" /> Photo Gallery
              </button>

              <button
                type="button"
                onClick={() => setMediaType('external_video')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mediaType === 'external_video'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Play className="w-4 h-4" /> YouTube / Video
              </button>

              <button
                type="button"
                onClick={() => setMediaType('external_link')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mediaType === 'external_link'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ExternalLink className="w-4 h-4" /> Live Demo
              </button>
            </div>

            {/* Gallery Upload section */}
            {mediaType === 'gallery' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Gallery Photos ({mediaUrls.length})
                  </span>
                  <label className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg cursor-pointer transition">
                    + Add Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      disabled={isUploadingGallery}
                      className="hidden"
                    />
                  </label>
                </div>

                {isUploadingGallery && (
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700 text-xs font-semibold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading photos...
                  </div>
                )}

                {mediaUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaUrls.map((url, idx) => (
                      <div key={idx} className="relative h-18 rounded-xl bg-slate-100 overflow-hidden group">
                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveMediaUrl(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Upload multiple high-res photos to create an interactive carousel / lightbox showcase.
                  </p>
                )}
              </div>
            )}

            {/* Video / External Embed section */}
            {(mediaType === 'external_video' || mediaType === 'external_link') && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800">
                  {mediaType === 'external_video' ? 'Video Stream URL' : 'Live Website URL'}
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={
                    mediaType === 'external_video'
                      ? 'https://youtube.com/watch?v=... or Vimeo'
                      : 'https://mysite.com'
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
