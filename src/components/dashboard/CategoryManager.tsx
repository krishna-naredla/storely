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
} from 'lucide-react';
import { BusinessProfile, Category } from '../../types';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  generateSlug,
} from '../../services/firebaseService';
import { BUSINESS_TYPES } from '../../services/businessConfig';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { ImageSizeWarning } from '../common/ImageSizeWarning';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CategoryManagerProps {
  business: BusinessProfile;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ business }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catImageFileSize, setCatImageFileSize] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getCategories(business.id);
      setCategories(data);
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
    setCatImage('');
    setCatImageFileSize(undefined);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
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

      if (editingCat) {
        await updateCategory(business.id, editingCat.id, {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
          image: catImage.trim() || undefined,
        });
      } else {
        await createCategory(business.id, {
          name: catName.trim(),
          slug: generateSlug(catName),
          description: catDesc.trim() || undefined,
          image: catImage.trim() || undefined,
          sortOrder: categories.length,
          isActive: true,
        });
      }

      setIsModalOpen(false);
      await loadData();
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
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      console.error('Error toggling category:', err);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const [moved] = newCats.splice(index, 1);
    newCats.splice(targetIndex, 0, moved);

    setCategories(newCats);

    // Persist new sortOrder
    try {
      await Promise.all(
        newCats.map((c, i) =>
          updateCategory(business.id, c.id, { sortOrder: i })
        )
      );
    } catch (err) {
      console.error('Error saving reordered categories:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    try {
      setIsDeleting(true);
      await deleteCategory(business.id, catToDelete.id);
      setCatToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setIsDeleting(false);
    }
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
            Organize your {bizMeta.itemPlural.toLowerCase()} into custom browsable sections.
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

      {/* Suggested Categories Quick Chips (if empty or vendor wants inspiration) */}
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
                  await createCategory(business.id, {
                    name: sug,
                    slug: generateSlug(sug),
                    sortOrder: categories.length,
                    isActive: true,
                  });
                  await loadData();
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
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`p-4 flex items-center justify-between transition-colors ${
                !cat.isActive ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveOrder(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                    title="Move up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === categories.length - 1}
                    onClick={() => handleMoveOrder(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                    title="Move down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{cat.name}</h3>
                    {!cat.isActive && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                        Hidden
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleActive(cat)}
                  className={`p-2 rounded-xl border transition ${
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
                  className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCatToDelete(cat)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
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
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
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
                  <span>{editingCat ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!catToDelete}
        title={`Delete Category "${catToDelete?.name}"?`}
        message="Items in this category will not be deleted, but they will become uncategorized."
        confirmText="Delete Category"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
};
