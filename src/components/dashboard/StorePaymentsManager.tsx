import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Loader2,
  Smartphone,
  ShieldCheck,
  Zap,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { updateBusinessProfile } from '../../services/firebaseService';

interface StorePaymentsManagerProps {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
}

export const StorePaymentsManager: React.FC<StorePaymentsManagerProps> = ({
  business,
  onBusinessUpdated,
}) => {
  const [upiId, setUpiId] = useState(business.upiId || 'maninaredla218@oksbi');
  const [enableOnlinePayment, setEnableOnlinePayment] = useState(
    business.enableOnlinePayment ?? true
  );
  const [enableCod, setEnableCod] = useState(business.enableCod ?? true);
  const [enableUpiOnDelivery, setEnableUpiOnDelivery] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      const trimmedUpi = upiId.trim();
      if (!trimmedUpi) {
        setError('Please enter a valid UPI ID (e.g. yourstore@oksbi)');
        setIsSaving(false);
        return;
      }

      const payload: Partial<BusinessProfile> = {
        upiId: trimmedUpi,
        enableOnlinePayment,
        enableCod,
      };

      await updateBusinessProfile(business.id, payload);
      onBusinessUpdated({
        ...business,
        ...payload,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save UPI payment settings to Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  const sampleDeepLink = `upi://pay?pa=${encodeURIComponent(
    upiId || 'maninaredla218@oksbi'
  )}&pn=${encodeURIComponent(business.name)}&am=500&cu=INR&tn=${encodeURIComponent(
    'StoreOrderPayment'
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Store Payments & UPI Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your business UPI ID and payment gateways so customers can pay instantly on their devices.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">100% Direct to You</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment settings and UPI ID successfully saved to Firestore!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">UPI Payment Gateway Settings</h3>
              <p className="text-xs text-slate-500">Linked directly to your storefront checkout deep-links</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Business UPI ID (Virtual Payment Address) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. maninaredla218@oksbi"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                This UPI ID is used to generate instant GPay, PhonePe, and Paytm deep links (`upi://pay?pa=...`) for customers.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Acceptance Modes
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
                  <p className="text-xs text-slate-500">Allow customers to pay via GPay, PhonePe, Paytm with auto QR and deep link buttons during checkout.</p>
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
                  <p className="text-xs text-slate-500">Allow customers to place orders and pay upon delivery or pickup.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
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
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Live QR Preview
              </span>
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h4 className="font-bold text-lg text-white">Customer Checkout View</h4>
              <p className="text-xs text-slate-400 mt-0.5">This QR and deep link will be rendered in customer carts.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl text-center space-y-3 shadow-inner">
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    sampleDeepLink
                  )}`}
                  alt="UPI QR Code"
                  className="w-36 h-36 rounded-xl border p-1 bg-white mx-auto shadow-xs"
                />
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 py-1 px-2 rounded-lg truncate">
                {upiId || 'No UPI ID Set'}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 py-1 rounded-md">
                ⚡ Deep Link: upi://pay?pa=...
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant mobile app redirect on Android & iOS</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Direct settlement with 0% platform commission</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
