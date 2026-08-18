import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  Calendar,
  User,
  Phone,
  BedDouble,
  Car,
  Scissors,
  X,
  Loader2,
} from 'lucide-react';
import { BusinessProfile, Booking, BookingStatus } from '../../types';
import { getBookings, updateBookingStatus } from '../../services/firebaseService';

interface BookingManagerProps {
  business: BusinessProfile;
}

export const BookingManager: React.FC<BookingManagerProps> = ({ business }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fetched = await getBookings(business.id);
      setBookings(fetched);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      setIsUpdating(true);
      await updateBookingStatus(business.id, bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendWhatsAppUpdate = (booking: Booking) => {
    if (!booking.customerPhone) return;
    const cleanPhone = booking.customerPhone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${booking.customerName}!\n\n` +
      `Regarding your booking *${booking.bookingNumber}* for *${booking.itemName}* with *${business.name}*:\n` +
      `Date: ${booking.bookingDate || booking.checkInDate || booking.startDate}\n` +
      `${booking.bookingTimeSlot ? `Time Slot: ${booking.bookingTimeSlot}\n` : ''}` +
      `Status: *${booking.status.toUpperCase()}*\n\n` +
      `We look forward to serving you! Feel free to reply if you need any adjustments.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesQuery =
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Appointments & Bookings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage scheduled customer appointments, stay reservations, and vehicle rentals.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition"
        >
          Refresh Bookings
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings by customer, item name, booking #..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="all">All Statuses ({bookings.length})</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filteredBookings.map((bk) => (
            <div
              key={bk.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-sm text-slate-900">
                    {bk.bookingNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      bk.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : bk.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : bk.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {bk.status}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {bk.itemName}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="font-bold text-slate-800">{bk.customerName}</span>
                  <span>•</span>
                  <span>{bk.customerPhone}</span>
                  <span>•</span>
                  <span className="text-slate-500 font-medium">
                    📅 {bk.bookingDate || bk.checkInDate || bk.startDate}
                    {bk.bookingTimeSlot ? ` (${bk.bookingTimeSlot})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="font-extrabold text-base text-slate-900">
                    {business.currencySymbol}{bk.totalAmount}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppUpdate(bk)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition"
                    title="Send WhatsApp Update"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBooking(bk)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Bookings Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Customers can book appointments, hotel stays, or vehicles directly from your public storefront.
          </p>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Booking #{selectedBooking.bookingNumber}
                </h3>
                <p className="text-xs text-emerald-700 font-semibold">{selectedBooking.itemName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status switcher */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Booking Status
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['pending', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(selectedBooking.id, st)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition ${
                      selectedBooking.status === st
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium">{selectedBooking.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.bookingDate || selectedBooking.checkInDate || selectedBooking.startDate}
                </span>
              </div>
              {selectedBooking.bookingTimeSlot && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-semibold text-emerald-800">{selectedBooking.bookingTimeSlot}</span>
                </div>
              )}
              {selectedBooking.notes && (
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <span className="font-bold block text-slate-800">Special Notes:</span>
                  {selectedBooking.notes}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleSendWhatsAppUpdate(selectedBooking)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Customer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
