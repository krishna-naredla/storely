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
import { deleteImageFromStorage } from '../../services/cloudinary';

interface CatalogManagerProps {
  business: BusinessProfile;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ business }) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

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
        price: Number(price),
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
        variants,
        addons,
        isActive: editingItem ? editingItem.isActive : true,
      };

      if (editingItem) {
        // Detect if the existing image was replaced or removed, then clean up the old one to save storage costs
        if (editingItem.images && editingItem.images.length > 0) {
          const oldImageUrl = editingItem.images[0];
          const newImageUrl = imageUrls[0];
          if (oldImageUrl !== newImageUrl) {
            deleteImageFromStorage(oldImageUrl);
          }
        }
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

  const handleToggleActive = async (item: CatalogItem) => {
    try {
      await updateCatalogItem(business.id, item.id, {
        isActive: !item.isActive,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
      );
    } catch (err) {
      console.error('Error toggling item visibility:', err);
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
      // Clean up storage bucket for the product image before deleting the document
      if (itemToDelete.images && itemToDelete.images.length > 0) {
        itemToDelete.images.forEach(img => deleteImageFromStorage(img));
      }
      await deleteCatalogItem(business.id, itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const addVariant = () => {
    if (!newVarName.trim()) return;
    setVariants((prev) => [
      ...prev,
      {
        id: 'var_' + Date.now(),
        name: newVarName.trim(),
        price: Number(newVarPrice) || price,
      },
    ]);
    setNewVarName('');
    setNewVarPrice(price);
  };

  const removeVariant = (varId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== varId));
  };

  const addAddon = () => {
    if (!newAddonName.trim()) return;
    setAddons((prev) => [
      ...prev,
      {
        id: 'add_' + Date.now(),
        name: newAddonName.trim(),
        price: Number(newAddonPrice) || 0,
      },
    ]);
    setNewAddonName('');
    setNewAddonPrice(0);
  };

  const removeAddon = (addId: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== addId));
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            {bizMeta.itemPlural} & Catalog Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, edit, duplicate, manage stock and pricing for your offerings.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New {bizMeta.itemLabel}</span>
        </button>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${bizMeta.itemPlural.toLowerCase()} by name, SKU...`}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">All Categories ({items.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Item List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse p-4 space-y-3">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const image = item.images && item.images.length > 0 ? item.images[0] : '';
            return (
              <SwipeToDelete key={item.id} onDelete={() => setItemToDelete(item)}>
                <div
                  className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 relative shadow-2xs hover:shadow-md ${
                    !item.isActive ? 'opacity-60 border-slate-200' : 'border-slate-200/90 hover:border-emerald-300'
                  }`}
                >
                {/* Top Badge & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {image ? (
                        <img src={image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {cat ? cat.name : 'General'}
                        </span>
                        {item.isFeatured && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                        {item.name}
                      </h3>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-emerald-700">
                          {business.currencySymbol}{item.salePrice || item.price}
                        </span>
                        {item.salePrice && item.salePrice < item.price && (
                          <span className="text-[11px] text-slate-400 line-through">
                            {business.currencySymbol}{item.price}
                          </span>
                        )}
                        {item.unit && (
                          <span className="text-[10px] text-slate-600">/{item.unit}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Visibility Pill */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    title={item.isActive ? 'Active (Click to hide)' : 'Hidden (Click to publish)'}
                    className={`p-1.5 rounded-lg border transition ${
                      item.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Specific Specs Details */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.type === 'service' && item.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.durationMinutes} mins
                      </span>
                    )}
                    {item.stockQuantity !== undefined && (
                      <span className="flex items-center gap-1">
                        <Boxes className="w-3 h-3 text-slate-400" />
                        {item.stockQuantity} in stock
                      </span>
                    )}
                    {item.type === 'room_stay' && item.roomCapacity && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3 text-slate-400" />
                        {item.roomCapacity} Guests
                      </span>
                    )}
                    {item.type === 'rental_vehicle' && item.seatingCapacity && (
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-400" />
                        {item.seatingCapacity} Seats
                      </span>
                    )}
                    {item.type === 'menu_item' && item.spiceLevel && (
                      <span className="flex items-center gap-1 capitalize">
                        🌶️ {item.spiceLevel}
                      </span>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="Duplicate Item"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </SwipeToDelete>
          );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No {bizMeta.itemPlural} Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your first {bizMeta.itemLabel.toLowerCase()} to showcase your offerings to customers.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add {bizMeta.itemLabel}</span>
          </button>
        </div>
      )}

      {/* CREATE / EDIT ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {editingItem ? `Edit ${bizMeta.itemLabel}` : `Add New ${bizMeta.itemLabel}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure details, pricing, photos, and options.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              {/* Item Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Item Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CatalogItemType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="product">Physical Product</option>
                    <option value="service">Service / Appointment</option>
                    <option value="menu_item">Restaurant Menu Item</option>
                    <option value="room">Hotel Room / Stay</option>
                    <option value="vehicle">Vehicle Rental</option>
                    <option value="package">Package / Combo</option>
                    <option value="course">Course / Workshop</option>
                    <option value="property">Property Listing</option>
                    <option value="custom">Custom Offering</option>
                  </select>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {bizMeta.itemLabel} Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Handmade Mango Pickle, Bridal Makeover, Deluxe Sea View Suite"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Pricing & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price ({business.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sale Price ({business.currencySymbol}) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salePrice ?? ''}
                    onChange={(e) =>
                      setSalePrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Discounted price"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit / Basis
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, kg, night, hour, session"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Photos with Cloudinary */}
              <div className="space-y-2">
                <ImageUploadInput
                  label="Item Photo (Cloudinary CDN or Image URL)"
                  value={imageUrls[0] || ''}
                  onChange={(url) => setImageUrls(url ? [url] : [])}
                  aspectRatio="square"
                  helperText="Primary photo displayed across your storefront catalog."
                  onFileSizeChange={(size) => setImageFileSize(size)}
                />
                <ImageSizeWarning fileSize={imageFileSize} />
              </div>

              {/* Short & Detailed Descriptions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Key features, ingredients, or highlights"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* VERTICAL SPECIFIC FIELDS */}
              {/* If Service / Appointment */}
              {type === 'service' && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-purple-600" />
                    Service Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        value={durationMinutes ?? 30}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* If Restaurant Menu Item */}
              {type === 'menu_item' && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                    Food & Menu Specs
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="isVegCheck"
                        checked={isVeg}
                        onChange={(e) => setIsVeg(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <label htmlFor="isVegCheck" className="text-xs font-bold text-amber-900">
                        {isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Prep Time (Mins)
                      </label>
                      <input
                        type="number"
                        value={prepTimeMinutes ?? 20}
                        onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Spice Level
                      </label>
                      <select
                        value={spiceLevel}
                        onChange={(e) => setSpiceLevel(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                      >
                        <option value="mild">Mild 🌿</option>
                        <option value="medium">Medium 🌶️</option>
                        <option value="spicy">Spicy 🔥</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* If Hotel Room */}
              {type === 'room' && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-blue-600" />
                    Room & Stay Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                        Guest Capacity
                      </label>
                      <input
                        type="number"
                        value={roomCapacity ?? 2}
                        onChange={(e) => setRoomCapacity(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                        Bed Type
                      </label>
                      <input
                        type="text"
                        value={bedType}
                        onChange={(e) => setBedType(e.target.value)}
                        placeholder="King Bed, Twin Bed"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                      Amenities (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={amenitiesInput}
                      onChange={(e) => setAmenitiesInput(e.target.value)}
                      placeholder="AC, Free WiFi, Balcony, Swimming Pool"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* If Vehicle Rental */}
              {type === 'vehicle' && (
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                  <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-teal-600" />
                    Vehicle Fleet Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                        Model / Year
                      </label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="e.g. 2024 Automatic"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-teal-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-teal-200 rounded-lg"
                      >
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric (EV)</option>
                        <option value="cng">CNG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                        Transmission
                      </label>
                      <select
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-teal-200 rounded-lg"
                      >
                        <option value="manual">Manual</option>
                        <option value="automatic">Automatic</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Variants / Options (e.g. 500g, 1kg or Size L)
                  </h4>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="Variant name (e.g. 500g Pack, Large)"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="number"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(Number(e.target.value))}
                    placeholder="Price"
                    className="w-24 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg"
                  >
                    Add
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-2 shadow-2xs"
                      >
                        <span className="font-semibold text-slate-800">{v.name}</span>
                        <span className="text-emerald-700 font-bold">
                          {business.currencySymbol}{v.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVariant(v.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles: Featured & In Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">In Stock / Available</div>
                    <div className="text-[10px] text-slate-500">Allow customers to order</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Featured Offering</div>
                    <div className="text-[10px] text-slate-500">Show on storefront top banner</div>
                  </div>
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : `Create ${bizMeta.itemLabel}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={`Delete ${itemToDelete?.name}?`}
        message="This will permanently delete this catalog item from your store. Customers will no longer be able to view or order it."
        confirmText="Delete Item"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
