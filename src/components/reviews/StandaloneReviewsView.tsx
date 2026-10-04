import React, { useState, useEffect } from 'react';
import {
  Star,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Info,
} from 'lucide-react';
import { BusinessProfile, Review } from '../../types';
import { getReviews, createReview, recordAnalyticsEvent } from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';

interface StandaloneReviewsViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  isOwner?: boolean;
}

export const StandaloneReviewsView: React.FC<StandaloneReviewsViewProps> = ({
  business,
  onBackToDashboard,
  isOwner = false,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await getReviews(business.id);
      // Filter for published or visible reviews only
      const visible = (data || []).filter((r) => r.status === 'published' || !r.status);
      setReviews(visible);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    recordAnalyticsEvent(business.id, 'review_view', { slug: business.slug }).catch(() => {});
    fetchReviews();
  }, [business.id, business.slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please write at least a few words about your experience');
      return;
    }

    try {
      setIsSubmitting(true);
      await createReview(business.id, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        rating,
        comment: comment.trim(),
        isVerifiedPurchase: false,
        status: 'pending',
      });

      recordAnalyticsEvent(business.id, 'review_submitted', {
        customerName: customerName.trim(),
        rating,
      }).catch(() => {});

      setSubmitSuccess(true);
      setCustomerName('');
      setCustomerPhone('');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReviews = reviews.length > 0;
  const averageRating = hasReviews
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const isProfileVerified = Boolean(business.isVerified || (business as any).verified);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Explicit Owner Preview Header */}
      {isOwner && onBackToDashboard && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Creator Owner Preview Mode</span>
            <span className="text-slate-400">• Standalone Client Reviews &amp; Testimonials Page</span>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md font-bold transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Hero Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-50 border-2 border-amber-100 p-1 shrink-0 shadow-sm overflow-hidden flex items-center justify-center">
              <SafeImage
                fallbackType="avatar"
                src={business.logo || business.profileImage || ''}
                alt={business.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-700 fill-amber-600" />
                  Client Reviews &amp; Testimonials
                </span>
                {isProfileVerified && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Creator
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900">
                {business.name}
              </h1>

              <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                {business.tagline || business.description || 'Verified feedback, client ratings, and testimonials from projects, consultations, and masterclasses.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-600 font-semibold">
                {hasReviews ? (
                  <>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span className="text-sm font-extrabold text-slate-900">{averageRating}</span>
                      <span className="text-slate-400">/ 5.0</span>
                    </div>
                    <span>•</span>
                    <span>{reviews.length} Verified Review{reviews.length === 1 ? '' : 's'}</span>
                  </>
                ) : (
                  <span className="text-slate-500">No reviews yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Top Summary & Action Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            {hasReviews ? (
              <>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 font-heading">
                  {averageRating}
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(Number(averageRating))
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Based on {reviews.length} client experience{reviews.length === 1 ? '' : 's'}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <div className="text-base font-bold text-slate-900">No reviews yet</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Be the first client to leave feedback for {business.name}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isFormOpen ? 'Close Review Form' : 'Write a Review'}</span>
          </button>
        </div>

        {/* Submit Review Form (Collapsible) */}
        {isFormOpen && (
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-3xl border-2 border-amber-200 p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Leave a Verified Review for {business.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share your candid feedback on projects, consultations, or sessions.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you! Your review has been submitted and published.</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Your Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (hoverRating ?? rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5
                    ? 'Excellent'
                    : rating === 4
                    ? 'Very Good'
                    : rating === 3
                    ? 'Good'
                    : rating === 2
                    ? 'Fair'
                    : 'Poor'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Review &amp; Feedback *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you work on together? What was the outcome or impact?"
                rows={3}
                className="w-full px-4 py-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-amber-600/20 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
            <p className="text-xs font-semibold">Loading reviews &amp; ratings...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Star className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Reviews Published Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Be the first client or student to share your experience with {business.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Leave First Review</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {rev.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          {rev.customerName}
                        </h4>
                        {rev.isVerifiedPurchase && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* Creator Reply if present */}
                {rev.reply && (
                  <div className="mt-3 pl-4 border-l-2 border-amber-400 bg-amber-50/50 p-3 rounded-r-xl space-y-1">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <span>Response from {business.name}</span>
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rev.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {business.name}. Hosted on Storelly Creator Studio.</p>
      </footer>
    </div>
  );
};
