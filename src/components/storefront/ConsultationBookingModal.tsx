import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  Clock,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Globe,
  Video,
} from 'lucide-react';
import { BusinessProfile, CatalogItem, Booking } from '../../types';
import { createBooking } from '../../services/firebaseService';

interface ConsultationBookingModalProps {
  business: BusinessProfile;
  item: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultationBookingModal: React.FC<ConsultationBookingModalProps> = ({
  business,
  item,
  isOpen,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedBooking, setPlacedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    async function fetchBookedSlots() {
      if (!item || !bookingDate) return;
      try {
        setIsLoadingSlots(true);
        const { getBookedSlotsForDate } = await import('../../services/firebaseService');
        const booked = await getBookedSlotsForDate(business.id, item.id, bookingDate);
        setBookedSlots(booked || []);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    fetchBookedSlots();
  }, [item?.id, bookingDate, business.id]);

  const availableSlots = (item?.consultationTimeSlots || []).filter(
    (slot) => !bookedSlots.includes(slot)
  );

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(bookingTimeSlot)) {
      setBookingTimeSlot(availableSlots[0]);
    } else if (availableSlots.length === 0) {
      setBookingTimeSlot('');
    }
  }, [availableSlots, bookingTimeSlot]);

  if (!isOpen || !item) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit WhatsApp number');
      return;
    }

    try {
      setIsSubmitting(true);

      const bookingData = {
        bookingType: 'appointment' as const,
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || undefined,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        bookingDate,
        bookingTimeSlot,
        timezone,
        totalAmount: item.salePrice || item.price,
        status: 'pending' as const,
        notes: notes.trim() || undefined,
        meetingMethod: item.meetingPlatform || 'google_meet',
      };

      const created = await createBooking(business.id, bookingData);
      setPlacedBooking(created);

      // WhatsApp confirmation
      const waText = encodeURIComponent(
        `📅 *NEW 1:1 CONSULTATION REQUEST*\n` +
        `Booking ID: *#${created.bookingNumber}*\n\n` +
        `👤 *Creator:* ${business.name}\n` +
        `🛎️ *Session:* ${item.name}\n` +
        `🗓️ *Date:* ${bookingDate}\n` +
        `🕒 *Slot:* ${bookingTimeSlot}\n` +
        `🌍 *Timezone:* ${timezone}\n\n` +
        `👤 *Customer:* ${customerName}\n` +
        `📞 *Contact:* ${customerPhone}\n` +
        (notes ? `📝 *Notes:* ${notes}\n` : '') +
        `\n*Amount:* ${business.currencySymbol}${bookingData.totalAmount}\n\n` +
        `Please confirm this session.`
      );

      const merchantPhone = (business.whatsapp || business.phone || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/${merchantPhone}?text=${waText}`;
      window.open(waUrl, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to book slot. It might have just been taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {placedBooking ? (
          <div className="text-center py-6 space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">Consultation Requested!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking #{placedBooking.bookingNumber} for {item.name} is sent to {business.name}.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-bold text-slate-900">{bookingDate} @ {bookingTimeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold text-blue-600 capitalize">{item.meetingPlatform?.replace('_', ' ') || 'Online'}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">1:1 Consultation</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">{item.name}</h2>
              <p className="text-xs text-slate-500">
                Duration: {item.duration || 60} mins • {business.currencySymbol}{item.salePrice || item.price}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Available Slots</label>
                  <div className="relative">
                    <select
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                      disabled={isLoadingSlots || availableSlots.length === 0}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400 appearance-none pr-8"
                      required
                    >
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))
                      ) : (
                        <option value="">No slots available</option>
                      )}
                    </select>
                    {isLoadingSlots && (
                      <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Your Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-slate-100 bg-slate-50 rounded-xl text-slate-500 cursor-default"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Full Name *"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp Number *"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Price</span>
                  <span className="text-base font-extrabold text-slate-900 font-heading">
                    {business.currencySymbol}{item.salePrice || item.price}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Booking Only
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                <span>Book 1:1 Consultation</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
