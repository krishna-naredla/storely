import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  RefreshCw,
  MessageSquare,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Globe,
  CreditCard,
  Armchair,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessProfile, EventItem, EventTicket, EventScheduleDate, EventTimeSlot } from '../../types';
import { purchaseEventTicketTransaction, reserveEventSeat, releaseEventSeat } from '../../services/firebaseService';
import { loadRazorpayScript } from '../../services/razorpayService';

interface EventCheckoutModalProps {
  event: EventItem | null;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticket: EventTicket) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [paymentMode, setPaymentMode] = useState<'online' | 'upi_qr'>('online');
  const [upiUtr, setUpiUtr] = useState('');
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<string | null>(null);

  // Date & Slot Selection State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<EventTicket | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(600); // 10 minutes hold timer

  // Build list of valid schedule dates
  const availableScheduleDates: EventScheduleDate[] = useMemo(() => {
    if (!event) return [];
    if (event.scheduleDates && event.scheduleDates.length > 0) {
      return event.scheduleDates.filter((d) => !d.isCancelled);
    }
    // Fallback for single legacy date
    if (event.eventDate) {
      const defaultSlot: EventTimeSlot = {
        id: `slot_default_${event.id}`,
        startTime: event.eventTime || '18:00',
        endTime: '',
        capacity: event.capacity || 50,
        ticketsSold: event.ticketsSold || 0,
        seatsRemaining: event.seatsRemaining || event.capacity || 50,
        label: 'Main Session',
      };
      return [
        {
          id: `date_${event.eventDate}`,
          date: event.eventDate,
          slots: [defaultSlot],
        },
      ];
    }
    return [];
  }, [event]);

  // Set initial selected date & slot when modal opens or event changes
  useEffect(() => {
    if (!isOpen || !event) return;
    setConfirmedTicket(null);
    setErrorMessage(null);
    setHoldSecondsLeft(600);

    const todayStr = new Date().toISOString().split('T')[0];

    // Find first available future/today date with valid slots
    const validFutureDate = availableScheduleDates.find((d) => d.date >= todayStr) || availableScheduleDates[0];
    if (validFutureDate) {
      setSelectedDate(validFutureDate.date);
      // Initialize calendar view to this month
      try {
        const parsed = new Date(`${validFutureDate.date}T00:00:00`);
        setCalendarViewDate(parsed);
      } catch (e) {
        setCalendarViewDate(new Date());
      }

      // Pick first non-sold-out slot
      const firstAvailSlot = validFutureDate.slots.find((s) => (s.seatsRemaining ?? s.capacity ?? 1) > 0) || validFutureDate.slots[0];
      if (firstAvailSlot) {
        setSelectedSlotId(firstAvailSlot.id);
      }
    }
  }, [isOpen, event, availableScheduleDates]);

  // Timer countdown while modal is open
  useEffect(() => {
    if (!isOpen || confirmedTicket) return;
    const interval = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, confirmedTicket]);

  if (!isOpen || !event) return null;

  // Selected date object
  const currentScheduleDate = availableScheduleDates.find((d) => d.date === selectedDate) || availableScheduleDates[0];
  const currentSlots = currentScheduleDate?.slots || [];
  const activeSlot = currentSlots.find((s) => s.id === selectedSlotId) || currentSlots[0];

  // Active slot capacity
  const slotCapacity = activeSlot?.capacity || event.capacity || 50;
  const slotSold = activeSlot?.ticketsSold || 0;
  const slotSeatsRemaining = activeSlot?.seatsRemaining !== undefined
    ? Number(activeSlot.seatsRemaining)
    : Math.max(0, slotCapacity - slotSold);

  const isSlotSoldOut = slotSeatsRemaining <= 0;
  const isEventSoldOut = event.status === 'sold_out' || (event.seatsRemaining !== undefined && event.seatsRemaining <= 0);
  const isFree = event.price === 0 || event.isFree;

  // Registration window check
  const todayStr = new Date().toISOString().split('T')[0];
  const isRegistrationNotYetOpen = Boolean(event.registrationStartDate && todayStr < event.registrationStartDate);
  const isRegistrationClosed = Boolean(event.registrationEndDate && todayStr > event.registrationEndDate);

  // Month Calendar Matrix Computation
  const calYear = calendarViewDate.getFullYear();
  const calMonth = calendarViewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startWeekday = firstDay.getDay(); // 0 = Sun
    const totalDays = lastDay.getDate();

    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isAvailable: boolean;
      isPast: boolean;
      isSelected: boolean;
      isSoldOut: boolean;
    }> = [];

    const availableDateSet = new Set(availableScheduleDates.map((d) => d.date));

    // Previous month padding
    const prevMonthLastDay = new Date(calYear, calMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(calYear, calMonth - 1, prevMonthLastDay - i);
      const dStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateString: dStr,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isAvailable: false,
        isPast: dStr < todayStr,
        isSelected: false,
        isSoldOut: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(calMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dStr = `${calYear}-${mm}-${dd}`;
      const isSched = availableDateSet.has(dStr);
      const isPast = dStr < todayStr;
      const schedObj = availableScheduleDates.find((s) => s.date === dStr);
      const isDateAllSoldOut = Boolean(
        schedObj &&
        schedObj.slots.every((slot) => (slot.seatsRemaining !== undefined ? slot.seatsRemaining <= 0 : (slot.ticketsSold || 0) >= (slot.capacity || 1)))
      );

      days.push({
        dateString: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isAvailable: isSched && !isPast && !isDateAllSoldOut,
        isPast,
        isSelected: dStr === selectedDate,
        isSoldOut: isDateAllSoldOut,
      });
    }

    // Next month padding to fill row
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(calYear, calMonth + 1, n);
      const dStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateString: dStr,
        dayNumber: n,
        isCurrentMonth: false,
        isAvailable: false,
        isPast: false,
        isSelected: false,
        isSoldOut: false,
      });
    }

    return days;
  }, [calYear, calMonth, availableScheduleDates, selectedDate, todayStr]);

  const handlePrevCalMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextCalMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth + 1, 1));
  };

  // Selected Time string representation
  const selectedTimeString = activeSlot
    ? activeSlot.endTime
      ? `${activeSlot.startTime} – ${activeSlot.endTime}`
      : activeSlot.startTime
    : event.eventTime || '18:00';

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePurchase = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !event) return;

    if (isRegistrationNotYetOpen) {
      setErrorMessage(`Registration for this event opens on ${event.registrationStartDate}.`);
      return;
    }

    if (isRegistrationClosed) {
      setErrorMessage(`Registration for this event closed on ${event.registrationEndDate}.`);
      return;
    }

    if (isSlotSoldOut || isEventSoldOut) {
      setErrorMessage('This time slot is completely sold out. Please select another available slot or date.');
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for WhatsApp ticket delivery.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      if (isFree) {
        // Free Ticket Flow
        const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
          eventDate: selectedDate,
          eventTime: selectedTimeString,
          slotId: selectedSlotId || activeSlot?.id,
          timezone: event.timezone || 'Asia/Kolkata',
          paymentStatus: 'free',
          seatNumber: selectedSeatNumber || undefined,
        });
        setConfirmedTicket(ticket);
        prepareWhatsAppConfirmation(ticket);
        if (onSuccess) onSuccess(ticket);
        return;
      }

      // Paid Event Flow: Direct UPI QR Mode
      if (paymentMode === 'upi_qr') {
        const holdId = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await reserveEventSeat(business.id, event.id, holdId, 10 * 60 * 1000);

        const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
          eventDate: selectedDate,
          eventTime: selectedTimeString,
          slotId: selectedSlotId || activeSlot?.id,
          timezone: event.timezone || 'Asia/Kolkata',
          paymentStatus: 'paid',
          paymentId: upiUtr ? `UPI-${upiUtr.trim()}` : `UPI-${Date.now()}`,
          notes: upiUtr ? `Paid via UPI QR, UTR: ${upiUtr}` : 'Paid via UPI QR',
          seatNumber: selectedSeatNumber || undefined,
          holdId: holdId,
        });

        setConfirmedTicket(ticket);
        prepareWhatsAppConfirmation(ticket);
        if (onSuccess) onSuccess(ticket);
        return;
      }

      // Online Gateway Flow via Server Order Creation
      const holdId = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        await reserveEventSeat(business.id, event.id, holdId, 10 * 60 * 1000);
      } catch (reserveErr: any) {
        setErrorMessage(reserveErr.message || 'Sold Out. Unable to reserve seat within atomic limit.');
        setLoading(false);
        return;
      }

      try {
        let orderData: any = null;

        try {
          const rzpOrderRes = await fetch('/api/events/create-rzp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: business.id,
              eventId: event.id,
              customerName: customerName.trim(),
              customerPhone: cleanPhone,
              eventDate: selectedDate,
              eventTime: selectedTimeString,
              slotId: selectedSlotId || activeSlot?.id,
              timezone: event.timezone || 'Asia/Kolkata',
            }),
          });

          if (rzpOrderRes.ok) {
            orderData = await rzpOrderRes.json().catch(() => null);
          } else {
            const errData = await rzpOrderRes.json().catch(() => ({}));
            console.error('[EventCheckout] Server Razorpay error:', errData);
            throw new Error(errData?.error || "Payment couldn't be initialized. Please try again in a moment.");
          }
        } catch (fetchErr: any) {
          await releaseEventSeat(business.id, event.id, holdId).catch(() => {});
          setErrorMessage(fetchErr?.message || "Payment couldn't be started. Please check your connection and try again.");
          setLoading(false);
          return;
        }

        if (!orderData || !orderData.rzpOrderId || !orderData.keyId) {
          await releaseEventSeat(business.id, event.id, holdId).catch(() => {});
          setErrorMessage(orderData?.error || "Payment couldn't be started. Please try again in a moment.");
          setLoading(false);
          return;
        }

        // Launch Live Razorpay Payment Modal
        await loadRazorpayScript();
        const RazorpayClass = (window as any).Razorpay;

        if (!RazorpayClass) {
          await releaseEventSeat(business.id, event.id, holdId).catch(() => {});
          setErrorMessage('Payment gateway SDK failed to load. Please disable ad-blockers and try again.');
          setLoading(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: business.name,
          description: `Ticket for ${event.title} (${selectedDate})`,
          image: business.logo || undefined,
          order_id: orderData.rzpOrderId,
          handler: async function (response: any) {
            try {
              setLoading(true);
              const verifyRes = await fetch('/api/events/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  businessId: business.id,
                  eventId: event.id,
                  eventDate: selectedDate,
                  eventTime: selectedTimeString,
                  slotId: selectedSlotId || activeSlot?.id,
                  timezone: event.timezone || 'Asia/Kolkata',
                }),
              });

              if (!verifyRes.ok) {
                const errData = await verifyRes.json().catch(() => ({}));
                throw new Error(errData?.error || 'Payment verification failed on server');
              }

              const { ticket } = await purchaseEventTicketTransaction(business.id, event.id, {
                customerName: customerName.trim(),
                customerPhone: cleanPhone,
                customerEmail: customerEmail.trim() || undefined,
                eventDate: selectedDate,
                eventTime: selectedTimeString,
                slotId: selectedSlotId || activeSlot?.id,
                timezone: event.timezone || 'Asia/Kolkata',
                paymentStatus: 'paid',
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                seatNumber: selectedSeatNumber || undefined,
                holdId: holdId,
              });

              setConfirmedTicket(ticket);
              prepareWhatsAppConfirmation(ticket);
              if (onSuccess) onSuccess(ticket);
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment was received but ticket finalization encountered an issue. Please contact the host.');
            } finally {
              setLoading(false);
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
              try {
                await releaseEventSeat(business.id, event.id, holdId);
              } catch (e) {
                console.error('Failed to release seat hold on dismiss', e);
              }
              setLoading(false);
            },
          },
        };

        const rzp = new RazorpayClass(options);
        rzp.on('payment.failed', async function (resp: any) {
          setErrorMessage(resp.error?.description || 'Payment failed. Please try again.');
          try {
            await releaseEventSeat(business.id, event.id, holdId);
          } catch (e) {
            console.error('Failed to release seat hold on failure', e);
          }
          setLoading(false);
        });
        rzp.open();
      } catch (payInitErr: any) {
        await releaseEventSeat(business.id, event.id, holdId).catch(() => {});
        throw payInitErr;
      }
    } catch (err: any) {
      console.error('Error during ticket booking:', err);
      setErrorMessage(err.message || 'Unable to reserve seat. It may have just sold out.');
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
          eventDate: ticket.eventDate,
          eventTime: ticket.eventTime,
          timezone: ticket.timezone || event.timezone,
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
        const data = await response.json().catch(() => null);
        if (data?.whatsAppUrl) {
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

  const handleShareWithFriends = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/events/${business.slug || business.id}?event=${event.id}#event-${event.id}`;
    const text = `🎟️ I just reserved my ticket for "${event.title}" on ${selectedDate} with ${business.name}! Secure your seat: ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: event.title,
        text,
        url: shareUrl,
      }).catch(() => {});
      return;
    }

    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const buildGoogleCalendarUrl = () => {
    if (!event || !confirmedTicket) return '#';
    const dateClean = (confirmedTicket.eventDate || selectedDate || '').replace(/-/g, '');
    const timeMatch = (confirmedTicket.eventTime || '').match(/(\d{1,2}):(\d{2})/);
    const startHour = timeMatch ? timeMatch[1].padStart(2, '0') : '18';
    const startMin = timeMatch ? timeMatch[2] : '00';
    const startStr = `${dateClean}T${startHour}${startMin}00`;
    const endHour = (Number(startHour) + 1).toString().padStart(2, '0');
    const endStr = `${dateClean}T${endHour}${startMin}00`;

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `Masterclass Session with ${business.name}\nTicket Code: ${confirmedTicket.ticketId}\nDate: ${confirmedTicket.eventDate}\nTime: ${confirmedTicket.eventTime} (${confirmedTicket.timezone || 'IST'})\n${
        event.meetingUrl ? `Join Link: ${event.meetingUrl}` : `Venue: ${event.venueAddress || ''}`
      }`
    );
    const location = encodeURIComponent(event.format === 'online' ? (event.meetingUrl || 'Online Webinar') : (event.venueAddress || ''));

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmedTicket ? (
          /* STEP 1: REGISTRATION & CUSTOMER SCHEDULE PICKER */
          <div className="space-y-5">
            {/* Event Summary Banner */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                <img
                  src={event.coverImage || business.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80'}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs">
                    {event.format === 'online' ? 'Online Webinar' : event.format === 'hybrid' ? 'Hybrid' : 'In-Person'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {event.price === 0 ? 'Free Entry' : `₹${event.price}`}
                  </span>
                  {event.timezone && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {event.timezone}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                  {event.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Hosted by <strong className="text-slate-700">{business.name}</strong>
                </p>
              </div>
            </div>

            {/* Hold Timer Banner */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Atomic Seat Reservation Active:</span>
              </span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-amber-200 text-amber-800">
                {formatTimer(holdSecondsLeft)}
              </span>
            </div>

            {/* ========================================================= */}
            {/* STEP 1A: SELECT DATE (INTERACTIVE CALENDAR / DATE PICKER) */}
            {/* ========================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>1. Select Preferred Date</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {availableScheduleDates.length} date{availableScheduleDates.length > 1 ? 's' : ''} available
                </span>
              </div>

              {/* Horizontal Date Pills for Fast Selection */}
              {availableScheduleDates.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {availableScheduleDates.map((d) => {
                    const isSelected = selectedDate === d.date;
                    const parsed = new Date(`${d.date}T00:00:00`);
                    const weekday = parsed.toLocaleDateString(undefined, { weekday: 'short' });
                    const monthDay = parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const isDatePast = d.date < todayStr;

                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d.date);
                          // Auto select first slot for this date
                          if (d.slots.length > 0) {
                            setSelectedSlotId(d.slots[0].id);
                          }
                        }}
                        disabled={isDatePast}
                        className={`px-3 py-2 rounded-2xl border text-center shrink-0 transition cursor-pointer min-w-[85px] ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : isDatePast
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30'
                        }`}
                      >
                        <span className={`block text-[10px] font-bold uppercase ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {weekday}
                        </span>
                        <span className="block text-xs font-black">
                          {monthDay}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Interactive Calendar Month Picker (if multiple or long range dates) */}
              {availableScheduleDates.length > 3 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevCalMonth}
                        className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextCalMonth}
                        className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_NAMES.map((w) => (
                      <span key={w} className="text-[10px] font-bold text-slate-400 uppercase">
                        {w.slice(0, 2)}
                      </span>
                    ))}
                    {calendarDays.map((cDay, idx) => {
                      if (!cDay.isCurrentMonth) {
                        return <div key={idx} className="h-7" />;
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!cDay.isAvailable}
                          onClick={() => {
                            if (cDay.isAvailable) {
                              setSelectedDate(cDay.dateString);
                              const targetDateObj = availableScheduleDates.find((sd) => sd.date === cDay.dateString);
                              if (targetDateObj && targetDateObj.slots.length > 0) {
                                setSelectedSlotId(targetDateObj.slots[0].id);
                              }
                            }
                          }}
                          className={`h-7 w-full rounded-lg text-xs font-bold transition flex items-center justify-center ${
                            cDay.isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : cDay.isAvailable
                              ? 'bg-white hover:bg-emerald-100 text-slate-900 border border-emerald-300/80 cursor-pointer font-black'
                              : cDay.isPast
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          {cDay.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* STEP 1B: SELECT TIME SLOT */}
            {/* ========================================================= */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>2. Select Time Slot for {selectedDate}</span>
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  {currentSlots.length} slot{currentSlots.length > 1 ? 's' : ''} on this date
                </span>
              </div>

              {currentSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No time slots configured for this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const sCap = slot.capacity || event.capacity || 50;
                    const sSold = slot.ticketsSold || 0;
                    const sLeft = slot.seatsRemaining !== undefined ? Number(slot.seatsRemaining) : Math.max(0, sCap - sSold);
                    const isFull = sLeft <= 0;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : isFull
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ''}</span>
                          </span>

                          {isFull ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                              SOLD OUT
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                              {sLeft} left
                            </span>
                          )}
                        </div>

                        {slot.label && (
                          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                            {slot.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Atomic Concurrency Guarantee Note */}
            <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3 flex items-center justify-between text-[11px] text-emerald-950">
              <span className="flex items-center gap-1.5 font-bold">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Selected Slot Capacity:</span>
              </span>
              <span className="font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {slotSeatsRemaining} of {slotCapacity} seats remaining
              </span>
            </div>

            {/* ========================================================= */}
            {/* STEP 1C: ATTENDEE CONTACT DETAILS */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <label className="font-bold text-slate-900 text-xs block">
                3. Attendee Information
              </label>

              <div className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp Mobile Number *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Ticket &amp; QR delivered via WhatsApp</p>
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">For Google Calendar invite</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit / Pay Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePurchase}
                disabled={loading || !customerName.trim() || !customerPhone.trim() || isSlotSoldOut || isEventSoldOut}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reserving Seat Authoritatively...</span>
                  </>
                ) : isFree ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Free Registration for {selectedDate}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{event.price} &amp; Confirm Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STEP 2: CONFIRMED TICKET & QR CODE DISPLAY */
          /* ========================================================= */
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Registration Confirmed!
              </h3>
              <p className="text-xs text-slate-500">
                Your ticket has been generated and seat capacity is locked.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 text-left space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket ID</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-slate-900">
                    <span>{confirmedTicket.ticketId}</span>
                    <button
                      type="button"
                      onClick={handleCopyTicketCode}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <QRCodeSVG value={confirmedTicket.ticketId} size={48} level="M" />
                </div>
              </div>

              {/* Event & Schedule Details */}
              <div className="space-y-2 text-xs text-slate-700">
                <div className="font-bold text-sm text-slate-900">
                  {event.title}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{confirmedTicket.eventDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{confirmedTicket.eventTime}</span>
                  </div>
                </div>

                {confirmedTicket.timezone && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>Timezone: {confirmedTicket.timezone}</span>
                  </div>
                )}

                {event.format === 'online' ? (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-900 text-xs">
                    <div className="font-bold flex items-center gap-1 mb-0.5">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      <span>Online Meeting Access</span>
                    </div>
                    <span className="text-[11px] text-blue-800">
                      {event.meetingUrl ? (
                        <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">
                          {event.meetingUrl}
                        </a>
                      ) : (
                        'Meeting link will be dispatched closer to the session.'
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-900 text-xs">
                    <div className="font-bold flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Physical Venue</span>
                    </div>
                    <span className="text-[11px] text-emerald-800">
                      {event.venueAddress || 'Venue'}{event.venueCity ? `, ${event.venueCity}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Ticket Confirmation to WhatsApp</span>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={buildGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add to Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={handleShareWithFriends}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedShare ? 'Link Copied!' : 'Share Event'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
