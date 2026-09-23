import { useLanguage } from '../../context/LanguageContext';
import { SafeImage } from '../common/SafeImage';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { PackageOpen } from "lucide-react";
import { DashboardEmptyState } from '../common/DashboardEmptyState';
import { DashboardSkeleton } from '../common/DashboardSkeleton';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Package,
  Sparkles,
  Check,
  X,
  Loader2,
  Clock,
  Flame,
  BedDouble,
  Car,
  Tag,
  Boxes,
  ArrowUpDown,
  UtensilsCrossed,
  Scissors,
  FileText,
  Video,
  FolderArchive,
  Image as ImageIcon,
  GraduationCap,
  Download,
  Users,
  Upload,
  UploadCloud,
  FileCheck,
  FileSpreadsheet,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  FolderPlus,
  Layers,
  Link2,
  ExternalLink,
  Calendar,
  Settings2,
  FolderOpen,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Palette,
  Share2,
  MessageCircle,
  QrCode,
  Globe,
  Percent,
  ZoomIn,
} from 'lucide-react';
import { z } from 'zod';
import {
  BusinessProfile,
  CatalogItem,
  Category,
  CatalogItemType,
  CatalogItemVariant,
  CatalogItemAddon,
} from '../../types';
import {
  isCreatorProfile,
  getPrimaryPublicDisplayPath,
} from '../../utils/profileHelper';
import {
  getCatalogItems,
  getCategories,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  duplicateCatalogItem,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  generateSlug,
  getStorefrontUrl,
} from '../../services/firebaseService';
import { BUSINESS_TYPES, isModuleApplicableForBusiness } from '../../services/businessConfig';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { ImageSizeWarning } from '../common/ImageSizeWarning';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { ProductShareModal } from '../common/ProductShareModal';
import { SwipeToDelete } from '../common/SwipeToDelete';
import {
  deleteImageFromStorage,
  uploadToCloudinary,
  uploadDigitalFileToCloudinary,
} from '../../services/cloudinary';
import { CATEGORY_COLOR_PALETTE, getCategoryColorConfig, CategoryColorOption } from '../../utils/categoryColors';
export type { CategoryColorOption };
export { CATEGORY_COLOR_PALETTE, getCategoryColorConfig };

// Zod Validation Schema for Product / Service / Digital Asset creation
export const productZodSchema = z.object({
  name: z.string().trim().min(1, 'Product Name / Title is required').min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().trim().min(1, 'Please select or create a Category'),
  type: z.string().min(1, 'Please select an Item Type'),
  productType: z.enum(['physical', 'digital_file', 'consultation_slot']),
  price: z.number().min(0, 'Price cannot be negative'),
  isFree: z.boolean(),
  salePrice: z.number().optional(),
  shortDescription: z.string().optional(),
  digitalFileType: z.string().optional(),
  digitalAssetMode: z.enum(['upload', 'link']).optional(),
  digitalFileUrl: z.string().optional(),
  digitalFilesCount: z.number().optional(),
  consultationDuration: z.number().optional(),
  consultationDaysCount: z.number().optional(),
  consultationTimeSlotsCount: z.number().optional(),
}).superRefine((data, ctx) => {
  // Free vs Paid validation
  if (!data.isFree && (data.price === undefined || data.price <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selling price must be greater than 0 unless marked as Free Product',
      path: ['price'],
    });
  }

  // Original Price validation
  if (data.salePrice && data.price !== undefined && data.salePrice > 0 && data.salePrice <= data.price && !data.isFree) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Original / Strike price should be higher than the discounted selling price',
      path: ['salePrice'],
    });
  }

  // Digital download validation
  if (data.productType === 'digital_file') {
    if (data.digitalFileType === 'course') {
      if (!data.digitalFilesCount || data.digitalFilesCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please add at least one lesson or file to this course package',
          path: ['digitalFiles'],
        });
      }
    } else {
      if (!data.digitalFileUrl || !data.digitalFileUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: data.digitalAssetMode === 'link'
            ? 'Please enter a valid direct access or download URL'
            : 'Please upload an asset file or switch to External Link mode',
          path: ['digitalFileUrl'],
        });
      }
    }
  }

  // Consultation booking validation
  if (data.productType === 'consultation_slot') {
    if (!data.consultationDuration || data.consultationDuration <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a consultation call duration',
        path: ['consultationDuration'],
      });
    }
    if (!data.consultationDaysCount || data.consultationDaysCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select at least one available day of the week',
        path: ['consultationDays'],
      });
    }
    if (!data.consultationTimeSlotsCount || data.consultationTimeSlotsCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify at least one time slot (10:00, 14:00)',
        path: ['consultationTimeSlots'],
      });
    }
  }
});

interface CatalogManagerProps {
  business: BusinessProfile;
}

export interface ParsedCsvProduct {
  name: string;
  price: number;
  salePrice?: number;
  categoryName: string;
  type: CatalogItemType;
  unit?: string;
  inStock: boolean;
  stockQuantity?: number;
  sku?: string;
  shortDescription?: string;
  images: string[];
  isValid: boolean;
  validationError?: string;
}

function parseCsvText(text: string, defaultItemType: CatalogItemType): ParsedCsvProduct[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuote = !insideQuote;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuote) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length < 2) return [];

  const parseRow = (rowStr: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQ = false;
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        if (inQ && rowStr[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const getIdx = (candidates: string[]) => {
    return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
  };

  const nameIdx = getIdx(['name', 'title', 'item', 'product']);
  const priceIdx = getIdx(['price', 'cost', 'mrp', 'rate', 'amount']);
  const salePriceIdx = getIdx(['saleprice', 'discountprice', 'offerprice', 'sale']);
  const categoryIdx = getIdx(['category', 'categoryname', 'dept', 'collection']);
  const typeIdx = getIdx(['type', 'itemtype', 'kind']);
  const unitIdx = getIdx(['unit', 'uom']);
  const inStockIdx = getIdx(['instock', 'available', 'stockstatus']);
  const stockQtyIdx = getIdx(['stockquantity', 'quantity', 'qty', 'count', 'stock']);
  const skuIdx = getIdx(['sku', 'code', 'barcode']);
  const descIdx = getIdx(['description', 'shortdescription', 'details', 'summary']);
  const imageIdx = getIdx(['images', 'image', 'photo', 'picture', 'imageurl', 'photourl']);

  const parsedItems: ParsedCsvProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length === 0 || row.every((c) => !c)) continue;

    const rawName = nameIdx !== -1 ? row[nameIdx] || '' : row[0] || '';
    const rawPrice = priceIdx !== -1 ? row[priceIdx] || '' : '0';
    const rawSalePrice = salePriceIdx !== -1 ? row[salePriceIdx] || '' : '';
    const rawCategory = categoryIdx !== -1 ? row[categoryIdx] || 'General' : 'General';
    const rawType = typeIdx !== -1 ? row[typeIdx] || '' : '';
    const rawUnit = unitIdx !== -1 ? row[unitIdx] || 'pcs' : 'pcs';
    const rawInStock = inStockIdx !== -1 ? row[inStockIdx] || 'true' : 'true';
    const rawStockQty = stockQtyIdx !== -1 ? row[stockQtyIdx] || '' : '';
    const rawSku = skuIdx !== -1 ? row[skuIdx] || '' : '';
    const rawDesc = descIdx !== -1 ? row[descIdx] || '' : '';
    const rawImage = imageIdx !== -1 ? row[imageIdx] || '' : '';

    const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
    const cleanSalePrice = rawSalePrice ? parseFloat(rawSalePrice.replace(/[^0-9.]/g, '')) : undefined;
    const cleanStockQty = rawStockQty ? parseInt(rawStockQty.replace(/[^0-9]/g, ''), 10) : undefined;

    let validItemType: CatalogItemType = defaultItemType;
    const normalizedType = rawType.toLowerCase();
    if (['service', 'menu_item', 'room_stay', 'rental_vehicle', 'product'].includes(normalizedType)) {
      validItemType = normalizedType as CatalogItemType;
    }

    const inStockBool = !['false', 'no', '0', 'out of stock', 'out'].includes(rawInStock.toLowerCase());

    const images = rawImage
      ? rawImage.split(/[,;]/).map((u) => u.trim()).filter((u) => u.startsWith('http'))
      : [];

    const isValid = Boolean(rawName.trim()) && !isNaN(cleanPrice) && cleanPrice >= 0;
    const validationError = !rawName.trim()
      ? 'Product name is missing'
      : isNaN(cleanPrice) || cleanPrice < 0
      ? 'Invalid price value'
      : undefined;

    parsedItems.push({
      name: rawName.trim(),
      price: isNaN(cleanPrice) ? 0 : cleanPrice,
      salePrice: cleanSalePrice && !isNaN(cleanSalePrice) ? cleanSalePrice : undefined,
      categoryName: rawCategory.trim() || 'General',
      type: validItemType,
      unit: rawUnit.trim() || 'pcs',
      inStock: inStockBool,
      stockQuantity: cleanStockQty && !isNaN(cleanStockQty) ? cleanStockQty : undefined,
      sku: rawSku.trim() || undefined,
      shortDescription: rawDesc.trim() || undefined,
      images,
      isValid,
      validationError,
    });
  }

  return parsedItems;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ business }) => {
  const { t } = useLanguage();
  const isDigitalCreator = isCreatorProfile(business);
  
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  // Bulk Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [priceAdjustmentType, setPriceAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [pricePercentageValue, setPricePercentageValue] = useState<string>('10');
  const [priceRoundingOption, setPriceRoundingOption] = useState<'round' | 'exact'>('round');
  const [bulkActionToast, setBulkActionToast] = useState<string | null>(null);

  // High-Resolution Image Preview Modal State
  const [previewingProductImage, setPreviewingProductImage] = useState<CatalogItem | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Draft persistence state
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const DRAFT_STORAGE_KEY = `storelly_catalog_draft_${business.id}`;

  // Bulk CSV Import State
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedCsvItems, setParsedCsvItems] = useState<ParsedCsvProduct[]>([]);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotalCount, setImportTotalCount] = useState(0);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [bulkImportSuccessMsg, setBulkImportSuccessMsg] = useState<string | null>(null);

  // Delete Confirm State
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('indigo');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState<string | null>(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);

  // Inline Quick Category Creator in Add/Edit Product Modal
  const [isInlineCategoryOpen, setIsInlineCategoryOpen] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [inlineCategoryColor, setInlineCategoryColor] = useState('indigo');
  const [isCreatingInlineCategory, setIsCreatingInlineCategory] = useState(false);

  // Digital Asset delivery mode ('upload' | 'link')
  const [digitalAssetMode, setDigitalAssetMode] = useState<'upload' | 'link'>('upload');

  // Consultation meeting platform
  const [meetingPlatform, setMeetingPlatform] = useState<'google_meet' | 'zoom' | 'whatsapp' | 'phone'>('google_meet');
  const [meetingInstructions, setMeetingInstructions] = useState('');

  // Item Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<CatalogItemType>('product');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState('pcs');
  const [sku, setSku] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<number | undefined>(undefined);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [offerText, setOfferText] = useState('');

  // Vertical specific form fields
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | undefined>(undefined);
  const [isVeg, setIsVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState<'mild' | 'medium' | 'spicy'>('mild');
  const [roomCapacity, setRoomCapacity] = useState<number | undefined>(undefined);
  const [bedType, setBedType] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | 'electric' | 'cng'>('petrol');
  const [transmission, setTransmission] = useState<'manual' | 'automatic'>('manual');
  const [seatingCapacity, setSeatingCapacity] = useState<number | undefined>(undefined);

  // Variants & Addons
  const [variants, setVariants] = useState<CatalogItemVariant[]>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState<number>(0);

  const [addons, setAddons] = useState<CatalogItemAddon[]>([]);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(0);

  // Digital Creator specific form fields
  const [productType, setProductType] = useState<'physical' | 'digital_file' | 'consultation_slot'>('physical');
  const [isFree, setIsFree] = useState(false);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [digitalFileType, setDigitalFileType] = useState<'pdf' | 'zip' | 'video' | 'audio' | 'document' | 'template' | 'course' | 'other'>('pdf');
  const [digitalFileUrl, setDigitalFileUrl] = useState('');
  const [digitalFileName, setDigitalFileName] = useState('');
  const [digitalFileSize, setDigitalFileSize] = useState('');
  const [digitalFiles, setDigitalFiles] = useState<{ id: string; title: string; url: string; fileSize?: string; fileType?: string }[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [consultationDuration, setConsultationDuration] = useState<number>(30);
  const [consultationDays, setConsultationDays] = useState<string[]>(['MO', 'TU', 'WE', 'TH', 'FR']);
  const [consultationTimeSlots, setConsultationTimeSlots] = useState<string[]>(['10:00', '11:30', '14:00', '15:30', '17:00']);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Sharing & Deep Links states
  const [sharingProduct, setSharingProduct] = useState<CatalogItem | null>(null);
  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);

  const storeUrl = getStorefrontUrl(business);

  const handleCopyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopiedStoreUrl(true);
    setTimeout(() => setCopiedStoreUrl(false), 2000);
  };

  const handleShareStoreWhatsApp = () => {
    const text = encodeURIComponent(
      `🌟 *${business.name}* 🌟\n` +
      `Check out our digital storefront and catalog:\n` +
      `👉 ${storeUrl}\n\n` +
      `Browse products, check prices, and place orders directly on WhatsApp!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  // Auto-save form draft to localStorage when adding a new item
  useEffect(() => {
    if (isModalOpen && !editingItem) {
      const timeoutId = setTimeout(() => {
        try {
          const draftPayload = {
            name,
            type,
            categoryId,
            shortDescription,
            detailedDescription,
            price,
            salePrice,
            unit,
            sku,
            imageUrls,
            inStock,
            stockQuantity,
            isFeatured,
            isOffer,
            offerText,
            productType,
            isFree,
            digitalFileType,
            digitalFileUrl,
            digitalFileName,
            digitalFileSize,
            digitalAssetMode,
            meetingPlatform,
            meetingInstructions,
            durationMinutes,
            prepTimeMinutes,
            isVeg,
            spiceLevel,
            roomCapacity,
            bedType,
            amenitiesInput,
            vehicleModel,
            fuelType,
            transmission,
            seatingCapacity,
            consultationDuration,
            consultationDays,
            consultationTimeSlots,
            variants,
            addons,
            updatedAt: Date.now(),
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
        } catch (e) {
          console.warn('Could not save catalog item draft:', e);
        }
      }, 400);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isModalOpen, editingItem, name, type, categoryId, shortDescription,
    detailedDescription, price, salePrice, unit, sku, imageUrls,
    inStock, stockQuantity, isFeatured, isOffer, offerText,
    productType, isFree, digitalFileType, digitalFileUrl, digitalFileName,
    digitalFileSize, digitalAssetMode, meetingPlatform, meetingInstructions,
    durationMinutes, prepTimeMinutes, isVeg,
    spiceLevel, roomCapacity, bedType, amenitiesInput, vehicleModel,
    fuelType, transmission, seatingCapacity, consultationDuration,
    consultationDays, consultationTimeSlots, variants, addons, DRAFT_STORAGE_KEY
  ]);

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove catalog draft:', e);
    }
    setHasRestoredDraft(false);
    resetFormFields();
  };

  const resetFormFields = () => {
    setName('');
    setType(isDigitalCreator ? 'product' : bizMeta.defaultItemType);
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setShortDescription('');
    setDetailedDescription('');
    setPrice(0);
    setSalePrice(undefined);
    setUnit(business.type === 'grocery' ? 'kg' : business.type === 'hotel' ? 'night' : business.type === 'rental' ? 'day' : 'pcs');
    setSku('');
    setImageUrls([]);
    setInStock(true);
    setStockQuantity(undefined);
    setIsFeatured(false);
    setIsOffer(false);
    setOfferText('');
    setDurationMinutes(30);
    setPrepTimeMinutes(20);
    setIsVeg(true);
    setSpiceLevel('mild');
    setRoomCapacity(2);
    setBedType('King Bed');
    setAmenitiesInput('Free WiFi, AC, TV, Room Service');
    setVehicleModel('');
    setFuelType('petrol');
    setTransmission('manual');
    setSeatingCapacity(5);
    setProductType(isDigitalCreator ? 'digital_file' : 'physical');
    setIsFree(false);
    setCloudinaryPublicId('');
    setDigitalFileUrl('');
    setDigitalFileName('');
    setDigitalFileSize('');
    setDigitalFiles([]);
    setDigitalAssetMode('upload');
    setMeetingPlatform('google_meet');
    setMeetingInstructions('');
    setNewLessonTitle('');
    setConsultationDuration(30);
    setConsultationDays(['MO', 'TU', 'WE', 'TH', 'FR']);
    setConsultationTimeSlots(['10:00', '11:30', '14:00', '15:30', '17:00']);
    setDigitalFileType('pdf');
    setVariants([]);
    setAddons([]);
    setIsInlineCategoryOpen(false);
    setInlineCategoryName('');
    setFormError(null);
  };

  // Load items and categories with resilient auto-seeding
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedItems, fetchedCategories] = await Promise.all([
        getCatalogItems(business.id),
        getCategories(business.id),
      ]);

      let finalCategories = fetchedCategories;

      // If no categories exist in the store, automatically seed recommended initial categories
      if (fetchedCategories.length === 0) {
        const meta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;
        const initialSuggestions = isDigitalCreator
          ? ['Digital Downloads', '1:1 Consultations', 'eBooks & Guides', 'Courses & Workshops', 'Physical Merch']
          : meta.suggestedCategories && meta.suggestedCategories.length > 0
          ? meta.suggestedCategories
          : ['Featured', 'Best Sellers', 'General'];

        const createdSeed: Category[] = [];
        for (let idx = 0; idx < Math.min(initialSuggestions.length, 4); idx++) {
          try {
            const seedCat = await createCategory(business.id, {
              name: initialSuggestions[idx],
              slug: generateSlug(initialSuggestions[idx]),
              sortOrder: idx,
              isActive: true,
            });
            createdSeed.push(seedCat);
          } catch (seedErr) {
            console.warn('Auto-seed category notice:', seedErr);
          }
        }
        if (createdSeed.length > 0) {
          finalCategories = createdSeed;
        }
      }

      setItems(fetchedItems);
      setCategories(finalCategories);

      // Ensure categoryId has a valid selection
      if (finalCategories.length > 0) {
        setCategoryId(prev => (prev && finalCategories.some(c => c.id === prev) ? prev : finalCategories[0].id));
      }
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  // Quick inline category creator in Add Product Modal
  const handleQuickCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inlineCategoryName.trim();
    if (!clean) return;
    try {
      setIsCreatingInlineCategory(true);
      const newCat = await createCategory(business.id, {
        name: clean,
        color: inlineCategoryColor,
        slug: generateSlug(clean),
        sortOrder: categories.length,
        isActive: true,
      });
      setCategories(prev => [...prev, newCat]);
      setCategoryId(newCat.id);
      setFieldErrors(prev => ({ ...prev, categoryId: '' }));
      setInlineCategoryName('');
      setIsInlineCategoryOpen(false);
    } catch (err: any) {
      console.error('Failed to create quick category:', err);
      setFormError('Failed to create category. Please try again.');
    } finally {
      setIsCreatingInlineCategory(false);
    }
  };

  // Manage Categories modal handlers
  const handleSaveCategoryFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;

    try {
      setIsCreatingCategory(true);
      if (editingCategory) {
        await updateCategory(business.id, editingCategory.id, {
          name: clean,
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor,
        });
        setCategories(prev =>
          prev.map(c =>
            c.id === editingCategory.id
              ? { ...c, name: clean, description: newCategoryDescription.trim() || undefined, color: newCategoryColor }
              : c
          )
        );
        setCategorySuccessMsg(`Category "${clean}" updated successfully!`);
        setEditingCategory(null);
      } else {
        const newCat = await createCategory(business.id, {
          name: clean,
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor,
          slug: generateSlug(clean),
          sortOrder: categories.length,
          isActive: true,
        });
        setCategories(prev => [...prev, newCat]);
        setCategorySuccessMsg(`Category "${clean}" created successfully!`);
        if (!categoryId) {
          setCategoryId(newCat.id);
        }
      }
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('indigo');
      setTimeout(() => setCategorySuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving category:', err);
      alert('Error saving category: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Move Category Up in Display Order
  const handleMoveCategoryUp = async (index: number) => {
    if (index <= 0 || isReorderingCategories) return;
    const newOrder = [...categories];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setCategories(newOrder);
    try {
      setIsReorderingCategories(true);
      await reorderCategories(business.id, newOrder.map(c => c.id));
    } catch (e) {
      console.warn('Reorder categories note:', e);
    } finally {
      setIsReorderingCategories(false);
    }
  };

  // Move Category Down in Display Order
  const handleMoveCategoryDown = async (index: number) => {
    if (index >= categories.length - 1 || isReorderingCategories) return;
    const newOrder = [...categories];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setCategories(newOrder);
    try {
      setIsReorderingCategories(true);
      await reorderCategories(business.id, newOrder.map(c => c.id));
    } catch (e) {
      console.warn('Reorder categories note:', e);
    } finally {
      setIsReorderingCategories(false);
    }
  };

  // Drag & Drop reordering
  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === targetIndex) {
      setDraggedCategoryIndex(null);
      return;
    }
    const newOrder = [...categories];
    const [moved] = newOrder.splice(draggedCategoryIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    setCategories(newOrder);
    setDraggedCategoryIndex(null);
    try {
      setIsReorderingCategories(true);
      await reorderCategories(business.id, newOrder.map(c => c.id));
    } catch (err) {
      console.warn('Drag reorder failed:', err);
    } finally {
      setIsReorderingCategories(false);
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeletingCategory(true);
      await deleteCategory(business.id, categoryToDelete.id);
      const remaining = categories.filter(c => c.id !== categoryToDelete.id);
      setCategories(remaining);
      if (categoryId === categoryToDelete.id) {
        setCategoryId(remaining.length > 0 ? remaining[0].id : '');
      }
      setCategoryToDelete(null);
      setCategorySuccessMsg('Category deleted.');
      setTimeout(() => setCategorySuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormError(null);
    setFieldErrors({});

    // Check if there is a saved local draft
    let restored = false;
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d && (d.name || d.price > 0 || d.shortDescription || (d.imageUrls && d.imageUrls.length > 0))) {
          setName(d.name || '');
          setType(d.type || (isDigitalCreator ? 'product' : bizMeta.defaultItemType));
          setCategoryId(d.categoryId || (categories.length > 0 ? categories[0].id : ''));
          setShortDescription(d.shortDescription || '');
          setDetailedDescription(d.detailedDescription || '');
          setPrice(d.price ?? 0);
          setSalePrice(d.salePrice);
          setUnit(d.unit || (business.type === 'grocery' ? 'kg' : business.type === 'hotel' ? 'night' : business.type === 'rental' ? 'day' : 'pcs'));
          setSku(d.sku || '');
          setImageUrls(d.imageUrls || []);
          setInStock(d.inStock ?? true);
          setStockQuantity(d.stockQuantity);
          setIsFeatured(d.isFeatured ?? false);
          setIsOffer(d.isOffer ?? false);
          setOfferText(d.offerText || '');
          setDurationMinutes(d.durationMinutes ?? 30);
          setPrepTimeMinutes(d.prepTimeMinutes ?? 20);
          setIsVeg(d.isVeg ?? true);
          setSpiceLevel(d.spiceLevel || 'mild');
          setRoomCapacity(d.roomCapacity ?? 2);
          setBedType(d.bedType || 'King Bed');
          setAmenitiesInput(d.amenitiesInput || 'Free WiFi, AC, TV, Room Service');
          setVehicleModel(d.vehicleModel || '');
          setFuelType(d.fuelType || 'petrol');
          setTransmission(d.transmission || 'manual');
          setSeatingCapacity(d.seatingCapacity ?? 5);
          setProductType(d.productType || (isDigitalCreator ? 'digital_file' : 'physical'));
          setIsFree(d.isFree ?? false);
          setDigitalFileType(d.digitalFileType || 'pdf');
          setDigitalFileUrl(d.digitalFileUrl || '');
          setDigitalFileName(d.digitalFileName || '');
          setDigitalFileSize(d.digitalFileSize || '');
          setDigitalAssetMode(d.digitalAssetMode || 'upload');
          setMeetingPlatform(d.meetingPlatform || 'google_meet');
          setMeetingInstructions(d.meetingInstructions || '');
          setConsultationDuration(d.consultationDuration ?? 30);
          setConsultationDays(d.consultationDays || ['MO', 'TU', 'WE', 'TH', 'FR']);
          setConsultationTimeSlots(d.consultationTimeSlots || ['10:00', '11:30', '14:00', '15:30', '17:00']);
          setVariants(d.variants || []);
          setAddons(d.addons || []);
          setHasRestoredDraft(true);
          restored = true;
        }
      }
    } catch (e) {
      console.warn('Could not read saved catalog draft:', e);
    }

    if (!restored) {
      setHasRestoredDraft(false);
      resetFormFields();
      // Synchronization check: ensure valid category from current list
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    } else {
      // Synchronization check: verify restored categoryId matches an existing category
      if (categories.length > 0 && (!categoryId || !categories.some(c => c.id === categoryId))) {
        const matched = categories.find(
          c => c.name.toLowerCase() === (categoryId || '').toLowerCase() ||
               c.slug.toLowerCase() === (categoryId || '').toLowerCase()
        );
        setCategoryId(matched ? matched.id : categories[0].id);
      }
    }

    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);

    // Robust Category Synchronization Check: Map item.categoryId reliably to business categories
    const rawCat = (item.categoryId || '').trim();
    const matchedCategory = categories.find(
      (c) =>
        c.id === rawCat ||
        c.name.toLowerCase() === rawCat.toLowerCase() ||
        c.slug.toLowerCase() === rawCat.toLowerCase()
    );

    if (matchedCategory) {
      setCategoryId(matchedCategory.id);
    } else if (rawCat && categories.some((c) => c.id === rawCat)) {
      setCategoryId(rawCat);
    } else if (categories.length > 0) {
      setCategoryId(categories[0].id);
    } else {
      setCategoryId(rawCat);
    }

    setShortDescription(item.shortDescription || '');
    setDetailedDescription(item.detailedDescription || '');
    setPrice(item.price);
    setSalePrice(item.salePrice);
    setUnit(item.unit || 'pcs');
    setSku(item.sku || '');
    setImageUrls(item.images || []);
    setInStock(item.inStock ?? true);
    setStockQuantity(item.stockQuantity);
    setIsFeatured(item.isFeatured ?? false);
    setIsOffer(item.isOffer ?? false);
    setOfferText(item.offerText || '');
    setDurationMinutes(item.durationMinutes);
    setPrepTimeMinutes(item.prepTimeMinutes);
    setIsVeg(item.isVeg ?? true);
    setSpiceLevel(item.spiceLevel || 'mild');
    setRoomCapacity(item.roomCapacity);
    setBedType(item.bedType || '');
    setAmenitiesInput(item.amenities ? item.amenities.join(', ') : '');
    setVehicleModel(item.vehicleModel || '');
    setFuelType(item.fuelType || 'petrol');
    setTransmission(item.transmission || 'manual');
    setSeatingCapacity(item.seatingCapacity);
    setProductType(item.productType || (isDigitalCreator ? 'digital_file' : 'physical'));
    setIsFree(item.isFree || item.price === 0);
    setCloudinaryPublicId(item.digitalFileId || '');
    setDigitalFileType(item.digitalFileType || 'pdf');
    setDigitalFileUrl(item.digitalFileUrl || '');
    setDigitalFileName(item.fileName || '');
    setDigitalFileSize(item.fileSize || '');
    setDigitalFiles(item.digitalFiles || []);
    setDigitalAssetMode(item.digitalFileUrl && item.digitalFileUrl.startsWith('http') && !item.digitalFileId ? 'link' : 'upload');
    setConsultationDuration(item.consultationDuration || 30);
    setConsultationDays(item.consultationDays || ['MO', 'TU', 'WE', 'TH', 'FR']);
    setConsultationTimeSlots(item.consultationTimeSlots || ['10:00', '11:30', '14:00', '15:30', '17:00']);
    setVariants(item.variants || []);
    setAddons(item.addons || []);
    setIsInlineCategoryOpen(false);
    setInlineCategoryName('');
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run comprehensive Zod validation schema
    const validationResult = productZodSchema.safeParse({
      name,
      categoryId,
      type: productType === 'consultation_slot' ? 'service' : type,
      productType,
      price: isFree ? 0 : Number(price),
      isFree,
      salePrice: salePrice !== undefined && salePrice > 0 && !isFree ? Number(salePrice) : undefined,
      shortDescription,
      digitalFileType,
      digitalAssetMode,
      digitalFileUrl,
      digitalFilesCount: digitalFiles.length,
      consultationDuration: Number(consultationDuration),
      consultationDaysCount: consultationDays.length,
      consultationTimeSlotsCount: consultationTimeSlots.length,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
      setFieldErrors(errors);
      const firstErrorMessage = validationResult.error.issues[0]?.message || 'Please fill in the required fields correctly.';
      setFormError(firstErrorMessage);
      return;
    }

    setFieldErrors({});

    try {
      setIsSaving(true);
      setFormError(null);

      const amenities = amenitiesInput
        ? amenitiesInput.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      // Multi-format field mapping: cleanly map only the fields needed for the chosen product type
      const itemPayload: Omit<CatalogItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        slug: editingItem?.slug || generateSlug(name),
        categoryId: categoryId || (categories.length > 0 ? categories[0].id : 'general'),
        type: productType === 'consultation_slot' ? 'service' : type,
        shortDescription: shortDescription.trim() || undefined,
        detailedDescription: detailedDescription.trim() || undefined,
        price: isFree ? 0 : Number(price),
        salePrice: salePrice !== undefined && salePrice > 0 && !isFree ? Number(salePrice) : undefined,
        unit: productType === 'physical' ? (unit.trim() || undefined) : undefined,
        sku: productType === 'physical' ? (sku.trim() || undefined) : undefined,
        images: imageUrls,
        inStock,
        stockQuantity: productType === 'physical' && stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        isFeatured,
        isOffer,
        offerText: isOffer ? (offerText.trim() || undefined) : undefined,
        durationMinutes: (type === 'service' || productType === 'consultation_slot') ? (durationMinutes ? Number(durationMinutes) : consultationDuration) : undefined,
        prepTimeMinutes: type === 'menu_item' ? (prepTimeMinutes ? Number(prepTimeMinutes) : undefined) : undefined,
        isVeg: type === 'menu_item' ? isVeg : undefined,
        spiceLevel: type === 'menu_item' ? spiceLevel : undefined,
        roomCapacity: type === 'room_stay' ? (roomCapacity ? Number(roomCapacity) : undefined) : undefined,
        bedType: type === 'room_stay' ? (bedType.trim() || undefined) : undefined,
        amenities: type === 'room_stay' ? amenities : undefined,
        vehicleModel: type === 'rental_vehicle' ? (vehicleModel.trim() || undefined) : undefined,
        fuelType: type === 'rental_vehicle' ? fuelType : undefined,
        transmission: type === 'rental_vehicle' ? transmission : undefined,
        seatingCapacity: type === 'rental_vehicle' ? (seatingCapacity ? Number(seatingCapacity) : undefined) : undefined,
        productType,
        digitalFileId: productType === 'digital_file' && digitalAssetMode === 'upload' ? (cloudinaryPublicId.trim() || undefined) : undefined,
        digitalFileUrl: productType === 'digital_file' ? (digitalFileUrl.trim() || undefined) : undefined,
        digitalFileType: productType === 'digital_file' ? digitalFileType : undefined,
        fileName: productType === 'digital_file' ? (digitalFileName.trim() || undefined) : undefined,
        fileSize: productType === 'digital_file' ? (digitalFileSize.trim() || undefined) : undefined,
        digitalFiles: productType === 'digital_file' && digitalFileType === 'course' ? digitalFiles : undefined,
        isFree,
        consultationDuration: productType === 'consultation_slot' ? Number(consultationDuration) : undefined,
        consultationDays: productType === 'consultation_slot' ? consultationDays : undefined,
        consultationTimeSlots: productType === 'consultation_slot' ? consultationTimeSlots : undefined,
        variants,
        addons,
        isActive: editingItem ? editingItem.isActive : true,
      };

      if (editingItem) {
        await updateCatalogItem(business.id, editingItem.id, itemPayload);
      } else {
        await createCatalogItem(business.id, itemPayload);
        // Clear draft on successful item creation
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          setHasRestoredDraft(false);
        } catch (e) {
          console.warn('Failed to clear catalog draft:', e);
        }
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Bulk Import Handlers
  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseCsvText(text, bizMeta.defaultItemType);
        setParsedCsvItems(parsed);
        setIsBulkImportModalOpen(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Name',
      'Price',
      'SalePrice',
      'Category',
      'Unit',
      'InStock',
      'StockQuantity',
      'SKU',
      'Description',
      'Images',
    ];

    const sampleRows = [
      [
        'Classic Cotton T-Shirt',
        '499',
        '399',
        'Apparel',
        'pcs',
        'TRUE',
        '50',
        'TSH-001',
        'Premium 100% breathable organic cotton tee',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
      ],
      [
        'Wireless Bluetooth Earbuds',
        '1499',
        '1199',
        'Electronics',
        'pcs',
        'TRUE',
        '25',
        'EAR-002',
        'High definition audio with active noise isolation',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
      ],
      [
        'Artisan Coffee Mug 350ml',
        '299',
        '',
        'Home & Kitchen',
        'pcs',
        'TRUE',
        '100',
        'MUG-003',
        'Handcrafted ceramic coffee cup with glossy finish',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${business.slug || 'store'}_catalog_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteBulkImport = async () => {
    const validItems = parsedCsvItems.filter((i) => i.isValid);
    if (validItems.length === 0) return;

    try {
      setIsImportingCsv(true);
      setImportProgress(0);
      setImportTotalCount(validItems.length);
      setImportSuccessCount(0);

      const currentCats = [...categories];
      const categoryMap = new Map<string, string>();
      currentCats.forEach((c) => {
        categoryMap.set(c.name.trim().toLowerCase(), c.id);
      });

      let imported = 0;

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const normalizedCatName = (item.categoryName || 'General').trim().toLowerCase();
        let targetCatId = categoryMap.get(normalizedCatName);

        if (!targetCatId) {
          try {
            const newCat = await createCategory(business.id, {
              name: item.categoryName || 'General',
              slug: generateSlug(item.categoryName || 'General'),
              sortOrder: currentCats.length,
              isActive: true,
            });
            targetCatId = newCat.id;
            categoryMap.set(normalizedCatName, newCat.id);
            currentCats.push(newCat);
          } catch (e) {
            console.warn('Could not auto-create category for CSV import:', e);
            targetCatId = currentCats[0]?.id || 'general';
          }
        }

        const itemPayload: Omit<CatalogItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> = {
          name: item.name,
          slug: generateSlug(item.name),
          categoryId: targetCatId,
          type: item.type,
          price: item.price,
          salePrice: item.salePrice,
          unit: item.unit || 'pcs',
          inStock: item.inStock,
          stockQuantity: item.stockQuantity,
          sku: item.sku,
          shortDescription: item.shortDescription,
          images: item.images,
          isActive: true,
        };

        await createCatalogItem(business.id, itemPayload);
        imported++;
        setImportSuccessCount(imported);
        setImportProgress(Math.round((imported / validItems.length) * 100));
      }

      await loadData();
      setIsBulkImportModalOpen(false);
      setBulkImportSuccessMsg(`Successfully imported ${imported} products into your catalog!`);
      setTimeout(() => setBulkImportSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error in bulk CSV import:', err);
      alert('Error importing some products: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleDigitalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingFile(true);
      setUploadProgress(0);
      const res = await uploadDigitalFileToCloudinary(file, (p) => setUploadProgress(p));
      setDigitalFileUrl(res.url);
      setDigitalFileName(res.fileName);
      setDigitalFileSize(res.fileSize);
      if (res.publicId) {
        setCloudinaryPublicId(res.publicId);
      }
      setIsUploadingFile(false);
    } catch (err: any) {
      setFormError(err.message || 'File upload failed');
      setIsUploadingFile(false);
    }
  };

  const handleAddCourseLessonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingFile(true);
      setUploadProgress(0);
      const res = await uploadDigitalFileToCloudinary(file, (p) => setUploadProgress(p));
      const newFileItem = {
        id: 'lesson_' + Date.now(),
        title: newLessonTitle.trim() || res.fileName,
        url: res.url,
        fileType: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'pdf',
        fileSize: res.fileSize,
        duration: undefined,
      };
      setDigitalFiles(prev => [...prev, newFileItem]);
      setNewLessonTitle('');
      setIsUploadingFile(false);
    } catch (err: any) {
      setFormError(err.message || 'Lesson file upload failed');
      setIsUploadingFile(false);
    }
  };

  const handleRemoveCourseLesson = (id: string) => {
    setDigitalFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItemIds.size === 0) return;
    setIsBulkDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;
    setIsBulkProcessing(true);
    const count = selectedItemIds.size;
    try {
      for (const id of selectedItemIds) {
        const itm = items.find(i => i.id === id);
        if (itm) {
          if (itm.digitalFileUrl || itm.digitalFileId) {
            deleteImageFromStorage(itm.digitalFileId || itm.digitalFileUrl || '', 'raw');
          }
          if (itm.images?.[0]) {
            deleteImageFromStorage(itm.images[0], 'image');
          }
        }
        await deleteCatalogItem(business.id, id);
      }
      setItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
      setSelectedItemIds(new Set());
      setIsBulkDeleteOpen(false);
      setBulkActionToast(`Successfully deleted ${count} items.`);
      setTimeout(() => setBulkActionToast(null), 3000);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkToggleVisibility = async (forceState?: boolean) => {
    if (selectedItemIds.size === 0) return;
    setIsBulkProcessing(true);
    const count = selectedItemIds.size;
    try {
      const updatedMap = new Map<string, boolean>();
      for (const id of selectedItemIds) {
        const itm = items.find(i => i.id === id);
        if (itm) {
          const nextActive = forceState !== undefined ? forceState : !itm.isActive;
          updatedMap.set(id, nextActive);
          await updateCatalogItem(business.id, id, { isActive: nextActive });
        }
      }
      setItems(prev => prev.map(i => (updatedMap.has(i.id) ? { ...i, isActive: updatedMap.get(i.id)! } : i)));
      setSelectedItemIds(new Set());
      setBulkActionToast(`Updated visibility for ${count} items.`);
      setTimeout(() => setBulkActionToast(null), 3000);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleApplyBulkPricePercentage = async () => {
    const pct = parseFloat(pricePercentageValue);
    if (isNaN(pct) || pct <= 0 || selectedItemIds.size === 0) return;
    setIsBulkProcessing(true);
    const count = selectedItemIds.size;
    try {
      const multiplier = priceAdjustmentType === 'increase' ? (1 + pct / 100) : (1 - pct / 100);
      const updatedMap = new Map<string, number>();

      for (const id of selectedItemIds) {
        const itm = items.find(i => i.id === id);
        if (itm) {
          let calculated = itm.price * multiplier;
          const finalPrice = priceRoundingOption === 'round'
            ? Math.max(0, Math.round(calculated))
            : Math.max(0, Math.round(calculated * 100) / 100);
          updatedMap.set(id, finalPrice);
          await updateCatalogItem(business.id, id, { price: finalPrice });
        }
      }

      setItems(prev => prev.map(i => (updatedMap.has(i.id) ? { ...i, price: updatedMap.get(i.id)! } : i)));
      setSelectedItemIds(new Set());
      setIsBulkPriceModalOpen(false);
      setBulkActionToast(`Applied ${priceAdjustmentType === 'increase' ? '+' : '-'}${pct}% price adjustment to ${count} products.`);
      setTimeout(() => setBulkActionToast(null), 3500);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    try {
      await updateCatalogItem(business.id, item.id, { isActive: !item.isActive });
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, isActive: !item.isActive } : i)));
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const handleDuplicate = async (item: CatalogItem) => {
    try {
      await duplicateCatalogItem(business.id, item);
      await loadData();
    } catch (err) {
      console.error('Error duplicating item:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      // Clean up Cloudinary storage
      if (itemToDelete.digitalFileUrl || itemToDelete.digitalFileId) {
        deleteImageFromStorage(itemToDelete.digitalFileId || itemToDelete.digitalFileUrl || '', 'raw');
      }
      if (itemToDelete.images?.[0]) {
        deleteImageFromStorage(itemToDelete.images[0], 'image');
      }
      if (itemToDelete.digitalFiles) {
        for (const df of itemToDelete.digitalFiles) {
          if (df.url) deleteImageFromStorage(df.url, 'raw');
        }
      }

      await deleteCatalogItem(business.id, itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || i.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isDigitalCreator ? 'Standard Catalog & Services' : bizMeta.itemPlural}
          </h2>
          <p className="text-xs text-slate-500">
            {isDigitalCreator
              ? 'Manage your standard physical items or 1:1 call consultation services.'
              : 'Manage your store offerings.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
            title="Manage store categories"
          >
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <span>Categories ({categories.length})</span>
          </button>

          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleCsvFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => document.getElementById('csv-file-input')?.click()}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
            title="Import catalog items in bulk via CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {bulkImportSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{bulkImportSuccessMsg}</span>
        </div>
      )}

      {categorySuccessMsg && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold">{categorySuccessMsg}</span>
        </div>
      )}

      {/* =========================================================================
          DIGITAL STOREFRONT URL & LIVE SHARING HUB BANNER
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white">Digital Store Live Link</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Public
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Customers can open this URL to browse your products, add items to cart, and order directly on WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShareStoreWhatsApp}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Share</span>
            </button>
            <button
              type="button"
              onClick={() => window.open(storeUrl, '_blank')}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
              title="Open storefront in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL Box */}
        <div className="flex items-center bg-black/40 border border-white/15 rounded-2xl p-1.5 sm:p-2 gap-2">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0 ml-1.5" />
          <input
            type="text"
            readOnly
            value={storeUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full bg-transparent font-mono text-xs text-emerald-200 font-semibold focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopyStoreUrl}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
          >
            {copiedStoreUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedStoreUrl ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <input
            type="checkbox"
            checked={selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 text-indigo-600 rounded cursor-pointer shrink-0"
            title="Select all products"
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">All Categories ({items.length})</option>
            {categories.map(cat => {
              const count = items.filter(i => i.categoryId === cat.id).length;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {selectedItemIds.size > 0 && (
        <div className="sticky top-20 z-20 bg-indigo-50/95 backdrop-blur-xs border border-indigo-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-indigo-950">
              {selectedItemIds.size} of {filteredItems.length} products selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedItemIds(new Set())}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Visibility Group */}
            <div className="inline-flex rounded-xl shadow-2xs border border-indigo-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => handleBulkToggleVisibility(true)}
                disabled={isBulkProcessing}
                className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Show all selected items"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Show</span>
              </button>
              <div className="w-[1px] bg-indigo-100" />
              <button
                type="button"
                onClick={() => handleBulkToggleVisibility(false)}
                disabled={isBulkProcessing}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Hide all selected items"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Hide</span>
              </button>
            </div>

            {/* Update Price Percentage */}
            <button
              type="button"
              onClick={() => setIsBulkPriceModalOpen(true)}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 bg-white hover:bg-indigo-100/70 active:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Adjust prices of selected products by a percentage"
            >
              <Percent className="w-3.5 h-3.5 text-indigo-600" />
              <span>Update Price %</span>
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Permanently delete all selected products"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Bulk Delete ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => {
            const isItemFree = item.isFree || item.price === 0;
            const categoryObj = categories.find(c => c.id === item.categoryId);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                className={`bg-white rounded-3xl border p-4 flex flex-col justify-between gap-3 relative transition hover:shadow-xs ${
                  !item.isActive
                    ? 'opacity-65 bg-slate-50 border-slate-200'
                    : selectedItemIds.has(item.id)
                    ? 'border-indigo-400 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => handleToggleSelectItem(item.id)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-start justify-between pl-6">
                    <div className="flex gap-3 min-w-0">
                      {/* High-Resolution Thumbnail with Hover Preview Trigger */}
                      <div
                        onClick={() => item.images?.[0] && setPreviewingProductImage(item)}
                        className="group/img relative w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition hover:border-indigo-400 hover:shadow-xs"
                        title={item.images?.[0] ? "Click to preview high-resolution image" : "No product image"}
                      >
                        {item.images?.[0] ? (
                          <>
                            <SafeImage
                              src={item.images[0]}
                              alt={item.name}
                              fallbackType="product"
                              className="w-full h-full object-contain object-center transition-transform duration-200 group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-4 h-4 drop-shadow" />
                            </div>
                          </>
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 truncate" title={item.name}>{item.name}</h3>
                        <div className="text-sm font-extrabold text-indigo-700 flex items-center gap-1.5">
                          {isItemFree ? (
                            <span className="text-emerald-600 font-extrabold text-xs px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">FREE</span>
                          ) : (
                            <>
                              <span>{business.currencySymbol || '₹'}{item.price}</span>
                              {item.salePrice && item.salePrice > item.price && (
                                <span className="text-[11px] text-slate-400 line-through font-normal">
                                  {business.currencySymbol || '₹'}{item.salePrice}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {categoryObj && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {(() => {
                              const colorCfg = getCategoryColorConfig(categoryObj.color);
                              return (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${colorCfg.dot}`} />
                                  <span className="truncate max-w-[130px]">{categoryObj.name}</span>
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(item)}
                      title={item.isActive ? 'Live on Storefront' : 'Hidden'}
                      className={`p-1.5 rounded-lg border transition ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    {item.productType === 'digital_file' && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                        {item.digitalFileType || 'FILE'}
                      </span>
                    )}
                    {item.productType === 'consultation_slot' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">
                        📅 1:1 Session ({item.consultationDuration || 30}m)
                      </span>
                    )}
                    {(!item.productType || item.productType === 'physical') && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        📦 Physical
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSharingProduct(item)}
                      title="Share Direct Product Link & QR"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(item)}
                      title="Duplicate"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      title="Delete"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <DashboardEmptyState
          icon={PackageOpen}
          title="No products found"
          description={searchQuery || selectedCategoryFilter !== 'all' ? "No products match your search or category filter." : "You haven't added any products or services yet. Create your first offering to start selling!"}
          actionLabel="Add New Product"
          onAction={openCreateModal}
        />
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingItem ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Fill in your item details, format, pricing, and category.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4">
              {hasRestoredDraft && !editingItem && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Unsaved draft restored from your last session.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-2 py-1 bg-white border border-amber-200 hover:bg-amber-100 text-amber-900 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    Discard Draft
                  </button>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Format Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Product Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {isModuleApplicableForBusiness('digital_products', business) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductType('digital_file');
                        setType('product');
                      }}
                      className={`p-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        productType === 'digital_file'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Digital Download</span>
                    </button>
                  )}
                  {isModuleApplicableForBusiness('booking_appointments', business) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductType('consultation_slot');
                        setType('service');
                      }}
                      className={`p-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        productType === 'consultation_slot'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>1:1 Session / Call</span>
                    </button>
                  )}
                  {isModuleApplicableForBusiness('products', business) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductType('physical');
                        setType('product');
                      }}
                      className={`p-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        productType === 'physical'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>Physical Item</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category & Item Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category with Quick Creator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsInlineCategoryOpen(!isInlineCategoryOpen)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isInlineCategoryOpen ? 'Close' : 'New Category'}</span>
                    </button>
                  </div>

                  {isInlineCategoryOpen ? (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2.5 mb-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide">Quick Add Category</span>
                        <div className="flex items-center gap-1">
                          <Palette className="w-3 h-3 text-indigo-600" />
                          <span className="text-[10px] text-indigo-700 font-semibold">Choose Color</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {CATEGORY_COLOR_PALETTE.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setInlineCategoryColor(c.id)}
                            className={`w-5 h-5 rounded-full border-2 transition cursor-pointer flex items-center justify-center ${
                              inlineCategoryColor === c.id ? 'border-slate-900 scale-110 shadow-xs' : 'border-white hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {inlineCategoryColor === c.id && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={inlineCategoryName}
                          onChange={e => {
                            setInlineCategoryName(e.target.value);
                            if (fieldErrors.categoryId) setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                          }}
                          placeholder="Presets, eBooks, Consultations"
                          className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-200 rounded-xl bg-white font-medium"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickCreateCategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickCreateCategory()}
                          disabled={isCreatingInlineCategory || !inlineCategoryName.trim()}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 shadow-xs"
                        >
                          {isCreatingInlineCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <select
                      value={categoryId}
                      onChange={e => {
                        if (e.target.value === '__CREATE_NEW__') {
                          setIsInlineCategoryOpen(true);
                        } else {
                          setCategoryId(e.target.value);
                          if (fieldErrors.categoryId) {
                            setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                          }
                        }
                      }}
                      className={`w-full px-3 py-2 text-xs border rounded-xl bg-white font-medium text-slate-800 transition ${
                        fieldErrors.categoryId ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200' : 'border-slate-200'
                      }`}
                      required
                    >
                      {categories.length === 0 && (
                        <option value="">-- Click &quot;New Category&quot; above to create one --</option>
                      )}
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__CREATE_NEW__">+ Create New Category...</option>
                    </select>

                    {categoryId && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {(() => {
                          const currentCat = categories.find(c => c.id === categoryId);
                          if (!currentCat) return null;
                          const colorCfg = getCategoryColorConfig(currentCat.color);
                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colorCfg.dot}`} />
                              <span>{currentCat.name}</span>
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    {fieldErrors.categoryId && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.categoryId}</p>
                    )}
                  </div>
                </div>

                {/* Item Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Item Type
                  </label>
                  <select
                    value={type}
                    onChange={e => {
                      setType(e.target.value as any);
                      if (fieldErrors.type) setFieldErrors(prev => ({ ...prev, type: '' }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-800"
                  >
                    {bizMeta.supportedItemTypes.filter(t => {
                      if (t === 'product') return !!business.modules?.products;
                      if (t === 'service') return !!business.modules?.services;
                      if (t === 'menu_item') return !!business.modules?.menu;
                      if (t === 'room') return !!business.modules?.rooms;
                      if (t === 'vehicle') return !!business.modules?.vehicles;
                      return true; // default types like custom/package always allowed if catalog is open
                    }).map(t => (
                      <option key={t} value={t}>
                        {t === 'product' ? 'Standard Product' : 
                         t === 'service' ? 'Professional Service' : 
                         t === 'menu_item' ? 'Food / Drink Item' :
                         t === 'room' ? 'Room / Stay' :
                         t === 'vehicle' ? 'Rental Vehicle' :
                         t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Name / Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Product Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Masterclass eBook, Lightroom Preset Pack"
                  className={`w-full px-3 py-2 text-xs border rounded-xl font-medium transition ${
                    fieldErrors.name ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200' : 'border-slate-200'
                  }`}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Short Description / Highlights */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Short Description / Highlights
                </label>
                <textarea
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  rows={2}
                  placeholder="Summary of what the customer receives..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* Pricing & Free Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pricing</span>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={e => {
                        setIsFree(e.target.checked);
                        if (e.target.checked) {
                          setPrice(0);
                          setSalePrice(undefined);
                        }
                        if (fieldErrors.price) setFieldErrors(prev => ({ ...prev, price: '' }));
                      }}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-700">Free Product</span>
                  </label>
                </div>

                {isFree ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">100% Free Product / Lead Magnet</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Customers can claim and download this offering at ₹0 without making a payment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Price ({business.currencySymbol || '₹'}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={e => {
                          setPrice(Number(e.target.value));
                          if (fieldErrors.price) setFieldErrors(prev => ({ ...prev, price: '' }));
                        }}
                        className={`w-full px-3 py-2 text-xs border rounded-xl bg-white font-semibold transition ${
                          fieldErrors.price ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200' : 'border-slate-200'
                        }`}
                        required
                      />
                      {fieldErrors.price && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Original / Strike Price (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={salePrice !== undefined ? salePrice : ''}
                        onChange={e => {
                          setSalePrice(e.target.value ? Number(e.target.value) : undefined);
                          if (fieldErrors.salePrice) setFieldErrors(prev => ({ ...prev, salePrice: '' }));
                        }}
                        placeholder="999"
                        className={`w-full px-3 py-2 text-xs border rounded-xl bg-white transition ${
                          fieldErrors.salePrice ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200' : 'border-slate-200'
                        }`}
                      />
                      {fieldErrors.salePrice && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.salePrice}</p>
                      )}
                      {salePrice && salePrice > price && price > 0 ? (
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">
                          ⚡ Save {Math.round(((salePrice - price) / salePrice) * 100)}% ({business.currencySymbol || '₹'}{salePrice - price} OFF)
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Photo */}
              <ImageUploadInput
                label="Cover Thumbnail Image"
                value={imageUrls[0] || ''}
                onChange={url => setImageUrls(url ? [url] : [])}
                aspectRatio="square"
              />

              {/* DIGITAL FILE CONFIGURATION */}
              {productType === 'digital_file' && (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      Digital Asset Configuration
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      File Category
                    </label>
                    <select
                      value={digitalFileType}
                      onChange={e => setDigitalFileType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="pdf">📄 Single PDF / eBook / Guide</option>
                      <option value="course">🎓 Course / Multi-lesson Package</option>
                      <option value="zip">🗜️ ZIP Archive / Template Bundle</option>
                      <option value="video">🎥 Video Masterclass</option>
                      <option value="audio">🎧 Audio / Podcast</option>
                      <option value="other">📁 Other Digital File</option>
                    </select>
                  </div>

                  {/* Single File Mode vs Multi Lesson */}
                  {digitalFileType !== 'course' ? (
                    <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3">
                      {/* Asset delivery mode switcher */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800">Asset File Source</span>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setDigitalAssetMode('upload')}
                            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                              digitalAssetMode === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            Cloud Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => setDigitalAssetMode('link')}
                            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                              digitalAssetMode === 'link' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            External Link
                          </button>
                        </div>
                      </div>

                      {digitalAssetMode === 'link' ? (
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Direct Download / Access URL
                          </label>
                          <div className="relative">
                            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="url"
                              value={digitalFileUrl}
                              onChange={e => setDigitalFileUrl(e.target.value)}
                              placeholder="https://drive.google.com/... or https://notion.site/..."
                              className="w-full pl-9 pr-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white font-mono"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Supports Google Drive, Dropbox, Notion, Mega, Gumroad, or any direct link. Customers receive this link upon checkout.
                          </p>
                        </div>
                      ) : (
                        <div>
                          {digitalFileUrl ? (
                            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-bold text-slate-800 truncate">
                                  {digitalFileName || 'digital_asset'}
                                </span>
                                {digitalFileSize && (
                                  <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                                    ({digitalFileSize})
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDigitalFileUrl('');
                                  setDigitalFileName('');
                                  setDigitalFileSize('');
                                }}
                                className="text-[11px] text-red-600 hover:text-red-800 font-bold ml-2 shrink-0 cursor-pointer"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <div>
                              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50/50 cursor-pointer transition">
                                <UploadCloud className="w-8 h-8 text-indigo-500 mb-1" />
                                <span className="text-xs font-bold text-indigo-900">
                                  {isUploadingFile ? `Uploading ${uploadProgress}%...` : 'Click to Upload Asset File'}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  PDF, ZIP, MP4, MP3, DOCX up to 100MB
                                </span>
                                <input
                                  type="file"
                                  onChange={handleDigitalFileUpload}
                                  disabled={isUploadingFile}
                                  className="hidden"
                                />
                              </label>
                              {isUploadingFile && (
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-1.5 transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Course / Multi-file Upload Box */
                    <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Course Lessons & Modules ({digitalFiles.length})
                        </span>
                      </div>

                      {digitalFiles.map((df, idx) => (
                        <div
                          key={df.id || idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">{df.title}</span>
                            {df.fileSize && (
                              <span className="text-[10px] text-slate-400">({df.fileSize})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCourseLesson(df.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <input
                          type="text"
                          value={newLessonTitle}
                          onChange={e => setNewLessonTitle(e.target.value)}
                          placeholder="Lesson/Chapter Title (Chapter 1: Introduction)"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                        />
                        <label className="flex items-center justify-center p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer transition gap-2">
                          <Plus className="w-4 h-4" />
                          <span>{isUploadingFile ? `Uploading ${uploadProgress}%...` : 'Add File to Course'}</span>
                          <input
                            type="file"
                            onChange={handleAddCourseLessonFile}
                            disabled={isUploadingFile}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1:1 CONSULTATION SLOT CONFIGURATION */}
              {productType === 'consultation_slot' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    1:1 Session Booking Settings
                  </h4>

                  {/* Call Duration Presets */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Call Duration
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[15, 30, 45, 60, 90].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setConsultationDuration(mins)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                            consultationDuration === mins
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Days */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Available Days
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: 'MO', label: 'Mon' },
                        { code: 'TU', label: 'Tue' },
                        { code: 'WE', label: 'Wed' },
                        { code: 'TH', label: 'Thu' },
                        { code: 'FR', label: 'Fri' },
                        { code: 'SA', label: 'Sat' },
                        { code: 'SU', label: 'Sun' },
                      ].map(d => {
                        const isSelected = consultationDays.includes(d.code);
                        return (
                          <button
                            key={d.code}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setConsultationDays(consultationDays.filter(c => c !== d.code));
                              } else {
                                setConsultationDays([...consultationDays, d.code]);
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-700 text-white border-amber-700'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Time Slots */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Daily Time Slots (10:00, 11:30, 14:00, 16:00)
                    </label>
                    <input
                      value={consultationTimeSlots.join(', ')}
                      onChange={e =>
                        setConsultationTimeSlots(
                          e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        )
                      }
                      placeholder="10:00, 11:30, 14:00, 16:00"
                      className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}

              {/* PHYSICAL ITEM CONFIGURATION */}
              {productType === 'physical' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-600" />
                    Physical Item Inventory & Stock
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stockQuantity !== undefined ? stockQuantity : ''}
                        onChange={e => setStockQuantity(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="50"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        placeholder="pcs, kg, pack"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        SKU (Code)
                      </label>
                      <input
                        type="text"
                        value={sku}
                        onChange={e => setSku(e.target.value)}
                        placeholder="PROD-001"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit & Cancel */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingFile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Manage Categories</h3>
                  <p className="text-xs text-slate-500">Organize your store into clear customer collections</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                  setNewCategoryColor('indigo');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Success Notification */}
              {categorySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{categorySuccessMsg}</span>
                </div>
              )}

              {/* Add / Edit Form */}
              <form onSubmit={handleSaveCategoryFromModal} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    {editingCategory ? `Edit Category "${editingCategory.name}"` : 'Create New Category'}
                  </span>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                        setNewCategoryColor('indigo');
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Color Palette Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-indigo-600" />
                    Category Accent Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLOR_PALETTE.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewCategoryColor(c.id)}
                        className={`w-7 h-7 rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          newCategoryColor === c.id ? 'border-slate-900 scale-110 shadow-xs ring-2 ring-indigo-300' : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {newCategoryColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Category Name (Digital Downloads, Consultations, eBooks)"
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white font-medium text-slate-800"
                  required
                />
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={e => setNewCategoryDescription(e.target.value)}
                  placeholder="Optional short description..."
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white"
                />
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCategory ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </form>

              {/* Categories List with Drag-and-Drop and Up/Down reordering */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Existing Categories ({categories.length})
                  </span>
                  {isReorderingCategories && (
                    <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving order...
                    </span>
                  )}
                </div>

                {categories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                    No categories created yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {categories.map((cat, idx) => {
                      const count = items.filter(i => i.categoryId === cat.id).length;
                      const colorCfg = getCategoryColorConfig(cat.color);
                      return (
                        <div
                          key={cat.id}
                          draggable
                          onDragStart={e => handleCategoryDragStart(e, idx)}
                          onDragOver={handleCategoryDragOver}
                          onDrop={e => handleCategoryDrop(e, idx)}
                          className={`p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-indigo-300 transition ${
                            draggedCategoryIndex === idx ? 'opacity-40 border-dashed border-indigo-400' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {/* Drag Handle */}
                            <div className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1 shrink-0" title="Drag to reorder">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0 || isReorderingCategories}
                                onClick={() => handleMoveCategoryUp(idx)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === categories.length - 1 || isReorderingCategories}
                                onClick={() => handleMoveCategoryDown(idx)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Category Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${colorCfg.dot}`} />
                                  <span className="truncate">{cat.name}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">({count} item{count !== 1 ? 's' : ''})</span>
                              </div>
                              {cat.description && (
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">{cat.description}</div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(cat);
                                setNewCategoryName(cat.name);
                                setNewCategoryDescription(cat.description || '');
                                setNewCategoryColor(cat.color || 'indigo');
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoryToDelete(cat)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                  setNewCategoryColor('indigo');
                }}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      <ConfirmActionModal
        isOpen={!!categoryToDelete}
        title={`Delete Category "${categoryToDelete?.name}"?`}
        message="Are you sure you want to remove this category? Products in this category will not be deleted."
        confirmText="Delete Category"
        isDestructive={true}
        isLoading={isDeletingCategory}
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => setCategoryToDelete(null)}
      />

      {/* Single Item Delete Confirmation */}
      <ConfirmActionModal
        isOpen={!!itemToDelete}
        title={`Delete "${itemToDelete?.name || 'Item'}"?`}
        message="Permanently remove this item and delete associated media files from storage?"
        confirmText="Delete Item"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmActionModal
        isOpen={isBulkDeleteOpen}
        title={`Delete ${selectedItemIds.size} Selected Items?`}
        message={`Are you sure you want to permanently delete all ${selectedItemIds.size} selected items? This action cannot be undone.`}
        confirmText={`Delete ${selectedItemIds.size} Items`}
        isDestructive={true}
        isLoading={isBulkProcessing}
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      {/* CSV Bulk Import Review Modal */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bulk CSV Product Import</h3>
                  <p className="text-xs text-slate-500">
                    File: <span className="font-medium text-slate-700">{csvFileName}</span> •{' '}
                    {parsedCsvItems.length} rows detected
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isImportingCsv && setIsBulkImportModalOpen(false)}
                disabled={isImportingCsv}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Import Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Rows</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{parsedCsvItems.length}</div>
                </div>
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Ready to Import</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">
                    {parsedCsvItems.filter((i) => i.isValid).length}
                  </div>
                </div>
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Invalid / Skipped</div>
                  <div className="text-xl font-bold text-red-700 mt-0.5">
                    {parsedCsvItems.filter((i) => !i.isValid).length}
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              {isImportingCsv && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                    <span>
                      Importing {importSuccessCount} of {importTotalCount} items...
                    </span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Parsed Items Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedCsvItems.map((item, idx) => (
                        <tr key={idx} className={item.isValid ? 'hover:bg-slate-50' : 'bg-red-50/40'}>
                          <td className="py-2.5 px-3">
                            {item.isValid ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                Valid
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
                                Error
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[180px] truncate">
                            {item.name || '(No name)'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            ₹{item.price.toFixed(2)}
                            {item.salePrice ? (
                              <span className="text-[10px] text-slate-400 block line-through">
                                ₹{item.salePrice.toFixed(2)}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{item.categoryName || 'General'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{item.sku || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {item.errors && item.errors.length > 0 ? (
                              <span className="text-red-600 font-medium">{item.errors.join(', ')}</span>
                            ) : (
                              <span className="text-emerald-600">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Sample Template</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkImportModalOpen(false)}
                  disabled={isImportingCsv}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkImport}
                  disabled={isImportingCsv || parsedCsvItems.filter((i) => i.isValid).length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isImportingCsv ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>
                        Import {parsedCsvItems.filter((i) => i.isValid).length} Products
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product-Level Share & Direct Buy Modal */}
      <ProductShareModal
        business={business}
        item={sharingProduct}
        isOpen={!!sharingProduct}
        onClose={() => setSharingProduct(null)}
      />

      {/* Bulk Price Percentage Update Modal */}
      {isBulkPriceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bulk Price Adjustment</h3>
                  <p className="text-xs text-slate-500">
                    Update prices for <span className="font-semibold text-indigo-600">{selectedItemIds.size}</span> selected products
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isBulkProcessing && setIsBulkPriceModalOpen(false)}
                disabled={isBulkProcessing}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Type: Markup vs Discount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Adjustment Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceAdjustmentType('increase')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      priceAdjustmentType === 'increase'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4 text-emerald-600" />
                    <span>Price Markup (+ Increase)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceAdjustmentType('decrease')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      priceAdjustmentType === 'decrease'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4 text-amber-600" />
                    <span>Discount (- Decrease)</span>
                  </button>
                </div>
              </div>

              {/* Percentage Input & Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Percentage Value (%)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0.1"
                      max="500"
                      step="0.5"
                      value={pricePercentageValue}
                      onChange={e => setPricePercentageValue(e.target.value)}
                      placeholder="10"
                      className="w-full pl-3 pr-8 py-2.5 text-sm font-bold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['5', '10', '15', '20', '25'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPricePercentageValue(val)}
                        className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          pricePercentageValue === val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rounding Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Price Formatting</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRounding"
                      value="round"
                      checked={priceRoundingOption === 'round'}
                      onChange={() => setPriceRoundingOption('round')}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="font-semibold">Round to whole integer (₹499)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRounding"
                      value="exact"
                      checked={priceRoundingOption === 'exact'}
                      onChange={() => setPriceRoundingOption('exact')}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="font-semibold">Exact 2 decimals</span>
                  </label>
                </div>
              </div>

              {/* Live Preview on Selected Items */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Sample Price Preview</span>
                  <span>{business.currencySymbol || '₹'}</span>
                </div>
                <div className="divide-y divide-slate-200/70 text-xs">
                  {items
                    .filter(i => selectedItemIds.has(i.id))
                    .slice(0, 4)
                    .map(item => {
                      const pct = parseFloat(pricePercentageValue) || 0;
                      const mul = priceAdjustmentType === 'increase' ? (1 + pct / 100) : (1 - pct / 100);
                      const calc = item.price * mul;
                      const next = priceRoundingOption === 'round'
                        ? Math.max(0, Math.round(calc))
                        : Math.max(0, Math.round(calc * 100) / 100);
                      return (
                        <div key={item.id} className="py-2 flex items-center justify-between">
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">{item.name}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-400 line-through text-[11px]">
                              {business.currencySymbol || '₹'}{item.price}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-indigo-700">
                              {business.currencySymbol || '₹'}{next}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {selectedItemIds.size > 4 && (
                    <div className="pt-2 text-[11px] text-slate-500 text-center font-medium">
                      + {selectedItemIds.size - 4} more selected products will be updated
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(false)}
                disabled={isBulkProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPricePercentage}
                disabled={isBulkProcessing || !parseFloat(pricePercentageValue)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isBulkProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply to {selectedItemIds.size} Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Image Preview Modal */}
      {previewingProductImage && previewingProductImage.images?.[0] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewingProductImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {previewingProductImage.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-extrabold text-indigo-700 font-mono">
                    {previewingProductImage.isFree || previewingProductImage.price === 0
                      ? 'FREE'
                      : `${business.currencySymbol || '₹'}${previewingProductImage.price}`}
                  </span>
                  {(() => {
                    const cat = categories.find(c => c.id === previewingProductImage.categoryId);
                    return cat ? (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {cat.name}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewingProductImage.images[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Open original high-res image in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewingProductImage(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* High-Resolution Image Container */}
            <div className="p-4 bg-slate-900/5 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewingProductImage.images[0]}
                alt={previewingProductImage.name}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-xl transition"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Toast Notification */}
      {bulkActionToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{bulkActionToast}</span>
        </div>
      )}
    </div>
  );
};

