import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  HelpCircle,
  Copy,
  Check,
  Building2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { updateBusinessProfile } from '../../services/firebaseService';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { usePaymentValidation } from '../../hooks/usePaymentValidation';

interface StorePaymentsManagerProps {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
}

export const StorePaymentsManager: React.FC<StorePaymentsManagerProps> = ({
  business,
  onBusinessUpdated,
}) => {
  // UPI & Online Payment Local Form State
  const [upiId, setUpiId] = useState(business.upiId || '');
  const [upiQrImage, setUpiQrImage] = useState(business.upiQrImage || '');
  const [enableOnlinePayment, setEnableOnlinePayment] = useState(
    business.enableOnlinePayment ?? true
  );
  const [enableCod, setEnableCod] = useState(business.enableCod ?? true);
  const [enableBankTransfer, setEnableBankTransfer] = useState(
    business.enableBankTransfer ?? false
  );

  // Bank Details State
  const [accountNumber, setAccountNumber] = useState(
    business.bankDetails?.accountNumber || ''
  );
  const [ifscCode, setIfscCode] = useState(
    business.bankDetails?.ifscCode || ''
  );
  const [accountHolderName, setAccountHolderName] = useState(
    business.bankDetails?.accountHolderName || ''
  );
  const [bankName, setBankName] = useState(
    business.bankDetails?.bankName || ''
  );
  const [branchName, setBranchName] = useState(
    business.bankDetails?.branchName || ''
  );

  // Notes
  const [paymentInstructions, setPaymentInstructions] = useState(
    business.paymentInstructions || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Reset form when tenant business changes to prevent cross-business leakage
  useEffect(() => {
    setUpiId(business.upiId || '');
    setUpiQrImage(business.upiQrImage || '');
    setEnableOnlinePayment(business.enableOnlinePayment ?? true);
    setEnableCod(business.enableCod ?? true);
    setEnableBankTransfer(business.enableBankTransfer ?? false);
    setAccountNumber(business.bankDetails?.accountNumber || '');
    setIfscCode(business.bankDetails?.ifscCode || '');
    setAccountHolderName(business.bankDetails?.accountHolderName || '');
    setBankName(business.bankDetails?.bankName || '');
    setBranchName(business.bankDetails?.branchName || '');
    setPaymentInstructions(business.paymentInstructions || '');
    setTouchedFields({});
    setError(null);
  }, [business.id]);

  const formState = {
    upiId,
    upiQrImage,
    enableOnlinePayment,
    enableCod,
    enableBankTransfer,
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    paymentInstructions,
  };

  // Unified Validation Hook strictly scoped to business context
  const { errors, warnings, isValid, getSanitizedPayload } = usePaymentValidation(
    formState,
    business
  );

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched
    setTouchedFields({
      upiId: true,
      accountHolderName: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
    });

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      setError(firstError || 'Please fix validation errors before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Sanitize payload strictly for current business.id
      const payload = getSanitizedPayload(business.id);

      await updateBusinessProfile(business.id, payload);
      onBusinessUpdated({
        ...business,
        ...payload,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save payment settings to Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  const sampleDeepLink = upiId.trim()
    ? `upi://pay?pa=${encodeURIComponent(
        upiId.trim()
      )}&pn=${encodeURIComponent(business.name)}&am=500&cu=INR&tn=${encodeURIComponent(
        'StoreOrderPayment'
      )}`
    : '';

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Direct Merchant Settlements • Scoped to {business.name}
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
            Payment Gateways &amp; UPI Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Configure how customers pay for orders, bookings, and digital assets on <strong>{business.name}</strong>. All payment routes are isolated to your business account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-semibold text-slate-200">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tenant ID: <span className="font-mono text-[11px] text-emerald-300">{business.id.slice(0, 8)}...</span></span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment methods &amp; UPI settings successfully saved for {business.name}!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{warnings[0]}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* UPI Settings Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">UPI Instant Payment Details</h3>
                <p className="text-xs text-slate-500">Connected to GPay, PhonePe, Paytm, and BHIM checkout</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Store UPI ID (VPA) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() => handleBlur('upiId')}
                    placeholder="e.g. yourstore@okhdfcbank or 9876543210@paytm"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:bg-white focus:outline-hidden transition ${
                      touchedFields.upiId && errors.upiId
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  {upiId && (
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                {touchedFields.upiId && errors.upiId ? (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errors.upiId}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Your customers can tap to pay directly via GPay / PhonePe / Paytm on mobile.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom UPI QR Image (Optional)
                </label>
                <ImageUploadInput
                  value={upiQrImage}
                  onChange={(url) => setUpiQrImage(url)}
                  label="Upload Printed Standee QR / Soundbox QR Code"
                  placeholder="Paste direct image URL or upload your store QR code"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If uploaded, this custom QR code replaces the generated vector QR on customer checkout.
                </p>
              </div>
            </div>

            {/* Payment Acceptance Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Modes Available in Checkout
              </span>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={enableOnlinePayment}
                  onChange={(e) => setEnableOnlinePayment(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 text-sm">Online UPI Instant Payment</span>
                  <p className="text-xs text-slate-500">Allow customers to pay via UPI QR and deep link buttons during checkout.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={enableCod}
                  onChange={(e) => setEnableCod(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 text-sm">Cash on Delivery (COD) / Pay on Delivery</span>
                  <p className="text-xs text-slate-500">Allow customers to place orders with cash or physical UPI payment upon arrival.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={enableBankTransfer}
                  onChange={(e) => setEnableBankTransfer(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 text-sm">Direct Bank Transfer (NEFT / IMPS)</span>
                  <p className="text-xs text-slate-500">Display your bank account details for high-value orders or bespoke invoices.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Bank Account Details (Conditional) */}
          {enableBankTransfer && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Bank Account Information</h3>
                  <p className="text-xs text-slate-500">Shared with customers when selecting Bank Transfer</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Holder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    onBlur={() => handleBlur('accountHolderName')}
                    placeholder="e.g. John Doe / Business Corp"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:bg-white focus:outline-hidden ${
                      touchedFields.accountHolderName && errors.accountHolderName
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {touchedFields.accountHolderName && errors.accountHolderName && (
                    <p className="text-xs text-rose-600 mt-1">{errors.accountHolderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    onBlur={() => handleBlur('bankName')}
                    placeholder="e.g. State Bank of India, HDFC Bank"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:bg-white focus:outline-hidden ${
                      touchedFields.bankName && errors.bankName
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {touchedFields.bankName && errors.bankName && (
                    <p className="text-xs text-rose-600 mt-1">{errors.bankName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    onBlur={() => handleBlur('accountNumber')}
                    placeholder="e.g. 123456789012"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm focus:ring-2 focus:bg-white focus:outline-hidden ${
                      touchedFields.accountNumber && errors.accountNumber
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {touchedFields.accountNumber && errors.accountNumber && (
                    <p className="text-xs text-rose-600 mt-1">{errors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('ifscCode')}
                    placeholder="e.g. SBIN0001234"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm uppercase focus:ring-2 focus:bg-white focus:outline-hidden ${
                      touchedFields.ifscCode && errors.ifscCode
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {touchedFields.ifscCode && errors.ifscCode && (
                    <p className="text-xs text-rose-600 mt-1">{errors.ifscCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Notes Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer Payment Instructions / Policies (Optional)
            </label>
            <textarea
              rows={3}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="e.g. Please share transaction screenshot on WhatsApp after UPI payment for faster dispatch."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Payment Settings</span>
              </>
            )}
          </button>
        </div>

        {/* Live Preview Column */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Live Storefront Preview
              </span>
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h4 className="font-bold text-lg text-white">Live Storefront QR</h4>
              <p className="text-xs text-slate-400 mt-0.5">How customers see payment on {business.name}:</p>
            </div>

            <div className="bg-white p-4 rounded-2xl text-center space-y-3 shadow-inner">
              <div className="flex justify-center">
                {upiQrImage ? (
                  <img
                    src={upiQrImage}
                    alt="Custom UPI QR"
                    className="w-36 h-36 rounded-xl object-contain border p-1 bg-white mx-auto shadow-xs"
                  />
                ) : upiId.trim() ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      sampleDeepLink
                    )}`}
                    alt="UPI QR Code"
                    className="w-36 h-36 rounded-xl border p-1 bg-white mx-auto shadow-xs"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 mx-auto p-2">
                    <QrCode className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
                    <span className="text-[10px] text-center font-semibold">Enter UPI ID to generate QR</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 py-1.5 px-2 rounded-lg truncate">
                {upiId.trim() || 'No UPI ID Configured'}
              </div>

              {upiId.trim() && (
                <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 py-1 rounded-md">
                  ⚡ Auto GPay / PhonePe / Paytm Link
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-300">Active Modes:</div>
              <div className="flex flex-wrap gap-1.5">
                {enableOnlinePayment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    <span>Online UPI</span>
                  </span>
                )}
                {enableCod && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    <span>Cash on Delivery</span>
                  </span>
                )}
                {enableBankTransfer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    <span>Bank Transfer</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant mobile app redirect on Android &amp; iOS</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Direct customer-to-merchant settlements</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
