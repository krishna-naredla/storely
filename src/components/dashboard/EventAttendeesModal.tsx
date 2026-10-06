import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Phone,
  MessageSquare,
  QrCode,
  Users,
  Ticket,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Armchair,
} from 'lucide-react';
import { EventItem, EventTicket, BusinessProfile } from '../../types';
import { subscribeToEventTickets, checkInTicket } from '../../services/firebaseService';
import { exportEventToGoogleCalendar } from '../../services/googleCalendarService';
import { auth } from '../../config/firebase';

interface EventAttendeesModalProps {
  event: EventItem | null;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const EventAttendeesModal: React.FC<EventAttendeesModalProps> = ({
  event,
  business,
  isOpen,
  onClose,
}) => {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'pending' | 'refunded'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [calendarSyncSuccess, setCalendarSyncSuccess] = useState<{
    htmlLink: string;
    attendeesCount: number;
  } | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !event?.id || !business?.id || !auth?.currentUser) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToEventTickets(business.id, event.id, (loadedTickets) => {
      setTickets(loadedTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, event?.id, business?.id]);

  if (!isOpen || !event) return null;

  const totalAttendees = tickets.length;
  const checkedInCount = tickets.filter((t) => t.checkedIn).length;
  const refundedCount = tickets.filter((t) => t.paymentStatus === 'refunded').length;
  const activeAttendees = tickets.filter((t) => t.paymentStatus !== 'refunded');
  const checkInRate = activeAttendees.length > 0
    ? Math.round((checkedInCount / activeAttendees.length) * 100)
    : 0;

  const totalRevenue = tickets
    .filter((t) => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + (t.price || 0), 0);

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Unique booked dates in tickets
  const availableDates = React.useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.eventDate) set.add(t.eventDate);
    });
    return Array.from(set).sort();
  }, [tickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerPhone.includes(searchQuery) ||
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedDateFilter !== 'all' && ticket.eventDate !== selectedDateFilter) {
      return false;
    }

    if (filter === 'checked_in') return ticket.checkedIn && ticket.paymentStatus !== 'refunded';
    if (filter === 'pending') return !ticket.checkedIn && ticket.paymentStatus !== 'refunded';
    if (filter === 'refunded') return ticket.paymentStatus === 'refunded';
    return true;
  });

  const handleToggleCheckIn = async (ticket: EventTicket) => {
    try {
      setUpdatingId(ticket.id);
      await checkInTicket(business.id, ticket.id, !ticket.checkedIn);
    } catch (err) {
      console.error('Failed to update check-in status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedTicketId(ticketId);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  const handleSyncToGoogleCalendar = async () => {
    try {
      setSyncingCalendar(true);
      setCalendarError(null);
      const res = await exportEventToGoogleCalendar(event, tickets);
      setCalendarSyncSuccess({
        htmlLink: res.htmlLink,
        attendeesCount: res.attendeesCount,
      });
    } catch (err: any) {
      console.error('Calendar sync error:', err);
      setCalendarError(err.message || 'Failed to sync with Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  const handleExportCSV = () => {
    if (tickets.length === 0) return;

    const headers = ['Ticket ID', 'Selected Date', 'Selected Time Slot', 'Seat Number', 'Section', 'Attendee Name', 'Phone', 'Email', 'Payment Status', 'Price (INR)', 'Checked In', 'Registered Date'];
    const rows = tickets.map((t) => [
      `"${t.ticketId}"`,
      `"${t.eventDate || event.eventDate}"`,
      `"${t.eventTime || event.eventTime}"`,
      `"${t.seatNumber || 'N/A'}"`,
      `"${t.seatSection || 'General'}"`,
      `"${t.customerName}"`,
      `"${t.customerPhone}"`,
      `"${t.customerEmail || ''}"`,
      `"${t.paymentStatus}"`,
      t.price || 0,
      t.checkedIn ? 'Yes' : 'No',
      `"${new Date(t.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildWhatsAppReminderUrl = (ticket: EventTicket) => {
    const cleanPhone = ticket.customerPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone;
    
    let accessText = '';
    if (event.format === 'online') {
      accessText = event.meetingUrl ? `\n🔗 *Meeting Link:* ${event.meetingUrl}` : '';
    } else {
      accessText = `\n📍 *Venue:* ${event.venueAddress || ''}${event.venueCity ? `, ${event.venueCity}` : ''}`;
    }

    const seatText = ticket.seatNumber ? `\n💺 *Assigned Seat:* ${ticket.seatNumber} (${ticket.seatSection || 'General'})` : '';
    const ticketDate = ticket.eventDate || event.eventDate;
    const ticketTime = ticket.eventTime || event.eventTime;

    const msg = encodeURIComponent(
      `👋 Hi ${ticket.customerName},\n\n` +
      `Reminder for your upcoming session: *${event.title}* with ${business.name}!\n\n` +
      `🎫 *Ticket ID:* \`${ticket.ticketId}\`` +
      seatText +
      `\n📅 *Date:* ${ticketDate}\n` +
      `⏰ *Time:* ${ticketTime}${ticket.timezone ? ` (${ticket.timezone})` : ''}\n` +
      accessText +
      `\n\nLooking forward to seeing you!`
    );

    return `https://wa.me/${formattedPhone}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Ticket className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Attendee Roster & Check-In
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-lg">
              {event.title} • {event.eventDate} at {event.eventTime} ({event.format === 'online' ? 'Online' : 'Offline'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar Sync Button */}
            <button
              type="button"
              onClick={handleSyncToGoogleCalendar}
              disabled={syncingCalendar}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              title="Sync event and confirmed attendees to your Google Calendar"
            >
              {syncingCalendar ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{syncingCalendar ? 'Syncing...' : 'Sync Google Calendar'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={tickets.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Sync Notification Banner */}
        {calendarSyncSuccess && (
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-2.5 flex items-center justify-between text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Successfully synchronized event and <strong>{calendarSyncSuccess.attendeesCount}</strong> attendees to your Google Calendar!
              </span>
            </div>
            <a
              href={calendarSyncSuccess.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-blue-700 underline hover:text-blue-900"
            >
              View in Calendar <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {calendarError && (
          <div className="bg-rose-50 border-b border-rose-100 px-5 py-2.5 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{calendarError}</span>
            </div>
            <button
              type="button"
              onClick={() => setCalendarError(null)}
              className="text-rose-600 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-white border-b border-slate-100 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Total Registered</span>
            <span className="text-lg font-black text-slate-900 font-heading">
              {totalAttendees} <span className="text-xs font-normal text-slate-500">/ {event.capacity} seats</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-emerald-700 font-semibold block text-[11px]">Checked-In</span>
            <span className="text-lg font-black text-emerald-950 font-heading">
              {checkedInCount} <span className="text-xs font-bold text-emerald-800">({checkInRate}%)</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
            <span className="text-blue-700 font-semibold block text-[11px]">Total Revenue</span>
            <span className="text-lg font-black text-blue-950 font-heading">
              ₹{totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
            <span className="text-amber-700 font-semibold block text-[11px]">Seats Remaining</span>
            <span className="text-lg font-black text-amber-950 font-heading">
              {event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold)}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by attendee name, phone, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {availableDates.length > 1 && (
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Dates ({tickets.length})</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {(['all', 'checked_in', 'pending', 'refunded'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                  filter === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Attendee List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Loading attendee roster...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">No attendees found</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {searchQuery
                  ? 'No registrations match your search criteria.'
                  : 'Tickets purchased will appear here in real-time with instant check-in controls.'}
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isUpdating = updatingId === ticket.id;
              const isRefunded = ticket.paymentStatus === 'refunded';
              const ticketDate = ticket.eventDate || event.eventDate;
              const ticketTime = ticket.eventTime || event.eventTime;

              return (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    ticket.checkedIn
                      ? 'bg-emerald-50/40 border-emerald-200/80 shadow-xs'
                      : isRefunded
                      ? 'bg-rose-50/30 border-rose-200/60 opacity-75'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Left Attendee Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {ticket.customerName}
                      </span>

                      {/* Date & Time Slot Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/80">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        <span>{ticketDate}</span>
                        <span className="text-emerald-400">•</span>
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{ticketTime}</span>
                      </span>

                      {/* Seat Number Pill if assigned */}
                      {ticket.seatNumber && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200">
                          <Armchair className="w-3 h-3 text-purple-600" />
                          Seat {ticket.seatNumber} ({ticket.seatSection || 'General'})
                        </span>
                      )}
                      
                      {/* Ticket ID Pill */}
                      <button
                        type="button"
                        onClick={() => handleCopyTicket(ticket.ticketId)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-mono font-bold text-slate-700 transition cursor-pointer"
                        title="Click to copy ticket code"
                      >
                        <span>{ticket.ticketId}</span>
                        {copiedTicketId === ticket.ticketId ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>

                      {/* Payment Status Pill */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ticket.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ticket.paymentStatus === 'free'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ticket.paymentStatus === 'paid' ? `₹${ticket.price} Paid` : ticket.paymentStatus}
                      </span>

                      {ticket.checkedIn && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Checked In
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {ticket.customerPhone}
                      </span>
                      {ticket.customerEmail && (
                        <span>• {ticket.customerEmail}</span>
                      )}
                      <span>• Booked {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* WhatsApp Reminder Link */}
                    <a
                      href={buildWhatsAppReminderUrl(ticket)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 transition text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      title="Send ticket reminder on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    {/* Check-In Toggle Button */}
                    {!isRefunded && (
                      <button
                        type="button"
                        onClick={() => handleToggleCheckIn(ticket)}
                        disabled={isUpdating}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          ticket.checkedIn
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isUpdating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : ticket.checkedIn ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Checked In</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mark Check-In</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
