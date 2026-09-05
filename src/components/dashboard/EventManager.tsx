import React, { useState, useEffect } from 'react';
import { DashboardEmptyState } from '../common/DashboardEmptyState';
import { DashboardSkeleton } from '../common/DashboardSkeleton';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Video,
  Ticket,
  Users,
  AlertTriangle,
  Edit2,
  Trash2,
  Share2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  Info,
  Layers,
  Sparkles,
  Search,
  Check,
  Copy,
  MessageSquare,
  RefreshCw,
  X,
} from 'lucide-react';
import { BusinessProfile, EventItem, EventFormat, EventStatus, MeetingPlatform } from '../../types';
import {
  subscribeToEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  getEventTickets,
} from '../../services/firebaseService';
import { uploadFileToStorage } from '../../services/firebaseService';
import { EventAttendeesModal } from './EventAttendeesModal';
import { EventCalendarView } from './EventCalendarView';

interface EventManagerProps {
  business: BusinessProfile;
  onOpenStorefront?: () => void;
}

const PRESET_EVENT_COVERS = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
];

export const EventManager: React.FC<EventManagerProps> = ({ business, onOpenStorefront }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'sold_out' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<EventItem | null>(null);
  const [cancellingEvent, setCancellingEvent] = useState<EventItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelledResult, setCancelledResult] = useState<{ event: EventItem; tickets: any[] } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState(PRESET_EVENT_COVERS[0]);
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventTime, setFormEventTime] = useState('18:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formFormat, setFormFormat] = useState<EventFormat>('online');
  const [formMeetingUrl, setFormMeetingUrl] = useState('');
  const [formMeetingPlatform, setFormMeetingPlatform] = useState<MeetingPlatform>('google_meet');
  const [formVenueAddress, setFormVenueAddress] = useState('');
  const [formVenueCity, setFormVenueCity] = useState('');
  const [formIsFree, setFormIsFree] = useState(false);
  const [formPrice, setFormPrice] = useState(499);
  const [formCapacity, setFormCapacity] = useState(50);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedLinkEventId, setCopiedLinkEventId] = useState<string | null>(null);

  // Subscribe to Events
  useEffect(() => {
    if (!business?.id) return;
    setLoading(true);
    const unsubscribe = subscribeToEvents(business.id, (loadedEvents) => {
      setEvents(loadedEvents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [business?.id]);

  // Reset & Populate Form
  const handleOpenCreateModal = (presetDate?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormCoverImage(PRESET_EVENT_COVERS[Math.floor(Math.random() * PRESET_EVENT_COVERS.length)]);
    // Default tomorrow's date or chosen date
    if (presetDate) {
      setFormEventDate(presetDate);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormEventDate(tomorrow.toISOString().split('T')[0]);
    }
    setFormEventTime('18:00');
    setFormDuration(60);
    setFormFormat('online');
    setFormMeetingUrl('');
    setFormMeetingPlatform('google_meet');
    setFormVenueAddress('');
    setFormVenueCity('');
    setFormIsFree(false);
    setFormPrice(499);
    setFormCapacity(50);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormCoverImage(event.coverImage || PRESET_EVENT_COVERS[0]);
    setFormEventDate(event.eventDate);
    setFormEventTime(event.eventTime || '18:00');
    setFormDuration(event.eventDurationMinutes || 60);
    setFormFormat(event.format);
    setFormMeetingUrl(event.meetingUrl || '');
    setFormMeetingPlatform(event.meetingPlatform || 'google_meet');
    setFormVenueAddress(event.venueAddress || '');
    setFormVenueCity(event.venueCity || '');
    setFormIsFree(event.price === 0);
    setFormPrice(event.price || 0);
    setFormCapacity(event.capacity || 50);
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadFileToStorage(file, 'uploads');
      setFormCoverImage(url);
    } catch (err) {
      console.error('Failed to upload cover image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formEventDate) return;

    try {
      setFormSubmitting(true);
      const price = formIsFree ? 0 : Number(formPrice) || 0;
      const capacity = Math.max(1, Number(formCapacity) || 1);

      if (editingEvent) {
        // Safe check: capacity cannot be lower than sold tickets
        if (capacity < (editingEvent.ticketsSold || 0)) {
          alert(`Capacity cannot be lower than the ${editingEvent.ticketsSold} tickets already sold.`);
          setFormSubmitting(false);
          return;
        }

        const remaining = capacity - (editingEvent.ticketsSold || 0);
        const status: EventStatus = remaining <= 0 ? 'sold_out' : (editingEvent.status === 'sold_out' ? 'upcoming' : editingEvent.status);

        await updateEvent(business.id, editingEvent.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          coverImage: formCoverImage,
          eventDate: formEventDate,
          eventTime: formEventTime,
          eventDurationMinutes: Number(formDuration) || 60,
          format: formFormat,
          meetingUrl: formFormat === 'online' ? formMeetingUrl.trim() : undefined,
          meetingPlatform: formFormat === 'online' ? formMeetingPlatform : undefined,
          venueAddress: formFormat === 'offline' ? formVenueAddress.trim() : undefined,
          venueCity: formFormat === 'offline' ? formVenueCity.trim() : undefined,
          price,
          isFree: price === 0,
          capacity,
          seatsRemaining: remaining,
          status,
        });
      } else {
        await createEvent(business.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          coverImage: formCoverImage,
          eventDate: formEventDate,
          eventTime: formEventTime,
          eventDurationMinutes: Number(formDuration) || 60,
          format: formFormat,
          meetingUrl: formFormat === 'online' ? formMeetingUrl.trim() : undefined,
          meetingPlatform: formFormat === 'online' ? formMeetingPlatform : undefined,
          venueAddress: formFormat === 'offline' ? formVenueAddress.trim() : undefined,
          venueCity: formFormat === 'offline' ? formVenueCity.trim() : undefined,
          price,
          isFree: price === 0,
          capacity,
          status: 'upcoming',
        });
      }

      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Failed to save event:', err);
      alert(err.message || 'Error saving event');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingEvent) return;
    try {
      setFormSubmitting(true);
      const res = await cancelEvent(business.id, cancellingEvent.id, cancellationReason);
      setCancellingEvent(null);
      setCancellationReason('');
      setCancelledResult(res);
    } catch (err: any) {
      console.error('Error cancelling event:', err);
      alert(err.message || 'Failed to cancel event');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event: EventItem) => {
    if (event.ticketsSold > 0) {
      if (!confirm(`This event has ${event.ticketsSold} sold ticket(s). Deleting it will remove the record. It is recommended to Cancel the event instead. Are you sure you want to permanently delete?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
        return;
      }
    }

    try {
      await deleteEvent(business.id, event.id, event.coverImage);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleCopyPublicLink = (event: EventItem) => {
    const origin = window.location.origin;
    const url = `${origin}/${business.slug}?tab=events#event-${event.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkEventId(event.id);
    setTimeout(() => setCopiedLinkEventId(null), 2000);
  };

  // Metrics Calculations
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => e.status === 'upcoming').length;
  const totalTicketsSold = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.ticketsSold || 0) * (e.price || 0), 0);

  // Filtering
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.venueCity && event.venueCity.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'upcoming') return event.status === 'upcoming';
    if (activeFilter === 'sold_out') return event.status === 'sold_out';
    if (activeFilter === 'cancelled') return event.status === 'cancelled';
    if (activeFilter === 'past') return event.status === 'past';
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                Event & Webinar Ticketing
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Host 1-to-many live webinars, workshops, and physical masterclasses with atomic seat limits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Month Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Events</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            {totalEvents}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Created across all dates</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Upcoming Sessions</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-heading">
            {upcomingEvents}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Active registration open</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Tickets Claimed</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 font-heading">
            {totalTicketsSold}
          </div>
          <p className="text-[11px] text-blue-700 font-medium">Attendees registered</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Ticket Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 font-heading">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-purple-700 font-medium">Direct earnings</p>
        </div>
      </div>

      {/* View Mode Switching: Calendar View vs List View */}
      {viewMode === 'calendar' ? (
        <EventCalendarView
          business={business}
          events={events}
          onSelectEventForAttendees={(event) => setSelectedEventForAttendees(event)}
          onEditEvent={(event) => handleOpenEditModal(event)}
          onCancelEvent={(event) => {
            setCancellingEvent(event);
            setCancellationReason('');
          }}
          onCreateEventOnDate={(dateStr) => handleOpenCreateModal(dateStr)}
        />
      ) : (
        <>
          {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'upcoming', 'sold_out', 'past', 'cancelled'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                activeFilter === filter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter === 'sold_out' ? 'Sold Out' : filter}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Loading events...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <DashboardEmptyState
          icon={Calendar}
          title="No events found"
          description={searchQuery ? 'No events match your search query.' : 'Host your first webinar or workshop! Multiple attendees can purchase tickets simultaneously.'}
          actionLabel="Create Masterclass / Event"
          onAction={() => handleOpenCreateModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const seatsLeft = event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold);
            const percentSold = Math.min(100, Math.round((event.ticketsSold / event.capacity) * 100));
            const isCancelled = event.status === 'cancelled';
            const isSoldOut = event.status === 'sold_out' || seatsLeft <= 0;

            return (
              <div
                key={event.id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isCancelled
                    ? 'border-rose-200/80 opacity-75'
                    : isSoldOut
                    ? 'border-amber-200/80'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Top Image & Format Badges */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={event.coverImage || PRESET_EVENT_COVERS[0]}
                    alt={event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${
                        event.format === 'online'
                          ? 'bg-blue-900/80 text-white border border-blue-400/30'
                          : 'bg-emerald-900/80 text-white border border-emerald-400/30'
                      }`}
                    >
                      {event.format === 'online' ? (
                        <>
                          <Video className="w-3 h-3 text-blue-300" />
                          <span>Online Webinar</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3 text-emerald-300" />
                          <span>Offline Event</span>
                        </>
                      )}
                    </span>

                    {isCancelled ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-xs">
                        Cancelled
                      </span>
                    ) : isSoldOut ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                        Sold Out
                      </span>
                    ) : null}
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xs">
                      {event.price > 0 ? `₹${event.price}` : 'Free'}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-900 font-heading line-clamp-1">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{event.eventDate} at {event.eventTime}</span>
                        {event.eventDurationMinutes && (
                          <span className="text-slate-400 font-normal">({event.eventDurationMinutes} mins)</span>
                        )}
                      </div>

                      {event.format === 'online' ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate">
                            {event.meetingPlatform === 'google_meet' ? 'Google Meet' : event.meetingPlatform || 'Online platform'} (Private link delivered on ticket)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="truncate">
                            {event.venueAddress || 'Venue'}{event.venueCity ? `, ${event.venueCity}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capacity Bar & Seats Info */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-700">
                        {event.ticketsSold} of {event.capacity} booked
                      </span>
                      <span className={seatsLeft <= 5 && seatsLeft > 0 ? 'text-amber-600 font-black' : 'text-slate-500'}>
                        {isSoldOut ? '0 seats left' : `${seatsLeft} seats remaining`}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCancelled
                            ? 'bg-rose-400'
                            : isSoldOut
                            ? 'bg-amber-500'
                            : percentSold > 75
                            ? 'bg-emerald-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedEventForAttendees(event)}
                      className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Attendees ({event.ticketsSold})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyPublicLink(event)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition text-xs font-bold cursor-pointer"
                      title="Copy Public Event Link"
                    >
                      {copiedLinkEventId === event.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(event)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition text-xs font-bold cursor-pointer"
                      title="Edit Event Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!isCancelled ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingEvent(event);
                          setCancellationReason('');
                        }}
                        className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition text-xs font-bold cursor-pointer"
                        title="Cancel Event & Notify Attendees"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-400 transition text-xs font-bold cursor-pointer"
                        title="Delete Cancelled Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

      {/* CREATE / EDIT EVENT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  {editingEvent ? 'Edit Event / Masterclass' : 'Create New Event / Masterclass'}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure date, format (online or in-person), seat capacity, and pricing.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Event / Webinar Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creator Growth Masterclass: 0 to 100k Followers"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Description & Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="What will attendees learn? What is the schedule?"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Cover Banner Image</span>
                  {uploadingImage && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Uploading image...
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={formCoverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer shadow-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Custom Cover</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {PRESET_EVENT_COVERS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormCoverImage(preset)}
                          className={`w-10 h-7 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                            formCoverImage === preset ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date, Time & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Event Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEventTime}
                    onChange={(e) => setFormEventTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Format Toggle: Online vs Offline */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-800 block">Event Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormFormat('online')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      formFormat === 'online'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Online (Webinar)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormFormat('offline')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      formFormat === 'offline'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>In-Person (Offline)</span>
                  </button>
                </div>

                {/* Conditional Fields based on Format */}
                {formFormat === 'online' ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Platform</label>
                        <select
                          value={formMeetingPlatform}
                          onChange={(e) => setFormMeetingPlatform(e.target.value as MeetingPlatform)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="google_meet">Google Meet</option>
                          <option value="zoom">Zoom</option>
                          <option value="teams">Microsoft Teams</option>
                          <option value="youtube_live">YouTube Live Stream</option>
                          <option value="other">Other Live URL</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">
                          Private Meeting Link URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://meet.google.com/xyz-abc-def"
                          value={formMeetingUrl}
                          onChange={(e) => setFormMeetingUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Security: This link remains private and is only automatically dispatched to verified ticket buyers.</span>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Physical Venue Address</label>
                      <input
                        type="text"
                        placeholder="e.g. WeWork Galaxy, 43 Residency Rd"
                        value={formVenueAddress}
                        onChange={(e) => setFormVenueAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">City / Landmark</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore, Karnataka"
                        value={formVenueCity}
                        onChange={(e) => setFormVenueCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Seat Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Ticket Price</label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsFree}
                        onChange={(e) => setFormIsFree(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-emerald-700 text-[11px]">Free Masterclass</span>
                    </label>
                  </div>

                  {!formIsFree ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  ) : (
                    <div className="py-2 px-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-bold text-center">
                      Free Entry for Attendees
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block">
                    Seat Capacity (Atomic Limit)
                  </label>
                  <input
                    type="number"
                    min={editingEvent ? (editingEvent.ticketsSold || 1) : 1}
                    max="10000"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {editingEvent && (
                    <p className="text-[10px] text-slate-500">
                      Already sold: <span className="font-bold text-slate-700">{editingEvent.ticketsSold}</span> tickets.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingEvent ? 'Save Changes' : 'Publish Masterclass'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {cancellingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Cancel Event & Notify Attendees?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cancelling <span className="font-bold text-slate-800">"{cancellingEvent.title}"</span> will mark all {cancellingEvent.ticketsSold} ticket(s) as refunded and halt further registrations.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">Reason for Cancellation (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Speaker reschedule, emergency maintenance..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs transition cursor-pointer"
              >
                Keep Event
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={formSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                {formSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION BROADCAST NOTIFICATION DIALOG */}
      {cancelledResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Event Cancelled — WhatsApp Broadcast
                  </h3>
                  <p className="text-xs text-slate-500">
                    {cancelledResult.tickets.length} attendee(s) marked for refund.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelledResult(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 p-1">
              {cancelledResult.tickets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No attendees were registered for this session.</p>
              ) : (
                cancelledResult.tickets.map((t) => {
                  const cleanPhone = t.customerPhone.replace(/[^0-9]/g, '');
                  const formattedPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone;
                  const waMsg = encodeURIComponent(
                    `⚠️ *Event Cancellation Notice*\n\n` +
                    `Hello ${t.customerName},\n` +
                    `We regret to inform you that *${cancelledResult.event.title}* hosted by ${business.name} has been cancelled.\n\n` +
                    (cancelledResult.event.cancellationReason ? `📝 *Reason:* ${cancelledResult.event.cancellationReason}\n` : '') +
                    `💰 *Refund:* Your ticket (${t.ticketId}) has been refunded in full.\n\n` +
                    `We sincerely apologize for any inconvenience caused.`
                  );
                  const waUrl = `https://wa.me/${formattedPhone}?text=${waMsg}`;

                  return (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{t.customerName}</span>
                        <span className="text-[11px] text-slate-500">{t.customerPhone}</span>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 text-[11px] shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setCancelledResult(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ATTENDEES ROSTER MODAL */}
      <EventAttendeesModal
        event={selectedEventForAttendees}
        business={business}
        isOpen={!!selectedEventForAttendees}
        onClose={() => setSelectedEventForAttendees(null)}
      />
    </div>
  );
};
