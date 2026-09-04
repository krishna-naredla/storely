import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  Lock,
  Sparkles,
  Smartphone,
  Mail,
  User,
  AlertCircle,
  Loader2,
  ExternalLink,
  Clock,
  RefreshCw,
  FileText,
  Video,
  FolderArchive,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BusinessProfile, CatalogItem, Order } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { createOrder } from '../../services/firebaseService';

interface DigitalCheckoutModalProps {
  item: CatalogItem | null;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export 
const safeJsonFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!res.ok) throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
    data = {};
  }
  return { res, data };
};

export const DigitalCheckoutModal: React.FC<DigitalCheckoutModalProps> = ({
  item,
  business,
  isOpen,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state
  const [purchasedOrder, setPurchasedOrder] = useState<Order | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleDownload = async (url: string, filename: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed or expired');
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error downloading file. Please request a new link if expired.');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
      setPurchasedOrder(null);
      setDownloadUrl(null);
      setExpiresAt(null);
      setErrorMessage(null);
      setRemainingSeconds(600);
      setResendSuccess(false);
    }
  }, [isOpen, item?.id]);

  // Expiry countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!isOpen || !item) return null;

  const isFree = item.isFree || item.price === 0;
  const price = item.salePrice || item.price;
  const currencySymbol = business.currencySymbol || '₹';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'video':
        return Video;
      case 'zip':
        return FolderArchive;
      case 'images':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleFreeClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!customerName.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp number');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Request secure download link from backend
      const { res, data } = await safeJsonFetch('/api/digital/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          fileUrl: item.digitalFileUrl || item.images?.[0] || '',
          fileName: item.fileName || item.name,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to claim digital product');
      }

      // 2. Log order in Firestore as DELIVERED
      const newOrder = await createOrder(business.id, {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        orderType: 'digital',
        items: [
          {
            itemId: item.id,
            name: item.name,
            price: 0,
            quantity: 1,
            image: item.images?.[0] || '',
          },
        ],
        subtotal: 0,
        deliveryFee: 0,
        discount: 0,
        tax: 0,
        total: 0,
        status: 'delivered',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        downloadStatus: 'completed',
        digitalAccessUrl: data.downloadUrl,
      });

      setPurchasedOrder(newOrder);
      setDownloadUrl(data.downloadUrl);
      setExpiresAt(data.expiresAt);
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaidPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!customerName.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp number');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Razorpay order on backend
      const { res: orderRes, data: orderData } = await safeJsonFetch('/api/digital/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          amount: price,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });
      if (!orderRes.ok || !orderData.id) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      // Check for Razorpay SDK on window
      const RazorpayClass = (window as any).Razorpay;

      const completeOrderVerification = async (paymentDetails: any) => {
        const { res: verifyRes, data: verifyData } = await safeJsonFetch('/api/digital/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: paymentDetails.razorpay_order_id || orderData.id,
            razorpay_payment_id: paymentDetails.razorpay_payment_id || `pay_${Date.now()}`,
            razorpay_signature: paymentDetails.razorpay_signature || 'mock_sig',
            itemId: item.id,
            fileUrl: item.digitalFileUrl || item.images?.[0] || '',
            fileName: item.fileName || item.name,
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            customerEmail: customerEmail.trim() || undefined,
            amount: price || 0,
          }),
        });
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Payment verification failed');
        }

        // Log order in Firestore as DELIVERED
        const newOrder = await createOrder(business.id, {
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
          orderType: 'digital',
          items: [
            {
              itemId: item.id,
              name: item.name,
              price: price,
              quantity: 1,
              image: item.images?.[0] || '',
            },
          ],
          subtotal: price,
          deliveryFee: 0,
          discount: 0,
          tax: 0,
          total: price,
          status: 'delivered',
          paymentMethod: 'online',
          paymentStatus: 'paid',
          downloadStatus: 'completed',
          digitalAccessUrl: verifyData.downloadUrl,
        });

        setPurchasedOrder(newOrder);
        setDownloadUrl(verifyData.downloadUrl);
        setExpiresAt(verifyData.expiresAt);
        triggerConfetti();
      };

      if (RazorpayClass) {
        const options = {
          key: orderData.keyId || 'rzp_test_dummy',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: business.name,
          description: item.name,
          image: business.logo || undefined,
          order_id: orderData.id,
          prefill: {
            name: customerName.trim(),
            contact: cleanPhone,
            email: customerEmail.trim() || undefined,
          },
          theme: {
            color: business.themeColor || '#4F46E5',
          },
          handler: async (response: any) => {
            try {
              await completeOrderVerification(response);
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment verification failed');
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            },
          },
        };

        const rzp = new RazorpayClass(options);
        rzp.open();
      } else if (price === 0 || isFree) {
        // Fallback for free items if Razorpay script is blocked
        await completeOrderVerification({
          razorpay_order_id: orderData.id,
          razorpay_payment_id: `pay_direct_${Date.now()}`,
          razorpay_signature: 'test_verified',
        });
        setIsLoading(false);
      } else {
        throw new Error('Razorpay SDK failed to load. Please disable ad-blockers and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed');
      setIsLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!purchasedOrder && !customerPhone) return;
    setIsResending(true);
    try {
      const { res, data } = await safeJsonFetch('/api/digital/resend-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: purchasedOrder?.id,
          itemId: item.id,
          fileUrl: item.digitalFileUrl || '',
          fileName: item.fileName || item.name,
          phone: customerPhone,
        }),
      });
      if (data.success && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setExpiresAt(data.expiresAt);
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch {
      alert('Could not refresh download link. Please contact the creator.');
    } finally {
      setIsResending(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    if (!downloadUrl) return;
    const message = encodeURIComponent(
      `Hi ${customerName}! Here is your download link for *${item.name}* from *${business.name}*:\n\n🔗 ${downloadUrl}\n\n⚠️ Note: This secure link is valid for 10 minutes.\nThank you for your purchase!`
    );
    window.open(`https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {purchasedOrder ? 'Download Ready' : isFree ? 'Instant Free Access' : 'Instant 1-Click Buy'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {purchasedOrder ? 'Your files have been unlocked' : 'Direct delivery to your device & WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Product Summary Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-white border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {item.images?.[0] ? (
                <SafeImage
                  src={item.images[0]}
                  alt={item.name}
                  fallbackType="product"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-8 h-8 text-indigo-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  {item.digitalFileType?.toUpperCase() || 'DIGITAL FILE'}
                </span>
                {item.fileSize && (
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {item.fileSize}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
              <div className="text-sm font-black text-indigo-700 mt-0.5">
                {isFree ? (
                  <span className="text-emerald-700 font-extrabold">FREE DOWNLOAD</span>
                ) : (
                  <span>
                    {currencySymbol}
                    {price}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SUCCESS SCREEN */}
          {purchasedOrder ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {isFree ? 'Claimed Successfully!' : 'Payment Verified!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Thank you, <span className="font-bold text-slate-800">{customerName}</span>. Your download is ready below.
                </p>
              </div>

              {/* Expiry Timer Pill */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Secure link expires in:</span>
                </div>
                <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-amber-200 text-amber-800">
                  {remainingSeconds > 0 ? formatTime(remainingSeconds) : 'Expired'}
                </span>
              </div>

              {/* Main Download Button */}
              {remainingSeconds > 0 && downloadUrl ? (
                <button
                  type="button"
                  onClick={() => handleDownload(downloadUrl, item.fileName || item.name || 'download')}
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm sm:text-base transition transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Now ({item.fileSize || 'Instant'})</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs text-center font-bold">
                    This download link has expired. Click below to generate a fresh link.
                  </div>
                  <button
                    onClick={handleResendLink}
                    disabled={isResending}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Refresh & Generate New Link</span>
                  </button>
                </div>
              )}

              {/* Multi-file/Course Lessons List if applicable */}
              {item.digitalFiles && item.digitalFiles.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Included Files ({item.digitalFiles.length})
                  </h5>
                  <div className="space-y-1.5">
                    {item.digitalFiles.map((df, idx) => {
                      const FileIcon = getFileIcon(df.fileType);
                      return (
                        <div
                          key={df.id || idx}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{df.title}</span>
                          </div>
                          {df.url && (
                            <button
                              type="button"
                              onClick={() => handleDownload(df.url!, df.title || 'download')}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] transition shrink-0 disabled:opacity-50"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* WhatsApp Delivery Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={openWhatsAppConfirmation}
                  className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Send Link to WhatsApp (+91 {customerPhone})</span>
                </button>
                {resendSuccess && (
                  <p className="text-[11px] text-emerald-600 font-bold text-center mt-2 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Download link refreshed successfully!
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form onSubmit={isFree ? handleFreeClaim : handlePaidPurchase} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  WhatsApp Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Download link will also be sent directly to this WhatsApp number.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 font-extrabold rounded-2xl text-white text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    isFree
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/25'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/25'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isFree ? 'Unlocking Download...' : 'Processing Payment...'}</span>
                    </>
                  ) : isFree ? (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Get Free Download</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Pay Now {currencySymbol}
                        {price}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>SSL Encrypted & Secure Instant Delivery</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
