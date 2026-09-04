import { useLanguage } from '../../context/LanguageContext';
import { SafeImage } from '../common/SafeImage';
import React, { useState, useEffect } from 'react';
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
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import {
  BusinessProfile,
  CatalogItem,
  Category,
  CatalogItemType,
  CatalogItemVariant,
  CatalogItemAddon,
  
} from '../../types';
import {
  getCatalogItems,
  getCategories,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  duplicateCatalogItem,
  generateSlug,
} from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { ImageSizeWarning } from '../common/ImageSizeWarning';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SwipeToDelete } from '../common/SwipeToDelete';
import {
  deleteImageFromStorage,
  uploadToCloudinary,
  uploadDigitalFileToCloudinary,
} from '../../services/cloudinary';

interface CatalogManagerProps {
  business: BusinessProfile;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ business }) => {
  const { t } = useLanguage();
  const isDigitalCreator = business.type === 'creator' || business.type === 'services' || business.modules?.digitalProducts;
  
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  // Bulk Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirm State
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [digitalFiles, setDigitalFiles] = useState<[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [consultationDuration, setConsultationDuration] = useState<number>(30);
  const [consultationDays, setConsultationDays] = useState<string[]>(['MO', 'TU', 'WE', 'TH', 'FR']);
  const [consultationTimeSlots, setConsultationTimeSlots] = useState<string[]>(['10:00', '11:00', '14:00', '15:00', '16:00']);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  // Load items and categories
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedItems, fetchedCategories] = await Promise.all([
        getCatalogItems(business.id),
        getCategories(business.id),
      ]);
      setItems(fetchedItems);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setType(bizMeta.defaultItemType);
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
    setNewLessonTitle('');
    setConsultationDuration(30);
    setConsultationDays(['MO', 'TU', 'WE', 'TH', 'FR']);
    setConsultationTimeSlots(['10:00', '11:00', '14:00', '15:00', '16:00']);
    setDigitalFileType('pdf');
    setVariants([]);
    setAddons([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setCategoryId(item.categoryId);
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
    setConsultationDuration(item.consultationDuration || 30);
    setConsultationDays(item.consultationDays || ['MO', 'TU', 'WE', 'TH', 'FR']);
    setConsultationTimeSlots(item.consultationTimeSlots || ['10:00', '11:00', '14:00', '15:00', '16:00']);
    setVariants(item.variants || []);
    setAddons(item.addons || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Item name is required');
      return;
    }
    if (price < 0) {
      setFormError('Price must be greater than or equal to 0');
      return;
    }

    if (isDigitalCreator && productType === 'digital_file') {
      if (digitalFileType === 'course' && digitalFiles.length === 0) {
        setFormError('Please upload at least one course lesson or file.');
        return;
      }
      if (digitalFileType !== 'course' && !digitalFileUrl) {
        setFormError('Please upload a digital file before saving.');
        return;
      }
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const amenities = amenitiesInput
        ? amenitiesInput.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const itemPayload: Omit<CatalogItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        slug: editingItem?.slug || generateSlug(name),
        categoryId: categoryId || (categories.length > 0 ? categories[0].id : 'general'),
        type,
        shortDescription: shortDescription.trim() || undefined,
        detailedDescription: detailedDescription.trim() || undefined,
        price: isFree ? 0 : Number(price),
        salePrice: salePrice !== undefined && salePrice > 0 && !isFree ? Number(salePrice) : undefined,
        unit: type === 'product' ? (unit.trim() || undefined) : undefined,
        sku: sku.trim() || undefined,
        images: imageUrls,
        inStock,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        isFeatured,
        isOffer,
        offerText: isOffer ? (offerText.trim() || undefined) : undefined,
        durationMinutes: type === 'service' ? (durationMinutes ? Number(durationMinutes) : undefined) : undefined,
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
        productType: isDigitalCreator ? productType : undefined,
        digitalFileId: productType === 'digital_file' ? (cloudinaryPublicId.trim() || undefined) : undefined,
        digitalFileUrl: productType === 'digital_file' ? (digitalFileUrl.trim() || undefined) : undefined,
        digitalFileType: productType === 'digital_file' ? digitalFileType : undefined,
        fileName: productType === 'digital_file' ? (digitalFileName.trim() || undefined) : undefined,
        fileSize: productType === 'digital_file' ? (digitalFileSize.trim() || undefined) : undefined,
        digitalFiles: productType === 'digital_file' && digitalFileType === 'course' ? digitalFiles : undefined,
        isFree: isDigitalCreator ? isFree : undefined,
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
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
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

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedItemIds.size} items?`)) return;
    setIsBulkProcessing(true);
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
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkToggleVisibility = async (isActive: boolean) => {
    if (selectedItemIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedItemIds) {
        await updateCatalogItem(business.id, id, { isActive });
      }
      setItems(prev => prev.map(i => (selectedItemIds.has(i.id) ? { ...i, isActive } : i)));
      setSelectedItemIds(new Set());
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
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="checkbox"
            checked={selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
          />
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
        </div>
        <select
          value={selectedCategoryFilter}
          onChange={e => setSelectedCategoryFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {selectedItemIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-800">{selectedItemIds.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkToggleVisibility(true)}
              className="px-3 py-1.5 bg-white border border-indigo-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
            >
              Show
            </button>
            <button
              onClick={() => handleBulkToggleVisibility(false)}
              className="px-3 py-1.5 bg-white border border-indigo-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
            >
              Hide
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-red-100 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
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
          {filteredItems.map(item => {
            const isItemFree = item.isFree || item.price === 0;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 relative transition hover:shadow-xs ${
                  !item.isActive ? 'opacity-60 bg-slate-50' : 'border-slate-200'
                }`}
              >
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => handleToggleSelectItem(item.id)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
                <div className="flex items-start justify-between pl-6">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.images?.[0] ? (
                        <SafeImage
                          src={item.images[0]}
                          alt={item.name}
                          fallbackType="product"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{item.name}</h3>
                      <div className="text-sm font-extrabold text-indigo-700">
                        {isItemFree ? (
                          <span className="text-emerald-600 font-extrabold">FREE</span>
                        ) : (
                          `${business.currencySymbol || '₹'}${item.salePrice || item.price}`
                        )}
                      </div>
                      {item.fileSize && (
                        <div className="text-[10px] text-slate-400 font-medium">{item.fileSize}</div>
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
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    {item.productType === 'digital_file' && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                        {item.digitalFileType || 'FILE'}
                      </span>
                    )}
                    {item.productType === 'consultation_slot' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">
                        📅 1:1 Session
                      </span>
                    )}
                    {item.salesCount !== undefined && item.salesCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {item.salesCount} sold
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicate(item)}
                      title="Duplicate"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      title="Delete"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Click Add New Product above to create your first offering.</p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Product Type Tabs */}
              {isDigitalCreator && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                    Product Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setProductType('digital_file')}
                      className={`p-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                        productType === 'digital_file'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Digital Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('consultation_slot')}
                      className={`p-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                        productType === 'consultation_slot'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>1:1 Session / Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('physical')}
                      className={`p-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                        productType === 'physical'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>Physical Item</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Item Type
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  >
                    {bizMeta.supportedItemTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>

                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Product Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Masterclass eBook, Lightroom Preset Pack"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  required
                />
              </div>

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
                  <span className="text-xs font-bold text-slate-800">Pricing</span>
                  {isDigitalCreator && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFree}
                        onChange={e => {
                          setIsFree(e.target.checked);
                          if (e.target.checked) setPrice(0);
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-emerald-700">Free Product</span>
                    </label>
                  )}
                </div>

                {!isFree && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Price ({business.currencySymbol || '₹'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={e => setPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Original / Strike Price (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={salePrice || ''}
                        onChange={e => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 999"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      />
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
              {isDigitalCreator && productType === 'digital_file' && (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Digital Asset Upload
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

                  {/* Single File Upload Box */}
                  {digitalFileType !== 'course' ? (
                    <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Uploaded File</span>
                        {digitalFileUrl && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" /> Ready for Delivery
                          </span>
                        )}
                      </div>

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
                  ) : (
                    /* Course / Multi-file Upload Box */
                    <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Course Files ({digitalFiles.length})
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
                          placeholder="Lesson/Chapter Title (e.g. Chapter 1: Introduction)"
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

              {/* 1:1 Consultation Slot Config */}
              {isDigitalCreator && productType === 'consultation_slot' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase">Consultation Settings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        Call Duration (mins)
                      </label>
                      <input
                        type="number"
                        value={consultationDuration}
                        onChange={e => setConsultationDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        Daily Slots (comma separated)
                      </label>
                      <input
                        value={consultationTimeSlots.join(', ')}
                        onChange={e =>
                          setConsultationTimeSlots(
                            e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          )
                        }
                        placeholder="10:00, 11:30, 15:00"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Item?"
        message="Permanently remove this item and delete associated files?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

