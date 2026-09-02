import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  Users,
  DollarSign,
  Plus,
  ExternalLink,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Share2,
  Check,
  Copy,
  Info,
  X,
} from 'lucide-react';
import { EventItem, EventFormat, EventStatus, BusinessProfile } from '../../types';

interface EventCalendarViewProps {
  business: BusinessProfile;
  events: EventItem[];
  onSelectEventForAttendees: (event: EventItem) => void;
  onEditEvent: (event: EventItem) => void;
  onCancelEvent: (event: EventItem) => void;
  onCreateEventOnDate?: (dateString: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({
  business,
  events,
  onSelectEventForAttendees,
  onEditEvent,
  onCancelEvent,
  onCreateEventOnDate,
}) => {
  // Calendar current browsing date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [formatFilter, setFormatFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.toISOString().split('T')[0]);
  };

  // Filter events by format
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (formatFilter === 'online' && e.format !== 'online') return false;
      if (formatFilter === 'offline' && e.format !== 'offline') return false;
      return true;
    });
  }, [events, formatFilter]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    filteredEvents.forEach((ev) => {
      if (!ev.eventDate) return;
      if (!map[ev.eventDate]) {
        map[ev.eventDate] = [];
      }
      map[ev.eventDate].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Build calendar matrix (padded for grid)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startWeekday = firstDayOfMonth.getDay(); // 0 for Sunday
    const totalDays = lastDayOfMonth.getDate();

    const days: {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: EventItem[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateString: dateStr,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const thisDate = new Date(year, month, d);
      // Format as YYYY-MM-DD manually to avoid timezone shift
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      days.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Next month padding to reach full 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let nextD = 1; nextD <= remainingCells; nextD++) {
      const nextDate = new Date(year, month + 1, nextD);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateString: dateStr,
        dayNumber: nextD,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate[dateStr] || [],
      });
    }

    return days;
  }, [year, month, eventsByDate]);

  // Selected Day's events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDate[selectedDay] || [];
  }, [selectedDay, eventsByDate]);

  // Month Statistics
  const monthStats = useMemo(() => {
    const mm = String(month + 1).padStart(2, '0');
    const prefix = `${year}-${mm}`;
    const thisMonthEvents = events.filter((e) => e.eventDate && e.eventDate.startsWith(prefix));
    const totalScheduled = thisMonthEvents.length;
    const totalTicketsSold = thisMonthEvents.reduce((acc, e) => acc + (e.ticketsSold || 0), 0);
    const totalRevenue = thisMonthEvents.reduce(
      (acc, e) => acc + (e.isFree ? 0 : (e.ticketsSold || 0) * (e.price || 0)),
      0
    );

    return { totalScheduled, totalTicketsSold, totalRevenue };
  }, [events, year, month]);

  const handleCopyLink = (event: EventItem) => {
    const origin = window.location.origin;
    const url = `${origin}/store/${business.slug}?tab=events&event=${event.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Calendar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        {/* Month Title & Nav */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {monthStats.totalScheduled} event{monthStats.totalScheduled === 1 ? '' : 's'} scheduled this month
            </p>
          </div>
        </div>

        {/* Filter Chips & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                formatFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter('online')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                formatFilter === 'online'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>Webinars</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter('offline')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                formatFilter === 'offline'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>In-Person</span>
            </button>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleGoToToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Events This Month
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            {monthStats.totalScheduled}
          </span>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Tickets Sold
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-950 font-heading">
            {monthStats.totalTicketsSold}
          </span>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
            Ticket Revenue
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-950 font-heading">
            ₹{monthStats.totalRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {WEEKDAY_NAMES.map((day) => (
            <div key={day} className="truncate px-1">
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {calendarDays.map((day, idx) => {
            const isSelected = selectedDay === day.dateString;
            const hasEvents = day.events.length > 0;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day.dateString)}
                className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition cursor-pointer group ${
                  !day.isCurrentMonth
                    ? 'bg-slate-50/50 text-slate-300'
                    : isSelected
                    ? 'bg-emerald-50/60 ring-2 ring-emerald-500 ring-inset'
                    : 'hover:bg-slate-50/80 bg-white'
                }`}
              >
                {/* Date Number & Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      day.isToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isSelected
                        ? 'bg-emerald-200 text-emerald-950'
                        : day.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {day.isCurrentMonth && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateEventOnDate?.(day.dateString);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                      title={`Create event on ${day.dateString}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Event Chips List */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {day.events.slice(0, 2).map((ev) => {
                    const isCancelled = ev.status === 'cancelled';
                    const isSoldOut = ev.status === 'sold_out';

                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate transition flex items-center gap-1 border shadow-2xs ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800 border-rose-200 line-through opacity-70'
                            : isSoldOut
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : ev.format === 'online'
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                        title={`${ev.eventTime} - ${ev.title} (${ev.ticketsSold}/${ev.capacity} seats)`}
                      >
                        {ev.format === 'online' ? (
                          <Video className="w-2.5 h-2.5 shrink-0 text-blue-600" />
                        ) : (
                          <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                        )}
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}

                  {day.events.length > 2 && (
                    <span className="text-[9px] font-bold text-slate-500 pl-1 block">
                      +{day.events.length - 2} more
                    </span>
                  )}
                </div>

                {/* Bottom mini indicator */}
                <div className="h-1 flex items-center gap-0.5">
                  {hasEvents && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE DETAILS & AGENDA PANEL */}
      {selectedDay && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Agenda for{' '}
                  {new Date(`${selectedDay}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'} scheduled for this date
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onCreateEventOnDate?.(selectedDay)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Event On This Day</span>
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <p className="text-xs font-medium">No sessions scheduled for this date.</p>
              <p className="text-[11px] text-slate-400">
                Click "Schedule Event On This Day" above to host a new workshop or masterclass.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayEvents.map((ev) => {
                const seatsLeft = ev.seatsRemaining ?? Math.max(0, ev.capacity - ev.ticketsSold);
                const isCancelled = ev.status === 'cancelled';
                const isSoldOut = ev.status === 'sold_out' || seatsLeft <= 0;

                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                      isCancelled
                        ? 'bg-rose-50/50 border-rose-200 opacity-75'
                        : isSoldOut
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/60 border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    {/* Header with Title & Format Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              ev.format === 'online'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ev.format === 'online' ? (
                              <>
                                <Video className="w-3 h-3" />
                                <span>Online</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3" />
                                <span>Offline</span>
                              </>
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {ev.eventTime} ({ev.eventDurationMinutes || 60}m)
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {ev.title}
                        </h4>
                      </div>

                      <span className="font-black text-xs text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {ev.isFree ? 'Free RSVP' : `₹${ev.price.toLocaleString()}`}
                      </span>
                    </div>

                    {/* Stats & Capacity */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 font-bold">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {ev.ticketsSold} / {ev.capacity} Attendees
                        </span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectEventForAttendees(ev)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] transition cursor-pointer"
                        >
                          Roster
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditEvent(ev)}
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT DETAILS LIGHTBOX MODAL (When clicking an event directly) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cover Image & Format Badge */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={selectedEvent.coverImage}
                alt={selectedEvent.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md text-white ${
                    selectedEvent.format === 'online' ? 'bg-blue-900/80' : 'bg-emerald-900/80'
                  }`}
                >
                  {selectedEvent.format === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  <span>{selectedEvent.format === 'online' ? 'Online Webinar' : 'Offline Event'}</span>
                </span>
              </div>
            </div>

            {/* Title & Date */}
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                {selectedEvent.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                <span>📅 {selectedEvent.eventDate}</span>
                <span>⏰ {selectedEvent.eventTime} ({selectedEvent.eventDurationMinutes || 60} mins)</span>
              </p>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200 max-h-32 overflow-y-auto">
              {selectedEvent.description || 'No description provided.'}
            </p>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price</span>
                <span className="text-sm font-black text-slate-900">
                  {selectedEvent.isFree ? 'Free' : `₹${selectedEvent.price.toLocaleString()}`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Sold / Cap</span>
                <span className="text-sm font-black text-emerald-950">
                  {selectedEvent.ticketsSold} / {selectedEvent.capacity}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Revenue</span>
                <span className="text-sm font-black text-indigo-950">
                  ₹{((selectedEvent.isFree ? 0 : selectedEvent.price) * (selectedEvent.ticketsSold || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedEvent)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    onEditEvent(selectedEvent);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    onSelectEventForAttendees(selectedEvent);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Attendee Roster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
