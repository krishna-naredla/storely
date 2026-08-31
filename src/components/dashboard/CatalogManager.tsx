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
} from 'lucide-react';
import { BusinessProfile, CatalogItem, Category, CatalogItemType, CatalogItemVariant, CatalogItemAddon } from '../../types';
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
import { deleteImageFromStorage, uploadToCloudinary } from '../../services/cloudinary';

interface CatalogManagerProps {
  business: BusinessProfile;
}

export const CatalogManager: React.FC<any> = ({ business }) => {
  const { t } = useLanguage();
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
  const [imageFileSize, setImageFileSize] = useState<number | undefined>(undefined);
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
    setProductType(business.modules?.digital_products ? 'digital_file' : 'physical');
    setIsFree(false);
    setCloudinaryPublicId('');
    setConsultationDuration(30);
    setConsultationDays(['MO', 'TU', 'WE', 'TH', 'FR']);
    setConsultationTimeSlots(['10:00', '11:00', '14:00', '15:00', '16:00']);
    setDigitalFileType('pdf');
    setDigitalFileUrl('');
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
    setProductType(item.productType || (business.modules?.digital_products ? 'digital_file' : 'physical'));
    setIsFree(item.price === 0);
    setCloudinaryPublicId(item.digitalFileId || '');
    setDigitalFileType(item.digitalFileType || 'pdf');
    setDigitalFileUrl(item.digitalFileUrl || '');
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
    
    if (business.modules?.digital_products && productType === 'digital_file' && !digitalFileUrl) {
      setFormError('Please upload a digital file before saving.');
      return;
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
        salePrice: salePrice !== undefined && salePrice > 0 ? Number(salePrice) : undefined,
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
        productType: business.modules?.digital_products ? productType : undefined,
        digitalFileId: productType === 'digital_file' ? (cloudinaryPublicId.trim() || undefined) : undefined,
        digitalFileUrl: productType === 'digital_file' ? (digitalFileUrl.trim() || undefined) : undefined,
        digitalFileType: productType === 'digital_file' ? digitalFileType : undefined,
        isFree: business.modules?.digital_products ? isFree : undefined,
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
      const url = await uploadToCloudinary(file, (p) => setUploadProgress(p));
      setDigitalFileUrl(url);
      const parts = url.split('/');
      const publicId = parts[parts.length - 1].split('.')[0];
      setCloudinaryPublicId(publicId);
      setIsUploadingFile(false);
    } catch (err: any) {
      setFormError(err.message || 'File upload failed');
      setIsUploadingFile(false);
    }
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
      setItems(prev => prev.map(i => selectedItemIds.has(i.id) ? { ...i, isActive } : i));
      setSelectedItemIds(new Set());
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    try {
      await updateCatalogItem(business.id, item.id, { isActive: !item.isActive });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !item.isActive } : i));
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
      await deleteCatalogItem(business.id, itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  const addVariant = () => {
    if (!newVarName.trim()) return;
    setVariants(prev => [...prev, { id: 'var_' + Date.now(), name: newVarName.trim(), price: newVarPrice || price }]);
    setNewVarName('');
    setNewVarPrice(price);
  };

  const removeVariant = (id: string) => setVariants(prev => prev.filter(v => v.id !== id));

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || i.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{bizMeta.itemPlural}</h2>
          <p className="text-xs text-slate-500">Manage your store offerings.</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input type="checkbox" checked={selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length} onChange={handleToggleSelectAll} className="w-4 h-4 text-emerald-600" />
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl" />
          </div>
        </div>
        <select value={selectedCategoryFilter} onChange={e => setSelectedCategoryFilter(e.target.value)} className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl">
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {selectedItemIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-800">{selectedItemIds.size} selected</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkToggleVisibility(true)} className="px-3 py-1.5 bg-white border border-indigo-200 text-xs font-bold rounded-lg">Show</button>
            <button onClick={() => handleBulkToggleVisibility(false)} className="px-3 py-1.5 bg-white border border-indigo-200 text-xs font-bold rounded-lg">Hide</button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 relative ${!item.isActive ? 'opacity-60' : 'border-slate-200'}`}>
              <div className="absolute top-3 left-3"><input type="checkbox" checked={selectedItemIds.has(item.id)} onChange={() => handleToggleSelectItem(item.id)} className="w-4 h-4 text-emerald-600" /></div>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {item.images?.[0] ? <SafeImage src={item.images[0]} alt={item.name} fallbackType="product" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-300" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900">{item.name}</h3>
                    <div className="text-sm font-extrabold text-emerald-700">{business.currencySymbol}{item.salePrice || item.price}</div>
                  </div>
                </div>
                <button onClick={() => handleToggleActive(item)} className={`p-1.5 rounded-lg border ${item.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <div className="text-[11px] text-slate-500">
                  {item.productType === 'digital_file' && '📁 Digital'}
                  {item.productType === 'consultation_slot' && '📅 Consultation'}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleDuplicate(item)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEditModal(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setItemToDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">No items found.</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-900">{editingItem ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-xl" required>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 text-xs border rounded-xl">
                    <option value="product">{business.modules?.digital_products ? 'Product / Digital' : 'Physical Product'}</option>
                    <option value="service">Service</option>
                    <option value="menu_item">Menu Item</option>
                    <option value="room">Room</option>
                    <option value="vehicle">Vehicle</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Item Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Price</label>
                  <input type="number" value={isFree ? 0 : price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-3 py-2 text-xs border rounded-xl" required />
                </div>
                {productType !== 'digital_file' && productType !== 'consultation_slot' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unit</label>
                    <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-xl" />
                  </div>
                )}
              </div>
              <ImageUploadInput label="Item Photo" value={imageUrls[0] || ''} onChange={url => setImageUrls(url ? [url] : [])} aspectRatio="square" />
              
              {business.modules?.digital_products && (
                <div className="p-4 bg-indigo-50 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-indigo-900">Digital Creator Options</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['physical', 'digital_file', 'consultation_slot'].map(pt => (
                      <button key={pt} type="button" onClick={() => setProductType(pt as any)} className={`p-2 rounded-xl text-[10px] font-bold border ${productType === pt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-100'}`}>
                        {pt === 'digital_file' ? '📁 File' : pt === 'consultation_slot' ? '📅 1:1' : '📦 Physical'}
                      </button>
                    ))}
                  </div>
                  {productType === 'digital_file' && (
                    <div className="space-y-3">
                       <select value={digitalFileType} onChange={e => setDigitalFileType(e.target.value as any)} className="w-full px-3 py-1.5 text-xs border rounded-lg">
                          <option value="pdf">PDF</option>
                          <option value="zip">ZIP</option>
                          <option value="video">Video</option>
                          <option value="audio">Audio</option>
                       </select>
                       <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isFree} onChange={e => { setIsFree(e.target.checked); if(e.target.checked) setPrice(0); }} id="isFree" />
                          <label htmlFor="isFree" className="text-xs font-bold">Free Download</label>
                       </div>
                       <input type="file" onChange={handleDigitalFileUpload} className="w-full text-[10px]" />
                       {isUploadingFile && <div className="text-[10px] font-bold text-indigo-700">Uploading {uploadProgress}%...</div>}
                       {digitalFileUrl && <div className="text-[10px] text-emerald-700">✓ Uploaded</div>}
                    </div>
                  )}
                  {productType === 'consultation_slot' && (
                    <div className="space-y-3">
                       <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold mb-1">Duration (min)</label>
                            <input type="number" value={consultationDuration} onChange={e => setConsultationDuration(Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded-lg" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">Slots (comma sep)</label>
                            <input value={consultationTimeSlots.join(',')} onChange={e => setConsultationTimeSlots(e.target.value.split(','))} className="w-full px-2 py-1 text-xs border rounded-lg" placeholder="10:00,11:00" />
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Item?"
        message="Permanently remove this item?"
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
