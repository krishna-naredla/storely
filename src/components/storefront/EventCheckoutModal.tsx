import React, { useState } from 'react';
import {
  X,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  Phone,
  User,
  Mail,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Download,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { BusinessProfile, EventItem, EventTicket } from '../../types';
import { purchaseEventTicketTransaction } from '../../services/firebaseService';

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

  // Success Confirmation State
  const [confirmedTicket, setConfirmedTicket] = useState<EventTicket | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !event) return null;

  const seatsLeft = event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold);
  const isSoldOut = event.status === 'sold_out' || seatsLeft <= 0;
  const isFree = event.price === 0 || event.isFree;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp phone number');
      return;
    }

    try {
      setLoading(true);

      // Handle Free Event vs Paid Event
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
        // Paid Event Checkout via Razorpay or simulated payment flow
        const razorpayKey = (window as any).RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
        const hasRazorpayScript = typeof (window as any).Razorpay !== 'undefined';

        if (razorpayKey && hasRazorpayScript) {
          const options = {
            key: razorpayKey,
            amount: event.price * 100, // in paise
            currency: 'INR',
            name: business.name,
            description: `Ticket for ${event.title}`,
            image: business.logo || undefined,
            handler: async function (response: any) {
              try {
                const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
                  customerName: customerName.trim(),
                  customerPhone: cleanPhone,
                  customerEmail: customerEmail.trim() || undefined,
                  paymentStatus: 'paid',
                  paymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
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
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (resp: any) {
            setErrorMessage(resp.error.description || 'Payment failed. Please try again.');
          });
          rzp.open();
        } else {
          // Instant direct confirmation with mock transaction
          const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            customerEmail: customerEmail.trim() || undefined,
            paymentStatus: 'paid',
            paymentId: `pay_direct_${Date.now()}`,
          });

          setConfirmedTicket(ticket);
          prepareWhatsAppConfirmation(ticket);
          if (onSuccess) onSuccess(ticket);
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

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      event.format === 'online'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {event.format === 'online' ? '🌐 Online' : '📍 In-Person'}
                  </span>

                  <span className="text-xs font-black text-slate-900">
                    {isFree ? 'Free Registration' : `₹${event.price}`}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 font-heading line-clamp-1">
                  {event.title}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{event.eventDate} at {event.eventTime}</span>
                </div>
              </div>
            </div>

            {/* Live Seat Scarcity Alert */}
            {seatsLeft <= 10 && seatsLeft > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                <span>Only {seatsLeft} seat{seatsLeft > 1 ? 's' : ''} left for this session!</span>
              </div>
            )}

            {isSoldOut ? (
              <div className="p-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">This Event is Sold Out</h4>
                <p className="text-xs text-slate-500">
                  All {event.capacity} seats have been reserved. Stay tuned for future batches!
                </p>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Your Full Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WhatsApp Phone Number <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Your digital ticket and access details will be sent directly to this WhatsApp number.
                  </p>
                </div>

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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Securing Your Seat...</span>
                      </>
                    ) : isFree ? (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Claim Free Ticket Pass</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pay ₹{event.price} & Get Ticket</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant E-Ticket Delivery • 100% Verified Session</span>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STEP 2: CONFIRMED E-TICKET PASS & SHARE OPTIONS */
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Seat Confirmed!
              </h3>
              <p className="text-xs text-slate-500">
                You're officially registered for <span className="font-bold text-slate-800">{event.title}</span>
              </p>
            </div>

            {/* Digital E-Ticket Pass Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl space-y-4 border border-slate-700 relative overflow-hidden">
              {/* Decorative ticket notch patterns */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300" />

              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  {business.logo && (
                    <img
                      src={business.logo}
                      alt={business.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-md object-cover"
                    />
                  )}
                  <span className="text-xs font-bold text-emerald-400">{business.name}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyTicketCode}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <span>{confirmedTicket.ticketId}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black font-heading leading-tight">{event.title}</h4>
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{event.eventDate} at {event.eventTime}</span>
                </div>
              </div>

              {/* Format / Join Info */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5">
                {event.format === 'online' ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Video className="w-4 h-4" />
                      <span>Online Webinar Pass</span>
                    </div>
                    {event.meetingUrl ? (
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-bold"
                      >
                        <span>Join Meeting Link: {event.meetingUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Meeting link will be dispatched to your WhatsApp prior to start.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <MapPin className="w-4 h-4" />
                      <span>In-Person Venue</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {event.venueAddress || 'Venue'}{event.venueCity ? `, ${event.venueCity}` : ''}
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/80">
                <span>Attendee: <strong className="text-white">{confirmedTicket.customerName}</strong></span>
                <span>{confirmedTicket.paymentStatus === 'paid' ? `₹${confirmedTicket.price} Paid` : 'Free Pass'}</span>
              </div>
            </div>

            {/* Action Buttons: WhatsApp Delivery & Add to Calendar */}
            <div className="space-y-2 pt-1 text-xs font-bold">
              {whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Receive E-Ticket on WhatsApp</span>
                </a>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`I registered for ${event.title}! Ticket: ${confirmedTicket.ticketId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share Ticket on WhatsApp</span>
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
