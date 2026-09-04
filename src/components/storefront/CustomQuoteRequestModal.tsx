import React, { useState } from 'react';
import {
  X,
  FileText,
  User,
  Phone,
  Mail,
  DollarSign,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { BusinessProfile, CustomQuoteRequest } from '../../types';
import { submitCustomQuoteRequest } from '../../services/firebaseService';
import { uploadFileToStorage } from '../../services/firebaseService';

interface CustomQuoteRequestModalProps {
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (req: CustomQuoteRequest) => void;
}

const BUDGET_OPTIONS = [
  'Under ₹2,000',
  '₹2,000 - ₹5,000',
  '₹5,000 - ₹15,000',
  '₹15,000 - ₹30,000',
  '₹30,000+',
  'Flexible / Open to Quote',
];

export const CustomQuoteRequestModal: React.FC<CustomQuoteRequestModalProps> = ({
  business,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [description, setDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState(BUDGET_OPTIONS[1]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success State
  const [submittedRequest, setSubmittedRequest] = useState<CustomQuoteRequest | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (referenceImages.length + newUrls.length >= 4) break; // Limit 4 photos
        const url = await uploadFileToStorage(files[i], 'uploads');
        newUrls.push(url);
      }
      setReferenceImages((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp number');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please describe what you would like to get custom made');
      return;
    }

    try {
      setLoading(true);
      const request = await submitCustomQuoteRequest(business.id, {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        description: description.trim(),
        budgetRange,
        referenceImages,
      });

      setSubmittedRequest(request);
      if (onSuccess) onSuccess(request);
    } catch (err: any) {
      console.error('Failed to submit quote request:', err);
      setErrorMessage(err.message || 'Unable to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppChatUrl = (req: CustomQuoteRequest) => {
    const cleanMerchantPhone = (business.whatsappNumber || business.phone || '').replace(/[^0-9]/g, '');
    const formattedPhone = cleanMerchantPhone.startsWith('91') || cleanMerchantPhone.length > 10 ? cleanMerchantPhone : '91' + cleanMerchantPhone;

    const msg = encodeURIComponent(
      `Hello ${business.name}! I just submitted a custom order inquiry on your store.\n\n` +
      `📌 *Request ID:* ${req.requestNumber}\n` +
      `👤 *Name:* ${req.customerName}\n` +
      `💰 *Budget:* ${req.budgetRange}\n\n` +
      `📝 *Details:* ${req.description.slice(0, 140)}${req.description.length > 140 ? '...' : ''}\n\n` +
      `Looking forward to your quote!`
    );

    return `https://wa.me/${formattedPhone}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submittedRequest ? (
          /* FORM VIEW */
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  Request a Custom Order / Quote
                </h3>
                <p className="text-xs text-slate-500">
                  Tell {business.name} what you have in mind. You'll receive a tailored price quote on WhatsApp.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Your Full Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WhatsApp Number <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address (Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Budget Range</span>
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Project Description & Specifications <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your design, illustration, consulting, or commissioned request in detail (colors, dimensions, deadline, references)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Reference Photos Upload */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Reference Photos / Moodboard (Up to 4 images)</span>
                  {uploadingImage && (
                    <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Uploading image...
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2 flex-wrap">
                  {referenceImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={imgUrl} alt="Ref" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {referenceImages.length < 4 && (
                    <label className="w-16 h-16 rounded-xl border border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 transition cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span className="text-[9px] font-bold mt-1">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Submit Request for Quote</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Zero Obligation • Direct Creator Quotation</span>
              </div>
            </form>
          </div>
        ) : (
          /* CONFIRMATION SCREEN */
          <div className="space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Inquiry Submitted Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Your request has been forwarded directly to <span className="font-bold text-slate-800">{business.name}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-left space-y-2">
              <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
                <span className="text-slate-500">Request Number:</span>
                <span className="font-mono font-bold text-purple-900">{submittedRequest.requestNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Budget:</span>
                <span className="font-bold text-slate-800">{submittedRequest.budgetRange}</span>
              </div>
              <p className="text-[11px] text-purple-800 pt-1">
                The creator will review your specifications and send a tailored price quote & payment link via WhatsApp.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs font-bold">
              <a
                href={buildWhatsAppChatUrl(submittedRequest)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Creator on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
