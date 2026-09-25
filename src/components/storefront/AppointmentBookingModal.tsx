import React, { useState } from 'react';
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
} from 'lucide-react';
import { BusinessProfile, CatalogItem, Booking } from '../../types';
import { createBooking } from '../../services/firebaseService';

interface AppointmentBookingModalProps {
  business: BusinessProfile;
  item: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
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
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedBooking, setPlacedBooking] = useState<Booking | null>(null);

  if (!isOpen || !item) return null;

  const totalAmount =
    typeof item.salePrice === 'number' && item.salePrice >= 0 && item.salePrice < item.price
      ? item.salePrice
      : (item.price ?? 0);

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
        totalAmount,
        status: 'pending' as const,
        notes: notes.trim() || undefined,
      };

      const created = await createBooking(business.id, bookingData);
      setPlacedBooking(created);

      // WhatsApp confirmation
      const waText = encodeURIComponent(
        `📅 *NEW APPOINTMENT REQUEST*\n` +
        `Booking ID: *#${created.bookingNumber}*\n\n` +
        `🛎️ *Service:* ${item.name}\n` +
        `🗓️ *Date:* ${bookingDate}\n` +
        `🕒 *Time:* ${bookingTimeSlot}\n\n` +
        `👤 *Customer:* ${customerName}\n` +
        `📞 *Contact:* ${customerPhone}\n` +
        (notes ? `📝 *Notes:* ${notes}\n` : '') +
        `\n*Total Estimate:* ${business.currencySymbol}${totalAmount}\n\n` +
        `Please confirm this appointment.`
      );

      const merchantPhone = (business.whatsapp || business.phone || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/${merchantPhone}?text=${waText}`;
      window.open(waUrl, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to book slot. It might be taken.');
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
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">Appointment Requested!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking #{placedBooking.bookingNumber} for {item.name} is sent to {business.name}.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">{bookingDate} @ {bookingTimeSlot}</span>
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
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Service Appointment</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">{item.name}</h2>
              <p className="text-xs text-slate-500">
                {business.currencySymbol}{item.salePrice || item.price}
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Preferred Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Preferred Time</label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    required
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                    <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                  </select>
                </div>
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

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Estimated Amount</span>
                  <span className="text-xl font-extrabold text-slate-900 font-heading">
                    {business.currencySymbol}{totalAmount}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                   Pay at Venue
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                <span>Request Appointment</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
