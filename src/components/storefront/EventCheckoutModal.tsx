import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Video,
  Ticket,
  Users,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { BusinessProfile, EventItem, EventTicket } from '../../types';
import { purchaseEventTicketTransaction, reserveEventSeat, releaseEventSeat } from '../../services/firebaseService';

interface EventCheckoutModalProps {
  event: EventItem | null;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticket: EventTicket) => void;
}

export const EventCheckoutModal: React.FC<EventCheckoutModalProps> = ({
  event,
  business,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<EventTicket | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !event) return null;

  const handlePurchase = async () => {
    if (!customerName || !customerPhone || !event) return;
    
    // Auto-prefix with 91 for WhatsApp if 10 digits
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const isFree = event.price === 0 || event.isFree;

      if (isFree) {
        // Atomic transaction to claim free ticket
        const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
          paymentStatus: 'free',
        });
        setConfirmedTicket(ticket);
        prepareWhatsAppConfirmation(ticket);
        if (onSuccess) onSuccess(ticket);
      } else {
        // Paid Event Checkout via Razorpay
        const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
        const hasRazorpayScript = typeof (window as any).Razorpay !== 'undefined';

        if (razorpayKey && hasRazorpayScript) {
          // 1. Reserve the seat before payment
          const holdId = `hold_${Date.now()}`;
          try {
            await reserveEventSeat(business.id, event.id, holdId, 10 * 60 * 1000);
          } catch (reserveErr: any) {
            setErrorMessage(reserveErr.message || 'Sold Out. Unable to reserve seat.');
            setLoading(false);
            return;
          }

          const options = {
            key: razorpayKey,
            amount: event.price * 100, // in paise
            currency: 'INR',
            name: business.name,
            description: `Ticket for ${event.title}`,
            image: business.logo || undefined,
            handler: async function (response: any) {
              try {
                // 3. Finalize payment and convert hold to ticket
                const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
                  customerName: customerName.trim(),
                  customerPhone: cleanPhone,
                  customerEmail: customerEmail.trim() || undefined,
                  paymentStatus: 'paid',
                  paymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  holdId: holdId, // Pass holdId to utilize reserved seat
                });

                setConfirmedTicket(ticket);
                prepareWhatsAppConfirmation(ticket);
                if (onSuccess) onSuccess(ticket);
              } catch (err: any) {
                setErrorMessage(err.message || 'Payment recorded but failed to lock ticket.');
              }
            },
            prefill: {
              name: customerName,
              contact: cleanPhone,
              email: customerEmail,
            },
            theme: {
              color: '#059669',
            },
            modal: {
              ondismiss: async function () {
                // 2. Release seat if user closes checkout
                try {
                  await releaseEventSeat(business.id, event.id, holdId);
                } catch (e) {
                  console.error('Failed to release seat hold on dismiss', e);
                }
                setLoading(false);
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', async function (resp: any) {
            setErrorMessage(resp.error.description || 'Payment failed. Please try again.');
            // Release seat on payment failure
            try {
              await releaseEventSeat(business.id, event.id, holdId);
            } catch (e) {
              console.error('Failed to release seat hold on failure', e);
            }
            setLoading(false);
          });
          rzp.open();
        } else {
          throw new Error('Razorpay SDK failed to load. Please disable ad-blockers and try again.');
        }
      }
    } catch (err: any) {
      console.error('Error during ticket booking:', err);
      setErrorMessage(err.message || 'Unable to reserve seat. It may have sold out.');
    } finally {
      setLoading(false);
    }
  };

  const prepareWhatsAppConfirmation = async (ticket: EventTicket) => {
    try {
      const response = await fetch('/api/events/whatsapp-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.ticketId,
          eventTitle: event.title,
          format: event.format,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          meetingUrl: event.meetingUrl,
          venueAddress: event.venueAddress,
          venueCity: event.venueCity,
          customerName: ticket.customerName,
          customerPhone: ticket.customerPhone,
          price: ticket.price,
          merchantName: business.name,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.whatsAppUrl) {
          setWhatsAppUrl(data.whatsAppUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching WhatsApp ticket link:', err);
    }
  };

  const handleCopyTicketCode = () => {
    if (!confirmedTicket) return;
    navigator.clipboard.writeText(confirmedTicket.ticketId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const buildGoogleCalendarUrl = () => {
    if (!event) return '#';
    // Format: YYYYMMDDTHHMMSSZ
    const dateStr = event.eventDate.replace(/-/g, '');
    const timeClean = (event.eventTime || '18:00').replace(/[^0-9]/g, '');
    const startStr = `${dateStr}T${timeClean.padEnd(4, '0')}00`;
    
    // Add 1 hour duration
    const endStr = `${dateStr}T${(Number(timeClean.slice(0, 2)) + 1).toString().padStart(2, '0')}${timeClean.slice(2, 4) || '00'}00`;

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `Masterclass with ${business.name}\nTicket Code: ${confirmedTicket?.ticketId || ''}\n${
        event.meetingUrl ? `Join Link: ${event.meetingUrl}` : `Venue: ${event.venueAddress || ''}`
      }`
    );
    const location = encodeURIComponent(event.format === 'online' ? (event.meetingUrl || 'Online') : (event.venueAddress || ''));

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmedTicket ? (
          /* STEP 1: REGISTRATION & CHECKOUT FORM */
          <div className="space-y-6">
            {/* Event Summary Card */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
                    {event.format === 'online' ? 'Online' : 'In-Person'}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {event.price === 0 ? 'Free' : `₹${event.price}`}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                  {event.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.eventDate}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.eventTime}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition shadow-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+91</span>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition shadow-xs"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Your ticket & links will be sent here
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="For calendar invites"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition shadow-xs"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handlePurchase}
              disabled={loading || !customerName || !customerPhone}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {event.price === 0 ? 'Claim Free Ticket' : `Pay ₹${event.price} & Book Seat`}
                </>
              )}
            </button>
          </div>
        ) : (
          /* STEP 2: SUCCESS & TICKET CONFIRMATION */
          <div className="text-center space-y-6 py-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 ring-8 ring-emerald-50">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You're Going! 🎉</h2>
              <p className="text-slate-500 text-sm">
                Your ticket for <strong className="text-slate-700">{event.title}</strong> is confirmed.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Ticket Code</p>
                  <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">{confirmedTicket.ticketId}</p>
                </div>
                <button
                  onClick={handleCopyTicketCode}
                  className="p-2 hover:bg-slate-200 text-slate-500 rounded-lg transition"
                  title="Copy Code"
                >
                  {copiedCode ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <QrCode className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="h-px bg-slate-200 w-full" />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{event.eventDate} at {event.eventTime}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  {event.format === 'online' ? (
                    <>
                      <Video className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-slate-900">Online Masterclass</span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {event.sendMeetingLinkTiming === 'immediately' 
                            ? 'Link sent to your WhatsApp' 
                            : 'Link will be sent closer to the event'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-slate-900">{event.venueCity}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{event.venueAddress}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Get Ticket on WhatsApp</span>
                </a>
              )}
              
              <a
                href={buildGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Add to Google Calendar</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-400 hover:text-slate-600 transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
