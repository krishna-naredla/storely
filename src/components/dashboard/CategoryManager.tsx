import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layers,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Check,
  X,
  Loader2,
  FolderOpen,
  Palette,
  GripVertical,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile, Category, CatalogItem } from '../../types';
import {
  getCategories,
  getCatalogItems,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  generateSlug,
} from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { ImageSizeWarning } from '../common/ImageSizeWarning';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { CATEGORY_COLOR_PALETTE, getCategoryColorConfig } from './CatalogManager';

interface CategoryManagerProps {
  business: BusinessProfile;
  onCategoriesUpdated?: (categories: Category[]) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ business, onCategoriesUpdated }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('indigo');
  const [catImage, setCatImage] = useState('');
  const [catImageFileSize, setCatImageFileSize] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete State
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag-and-drop / Reorder state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cats, catalogItems] = await Promise.all([
        getCategories(business.id),
        getCatalogItems(business.id),
      ]);
      setCategories(cats);
      setItems(catalogItems);
      if (onCategoriesUpdated) {
        onCategoriesUpdated(cats);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const openCreateModal = () => {
    setEditingCat(null);
    setCatName('');
    setCatDesc('');
    setCatColor('indigo');
    setCatImage('');
    setCatImageFileSize(undefined);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatColor(cat.color || 'indigo');
    setCatImage(cat.image || '');
    setCatImageFileSize(undefined);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let updatedCats: Category[] = [];

      if (editingCat) {
        await updateCategory(business.id, editingCat.id, {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
          color: catColor,
          image: catImage.trim() || undefined,
        });
        updatedCats = categories.map((c) =>
          c.id === editingCat.id
            ? {
                ...c,
                name: catName.trim(),
                description: catDesc.trim() || undefined,
                color: catColor,
                image: catImage.trim() || undefined,
              }
            : c
        );
        setCategories(updatedCats);
        setSuccessMsg(`Category "${catName.trim()}" updated successfully!`);
      } else {
        const newCat = await createCategory(business.id, {
          name: catName.trim(),
          slug: generateSlug(catName),
          description: catDesc.trim() || undefined,
          color: catColor,
          image: catImage.trim() || undefined,
          sortOrder: categories.length,
          isActive: true,
        });
        updatedCats = [...categories, newCat];
        setCategories(updatedCats);
        setSuccessMsg(`Category "${catName.trim()}" created successfully!`);
      }

      if (onCategoriesUpdated) {
        onCategoriesUpdated(updatedCats);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(business.id, cat.id, {
        isActive: !cat.isActive,
      });
      const updated = categories.map((c) =>
        c.id === cat.id ? { ...c, isActive: !c.isActive } : c
      );
      setCategories(updated);
      if (onCategoriesUpdated) {
        onCategoriesUpdated(updated);
      }
    } catch (err) {
      console.error('Error toggling category:', err);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length || isReordering) return;

    const newCats = [...categories];
    const [moved] = newCats.splice(index, 1);
    newCats.splice(targetIndex, 0, moved);

    setCategories(newCats);
    if (onCategoriesUpdated) {
      onCategoriesUpdated(newCats);
    }

    // Persist new sortOrder
    try {
      setIsReordering(true);
      await reorderCategories(
        business.id,
        newCats.map((c) => c.id)
      );
    } catch (err) {
      console.error('Error saving reordered categories:', err);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newCats = [...categories];
    const [moved] = newCats.splice(draggedIndex, 1);
    newCats.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    setCategories(newCats);

    if (onCategoriesUpdated) {
      onCategoriesUpdated(newCats);
    }

    try {
      setIsReordering(true);
      await reorderCategories(
        business.id,
        newCats.map((c) => c.id)
      );
    } catch (err) {
      console.warn('Reorder drag drop note:', err);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    try {
      setIsDeleting(true);
      await deleteCategory(business.id, catToDelete.id);
      const remaining = categories.filter((c) => c.id !== catToDelete.id);
      setCategories(remaining);
      if (onCategoriesUpdated) {
        onCategoriesUpdated(remaining);
      }
      setCatToDelete(null);
      setSuccessMsg('Category deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Count items assigned to each category
  const getItemCountForCategory = (catId: string, catName: string) => {
    return items.filter(
      (item) =>
        item.categoryId === catId ||
        item.categoryId?.toLowerCase() === catName.toLowerCase()
    ).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Store Categories & Sections
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize your {bizMeta.itemPlural.toLowerCase()} into custom color-coded browsable sections.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Suggested Categories Quick Chips */}
      {bizMeta.suggestedCategories && (
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            Quick Ideas for {bizMeta.label}:
          </span>
          {bizMeta.suggestedCategories.map((sug) => {
            const alreadyAdded = categories.some(
              (c) => c.name.toLowerCase() === sug.toLowerCase()
            );
            return (
              <button
                key={sug}
                type="button"
                disabled={alreadyAdded}
                onClick={async () => {
                  const newCat = await createCategory(business.id, {
                    name: sug,
                    slug: generateSlug(sug),
                    color: 'emerald',
                    sortOrder: categories.length,
                    isActive: true,
                  });
                  const updated = [...categories, newCat];
                  setCategories(updated);
                  if (onCategoriesUpdated) onCategoriesUpdated(updated);
                  setSuccessMsg(`Added category "${sug}"`);
                  setTimeout(() => setSuccessMsg(null), 3000);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  alreadyAdded
                    ? 'bg-emerald-100/50 text-emerald-600 cursor-default opacity-60'
                    : 'bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 shadow-2xs cursor-pointer'
                }`}
              >
                + {sug}
              </button>
            );
          })}
        </div>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {categories.map((cat, idx) => {
            const colorCfg = getCategoryColorConfig(cat.color);
            const itemCount = getItemCountForCategory(cat.id, cat.name);
            const isDragging = draggedIndex === idx;

            return (
              <div
                key={cat.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                className={`p-4 flex items-center justify-between transition-colors ${
                  isDragging ? 'opacity-40 bg-slate-100' : !cat.isActive ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Drag Handle & Reorder Buttons */}
                  <div className="flex items-center gap-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0 || isReordering}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1 || isReordering}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${colorCfg.dot}`} />
                        <span>{cat.name}</span>
                      </span>

                      <span className="text-[11px] font-medium text-slate-500">
                        ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                      </span>

                      {!cat.isActive && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          Hidden
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{cat.description}</p>
                    )}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      cat.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title={cat.isActive ? 'Hide on Storefront' : 'Publish on Storefront'}
                  >
                    {cat.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatToDelete(cat)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Categories Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create categories to group your offerings on the public storefront.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Category</span>
          </button>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCat ? 'Edit Category' : 'New Custom Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Pickles & Chutneys, Starters, Hair Care"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Category Color Palette Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Category Color Badge</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORY_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCatColor(c.id)}
                      className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        catColor === c.id
                          ? `${c.bg} ${c.text} ${c.border} ring-2 ring-emerald-500 shadow-xs font-extrabold`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief note about this section..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <ImageUploadInput
                  label="Category Banner / Photo"
                  value={catImage}
                  onChange={setCatImage}
                  aspectRatio="banner"
                  helperText="Optional banner displayed for this category."
                  onFileSizeChange={setCatImageFileSize}
                />
                <ImageSizeWarning fileSize={catImageFileSize} />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCat ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmActionModal
        isOpen={!!catToDelete}
        title={`Delete Category "${catToDelete?.name}"?`}
        message="Items in this category will not be deleted, but they will become uncategorized until reassigned."
        confirmText="Delete Category"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
};
