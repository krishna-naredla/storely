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
  Palette,
  Smartphone,
  Monitor,
  Save,
  CheckCircle2,
  Sliders,
  Type,
  LayoutGrid,
  ShieldCheck,
  Phone,
  Mail,
  Camera,
  PenTool,
  Code2,
  Feather,
  HeartHandshake,
  Brush,
  PartyPopper,
  Smile,
  Search,
  RefreshCw,
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
  PortfolioProfession,
  PortfolioThemeColor,
  PortfolioFontStyle,
  PortfolioLayoutMode,
  PortfolioCardStyle,
  PortfolioServicePackage,
  PortfolioThemeConfig,
  PortfolioBlock,
  PortfolioTemplateId,
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
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { SafeImage } from '../common/SafeImage';
import { PortfolioUrlBanner } from '../portfolio/PortfolioUrlBanner';
import { PortfolioItemEditor } from '../portfolio/PortfolioItemEditor';
import { PortfolioDetailModal } from '../portfolio/PortfolioDetailModal';
import { PortfolioLiveMockup } from '../portfolio/PortfolioLiveMockup';
import { PortfolioBlocksManager } from '../portfolio/PortfolioBlocksManager';
import { PortfolioTemplateSelector } from '../portfolio/PortfolioTemplateSelector';
import { PORTFOLIO_PRESETS, PortfolioPreset } from '../../data/portfolioPresets';
import {
  PORTFOLIO_THEME_PALETTES,
  PORTFOLIO_FONT_OPTIONS,
  PORTFOLIO_CARD_STYLES,
  BORDER_RADIUS_OPTIONS,
  PORTFOLIO_LAYOUT_TEMPLATES,
  getDefaultPortfolioBlocks,
  getEffectivePortfolioTheme,
} from '../../utils/portfolioTheme';
import { DashboardEmptyState } from '../common/DashboardEmptyState';
import { DashboardSkeleton } from '../common/DashboardSkeleton';

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

const PROFESSION_LIST: {
  id: PortfolioProfession;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  { id: 'photographer', name: 'Photographer', icon: Camera, desc: 'Weddings, candid shoots, portraits & drone' },
  { id: 'designer', name: 'Designer', icon: PenTool, desc: 'Logo design, branding, UI/UX & social media' },
  { id: 'developer', name: 'Developer', icon: Code2, desc: 'Web apps, SaaS, APIs, code & tech stack' },
  { id: 'youtuber', name: 'YouTuber / Creator', icon: Youtube, desc: 'Videos, vlogs, media kit & brand collabs' },
  { id: 'writer', name: 'Writer', icon: Feather, desc: 'Articles, blogs, copywriting & newsletters' },
  { id: 'coach', name: 'Coach / Mentor', icon: HeartHandshake, desc: '1:1 coaching, mindset, programs & growth' },
  { id: 'artist', name: 'Artist', icon: Brush, desc: 'Canvas paintings, digital art & commissions' },
  { id: 'event_planner', name: 'Event Planner', icon: PartyPopper, desc: 'Weddings, corporate summits & birthdays' },
  { id: 'beauty', name: 'Beauty Pro', icon: Smile, desc: 'HD bridal makeup, party glam & makeovers' },
  { id: 'custom', name: 'Custom Creator', icon: Sparkles, desc: 'Flexible portfolio layout for any creator' },
];

export const WorkPortfolioManager: React.FC<WorkPortfolioManagerProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    'works' | 'templates' | 'blocks' | 'appearance' | 'services' | 'skills' | 'testimonials' | 'mediakit' | 'cta'
  >('works');

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [consultationItems, setConsultationItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile vs Desktop Preview Switcher
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [showMobilePreviewModal, setShowMobilePreviewModal] = useState(false);

  // Active modal preview item
  const [previewModalItem, setPreviewModalItem] = useState<PortfolioItem | null>(null);

  // Routable Item Editor Mode
  const [editorMode, setEditorMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PortfolioItem | null>(null);

  // Save State Management
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ==========================================
  // WORKING DRAFT SETTINGS (Live Synchronized)
  // ==========================================
  const initialSettings = business.portfolioSettings || { ctaMode: 'whatsapp' };
  const initialThemeConfig = getEffectivePortfolioTheme(business);

  // Template & Dynamic Blocks
  const [selectedTemplateId, setSelectedTemplateId] = useState<PortfolioTemplateId>(
    initialSettings.templateId || 'modern_showcase'
  );
  const [blocks, setBlocks] = useState<PortfolioBlock[]>(
    initialSettings.blocks && initialSettings.blocks.length > 0
      ? initialSettings.blocks
      : getDefaultPortfolioBlocks(business)
  );

  const [selectedProfession, setSelectedProfession] = useState<PortfolioProfession>(
    initialSettings.profession || 'custom'
  );
  const [professionTitle, setProfessionTitle] = useState(
    initialSettings.professionTitle || PORTFOLIO_PRESETS[selectedProfession]?.professionTitle || ''
  );
  const [specializations, setSpecializations] = useState<string[]>(
    initialSettings.specializations || PORTFOLIO_PRESETS[selectedProfession]?.specializations || []
  );
  const [specInput, setSpecInput] = useState('');
  const [slogan, setSlogan] = useState(
    initialSettings.slogan || PORTFOLIO_PRESETS[selectedProfession]?.slogan || ''
  );
  const [location, setLocation] = useState(
    initialSettings.location || PORTFOLIO_PRESETS[selectedProfession]?.location || 'India'
  );
  const [aboutStory, setAboutStory] = useState(
    initialSettings.aboutStory ||
      PORTFOLIO_PRESETS[selectedProfession]?.aboutStory ||
      business.description ||
      ''
  );
  const [experienceYears, setExperienceYears] = useState(
    initialSettings.experienceYears ||
      PORTFOLIO_PRESETS[selectedProfession]?.experienceYears ||
      '5+ Years'
  );

  // Skills & Tools
  const [skillsList, setSkillsList] = useState<string[]>(
    initialSettings.skillsList || PORTFOLIO_PRESETS[selectedProfession]?.skillsList || []
  );
  const [skillInput, setSkillInput] = useState('');
  const [toolsList, setToolsList] = useState<string[]>(
    initialSettings.toolsList || PORTFOLIO_PRESETS[selectedProfession]?.toolsList || []
  );
  const [toolInput, setToolInput] = useState('');

  // Theme & Appearance
  const [themeColor, setThemeColor] = useState<PortfolioThemeColor>(
    initialSettings.themeColor || 'default'
  );
  const [fontFamily, setFontFamily] = useState<PortfolioFontStyle>(
    initialThemeConfig.fontFamily || 'sans'
  );
  const [cardStyle, setCardStyle] = useState<PortfolioCardStyle>(
    initialThemeConfig.cardStyle || 'bordered'
  );
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'>(
    initialThemeConfig.borderRadius || 'xl'
  );
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>(
    initialThemeConfig.primaryColor || '#4f46e5'
  );
  const [customBgColor, setCustomBgColor] = useState<string>(
    initialThemeConfig.backgroundColor || '#f8fafc'
  );
  const [layoutMode, setLayoutMode] = useState<PortfolioLayoutMode>(
    initialSettings.layoutMode || 'grid'
  );

  // Services & Pricing Packages
  const [services, setServices] = useState<PortfolioServicePackage[]>(
    initialSettings.services && initialSettings.services.length > 0
      ? initialSettings.services
      : PORTFOLIO_PRESETS[selectedProfession]?.suggestedServices || []
  );
  const [serviceToDelete, setServiceToDelete] = useState<PortfolioServicePackage | null>(null);

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
  const [mediaKitEnabled, setMediaKitEnabled] = useState(
    initialSettings.mediaKit?.enabled ?? true
  );
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>(
    initialSettings.mediaKit?.platformStats || []
  );
  const [statToDelete, setStatToDelete] = useState<PlatformStat | null>(null);
  const [brandCollabs, setBrandCollabs] = useState<BrandCollab[]>(
    initialSettings.mediaKit?.brandCollabs || []
  );
  const [collabToDelete, setCollabToDelete] = useState<BrandCollab | null>(null);

  // Skill / Tool Delete Confirmations
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [toolToDelete, setToolToDelete] = useState<string | null>(null);

  // CTA & WhatsApp Settings
  const [primaryCtaText, setPrimaryCtaText] = useState(
    initialSettings.primaryCtaText || PORTFOLIO_PRESETS[selectedProfession]?.primaryCtaText || 'WhatsApp'
  );
  const [secondaryCtaText, setSecondaryCtaText] = useState(
    initialSettings.secondaryCtaText || PORTFOLIO_PRESETS[selectedProfession]?.secondaryCtaText || 'Hire Me'
  );
  const [tertiaryCtaText, setTertiaryCtaText] = useState(
    initialSettings.tertiaryCtaText || PORTFOLIO_PRESETS[selectedProfession]?.tertiaryCtaText || 'View Packages'
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialSettings.whatsappMessage ||
      PORTFOLIO_PRESETS[selectedProfession]?.whatsappMessage ||
      `Hi ${business.name}, I checked your portfolio on Storelly and would love to enquire about working together!`
  );
  const [ctaMode, setCtaMode] = useState<'whatsapp' | 'booking' | 'custom_quote'>(
    initialSettings.ctaMode || 'whatsapp'
  );

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mark unsaved changes
  const markDirty = () => setHasUnsavedChanges(true);

  // Sync routable URL parameters for deep-linking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const view = searchParams.get('portfolio_view') || searchParams.get('view');
    const itemId = searchParams.get('portfolio_item_id') || searchParams.get('itemId');

    if (view === 'new') {
      setEditingItem(null);
      setEditorMode('create');
    } else if (view === 'edit' && itemId && items.length > 0) {
      const match = items.find((i) => i.id === itemId);
      if (match) {
        setEditingItem(match);
        setEditorMode('edit');
      }
    }
  }, [items]);

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

  // Handle Switching Profession Preset
  const handleSelectProfession = (prof: PortfolioProfession) => {
    setSelectedProfession(prof);
    const p = PORTFOLIO_PRESETS[prof];
    if (p) {
      setProfessionTitle(p.professionTitle);
      setSpecializations(p.specializations);
      setSlogan(p.slogan);
      setLocation(p.location || 'India');
      setAboutStory(p.aboutStory);
      setExperienceYears(p.experienceYears || '5+ Years');
      setSkillsList(p.skillsList);
      setToolsList(p.toolsList);
      setThemeColor(p.themeColor || 'default');
      setFontFamily(p.fontStyle || 'sans');
      setCardStyle('bordered');
      setLayoutMode(p.layoutMode || 'grid');
      setPrimaryCtaText(p.primaryCtaText || 'WhatsApp');
      setSecondaryCtaText(p.secondaryCtaText || 'Hire Me');
      setTertiaryCtaText(p.tertiaryCtaText || 'View Packages');
      setWhatsappMessage(p.whatsappMessage || `Hi ${business.name}, let's work together!`);
      if (p.suggestedServices && p.suggestedServices.length > 0) {
        setServices(p.suggestedServices);
      }
    }
    markDirty();
  };

  // Handle Palette Switch
  const handleSelectPalette = (paletteKey: PortfolioThemeColor) => {
    setThemeColor(paletteKey);
    const pal = PORTFOLIO_THEME_PALETTES[paletteKey];
    if (pal) {
      setCustomPrimaryColor(pal.primary);
      setCustomBgColor(pal.background);
    }
    markDirty();
  };

  // ==========================================
  // MASTER SAVE & PUBLISH ALL CHANGES
  // ==========================================
  const handleSaveAllPortfolioChanges = async () => {
    setIsSavingAll(true);
    try {
      const updatedThemeConfig: PortfolioThemeConfig = {
        primaryColor: customPrimaryColor,
        backgroundColor: customBgColor,
        fontFamily,
        cardStyle,
        borderRadius,
        colorMode: themeColor === 'dark' ? 'dark' : 'light',
      };

      const updatedSettings: PortfolioSettings = {
        ...business.portfolioSettings,
        templateId: selectedTemplateId,
        blocks,
        profession: selectedProfession,
        professionTitle: professionTitle.trim(),
        specializations,
        slogan: slogan.trim(),
        location: location.trim(),
        aboutStory: aboutStory.trim(),
        experienceYears: experienceYears.trim(),
        skillsList,
        toolsList,
        themeColor,
        fontStyle: fontFamily,
        layoutMode,
        themeConfig: updatedThemeConfig,
        services,
        ctaMode,
        primaryCtaText: primaryCtaText.trim(),
        secondaryCtaText: secondaryCtaText.trim(),
        tertiaryCtaText: tertiaryCtaText.trim(),
        whatsappMessage: whatsappMessage.trim(),
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

      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving portfolio changes:', err);
      showToast('Failed to save portfolio customizations. Please try again.', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  // ==========================================
  // WORK ITEM CRUD HANDLERS
  // ==========================================
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setEditorMode('create');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portfolio_view', 'new');
      url.searchParams.delete('portfolio_item_id');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleOpenEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditorMode('edit');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portfolio_view', 'edit');
      url.searchParams.set('portfolio_item_id', item.id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleCloseEditor = () => {
    setEditorMode('list');
    setEditingItem(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('portfolio_view');
      url.searchParams.delete('portfolio_item_id');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleSavePortfolioItem = async (
    data: Omit<PortfolioItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'order'>
  ) => {
    if (editingItem) {
      await updatePortfolioItem(business.id, editingItem.id, data);
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? ({ ...i, ...data } as PortfolioItem) : i))
      );
    } else {
      const order = items.length;
      const created = await createPortfolioItem(business.id, {
        title: data.title || '',
        category: data.category || 'Other',
        coverImage: data.coverImage || '',
        mediaType: data.mediaType || 'image',
        mediaUrls: data.mediaUrls || [],
        externalUrl: data.externalUrl,
        description: data.description || '',
        tags: data.tags || [],
        clientName: data.clientName,
        projectOutcome: data.projectOutcome,
        year: data.year || data.projectYear,
        projectYear: data.projectYear || data.year,
        role: data.role,
        liveDemoUrl: data.liveDemoUrl,
        githubUrl: data.githubUrl,
        figmaUrl: data.figmaUrl,
        caseStudyNarrative: data.caseStudyNarrative || data.caseStudyStory,
        caseStudyStory: data.caseStudyStory || data.caseStudyNarrative,
        readTime: data.readTime,
        videoViews: data.videoViews,
        isActive: data.isActive !== undefined ? data.isActive : true,
        order,
      });
      setItems((prev) => [...prev, created]);
    }
    handleCloseEditor();
  };

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

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deletePortfolioItem(business.id, itemToDelete.id, itemToDelete);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      showToast('Failed to delete item.', 'error');
    }
  };

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
  // SERVICES & PACKAGES CRUD
  // ==========================================
  const handleAddServicePackage = () => {
    const newPkg: PortfolioServicePackage = {
      id: `pkg_${Date.now()}`,
      title: 'New Service Package',
      price: '₹9,999',
      duration: '3-5 Days',
      description: 'Custom creative deliverable with full client consultation.',
      deliverables: ['Strategy call', 'High resolution assets', 'Commercial usage rights'],
      popular: services.length === 1,
    };
    setServices([...services, newPkg]);
    markDirty();
  };

  const handleUpdateServicePackage = (
    id: string,
    field: keyof PortfolioServicePackage,
    value: any
  ) => {
    setServices((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    markDirty();
  };

  const handleConfirmDeleteServicePackage = () => {
    if (!serviceToDelete) return;
    setServices(services.filter((p) => p.id !== serviceToDelete.id));
    setServiceToDelete(null);
    markDirty();
  };

  // ==========================================
  // TESTIMONIALS CRUD
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
      showToast('Client Name and Quote are required.', 'error');
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
          prev.map((t) => (t.id === editingTestimonial.id ? { ...t, ...payload } : t))
        );
      } else {
        const created = await createTestimonial(business.id, payload);
        setTestimonials((prev) => [...prev, created]);
      }
      setIsTestimonialModalOpen(false);
    } catch (err) {
      console.error('Error saving testimonial:', err);
      showToast('Failed to save testimonial.', 'error');
    } finally {
      setIsSavingTestimonial(false);
    }
  };

  const handleConfirmDeleteTestimonial = async () => {
    if (!testimonialToDelete) return;
    try {
      await deleteTestimonial(business.id, testimonialToDelete.id, testimonialToDelete.clientPhoto);
      setTestimonials((prev) => prev.filter((t) => t.id !== testimonialToDelete.id));
      setTestimonialToDelete(null);
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  // ==========================================
  // MEDIA KIT CRUD
  // ==========================================
  const handleAddPlatformStat = () => {
    const newStat: PlatformStat = {
      id: `stat-${Date.now()}`,
      platform: 'Instagram',
      count: '25K',
      engagementRate: '4.8%',
      label: 'Followers',
    };
    setPlatformStats([...platformStats, newStat]);
    markDirty();
  };

  const handleUpdatePlatformStat = (id: string, field: keyof PlatformStat, value: string) => {
    setPlatformStats((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    markDirty();
  };

  const handleConfirmDeletePlatformStat = () => {
    if (!statToDelete) return;
    setPlatformStats(platformStats.filter((s) => s.id !== statToDelete.id));
    setStatToDelete(null);
    markDirty();
  };

  const handleAddBrandCollab = () => {
    const newCollab: BrandCollab = {
      id: `collab-${Date.now()}`,
      brandName: 'Brand Name',
      description: 'Campaign / Product Showcase',
      collabYear: '2026',
    };
    setBrandCollabs([...brandCollabs, newCollab]);
    markDirty();
  };

  const handleUpdateBrandCollab = (id: string, field: keyof BrandCollab, value: string) => {
    setBrandCollabs((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    markDirty();
  };

  const handleConfirmDeleteBrandCollab = () => {
    if (!collabToDelete) return;
    setBrandCollabs(brandCollabs.filter((c) => c.id !== collabToDelete.id));
    setCollabToDelete(null);
    markDirty();
  };

  // Specialization pills
  const handleAddSpec = () => {
    if (!specInput.trim()) return;
    if (!specializations.includes(specInput.trim())) {
      setSpecializations([...specializations, specInput.trim()]);
      markDirty();
    }
    setSpecInput('');
  };

  const handleRemoveSpec = (spec: string) => {
    setSpecializations(specializations.filter((s) => s !== spec));
    markDirty();
  };

  // Skills & Tools pills
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skillsList.includes(skillInput.trim())) {
      setSkillsList([...skillsList, skillInput.trim()]);
      markDirty();
    }
    setSkillInput('');
  };

  const handleConfirmDeleteSkill = () => {
    if (!skillToDelete) return;
    setSkillsList(skillsList.filter((item) => item !== skillToDelete));
    setSkillToDelete(null);
    markDirty();
  };

  const handleAddTool = () => {
    if (!toolInput.trim()) return;
    if (!toolsList.includes(toolInput.trim())) {
      setToolsList([...toolsList, toolInput.trim()]);
      markDirty();
    }
    setToolInput('');
  };

  const handleConfirmDeleteTool = () => {
    if (!toolToDelete) return;
    setToolsList(toolsList.filter((item) => item !== toolToDelete));
    setToolToDelete(null);
    markDirty();
  };

  // Filtered items for list view
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

  // Derived effective theme config for Live Preview
  const currentWorkingThemeConfig: PortfolioThemeConfig = {
    primaryColor: customPrimaryColor,
    backgroundColor: customBgColor,
    fontFamily,
    cardStyle,
    borderRadius,
    colorMode: themeColor === 'dark' ? 'dark' : 'light',
  };

  const currentWorkingSettings: PortfolioSettings = {
    ...business.portfolioSettings,
    templateId: selectedTemplateId,
    blocks,
    profession: selectedProfession,
    professionTitle,
    specializations,
    slogan,
    location,
    aboutStory,
    experienceYears,
    skillsList,
    toolsList,
    themeColor,
    fontStyle: fontFamily,
    layoutMode,
    themeConfig: currentWorkingThemeConfig,
    services,
    ctaMode,
    primaryCtaText,
    secondaryCtaText,
    tertiaryCtaText,
    whatsappMessage,
    mediaKit: {
      enabled: mediaKitEnabled,
      platformStats,
      brandCollabs,
    },
  };

  // Full-page routable view for creating or editing work sample items
  if (editorMode !== 'list') {
    return (
      <PortfolioItemEditor
        business={business}
        editingItem={editingItem}
        categories={CATEGORIES}
        onBack={handleCloseEditor}
        onSave={handleSavePortfolioItem}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
              Creator Portfolio Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Live Auto-Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize everything with instant real-time live preview, responsive templates, client reviews, pricing packages, and WhatsApp inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Preview Trigger Button (Visible on smaller screens) */}
          <button
            type="button"
            onClick={() => setShowMobilePreviewModal(true)}
            className="lg:hidden px-3.5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateItem}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Work Sample
          </button>
        </div>
      </div>

      {/* Standalone Public URL & QR Banner */}
      <PortfolioUrlBanner business={business} itemCount={items.length} />

      {/* ===================================================== */}
      {/* 2-COLUMN MAIN STUDIO LAYOUT (LEFT: CONTROLS, RIGHT: LIVE PREVIEW) */}
      {/* ===================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================================================== */}
        {/* LEFT 7 COLUMNS: COMPLETE STUDIO CUSTOMIZATION TABS */}
        {/* ===================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub-Tab Navigation Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('works')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'works'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Works ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('blocks')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'blocks'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Page Blocks ({blocks.filter((b) => b.enabled).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Colors & Style</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Packages ({services.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skills & Bio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('testimonials')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'testimonials'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Reviews ({testimonials.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mediakit')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'mediakit'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Media Kit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cta')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'cta'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp & CTA</span>
            </button>
          </div>

          {/* ===================================================== */}
          {/* TAB 1: WORKS & PROJECTS (FULL CRUD) */}
          {/* ===================================================== */}
          {activeTab === 'works' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Works, Showcases & Case Studies</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage your portfolio project deliverables, media gallery, outcomes and links.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateItem}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, description or #tags..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All ({items.length})
                  </button>
                  {CATEGORIES.slice(0, 5).map((cat) => {
                    const count = items.filter((i) => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                          selectedCategoryFilter === cat
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-bold">Loading portfolio items...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No custom work samples found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No items match your search. Try a different query.'
                      : 'Add your first creative project, photo gallery, showreel, or development case study to showcase on your portfolio website.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateItem}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add First Work Sample
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      {/* Left thumbnail & title */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Reorder Arrows */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === items.length - 1}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                          <SafeImage
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {item.mediaType === 'external_video' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                              <Play className="w-3 h-3 fill-current" />
                            </div>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {item.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                            {!item.isActive && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                                Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.clientName ? `Client: ${item.clientName} • ` : ''}
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setPreviewModalItem(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                          title="Preview Case Study Modal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleItemActive(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                          title={item.isActive ? 'Hide from public view' : 'Show on public view'}
                        >
                          {item.isActive ? (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB: TEMPLATES SELECTION */}
          {/* ===================================================== */}
          {activeTab === 'templates' && (
            <PortfolioTemplateSelector
              selectedTemplateId={selectedTemplateId}
              business={business}
              onBusinessUpdated={onBusinessUpdated}
              onSelectTemplate={(tmplOrId) => {
                const tmplId = typeof tmplOrId === 'string' ? tmplOrId : tmplOrId.id;
                setSelectedTemplateId(tmplId);
                markDirty();
              }}
            />
          )}

          {/* ===================================================== */}
          {/* TAB: DYNAMIC PAGE BLOCKS (FULL CRUD & REORDER) */}
          {/* ===================================================== */}
          {activeTab === 'blocks' && (
            <PortfolioBlocksManager
              blocks={blocks}
              onChangeBlocks={(newBlocks) => {
                setBlocks(newBlocks);
                markDirty();
              }}
              onChange={(newBlocks) => {
                setBlocks(newBlocks);
                markDirty();
              }}
              business={business}
              onBusinessUpdated={onBusinessUpdated}
            />
          )}

          {/* ===================================================== */}
          {/* TAB 2: TEMPLATES & APPEARANCE CUSTOMIZATION */}
          {/* ===================================================== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* 1. Profession Archetype Presets */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Creator Profession & Layout Preset</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Select your creative domain to auto-configure optimal layout, tags and messaging.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    1-Click Apply
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {PROFESSION_LIST.map((prof) => {
                    const IconComp = prof.icon;
                    const isSelected = selectedProfession === prof.id;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => handleSelectProfession(prof.id)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-black shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-xs'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold leading-tight truncate w-full">{prof.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Color Themes & Palettes */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                      <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Visual Color Themes & Palettes</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose an aesthetic or fine-tune exact hex codes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(PORTFOLIO_THEME_PALETTES) as PortfolioThemeColor[]).map((key) => {
                    const pal = PORTFOLIO_THEME_PALETTES[key];
                    const isSelected = themeColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectPalette(key)}
                        className={`p-3 rounded-2xl border text-left transition-all space-y-2 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: pal.background }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: pal.text }}
                          />
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white capitalize">
                          {key} Palette
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Direct Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Primary Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customPrimaryColor}
                        onChange={(e) => {
                          setCustomPrimaryColor(e.target.value);
                          markDirty();
                        }}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-xs"
                      />
                      <input
                        type="text"
                        value={customPrimaryColor}
                        onChange={(e) => {
                          setCustomPrimaryColor(e.target.value);
                          markDirty();
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Canvas Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value);
                          markDirty();
                        }}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 shadow-xs"
                      />
                      <input
                        type="text"
                        value={customBgColor}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value);
                          markDirty();
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Typography & Card Styles */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>Typography, Cards & Corner Radii</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Font Family */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Typography Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value as any);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      {PORTFOLIO_FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label} ({f.sample})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Card Style */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Card Aesthetic
                    </label>
                    <select
                      value={cardStyle}
                      onChange={(e) => {
                        setCardStyle(e.target.value as any);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      {PORTFOLIO_CARD_STYLES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Border Corner Radius
                    </label>
                    <select
                      value={borderRadius}
                      onChange={(e) => {
                        setBorderRadius(e.target.value as any);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      {BORDER_RADIUS_OPTIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Profile Header Text Customization */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Profile Header & Bio Identifiers</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Custom Profession Title (Lead Wedding Photographer)
                    </label>
                    <input
                      type="text"
                      value={professionTitle}
                      onChange={(e) => {
                        setProfessionTitle(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Slogan / Punchline
                      </label>
                      <input
                        type="text"
                        value={slogan}
                        onChange={(e) => {
                          setSlogan(e.target.value);
                          markDirty();
                        }}
                        placeholder="Crafting timeless visual narratives"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Location / Base City
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          markDirty();
                        }}
                        placeholder="Hyderabad & Mumbai"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 3: SERVICES & PRICING PACKAGES (FULL CRUD) */}
          {/* ===================================================== */}
          {activeTab === 'services' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Service Packages & Pricing Retainers</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Showcase transparent packages with verified deliverables and instant WhatsApp booking links.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddServicePackage}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Package</span>
                </button>
              </div>

              {services.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 mb-3">No packages created yet.</p>
                  <button
                    type="button"
                    onClick={handleAddServicePackage}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Service Package
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {services.map((pkg, idx) => (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 relative text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setServiceToDelete(pkg)}
                        className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Package Title
                          </label>
                          <input
                            type="text"
                            value={pkg.title}
                            onChange={(e) => handleUpdateServicePackage(pkg.id, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Badge / Highlight
                          </label>
                          <input
                            type="text"
                            value={pkg.badge || ''}
                            onChange={(e) => handleUpdateServicePackage(pkg.id, 'badge', e.target.value)}
                            placeholder="Most Popular"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Price
                          </label>
                          <input
                            type="text"
                            value={pkg.price}
                            onChange={(e) => handleUpdateServicePackage(pkg.id, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Duration / Turnaround
                          </label>
                          <input
                            type="text"
                            value={pkg.duration || ''}
                            onChange={(e) => handleUpdateServicePackage(pkg.id, 'duration', e.target.value)}
                            placeholder="5-7 Days"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={pkg.description}
                          onChange={(e) => handleUpdateServicePackage(pkg.id, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Deliverables (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={pkg.deliverables?.join(', ') || ''}
                          onChange={(e) =>
                            handleUpdateServicePackage(
                              pkg.id,
                              'deliverables',
                              e.target.value.split(',').map((d) => d.trim()).filter(Boolean)
                            )
                          }
                          placeholder="50 Retouched Photos, Online Gallery, Drone Video"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 4: SKILLS, TOOLS & ABOUT NARRATIVE */}
          {/* ===================================================== */}
          {activeTab === 'skills' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>About Story, Skills & Technology Stack</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Highlight your background story, milestones and technical competencies.
                </p>
              </div>

              {/* Story Narrative */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  About Story & Creative Philosophy
                </label>
                <textarea
                  rows={4}
                  value={aboutStory}
                  onChange={(e) => {
                    setAboutStory(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Milestones Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={experienceYears}
                    onChange={(e) => {
                      setExperienceYears(e.target.value);
                      markDirty();
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Specializations Tags */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Specializations (Bullets on Hero Profile)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSpec()}
                    placeholder="Cinematic Wedding Photography"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>{spec}</span>
                      <X
                        className="w-3 h-3 cursor-pointer text-slate-400 hover:text-red-500"
                        onClick={() => handleRemoveSpec(spec)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills & Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Skills */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Key Skills & Domain Competencies
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                      placeholder="Color Grading"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>{skill}</span>
                        <X
                          className="w-3 h-3 cursor-pointer text-indigo-400 hover:text-red-500"
                          onClick={() => setSkillToDelete(skill)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Software & Tech Stack
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={toolInput}
                      onChange={(e) => setToolInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
                      placeholder="Adobe Lightroom, Figma"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddTool}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {toolsList.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>{tool}</span>
                        <X
                          className="w-3 h-3 cursor-pointer text-slate-400 hover:text-red-500"
                          onClick={() => setToolToDelete(tool)}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 5: TESTIMONIALS & REVIEWS (FULL CRUD) */}
          {/* ===================================================== */}
          {activeTab === 'testimonials' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Verified Client Testimonials & Reviews</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add social proof with quotes, client roles, and star ratings to build trust with new prospects.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateTestimonial}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Review</span>
                </button>
              </div>

              {testimonials.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 mb-3">No client reviews added yet.</p>
                  <button
                    type="button"
                    onClick={handleOpenCreateTestimonial}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add First Review
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= (t.rating || 5) ? 'fill-current' : 'opacity-25'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs italic text-slate-700 dark:text-slate-300">"{t.quote}"</p>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {t.clientName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {t.clientName}
                            </span>
                            {t.clientRole && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                                • {t.clientRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTestimonial(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestimonialToDelete(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 6: MEDIA KIT & BRAND COLLABORATIONS (FULL CRUD) */}
          {/* ===================================================== */}
          {activeTab === 'mediakit' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Media Kit, Audience Stats & Brand Collabs</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    For creators, YouTubers, and influencers to share reach metrics with sponsoring brands.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPlatformStat}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stat Counter
                </button>
              </div>

              {/* Platform Stats Grid */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Platform Reach & Follower Counters
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {platformStats.map((stat) => (
                    <div
                      key={stat.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 relative text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setStatToDelete(stat)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Delete Stat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Platform</label>
                          <input
                            type="text"
                            value={stat.platform}
                            onChange={(e) => handleUpdatePlatformStat(stat.id, 'platform', e.target.value)}
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Count</label>
                          <input
                            type="text"
                            value={stat.count}
                            onChange={(e) => handleUpdatePlatformStat(stat.id, 'count', e.target.value)}
                            placeholder="150K"
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black text-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Label</label>
                          <input
                            type="text"
                            value={stat.label || ''}
                            onChange={(e) => handleUpdatePlatformStat(stat.id, 'label', e.target.value)}
                            placeholder="Subscribers"
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Engagement</label>
                          <input
                            type="text"
                            value={stat.engagementRate || ''}
                            onChange={(e) => handleUpdatePlatformStat(stat.id, 'engagementRate', e.target.value)}
                            placeholder="5.2%"
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Collabs */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Brand Collaborations & Partnerships
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBrandCollab}
                    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Brand
                  </button>
                </div>

                <div className="space-y-2">
                  {brandCollabs.map((collab) => (
                    <div
                      key={collab.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3 text-xs"
                    >
                      <input
                        type="text"
                        value={collab.brandName}
                        onChange={(e) => handleUpdateBrandCollab(collab.id, 'brandName', e.target.value)}
                        placeholder="Brand Name"
                        className="w-36 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                      <input
                        type="text"
                        value={collab.description}
                        onChange={(e) => handleUpdateBrandCollab(collab.id, 'description', e.target.value)}
                        placeholder="Campaign details (Summer launch reel)"
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setCollabToDelete(collab)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 7: WHATSAPP ENQUIRY & CALL-TO-ACTION SETTINGS */}
          {/* ===================================================== */}
          {activeTab === 'cta' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Inquiry & Action Buttons</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure pre-filled WhatsApp inquiry templates and high-conversion action buttons on your portfolio.
                </p>
              </div>

              {/* 3 Main Action Buttons Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Primary Button Label (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={primaryCtaText}
                    onChange={(e) => {
                      setPrimaryCtaText(e.target.value);
                      markDirty();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Secondary Button (Hire Me / Inquire)
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaText}
                    onChange={(e) => {
                      setSecondaryCtaText(e.target.value);
                      markDirty();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tertiary Button (View Packages)
                  </label>
                  <input
                    type="text"
                    value={tertiaryCtaText}
                    onChange={(e) => {
                      setTertiaryCtaText(e.target.value);
                      markDirty();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              {/* WhatsApp Message Template */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Pre-filled WhatsApp Message from Prospects
                </label>
                <textarea
                  rows={3}
                  value={whatsappMessage}
                  onChange={(e) => {
                    setWhatsappMessage(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium resize-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400">
                  When a client taps any WhatsApp inquiry button on your portfolio website, their WhatsApp app will open with this message ready to send.
                </p>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* BOTTOM STICKY FLOATING SAVE BAR */}
          {/* ===================================================== */}
          <div className="sticky bottom-4 z-30 bg-slate-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  hasUnsavedChanges ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-xs font-bold truncate">
                {hasUnsavedChanges
                  ? 'You have unsaved changes in portfolio'
                  : 'All portfolio customizations synced'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveAllPortfolioChanges}
              disabled={isSavingAll}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Saved Live!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Publish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* RIGHT 5 COLUMNS: STICKY REAL-TIME LIVE INTERACTIVE PREVIEW */}
        {/* ===================================================== */}
        <div className="hidden lg:block lg:col-span-5 sticky top-20">
          <PortfolioLiveMockup
            business={business}
            items={items}
            testimonials={testimonials}
            settings={currentWorkingSettings}
            services={services}
            themeConfig={currentWorkingThemeConfig}
            themeColor={themeColor}
            layoutMode={layoutMode}
            onOpenItem={(item) => setPreviewModalItem(item)}
            deviceMode={previewDeviceMode}
            onDeviceModeChange={(mode) => setPreviewDeviceMode(mode)}
          />
        </div>
      </div>

      {/* ===================================================== */}
      {/* MOBILE PREVIEW MODAL (FOR SMALL SCREENS) */}
      {/* ===================================================== */}
      {showMobilePreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Live Interactive Mobile Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePreviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex justify-center">
              <PortfolioLiveMockup
                business={business}
                items={items}
                testimonials={testimonials}
                settings={currentWorkingSettings}
                services={services}
                themeConfig={currentWorkingThemeConfig}
                themeColor={themeColor}
                layoutMode={layoutMode}
                onOpenItem={(item) => {
                  setShowMobilePreviewModal(false);
                  setPreviewModalItem(item);
                }}
                deviceMode="mobile"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* PROJECT CASE STUDY DETAIL MODAL */}
      {/* ===================================================== */}
      {previewModalItem && (
        <PortfolioDetailModal
          item={previewModalItem}
          business={business}
          onClose={() => setPreviewModalItem(null)}
        />
      )}

      {/* ===================================================== */}
      {/* TESTIMONIAL CREATE / EDIT MODAL */}
      {/* ===================================================== */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {editingTestimonial ? 'Edit Testimonial' : 'Add Client Review'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTestimonialModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={testimonialClientName}
                  onChange={(e) => setTestimonialClientName(e.target.value)}
                  placeholder="Rajesh & Priya"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Client Role / Company (Optional)
                </label>
                <input
                  type="text"
                  value={testimonialClientRole}
                  onChange={(e) => setTestimonialClientRole(e.target.value)}
                  placeholder="Wedding Couple / CEO, Apex Studios"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Rating (1-5 Stars)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setTestimonialRating(star)}
                      className={`w-6 h-6 cursor-pointer ${
                        star <= testimonialRating
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Client Quote / Review *
                </label>
                <textarea
                  rows={3}
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  placeholder="Write the feedback received from the client..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTestimonial}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {isSavingTestimonial ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* DELETE CONFIRM DIALOGS */}
      {/* ===================================================== */}
      {itemToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(itemToDelete)}
          title="Delete Portfolio Work Sample?"
          message={`Are you sure you want to permanently delete "${itemToDelete.title}"?`}
          confirmText="Delete Sample"
          cancelText="Keep Sample"
          isDestructive={true}
          onConfirm={handleConfirmDeleteItem}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {testimonialToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(testimonialToDelete)}
          title="Delete Testimonial?"
          message={`Are you sure you want to delete the review by "${testimonialToDelete.clientName}"?`}
          confirmText="Delete Review"
          cancelText="Keep Review"
          isDestructive={true}
          onConfirm={handleConfirmDeleteTestimonial}
          onCancel={() => setTestimonialToDelete(null)}
        />
      )}

      {serviceToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(serviceToDelete)}
          title="Delete Service Package?"
          message={`Are you sure you want to delete "${serviceToDelete.title}"?`}
          confirmText="Delete Package"
          cancelText="Keep Package"
          isDestructive={true}
          onConfirm={handleConfirmDeleteServicePackage}
          onCancel={() => setServiceToDelete(null)}
        />
      )}

      {statToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(statToDelete)}
          title="Delete Platform Stat?"
          message={`Are you sure you want to delete the stat counter for ${statToDelete.platform}?`}
          confirmText="Delete Stat"
          cancelText="Keep Stat"
          isDestructive={true}
          onConfirm={handleConfirmDeletePlatformStat}
          onCancel={() => setStatToDelete(null)}
        />
      )}

      {collabToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(collabToDelete)}
          title="Delete Brand Collaboration?"
          message={`Are you sure you want to delete collaboration "${collabToDelete.brandName}"?`}
          confirmText="Delete Brand"
          cancelText="Keep Brand"
          isDestructive={true}
          onConfirm={handleConfirmDeleteBrandCollab}
          onCancel={() => setCollabToDelete(null)}
        />
      )}

      {skillToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(skillToDelete)}
          title="Delete Skill?"
          message={`Are you sure you want to remove skill "${skillToDelete}"?`}
          confirmText="Remove Skill"
          cancelText="Keep Skill"
          isDestructive={true}
          onConfirm={handleConfirmDeleteSkill}
          onCancel={() => setSkillToDelete(null)}
        />
      )}

      {toolToDelete && (
        <ConfirmActionModal
          isOpen={Boolean(toolToDelete)}
          title="Delete Tool / Tech Stack?"
          message={`Are you sure you want to remove "${toolToDelete}" from your tech stack?`}
          confirmText="Remove Tool"
          cancelText="Keep Tool"
          isDestructive={true}
          onConfirm={handleConfirmDeleteTool}
          onCancel={() => setToolToDelete(null)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
