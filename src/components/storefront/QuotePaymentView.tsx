import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { BusinessProfile, CustomQuoteRequest } from '../../types';
import { getCustomQuoteRequest, acceptQuotePayment } from '../../services/firebaseService';

interface QuotePaymentViewProps {
  business: BusinessProfile;
  requestId: string;
  onBackToStorefront?: () => void;
}

export const QuotePaymentView: React.FC<QuotePaymentViewProps> = ({
  business,
  requestId,
  onBackToStorefront,
}) => {
  const [request, setRequest] = useState<CustomQuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const data = await getCustomQuoteRequest(business.id, requestId);
        setRequest(data);
      } catch (err: any) {
        console.error('Failed to load quote request:', err);
        setErrorMessage(err.message || 'Quote request not found or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (business?.id && requestId) {
      fetchRequest();
    }
  }, [business?.id, requestId]);

  const handlePayQuote = async () => {
    if (!request || !request.quotedPrice) return;
    setErrorMessage(null);

    try {
      setPaying(true);

      const razorpayKey = (window as any).RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
      const hasRazorpayScript = typeof (window as any).Razorpay !== 'undefined';

      if (razorpayKey && hasRazorpayScript) {
        const options = {
          key: razorpayKey,
          amount: request.quotedPrice * 100, // paise
          currency: 'INR',
          name: business.name,
          description: `Custom Commission: ${request.requestNumber}`,
          image: business.logo || undefined,
          handler: async function (response: any) {
            try {
              const updated = await acceptQuotePayment(business.id, request.id, {
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                amountPaid: request.quotedPrice,
              });
              setRequest(updated);
              setPaymentSuccess(true);
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment recorded but failed to update status.');
            }
          },
          prefill: {
            name: request.customerName,
            contact: request.customerPhone,
            email: request.customerEmail,
          },
          theme: {
            color: '#7c3aed',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage(resp.error.description || 'Payment cancelled or failed.');
        });
        rzp.open();
      } else {
        // Direct confirmation fallback
        const updated = await acceptQuotePayment(business.id, request.id, {
          paymentId: `pay_quote_${Date.now()}`,
          amountPaid: request.quotedPrice,
        });
        setRequest(updated);
        setPaymentSuccess(true);
      }
    } catch (err: any) {
      console.error('Payment failure:', err);
      setErrorMessage(err.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-xs font-bold text-slate-600">Loading custom quote proposal...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">Quote Not Found</h2>
          <p className="text-xs text-slate-500">
            This commission proposal link may have expired or been removed.
          </p>
          {onBackToStorefront && (
            <button
              type="button"
              onClick={onBackToStorefront}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Back to Storefront
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPaid = request.paymentStatus === 'paid' || request.status === 'accepted' || request.status === 'completed';
  const cleanPhone = (business.whatsappNumber || business.phone || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone;
  const waChatUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${business.name}, I am contacting you regarding my quote proposal (${request.requestNumber}).`
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 text-slate-900 selection:bg-purple-500 selection:text-white py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back navigation */}
        {onBackToStorefront && (
          <button
            type="button"
            onClick={onBackToStorefront}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to {business.name}'s Store</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex items-center gap-4">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {business.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              Official Price Proposal
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {business.name}
            </h1>
            <p className="text-xs text-slate-500">
              Custom Order Reference: <strong className="font-mono text-slate-700">{request.requestNumber}</strong>
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pricing & Proposal Card */}
        <div className="bg-white rounded-3xl border border-purple-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Quoted Amount
              </span>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                {request.estimatedDeliveryDays ? `${request.estimatedDeliveryDays} Days Delivery` : 'Custom Timeline'}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-heading">
              ₹{(request.quotedPrice || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-xs">
            {/* Scope Notes */}
            {request.quoteNotes && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Creator Scope Notes
                </span>
                <p className="text-purple-900 leading-relaxed text-xs">
                  {request.quoteNotes}
                </p>
              </div>
            )}

            {/* Request Summary */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Your Order Specifications
              </span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {request.description}
              </p>

              {request.referenceImages && request.referenceImages.length > 0 && (
                <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                  {request.referenceImages.map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={img} alt="Ref" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment / Status Section */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {isPaid ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-emerald-950">Payment Confirmed!</h3>
                  <p className="text-[11px] text-emerald-800">
                    Your custom order is officially approved and in progress with {business.name}.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePayQuote}
                  disabled={paying}
                  className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {paying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Secure Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Accept & Pay ₹{(request.quotedPrice || 0).toLocaleString()}</span>
                    </>
                  )}
                </button>
              )}

              {/* Direct WhatsApp Message Creator */}
              <a
                href={waChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-bold transition flex items-center justify-center gap-2 text-xs"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Discuss with {business.name} on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
