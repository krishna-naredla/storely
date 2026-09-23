import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  X,
  User,
  Plus,
  CornerDownRight,
  QrCode,
} from 'lucide-react';
import { BusinessProfile, Review } from '../../types';
import { getReviews, replyToReview, updateReviewStatus, getModuleDeepUrl } from '../../services/firebaseService';
import { ModuleQrModal } from '../common/ModuleQrModal';
import { isCreatorProfile } from '../../utils/profileHelper';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface ReviewsManagerProps {
  business: BusinessProfile;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({ business }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Manual Review Form
  const [manualName, setManualName] = useState('');
  const [manualComment, setManualComment] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [isSavingManual, setIsSavingManual] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getReviews(business.id);
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      setIsSubmittingReply(true);
      await replyToReview(business.id, reviewId, replyText.trim());
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, reply: replyText.trim(), replyAt: Date.now() } : r
        )
      );
      setReplyingReviewId(null);
      setReplyText('');
    } catch (err) {
      console.error('Error replying to review:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualComment.trim()) return;
    try {
      setIsSavingManual(true);
      const { createReview } = await import('../../services/firebaseService');
      await createReview(business.id, {
        customerName: manualName.trim(),
        rating: manualRating,
        comment: manualComment.trim(),
        status: 'published',
        isVerifiedPurchase: false,
      });
      setIsAddModalOpen(false);
      setManualName('');
      setManualComment('');
      setManualRating(5);
      await loadData();
    } catch (err) {
      console.error('Error adding manual review:', err);
    } finally {
      setIsSavingManual(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  const toggleReviewVisibility = async (review: Review) => {
    try {
      const newStatus = review.status === 'published' ? 'hidden' : 'published';
      await updateReviewStatus(business.id, review.id, newStatus);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Error toggling review visibility:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Rating Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            {isCreatorProfile(business) ? 'Client Testimonials' : 'Customer Reviews & Ratings'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isCreatorProfile(business) 
              ? 'Manage feedback from your clients. You can choose which testimonials to display publicly.'
              : 'View real feedback submitted by customers on your public storefront and reply publicly.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="Generate and download QR code to collect client reviews"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            <span>Reviews QR</span>
          </button>

          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-5 h-5 fill-amber-400" />
              <span className="font-heading font-extrabold text-lg text-slate-900">{avgRating}</span>
            </div>
            <span className="text-xs text-slate-400">({reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {rev.customerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rev.customerName}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReviewVisibility(rev)}
                    className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-[10px] font-bold ${
                      rev.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                    }`}
                  >
                    {rev.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{rev.status === 'published' ? 'Live on Profile' : 'Hidden'}</span>
                  </button>
                  
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <p className="text-xs text-slate-700 leading-relaxed pl-12">{rev.comment}</p>

              {/* Vendor Reply if exists */}
              {rev.reply && (
                <div className="ml-12 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Response from {business.name}:</span>
                  </div>
                  <p className="pl-5 text-slate-700">{rev.reply}</p>
                </div>
              )}

              {/* Reply Form / Button */}
              {!rev.reply && replyingReviewId !== rev.id && (
                <div className="pl-12 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingReviewId(rev.id);
                      setReplyText('');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply to Customer</span>
                  </button>
                </div>
              )}

              {replyingReviewId === rev.id && (
                <div className="ml-12 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a polite public response..."
                    rows={2}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingReviewId(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingReply || !replyText.trim()}
                      onClick={() => handleSendReply(rev.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                    >
                      {isSubmittingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Post Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Reviews Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Customers can leave ratings and comments directly on your public storefront.
          </p>
        </div>
      )}

      {/* Reviews QR Code Modal */}
      {isQrModalOpen && (
        <ModuleQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title="Customer Reviews & Feedback QR"
          subtitle={`Let clients scan and read verified testimonials or leave a 5-star review directly on ${business.name}.`}
          badge="Reviews & Feedback"
          url={getModuleDeepUrl(business, 'reviews')}
          businessName={business.name}
          logoUrl={business.logo || business.profileImage}
          accentColor="amber"
        />
      )}

      {/* Add Manual Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 font-heading">
                Add Client Testimonial / Review
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManual} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setManualRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= manualRating
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
                  Feedback / Quote *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste the feedback or testimonial here..."
                  value={manualComment}
                  onChange={(e) => setManualComment(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingManual && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
