import { DashboardEmptyState } from "../common/DashboardEmptyState";
import { DashboardSkeleton } from "../common/DashboardSkeleton";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  Phone,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  Image as ImageIcon,
  Send,
  AlertCircle,
  AlertTriangle,
  Archive,
  Trash2,
  X,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  RotateCcw,
  BellRing,
} from 'lucide-react';
import { BusinessProfile, CustomQuoteRequest, QuoteRequestStatus } from '../../types';
import {
  subscribeToCustomQuoteRequests,
  submitQuoteOffer,
  acceptQuotePayment,
  updateCustomQuoteRequest,
  archiveCustomQuoteRequest,
  deleteCustomQuoteRequest,
  checkAndExpireOldQuotes,
} from '../../services/firebaseService';

interface CustomQuoteManagerProps {
  business: BusinessProfile;
  onOpenStorefront?: () => void;
}

const QUOTE_EXPIRY_HOURS = 48;
const QUOTE_EXPIRY_MS = QUOTE_EXPIRY_HOURS * 60 * 60 * 1000;

interface ExpiredAlertItem {
  id: string;
  requestNumber: string;
  customerName: string;
  expiredAt: number;
}

export const CustomQuoteManager: React.FC<CustomQuoteManagerProps> = ({ business }) => {
  const [requests, setRequests] = useState<CustomQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QuoteRequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [expiredAlerts, setExpiredAlerts] = useState<ExpiredAlertItem[]>([]);

  // Modals & Active Request States
  const [selectedRequest, setSelectedRequest] = useState<CustomQuoteRequest | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedImageLightbox, setSelectedImageLightbox] = useState<string | null>(null);

  // Quote Form State
  const [quotePrice, setQuotePrice] = useState<number>(2500);
  const [quoteDays, setQuoteDays] = useState<number>(3);
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live timer tick for accurate countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // update every 10s
    return () => clearInterval(timer);
  }, []);

  // Check and expire old quotes automatically
  const runQuoteExpiryCheck = useCallback(async () => {
    if (!business?.id) return;
    try {
      const newlyExpired = await checkAndExpireOldQuotes(business.id, QUOTE_EXPIRY_HOURS);
      if (newlyExpired && newlyExpired.length > 0) {
        setExpiredAlerts((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const additions = newlyExpired
            .filter((item) => !existingIds.has(item.id))
            .map((item) => ({
              id: item.id,
              requestNumber: item.requestNumber,
              customerName: item.customerName,
              expiredAt: item.updatedAt || Date.now(),
            }));
          return [...additions, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to run automatic quote expiry check:', err);
    }
  }, [business?.id]);

  useEffect(() => {
    if (!business?.id) return;
    setLoading(true);
    const unsubscribe = subscribeToCustomQuoteRequests(
      business.id,
      (loadedRequests) => {
        setRequests(loadedRequests);
        setLoading(false);
      },
      true // include archived in internal state, filter in UI
    );

    // Initial check
    runQuoteExpiryCheck();

    // Periodic check every 30 seconds
    const interval = setInterval(runQuoteExpiryCheck, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [business?.id, runQuoteExpiryCheck]);

  // Expiry calculation helper
  const getExpiryDetails = useCallback(
    (req: CustomQuoteRequest) => {
      if (req.status !== 'quoted' || req.paymentStatus === 'paid') {
        return null;
      }
      const quotedTime = req.quotedAt || req.updatedAt || req.createdAt;
      const elapsed = currentTime - quotedTime;
      const remaining = QUOTE_EXPIRY_MS - elapsed;
      const isExpired = remaining <= 0;

      const totalMinutes = Math.max(0, Math.floor(remaining / (1000 * 60)));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const percentRemaining = Math.max(0, Math.min(100, Math.round((remaining / QUOTE_EXPIRY_MS) * 100)));

      let urgencyLevel: 'normal' | 'warning' | 'critical' | 'expired' = 'normal';
      if (isExpired) {
        urgencyLevel = 'expired';
      } else if (hours < 6) {
        urgencyLevel = 'critical';
      } else if (hours < 24) {
        urgencyLevel = 'warning';
      }

      return {
        isExpired,
        hours,
        minutes,
        remainingMs: remaining,
        percentRemaining,
        urgencyLevel,
        displayText: isExpired
          ? 'Expired (48h reached)'
          : `${hours}h ${minutes}m remaining`,
      };
    },
    [currentTime]
  );

  // Handle Opening Quote Modal
  const handleOpenQuoteModal = (req: CustomQuoteRequest) => {
    setSelectedRequest(req);
    setQuotePrice(req.quotedPrice || 2500);
    setQuoteDays(req.estimatedDeliveryDays || 3);
    setQuoteNotes(req.quoteNotes || 'Includes 2 revisions and final high-resolution files.');
    setIsQuoteModalOpen(true);
  };

  // Submit Price Quote & Prepare WhatsApp Link
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setSubmittingQuote(true);
      const { request: updated, paymentUrl } = await submitQuoteOffer(business.id, selectedRequest.id, {
        quotedPrice: Number(quotePrice) || 0,
        estimatedDeliveryDays: Number(quoteDays) || 3,
        quoteNotes: quoteNotes.trim(),
      });

      setSelectedRequest(updated);

      // Remove from alert list if previously expired
      setExpiredAlerts((prev) => prev.filter((a) => a.id !== selectedRequest.id));

      // Trigger WhatsApp API endpoint to format message
      const response = await fetch('/api/quotes/whatsapp-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestNumber: updated.requestNumber,
          customerName: updated.customerName,
          customerPhone: updated.customerPhone,
          quotedPrice: updated.quotedPrice,
          estimatedDeliveryDays: updated.estimatedDeliveryDays,
          quoteNotes: updated.quoteNotes,
          paymentUrl,
          merchantName: business.name,
        }),
      });

      if (response.ok) {
                let data;
        try {
          data = JSON.parse(await response.text());
        } catch (e) {
          throw new Error('Invalid response from server.');
        }
        if (data.whatsAppUrl) {
          window.open(data.whatsAppUrl, '_blank');
        }
      }

      setIsQuoteModalOpen(false);
    } catch (err: any) {
      console.error('Failed to submit quote:', err);
      alert(err.message || 'Error submitting quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Reactivate / Re-quote an Expired Request
  const handleReactivateQuote = (req: CustomQuoteRequest) => {
    handleOpenQuoteModal(req);
  };

  // Mark Quote Request Accepted / Paid (Instant Confirmation)
  const handleMarkPaid = async (req: CustomQuoteRequest) => {
    if (!confirm(`Mark ${req.requestNumber} for ${req.customerName} as paid and accepted?`)) return;
    try {
      await acceptQuotePayment(business.id, req.id, {
        amountPaid: req.quotedPrice || 0,
      });
    } catch (err) {
      console.error('Failed to accept payment:', err);
    }
  };

  // Mark Order as Completed
  const handleMarkCompleted = async (req: CustomQuoteRequest) => {
    try {
      await updateCustomQuoteRequest(business.id, req.id, {
        status: 'completed',
      });
    } catch (err) {
      console.error('Failed to complete request:', err);
    }
  };

  // Reject Request
  const handleReject = async (req: CustomQuoteRequest) => {
    const reason = prompt('Please enter a brief rejection reason (optional):');
    if (reason === null) return;

    try {
      await updateCustomQuoteRequest(business.id, req.id, {
        status: 'rejected',
        rejectionReason: reason || 'Not available currently',
      });
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  // Archive / Delete
  const handleToggleArchive = async (req: CustomQuoteRequest) => {
    try {
      await archiveCustomQuoteRequest(business.id, req.id, !req.isArchived);
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const handleDelete = async (req: CustomQuoteRequest) => {
    if (!confirm(`Permanently delete enquiry ${req.requestNumber}?`)) return;
    try {
      await deleteCustomQuoteRequest(business.id, req.id);
    } catch (err) {
      console.error('Failed to delete quote request:', err);
    }
  };

  const handleCopyLink = (req: CustomQuoteRequest) => {
    const origin = window.location.origin;
    const url = `${origin}/quote-pay/${business.id}/${req.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Metrics Calculations
  const nonArchived = requests.filter((r) => !r.isArchived);
  const totalInquiries = nonArchived.length;
  const newRequestsCount = nonArchived.filter((r) => r.status === 'new').length;
  const quotedCount = nonArchived.filter((r) => r.status === 'quoted').length;
  const acceptedCount = nonArchived.filter((r) => r.status === 'accepted').length;
  const completedCount = nonArchived.filter((r) => r.status === 'completed').length;
  const rejectedCount = nonArchived.filter((r) => r.status === 'rejected').length;
  const expiredQuotesCount = nonArchived.filter(
    (r) => r.status === 'rejected' && r.rejectionReason?.toLowerCase().includes('expired')
  ).length;

  const totalCommissionRevenue = nonArchived
    .filter((r) => r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + (r.quotedPrice || 0), 0);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (!showArchived && req.isArchived) return false;
    if (showArchived && !req.isArchived) return false;

    const matchesSearch =
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerPhone.includes(searchQuery) ||
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                Custom Orders & Quote Requests
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Review bespoke commission inquiries, send tailored price quotes, and track automatic 48-hour payment timers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={runQuoteExpiryCheck}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Scan for expired quotes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              showArchived
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Viewing Archived' : 'View Archived'}</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNER: EXPIRED QUOTES ALERT */}
      {expiredAlerts.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200/90 shadow-sm animate-in slide-in-from-top duration-300 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>
                {expiredAlerts.length} Quote Proposal{expiredAlerts.length > 1 ? 's' : ''} Expired (48-Hour Unpaid Timeout)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpiredAlerts([])}
              className="text-amber-700 hover:text-amber-950 text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-amber-100 transition cursor-pointer"
            >
              Dismiss All
            </button>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            Customers did not complete payment within 48 hours of receiving the quote proposal. The requests were automatically moved to <strong className="font-semibold">Rejected</strong> to keep your pipeline clean.
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {expiredAlerts.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-amber-100/90 text-amber-950 border border-amber-300/60 px-2.5 py-1 rounded-xl"
              >
                <Clock className="w-3 h-3 text-amber-700" />
                {item.requestNumber} ({item.customerName})
              </span>
            ))}
            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline ml-1 cursor-pointer"
            >
              View in Rejected tab →
            </button>
          </div>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inquiries</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            {totalInquiries}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Customer requests</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Active Quotes</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 font-heading">
            {quotedCount}
          </div>
          <p className="text-[11px] text-blue-700 font-medium">Under 48h payment window</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Accepted / In Progress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-heading">
            {acceptedCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">{completedCount} already delivered</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Paid Commissions</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950 font-heading">
            ₹{totalCommissionRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-indigo-700 font-medium">{expiredQuotesCount} expired inquiries</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(['all', 'new', 'quoted', 'accepted', 'completed', 'rejected'] as const).map((tab) => {
            const count =
              tab === 'all'
                ? nonArchived.length
                : nonArchived.filter((r) => r.status === tab).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab === 'accepted' ? 'Accepted (Paid)' : tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries by name, phone, or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-8">
          <DashboardSkeleton count={6} type="list" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <DashboardEmptyState
          icon={FileText}
          title="No commission inquiries"
          description={searchQuery ? 'No requests match your search query.' : 'You have no custom quote requests matching this filter.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const cleanPhone = req.customerPhone.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone;
            const waChatUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
              `Hello ${req.customerName}, this is ${business.name} regarding your custom order enquiry (${req.requestNumber}).`
            )}`;

            const expiry = getExpiryDetails(req);
            const isAutoExpired =
              req.status === 'rejected' && req.rejectionReason?.toLowerCase().includes('expired');

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4"
              >
                {/* Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      {req.requestNumber}
                    </span>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {req.customerName}
                    </h3>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        req.status === 'new'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'quoted'
                          ? 'bg-blue-100 text-blue-800'
                          : req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'completed'
                          ? 'bg-purple-100 text-purple-800'
                          : isAutoExpired
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'accepted'
                        ? 'Accepted & Paid'
                        : isAutoExpired
                        ? 'Expired (48h Timeout)'
                        : req.status}
                    </span>

                    {req.budgetRange && (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Budget: {req.budgetRange}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Received {new Date(req.createdAt).toLocaleDateString()} at{' '}
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Description & Reference Images */}
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {req.description}
                  </p>

                  {/* Reference Image Thumbnails */}
                  {req.referenceImages && req.referenceImages.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Reference Photos ({req.referenceImages.length})
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {req.referenceImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedImageLightbox(imgUrl)}
                            className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer hover:opacity-85 transition group relative"
                          >
                            <img
                              src={imgUrl}
                              alt={`Reference ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quoted Information Box & Expiry Countdown */}
                {req.quotedPrice && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-bold">
                      <span className="text-purple-900">
                        Quoted:{' '}
                        <strong className="text-sm font-black text-purple-950">
                          ₹{req.quotedPrice.toLocaleString()}
                        </strong>{' '}
                        ({req.estimatedDeliveryDays} days turnaround)
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start sm:self-auto ${
                          req.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.paymentStatus === 'paid' ? 'Payment Confirmed' : 'Payment Pending'}
                      </span>
                    </div>

                    {/* LIVE 48-HOUR QUOTE EXPIRY TIMER BAR */}
                    {expiry && (
                      <div
                        className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
                          expiry.urgencyLevel === 'critical'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : expiry.urgencyLevel === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-blue-50 border-blue-200 text-blue-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              expiry.urgencyLevel === 'critical' ? 'animate-pulse text-rose-600' : 'text-blue-600'
                            }`}
                          />
                          <span>
                            Quote Expiry: <strong className="font-black">{expiry.displayText}</strong> (48h window)
                          </span>
                        </div>

                        {/* Progress meter */}
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                expiry.urgencyLevel === 'critical'
                                  ? 'bg-rose-500'
                                  : expiry.urgencyLevel === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${expiry.percentRemaining}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {expiry.percentRemaining}%
                          </span>
                        </div>
                      </div>
                    )}

                    {req.quoteNotes && (
                      <p className="text-[11px] text-purple-700 italic">
                        "{req.quoteNotes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection / Expiration Notice */}
                {req.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Status Note:</strong> {req.rejectionReason}
                      </span>
                    </div>
                    {isAutoExpired && (
                      <button
                        type="button"
                        onClick={() => handleReactivateQuote(req)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-quote</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs font-bold">
                  {/* Left Contacts */}
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {req.customerPhone}
                    </span>
                    {req.customerEmail && (
                      <span>• {req.customerEmail}</span>
                    )}
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* WhatsApp Chat Button */}
                    <a
                      href={waChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chat</span>
                    </a>

                    {/* Send / Update Quote CTA */}
                    {req.status !== 'completed' && req.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleOpenQuoteModal(req)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{req.quotedPrice ? 'Edit Quote' : 'Send Price Quote'}</span>
                      </button>
                    )}

                    {/* Reactivate CTA for rejected or expired quotes */}
                    {req.status === 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleReactivateQuote(req)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Send Fresh Quote</span>
                      </button>
                    )}

                    {/* Mark Paid (if quoted and payment pending) */}
                    {req.status === 'quoted' && req.paymentStatus !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(req)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Paid</span>
                      </button>
                    )}

                    {/* Mark Completed (if accepted & paid) */}
                    {req.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(req)}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}

                    {/* Archive / Delete Menu */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(req)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                      title={req.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    {req.status !== 'rejected' && req.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleReject(req)}
                        className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        title="Reject Enquiry"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {req.isArchived && (
                      <button
                        type="button"
                        onClick={() => handleDelete(req)}
                        className="p-2 rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEND / EDIT QUOTE MODAL */}
      {isQuoteModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <button
              type="button"
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Send Price Proposal & Payment Link
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRequest.requestNumber} • For {selectedRequest.customerName}
                </p>
              </div>
            </div>

            {/* 48-Hour Guarantee Note */}
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>48-Hour Payment Expiry:</strong> Once submitted, a direct payment link valid for 48 hours will be dispatched. If unpaid within 48h, the system will automatically mark it expired and notify you.
              </p>
            </div>

            {/* Request Snapshot */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Requirement</span>
              <p className="text-slate-700 line-clamp-3 leading-relaxed">{selectedRequest.description}</p>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Quoted Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Estimated Delivery (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={quoteDays}
                    onChange={(e) => setQuoteDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Notes & Scope Inclusions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes 2 revisions, original raw files, commercial use license..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Direct Payment Link Copy */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
                  One-Time Payment Link
                </span>
                <div className="flex items-center justify-between text-[11px] text-purple-700 font-mono">
                  <span className="truncate max-w-xs">{`${window.location.origin}/quote-pay/${business.id}/${selectedRequest.id}`}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedRequest)}
                    className="p-1 text-purple-800 hover:text-purple-950 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingQuote && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Quote on WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX */}
      {selectedImageLightbox && (
        <div
          onClick={() => setSelectedImageLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={selectedImageLightbox}
              alt="Enlarged Reference"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

