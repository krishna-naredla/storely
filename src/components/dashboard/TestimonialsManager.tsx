import React, { useState, useEffect } from 'react';
import {
  Star,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Upload,
  User,
  Quote,
  Loader2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { BusinessProfile, Testimonial } from '../../types';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
} from '../../services/firebaseService';
import { uploadToCloudinary } from '../../services/cloudinary';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TestimonialsManagerProps {
  business: BusinessProfile;
  onTestimonialsChange?: (testimonials: Testimonial[]) => void;
}

export const TestimonialsManager: React.FC<TestimonialsManagerProps> = ({
  business,
  onTestimonialsChange,
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [clientPhoto, setClientPhoto] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const list = await getTestimonials(business.id);
      setTestimonials(list);
      onTestimonialsChange?.(list);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [business.id]);

  const handleOpenAdd = () => {
    setEditingTestimonial(null);
    setClientName('');
    setClientRole('');
    setClientPhoto('');
    setQuote('');
    setRating(5);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Testimonial) => {
    setEditingTestimonial(t);
    setClientName(t.clientName);
    setClientRole(t.clientRole || '');
    setClientPhoto(t.clientPhoto || '');
    setQuote(t.quote);
    setRating(t.rating || 5);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setClientPhoto(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !quote.trim()) return;
    setIsSaving(true);
    try {
      if (editingTestimonial) {
        await updateTestimonial(business.id, editingTestimonial.id, {
          clientName: clientName.trim(),
          clientRole: clientRole.trim() || undefined,
          clientPhoto: clientPhoto.trim() || undefined,
          quote: quote.trim(),
          rating,
        });
      } else {
        await createTestimonial(business.id, {
          clientName: clientName.trim(),
          clientRole: clientRole.trim() || undefined,
          clientPhoto: clientPhoto.trim() || undefined,
          quote: quote.trim(),
          rating,
          isActive: true,
          order: testimonials.length,
        });
      }
      setIsModalOpen(false);
      await fetchTestimonials();
    } catch (err) {
      console.error('Error saving testimonial:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (t: Testimonial) => {
    try {
      await updateTestimonial(business.id, t.id, { isActive: !t.isActive });
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const newOrder = [...testimonials];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setTestimonials(newOrder);

    const reorderPayload = newOrder.map((t, idx) => ({ id: t.id, order: idx }));
    try {
      await reorderTestimonials(business.id, reorderPayload);
    } catch (err) {
      console.error('Error reordering testimonials:', err);
      fetchTestimonials();
    }
  };

  const handleConfirmDelete = async () => {
    if (!testimonialToDelete) return;
    try {
      await deleteTestimonial(business.id, testimonialToDelete.id);
      setTestimonialToDelete(null);
      await fetchTestimonials();
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200">
        <div>
          <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Client Reviews & Testimonials
          </h3>
          <p className="text-xs text-slate-500">
            Showcase verified client quotes, star ratings, and roles on your public portfolio page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* List / Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Quote className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No client testimonials added yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Adding authentic reviews from past clients or collaborators builds trust and drives more booking inquiries.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Add First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t, index) => (
            <div
              key={t.id}
              className={`p-5 rounded-3xl bg-white border transition-all space-y-3 flex flex-col justify-between ${
                t.isActive ? 'border-slate-200 shadow-2xs' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div className="space-y-2">
                {/* Rating & Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < (t.rating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === testimonials.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        t.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                      }`}
                      title={t.isActive ? 'Visible publicly' : 'Hidden publicly'}
                    >
                      {t.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestimonialToDelete(t)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              {/* Client Info */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                {t.clientPhoto ? (
                  <img
                    src={t.clientPhoto}
                    alt={t.clientName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-black text-[11px] flex items-center justify-center">
                    {t.clientName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">{t.clientName}</div>
                  {t.clientRole && (
                    <div className="text-[10px] text-slate-400">{t.clientRole}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Testimonial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 font-heading">
                {editingTestimonial ? 'Edit Testimonial' : 'Add Client Testimonial'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Reddy or Acme Inc."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client Title / Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Founder at Lumina / Bride"
                  value={clientRole}
                  onChange={(e) => setClientRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client Photo or Logo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {clientPhoto ? (
                    <img
                      src={clientPhoto}
                      alt="Preview"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5">
                    {isUploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{clientPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  {clientPhoto && (
                    <button
                      type="button"
                      onClick={() => setClientPhoto('')}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
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
                      onClick={() => setRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
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
                  Review / Testimonial Quote *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the collaboration outcome, quality of work, or satisfaction..."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Testimonial Dialog */}
      <ConfirmDialog
        isOpen={!!testimonialToDelete}
        title="Delete Testimonial?"
        message={`Are you sure you want to delete the testimonial from "${testimonialToDelete?.clientName}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTestimonialToDelete(null)}
      />
    </div>
  );
};
