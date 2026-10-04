import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  User,
  Phone,
  Mail,
  Video,
  Globe,
  Sparkles,
  CheckCircle2,
  Calendar,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { BusinessProfile, CatalogItem, Booking } from '../../types';
import { getCatalogItems, createBooking, getBookedSlotsForDate, recordAnalyticsEvent } from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';

interface StandaloneConsultationViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  isOwner?: boolean;
}

const DEFAULT_TIME_SLOTS = [
  '10:00 AM - 10:30 AM',
  '11:00 AM - 11:30 AM',
  '02:00 PM - 02:30 PM',
  '03:30 PM - 04:00 PM',
  '05:00 PM - 05:30 PM',
  '06:30 PM - 07:00 PM',
];

export const StandaloneConsultationView: React.FC<StandaloneConsultationViewProps> = ({
  business,
  onBackToDashboard,
  isOwner = false,
}) => {
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Load Creator Consultation Services
  useEffect(() => {
    let isMounted = true;
    async function loadServices() {
      setIsLoading(true);
      try {
        recordAnalyticsEvent(business.id, 'consultation_view', { slug: business.slug }).catch(() => {});
        const items = await getCatalogItems(business.id);
        if (!isMounted) return;

        // Strictly filter for active creator consultation items
        const consultItems = (items || []).filter(
          (i) =>
            i.isActive !== false &&
            (i.productType === 'consultation_slot' ||
              Boolean(i.consultationDuration) ||
              Boolean(i.consultationTimeSlots && i.consultationTimeSlots.length > 0))
        );

        if (consultItems.length > 0) {
          setServices(consultItems);
          setSelectedService(consultItems[0]);
        } else {
          // Strictly no fake consultation fallback
          setServices([]);
          setSelectedService(null);
        }
      } catch (err) {
        console.error('Error fetching consultation items:', err);
        setServices([]);
        setSelectedService(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadServices();
    return () => {
      isMounted = false;
    };
  }, [business.id]);

  // Fetch Booked Slots when Date or Service changes
  useEffect(() => {
    let isMounted = true;
    async function fetchBooked() {
      if (!selectedService || !bookingDate) return;
      setIsLoadingSlots(true);
      try {
        const booked = await getBookedSlotsForDate(business.id, selectedService.id, bookingDate);
        if (isMounted) {
          setBookedSlots(booked || []);
        }
      } catch (err) {
        console.error('Error loading booked slots:', err);
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    }

    fetchBooked();
    return () => {
      isMounted = false;
    };
  }, [business.id, selectedService?.id, bookingDate]);

  const activeTimeSlots =
    selectedService?.consultationTimeSlots && selectedService.consultationTimeSlots.length > 0
      ? selectedService.consultationTimeSlots
      : DEFAULT_TIME_SLOTS;

  const availableSlots = activeTimeSlots.filter((slot) => !bookedSlots.includes(slot));

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(selectedSlot)) {
      setSelectedSlot(availableSlots[0]);
    } else if (availableSlots.length === 0) {
      setSelectedSlot('');
    }
  }, [availableSlots, selectedSlot]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone or WhatsApp number');
      return;
    }
    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }

    try {
      setIsSubmitting(true);
      const serviceName = selectedService?.name || '1:1 Consultation';
      const servicePrice = selectedService?.salePrice || selectedService?.price || 0;

      const bookingData = {
        bookingType: 'appointment' as const,
        itemId: selectedService?.id || 'consultation',
        itemName: serviceName,
        itemImage: selectedService?.images?.[0] || business.logo || business.profileImage,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        bookingDate,
        bookingTimeSlot: selectedSlot,
        timezone,
        totalAmount: servicePrice,
        paymentStatus: 'pending' as const,
        status: 'confirmed' as const,
        notes: notes.trim() || undefined,
      };

      const result = await createBooking(business.id, bookingData);
      setConfirmedBooking(result);
    } catch (err: any) {
      console.error('Error booking consultation:', err);
      setError(err?.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappNumber = (business.whatsapp || business.phone || '').replace(/[^0-9]/g, '');
  const cleanCurrency = business.currencySymbol || '₹';

  const isProfileVerified = Boolean(business.isVerified || (business as any).verified);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Explicit Owner Preview Header */}
      {isOwner && onBackToDashboard && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Creator Owner Preview Mode</span>
            <span className="text-slate-400">• Standalone 1:1 Consultations Page</span>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-50 border-2 border-blue-100 p-1 shrink-0 shadow-sm overflow-hidden flex items-center justify-center">
              <SafeImage
                fallbackType="avatar"
                src={business.logo || business.profileImage || ''}
                alt={business.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Video className="w-3 h-3 text-blue-600" />
                  1:1 Consultations
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

              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {business.tagline || business.description || 'Schedule a dedicated one-on-one consultation, mentorship session, or advisory call directly with the creator.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Timezone: {timezone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  Google Meet / Video Call
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold">Loading available consultation sessions...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No consultation sessions available.</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {business.name} has not configured any public consultation or mentorship sessions at this time.
              </p>
            </div>
          </div>
        ) : confirmedBooking ? (
          /* Confirmation Screen */
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-10 shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Booking Confirmed
              </span>
              <h2 className="text-2xl font-black font-heading text-slate-900">
                You're Scheduled!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Your consultation session with <strong>{business.name}</strong> has been successfully booked.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.itemName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">
                  {new Date(confirmedBooking.bookingDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Time Slot:</span>
                <span className="font-bold text-blue-700">{confirmedBooking.bookingTimeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attendee:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.customerName}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hi ${business.name}, I just booked a 1:1 consultation "${confirmedBooking.itemName}" for ${confirmedBooking.bookingDate} at ${confirmedBooking.bookingTimeSlot}. My name is ${confirmedBooking.customerName}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Confirmation on WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Book Another Session
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Booking Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Session Types & Creator Info */}
            <div className="md:col-span-5 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Session Type
                </h3>

                <div className="space-y-3">
                  {services.map((item) => {
                    const isSelected = selectedService?.id === item.id;
                    const price = item.salePrice || item.price || 0;
                    const duration = item.consultationDuration || 30;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedService(item)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                {item.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {item.shortDescription || item.detailedDescription || 'Personalized 1-on-1 strategy and advisory session.'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-extrabold text-slate-900">
                                {price > 0 ? `${cleanCurrency}${price}` : 'Free'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 text-blue-700 font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              {duration} Minutes
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Video className="w-3.5 h-3.5" />
                              Video Call
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* Trust Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Direct Creator Guarantee
                </div>
                <p className="leading-relaxed text-[11px] text-slate-500">
                  Calls are conducted directly with {business.name}. Meeting link and calendar invite are shared immediately upon booking.
                </p>
              </div>
            </div>

            {/* Right Column: Schedule Slot & Customer Details Form */}
            <div className="md:col-span-7">
              <form
                onSubmit={handleBookingSubmit}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Choose Date &amp; Time
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your preferred consultation date and available slot.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      min={todayStr}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Slot Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Available Time Slots *
                    </label>
                    {isLoadingSlots && (
                      <span className="text-[10px] text-blue-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking availability...
                      </span>
                    )}
                  </div>

                  {availableSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No slots available for this date. Please pick another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Your Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        WhatsApp / Phone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. +91 9876543210"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Meeting Agenda / Questions (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What would you like to discuss or accomplish during this consultation?"
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlot}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scheduling Your Session...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>Confirm &amp; Book Consultation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {business.name}. Hosted on Storelly Creator Studio.</p>
      </footer>
    </div>
  );
};
