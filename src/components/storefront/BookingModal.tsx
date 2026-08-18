import React, { useState } from 'react';
import {
  X,
  CalendarCheck,
  Clock,
  BedDouble,
  Car,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile, CatalogItem, Booking } from '../../types';
import { createBooking } from '../../services/firebaseService';

interface BookingModalProps {
  business: BusinessProfile;
  item: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  business,
  item,
  isOpen,
  onClose,
}) => {
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Date and Time fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [guestsCount, setGuestsCount] = useState(1);
  const [vehicleQuantity, setVehicleQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedBooking, setPlacedBooking] = useState<Booking | null>(null);

  if (!isOpen || !item) return null;

  const bookingType: 'appointment' | 'room_stay' | 'vehicle_rental' =
    item.type === 'room'
      ? 'room_stay'
      : item.type === 'vehicle'
      ? 'vehicle_rental'
      : 'appointment';

  // Calculate total price based on duration/nights
  let calculatedAmount = item.salePrice || item.price;
  if (bookingType === 'room_stay') {
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const diffDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
    calculatedAmount = (item.salePrice || item.price) * diffDays;
  } else if (bookingType === 'vehicle_rental') {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
    calculatedAmount = (item.salePrice || item.price) * diffDays * vehicleQuantity;
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Please enter your WhatsApp contact number');
      return;
    }

    try {
      setIsSubmitting(true);

      const bookingData = {
        bookingType,
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        bookingDate: bookingType === 'appointment' ? bookingDate : checkInDate || startDate,
        bookingTimeSlot: bookingType === 'appointment' ? bookingTimeSlot : undefined,
        checkInDate: bookingType === 'room_stay' ? checkInDate : undefined,
        checkOutDate: bookingType === 'room_stay' ? checkOutDate : undefined,
        startDate: bookingType === 'vehicle_rental' ? startDate : undefined,
        endDate: bookingType === 'vehicle_rental' ? endDate : undefined,
        guestsCount: bookingType === 'room_stay' ? guestsCount : undefined,
        vehicleQuantity: bookingType === 'vehicle_rental' ? vehicleQuantity : undefined,
        totalAmount: calculatedAmount,
        status: 'pending' as const,
        notes: notes.trim() || undefined,
      };

      const created = await createBooking(business.id, bookingData);
      setPlacedBooking(created);

      // WhatsApp formatted confirmation text
      const waText = encodeURIComponent(
        `📅 *NEW BOOKING REQUEST*\n` +
        `Booking ID: *#${created.bookingNumber}*\n` +
        `Business: *${business.name}*\n\n` +
        `🛎️ *Service/Item:* ${item.name}\n` +
        `👤 *Customer:* ${customerName}\n` +
        `📞 *Contact:* ${customerPhone}\n` +
        (bookingType === 'appointment'
          ? `🗓️ *Date & Time:* ${bookingDate} @ ${bookingTimeSlot}\n`
          : '') +
        (bookingType === 'room_stay'
          ? `🏨 *Check-in:* ${checkInDate}\n🏨 *Check-out:* ${checkOutDate}\n👥 *Guests:* ${guestsCount}\n`
          : '') +
        (bookingType === 'vehicle_rental'
          ? `🚗 *From:* ${startDate} *To:* ${endDate}\n🔢 *Quantity:* ${vehicleQuantity}\n`
          : '') +
        (notes ? `📝 *Notes:* ${notes}\n` : '') +
        `\n*Total Estimate:* ${business.currencySymbol}${calculatedAmount}\n\n` +
        `Please confirm this booking reservation.`
      );

      const merchantPhone = (business.whatsapp || business.phone).replace(/\D/g, '');
      const waUrl = `https://wa.me/${merchantPhone}?text=${waText}`;
      window.open(waUrl, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {placedBooking ? (
          /* Confirmation state */
          <div className="text-center py-6 space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Booking Requested
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2 font-heading">
                Booking Request Sent!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking #{placedBooking.bookingNumber} for {item.name} has been sent to {business.name}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Estimate:</span>
                <span className="font-bold text-slate-900">
                  {business.currencySymbol}
                  {placedBooking.totalAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-emerald-700 uppercase">
                  {placedBooking.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const merchantPhone = (business.whatsapp || business.phone).replace(/\D/g, '');
                  const waUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(
                    `Hi ${business.name}, I am checking status for booking #${placedBooking.bookingNumber}.`
                  )}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlacedBooking(null);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="overflow-y-auto flex-1 pr-1 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Direct Booking
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">{item.name}</h2>
              <p className="text-xs text-slate-500">
                {business.name} • {business.currencySymbol}
                {item.salePrice || item.price}
                {item.unit ? ` / ${item.unit}` : ''}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Type specific date selection */}
              {bookingType === 'appointment' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={todayStr}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Time Slot *
                    </label>
                    <select
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    >
                      <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                      <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                      <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                      <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                      <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                      <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                    </select>
                  </div>
                </div>
              )}

              {bookingType === 'room_stay' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        value={checkInDate}
                        min={todayStr}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={checkInDate || todayStr}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={item.roomCapacity || 10}
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {bookingType === 'vehicle_rental' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Trip Start Date *
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min={todayStr}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Trip End Date *
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || todayStr}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Vehicle Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={vehicleQuantity}
                      onChange={(e) => setVehicleQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Customer Contact Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Contact Details
                </span>

                <div className="space-y-2.5">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Full Name *"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="WhatsApp Phone Number (e.g. +91 9876543210) *"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email Address (Optional)"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special requests, preferences, or pickup instructions (Optional)"
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Estimated Amount:</span>
                  <span className="text-base font-extrabold text-slate-900 font-heading">
                    {business.currencySymbol}
                    {calculatedAmount}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Pay at venue
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirm & Send to WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
