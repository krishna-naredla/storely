import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Ticket,
  Users,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  Flame,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { BusinessProfile, EventItem, EventTicket } from '../../types';
import { EventCheckoutModal } from './EventCheckoutModal';
import { cleanupStaleEventHolds } from '../../services/firebaseService';

interface EventsShowcaseProps {
  events: EventItem[];
  business: BusinessProfile;
  title?: string;
  subtitle?: string;
}

export const EventsShowcase: React.FC<EventsShowcaseProps> = ({
  events,
  business,
  title = 'Live Masterclasses & Events',
  subtitle = 'Join interactive workshops, exclusive sessions, and webinars hosted directly by creator.',
}) => {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'offline' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [sharingEventId, setSharingEventId] = useState<string | null>(null);

  // Filter out cancelled events on public storefront
  const activeEvents = useMemo(() => {
    return events.filter((e) => e.status !== 'cancelled');
  }, [events]);

  React.useEffect(() => {
    // Cleanup stale holds for all active events when showcase mounts
    activeEvents.forEach((evt) => {
      cleanupStaleEventHolds(business.id, evt.id).catch(() => {});
    });
  }, [business.id, activeEvents]);

  // Filter and search events
  const filteredEvents = useMemo(() => {
    return activeEvents.filter((event) => {
      if (activeFilter === 'online' && event.format !== 'online') return false;
      if (activeFilter === 'offline' && event.format !== 'offline') return false;
      if (activeFilter === 'free' && event.price > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title?.toLowerCase().includes(q);
        const matchesDesc = event.description?.toLowerCase().includes(q);
        const matchesCity = event.venueCity?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCity) return false;
      }

      return true;
    });
  }, [activeEvents, activeFilter, searchQuery]);

  if (activeEvents.length === 0) return null;

  const handleOpenTicketModal = (event: EventItem) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const getEventShareUrl = (event: EventItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://storelly.com';
    const storePath = business.slug ? `/store/${encodeURIComponent(business.slug)}` : `/store/${business.id}`;
    return `${origin}${storePath}?event=${encodeURIComponent(event.id)}#event-${event.id}`;
  };

  const handleShare = async (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getEventShareUrl(event);
    const shareText = `🎟️ Join "${event.title}" hosted by ${business.name}!\n📅 ${event.eventDate} at ${event.eventTime}\n💰 ${event.price === 0 ? 'Free Entry' : `₹${event.price}`}\n${event.format === 'online' ? '🌐 Live Online Webinar' : `📍 Venue: ${event.venueCity || event.venueAddress || 'In-Person'}`}\n\nSecure your seat before capacity runs out:\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Toggle dropdown share
    setSharingEventId(sharingEventId === event.id ? null : event.id);
  };

  const handleCopyLink = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getEventShareUrl(event);
    navigator.clipboard.writeText(shareUrl);
    setCopiedEventId(event.id);
    setTimeout(() => {
      setCopiedEventId(null);
      setSharingEventId(null);
    }, 2000);
  };

  const handleWhatsAppShare = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getEventShareUrl(event);
    const message = encodeURIComponent(
      `🎟️ *Join "${event.title}"* hosted by *${business.name}*!\n\n` +
      `📅 *Date:* ${event.eventDate}\n` +
      `⏰ *Time:* ${event.eventTime} ${event.eventDurationMinutes ? `(${event.eventDurationMinutes} mins)` : ''}\n` +
      `💰 *Price:* ${event.price === 0 ? 'Free Access' : `₹${event.price}`}\n` +
      `📍 *Format:* ${event.format === 'online' ? 'Live Online Session' : (event.venueCity || 'In-Person Workshop')}\n` +
      `⚡ *Seat Limit:* ${event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold)} seats left of ${event.capacity} total!\n\n` +
      `👉 *Book your seat directly here:* ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    setSharingEventId(null);
  };

  const handleTwitterShare = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getEventShareUrl(event);
    const text = encodeURIComponent(`🎟️ Joining "${event.title}" with @${business.slug || business.name}! Reserve your seat before capacity fills up:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    setSharingEventId(null);
  };

  const handleGoogleCalendarAdd = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = (event.eventDate || '').replace(/-/g, '');
    const timeClean = (event.eventTime || '18:00').replace(/[^0-9]/g, '');
    const startStr = `${dateStr}T${timeClean.padEnd(4, '0')}00`;
    const durationHours = Math.max(1, Math.round((event.eventDurationMinutes || 60) / 60));
    const endHour = (Number(timeClean.slice(0, 2)) + durationHours).toString().padStart(2, '0');
    const endStr = `${dateStr}T${endHour}${timeClean.slice(2, 4) || '00'}00`;

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `Live Event: ${event.title}\nHosted by ${business.name}\n${event.description || ''}\n${
        event.format === 'online' ? 'Online event - meeting link provided on ticket confirmation.' : `Venue: ${event.venueAddress || ''}, ${event.venueCity || ''}`
      }`
    );
    const location = encodeURIComponent(event.format === 'online' ? 'Online (Google Meet/Webinar)' : (event.venueAddress || event.venueCity || ''));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      {/* Section Heading & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shadow-xs">
              <Ticket className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activeEvents.length} Active Session{activeEvents.length > 1 ? 's' : ''}</span>
          </span>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Atomic Seat Limits Enforced</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Sessions ({activeEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('online')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'online'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Online Webinar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('offline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'offline'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>In-Person Meetup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('free')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'free'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Free Entry
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, topics, city..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No events matched your search or filter</p>
          <button
            type="button"
            onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
            className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
          >
            Clear filters & view all events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const seatsLeft = event.seatsRemaining !== undefined
              ? Number(event.seatsRemaining)
              : Math.max(0, event.capacity - (Number(event.ticketsSold) || 0));
            const isSoldOut = event.status === 'sold_out' || seatsLeft <= 0;
            const percentBooked = Math.min(100, Math.round(((Number(event.ticketsSold) || 0) / (event.capacity || 1)) * 100));
            const isUrgent = seatsLeft > 0 && seatsLeft <= 5;
            const isSellingFast = percentBooked >= 75 && !isSoldOut;
            const isShareOpen = sharingEventId === event.id;

            return (
              <div
                key={event.id}
                id={`event-${event.id}`}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Cover Banner with Overlays */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={event.coverImage || business.coverImage || business.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80'}
                    alt={event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

                  {/* Badges on Top Left */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${
                        event.format === 'online'
                          ? 'bg-blue-900/85 text-white border border-blue-400/40'
                          : 'bg-emerald-900/85 text-white border border-emerald-400/40'
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
                          <span>Offline Meetup</span>
                        </>
                      )}
                    </span>

                    {isSoldOut ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-xs">
                        Sold Out
                      </span>
                    ) : isUrgent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs animate-pulse">
                        <Flame className="w-3 h-3" />
                        <span>Only {seatsLeft} Left!</span>
                      </span>
                    ) : isSellingFast ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/90 text-slate-950 backdrop-blur-md shadow-xs">
                        Selling Fast
                      </span>
                    ) : null}
                  </div>

                  {/* Top Right Action Buttons (Share & Price Tag) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                    {/* Share Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => handleShare(event, e)}
                        title="Share this event"
                        className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 shadow-xs transition cursor-pointer flex items-center justify-center"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Share Dropdown Menu */}
                      {isShareOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl p-2 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                            Share Event
                          </p>
                          <button
                            type="button"
                            onClick={(e) => handleWhatsAppShare(event, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition text-left cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Share on WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(event, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition text-left cursor-pointer"
                          >
                            {copiedEventId === event.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copy Direct Link</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleTwitterShare(event, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition text-left cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            <span>Share on X / Twitter</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleGoogleCalendarAdd(event, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition text-left cursor-pointer border-t border-slate-100 mt-1 pt-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Add to Calendar</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Price Pill */}
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xs">
                      {event.price > 0 ? `₹${event.price}` : 'Free'}
                    </span>
                  </div>

                  {/* Bottom Banner Info: Host Tag */}
                  <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-white text-[11px] font-bold z-10">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-[9px] uppercase">
                        {business.name.slice(0, 1)}
                      </span>
                      <span className="truncate">{business.name}</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-black text-base text-slate-900 font-heading leading-tight line-clamp-2 group-hover:text-emerald-700 transition">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Date, Time & Location Highlights */}
                    <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">
                          {event.scheduleDates && event.scheduleDates.length > 1
                            ? `${event.scheduleDates.length} Dates Available (${event.eventDate} → ${event.eventEndDate || event.eventDate})`
                            : `${event.eventDate} at ${event.eventTime}`}
                        </span>
                        {event.eventDurationMinutes && (
                          <span className="text-slate-400 font-normal">({event.eventDurationMinutes} mins)</span>
                        )}
                      </div>

                      {event.format === 'online' ? (
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">
                            Live via {event.meetingPlatform === 'google_meet' ? 'Google Meet' : event.meetingPlatform || 'Online Platform'}
                          </span>
                        </div>
                      ) : event.format === 'hybrid' ? (
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Video className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">Hybrid (Online &amp; In-Person)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">
                            {event.venueAddress || 'Venue'}{event.venueCity ? `, ${event.venueCity}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seat Capacity & Atomic Limit Section */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Seat Capacity (Atomic Limit):</span>
                        </span>
                        <span className="font-mono text-slate-900">{event.capacity} Total</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isSoldOut
                              ? 'bg-rose-500'
                              : isUrgent
                              ? 'bg-amber-500'
                              : percentBooked > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percentBooked}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">
                          {event.ticketsSold || 0} booked ({percentBooked}%)
                        </span>
                        <span className={`font-black ${isSoldOut ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {isSoldOut ? 'Capacity Full' : `${seatsLeft} seats available`}
                        </span>
                      </div>
                    </div>

                    {/* Booking & Share Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTicketModal(event)}
                        disabled={isSoldOut}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          isSoldOut
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : event.price === 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/20'
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                        <span>{isSoldOut ? 'Sold Out' : event.price === 0 ? 'Register for Free' : `Get Ticket • ₹${event.price}`}</span>
                        {!isSoldOut && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShare(event, e)}
                        title="Share Event"
                        className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Checkout Modal */}
      <EventCheckoutModal
        event={selectedEvent}
        business={business}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </section>
  );
};
