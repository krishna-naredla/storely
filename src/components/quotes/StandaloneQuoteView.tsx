import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Phone,
  Mail,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Upload,
  Info,
} from 'lucide-react';
import { BusinessProfile, CustomQuoteRequest } from '../../types';
import { submitCustomQuoteRequest, recordAnalyticsEvent } from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';

interface StandaloneQuoteViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  isOwner?: boolean;
}

const BUDGET_RANGES = [
  'Under ₹5,000',
  '₹5,000 - ₹15,000',
  '₹15,000 - ₹30,000',
  '₹30,000 - ₹60,000',
  '₹60,000 - ₹1,00,000',
  '₹1,00,000+',
  'Flexible / Open to Quote',
];

export const StandaloneQuoteView: React.FC<StandaloneQuoteViewProps> = ({
  business,
  onBackToDashboard,
  isOwner = false,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [description, setDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [referenceUrl, setReferenceUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedQuote, setSubmittedQuote] = useState<CustomQuoteRequest | null>(null);

  const [deadline, setDeadline] = useState('');

  const isProfileVerified = Boolean(business.isVerified || (business as any).verified);

  useEffect(() => {
    recordAnalyticsEvent(business.id, 'quote_view', { slug: business.slug }).catch(() => {});
  }, [business.id, business.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit WhatsApp or phone number');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setError('Please provide a clear description of your project requirements (min 15 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      const req = await submitCustomQuoteRequest(business.id, {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        description: deadline ? `${description.trim()}\n\nTarget Deadline: ${deadline}` : description.trim(),
        budgetRange,
        referenceImages: referenceUrl.trim() ? [referenceUrl.trim()] : [],
      });

      setSubmittedQuote(req);
      recordAnalyticsEvent(business.id, 'quote_request', {
        requestId: req.id,
        customerName: customerName.trim(),
        budgetRange,
      }).catch(() => {});
    } catch (err: any) {
      console.error('Error submitting quote request:', err);
      setError(err?.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappNumber = (business.whatsapp || business.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Explicit Owner Preview Header */}
      {isOwner && onBackToDashboard && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Creator Owner Preview Mode</span>
            <span className="text-slate-400">• Standalone Custom Project Quotes Page</span>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
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
                  <FileText className="w-3 h-3 text-amber-700" />
                  Custom Project Quotes
                </span>
                {isProfileVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Creator
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900">
                {business.name}
              </h1>

              <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                {business.tagline || business.description || 'Submit your project requirements, scope, and timeline to receive a personalized proposal and quote estimate.'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {submittedQuote ? (
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-10 shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Inquiry Received
              </span>
              <h2 className="text-2xl font-black font-heading text-slate-900">
                Quote Request Sent!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Thank you, <strong>{submittedQuote.customerName}</strong>! {business.name} has received your brief and will review your specifications shortly.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Estimated Budget:</span>
                <span className="font-bold text-slate-900">{submittedQuote.budgetRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-bold text-slate-900">{submittedQuote.customerPhone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hi ${business.name}, I just submitted a custom project quote request for budget range ${submittedQuote.budgetRange}. My name is ${submittedQuote.customerName}. Looking forward to connecting!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Notify {business.name} on WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setSubmittedQuote(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Request a Custom Quote
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tell us about your project goals, deliverables, budget, and timeline.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

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
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp / Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Budget Range *
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
              >
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project Scope &amp; Deliverables *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want built, designed, or created. Include details such as timeline, goals, and any specific requirements..."
                rows={4}
                className="w-full px-4 py-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Deadline / Timeline (Optional)
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. 2 weeks, by end of month, or ASAP"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reference Link / Figma / Doc (Optional)
              </label>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://figma.com/... or https://drive.google.com/..."
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Project Brief...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Submit Custom Quote Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {business.name}. Hosted on Storelly Creator Studio.</p>
      </footer>
    </div>
  );
};
