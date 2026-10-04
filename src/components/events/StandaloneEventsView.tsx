import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
  Share2,
  Copy,
  Check,
  Search,
  Lock,
  Flame,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { BusinessProfile, EventItem } from '../../types';
import { getEvents, cleanupStaleEventHolds, recordAnalyticsEvent } from '../../services/firebaseService';
import { SafeImage } from '../common/SafeImage';
import { EventCheckoutModal } from '../storefront/EventCheckoutModal';

interface StandaloneEventsViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
  isOwner?: boolean;
}

export const StandaloneEventsView: React.FC<StandaloneEventsViewProps> = ({
  business,
  onBackToDashboard,
  isOwner = false,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'offline' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [sharingEventId, setSharingEventId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      setIsLoading(true);
      try {
        recordAnalyticsEvent(business.id, 'event_view', { slug: business.slug }).catch(() => {});
        const fetchedEvents = await getEvents(business.id);
        if (!isMounted) return;
        const active = (fetchedEvents || []).filter((e) => e.status !== 'cancelled');
        setEvents(active);

        // Cleanup stale holds for all active events
        active.forEach((evt) => {
          cleanupStaleEventHolds(business.id, evt.id).catch(() => {});
        });
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [business.id]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
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
  }, [events, activeFilter, searchQuery]);

  const handleOpenTicketModal = (event: EventItem) => {
    setSelectedEvent(event);
    setIsCheckoutOpen(true);
  };

  const getEventShareUrl = (event: EventItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://storelly.com';
    const eventPath = business.slug ? `/events/${encodeURIComponent(business.slug)}` : `/events/${business.id}`;
    return `${origin}${eventPath}?event=${encodeURIComponent(event.id)}#event-${event.id}`;
  };

  const handleShare = async (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getEventShareUrl(event);
    const shareText = `🎟️ Join "${event.title}" hosted by ${business.name}!\n📅 ${event.eventDate} at ${event.eventTime}\n💰 ${event.price === 0 ? 'Free Entry' : `₹${event.price}`}\n\nBook your seat before atomic capacity runs out:\n${shareUrl}`;

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
      `💰 *Price:* ${event.price === 0 ? 'Free Entry' : `₹${event.price}`}\n` +
      `📍 *Format:* ${event.format === 'online' ? 'Live Online Session' : (event.venueCity || 'In-Person Workshop')}\n` +
      `⚡ *Capacity Limit:* ${event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold)} seats left of ${event.capacity} total!\n\n` +
      `👉 *Book your seat directly here:* ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    setSharingEventId(null);
  };

  const bannerImage = business.banner || business.coverImage;

  const isProfileVerified = Boolean(business.isVerified || (business as any).verified);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Explicit Owner Preview Header */}
      {isOwner && onBackToDashboard && (
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Creator Owner Preview Mode</span>
            <span className="text-slate-400">• Standalone Events &amp; Workshops Page</span>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md font-bold transition cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Hero Header with Cover Banner */}
      <header className="bg-white border-b border-slate-200">
        {/* Cover Banner */}
        <div className="relative h-44 sm:h-64 w-full bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 overflow-hidden">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={business.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
        </div>

        {/* Profile Info Overlay */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-white p-1 shrink-0 shadow-xl overflow-hidden relative z-10 flex items-center justify-center">
              <SafeImage
                fallbackType="avatar"
                src={business.logo || business.profileImage || ''}
                alt={business.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div className="space-y-1.5 flex-1 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-emerald-700" />
                  Live Events &amp; Masterclasses
                </span>
                {isProfileVerified && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Host
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900">
                {business.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {business.tagline || business.description || 'Explore upcoming live masterclasses, interactive cohorts, webinars, and in-person events hosted by creator.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{events.length}</strong> Total Sessions
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Atomic Seat Allocation Guarantee</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Sessions ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('online')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeFilter === 'free'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Free Access
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, city..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
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

        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-semibold">Loading upcoming events &amp; workshops...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Ticket className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Scheduled Sessions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {business.name} currently has no active sessions matching your filter. Please check back soon or follow their social channels for updates.
              </p>
            </div>
            {(activeFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
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
              const isShareOpen = sharingEventId === event.id;

              return (
                <div
                  key={event.id}
                  id={`event-${event.id}`}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
                >
                  {/* Event Cover Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={event.coverImage || bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                      alt={event.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

                    {/* Format Badge & Urgency Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${
                          event.format === 'online'
                            ? 'bg-blue-900/85 text-white border border-blue-400/30'
                            : 'bg-emerald-900/85 text-white border border-emerald-400/30'
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
                            <span>In-Person Meetup</span>
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
                      ) : null}
                    </div>

                    {/* Top Right: Share & Price */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => handleShare(event, e)}
                          title="Share event"
                          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 shadow-xs transition cursor-pointer flex items-center justify-center"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

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
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xs">
                        {event.price > 0 ? `₹${event.price}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-black text-base text-slate-900 leading-snug group-hover:text-emerald-700 transition">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Date, Time & Venue Details */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-800">
                          {event.eventDate} at {event.eventTime}
                        </span>
                        {event.eventDurationMinutes && (
                          <span className="text-slate-400">({event.eventDurationMinutes} mins)</span>
                        )}
                      </div>

                      {event.format === 'online' ? (
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">
                            Live via {event.meetingPlatform === 'google_meet' ? 'Google Meet' : event.meetingPlatform || 'Online Platform'}
                          </span>
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
                            {isSoldOut ? 'Capacity Full' : `${seatsLeft} seats remaining`}
                          </span>
                        </div>
                      </div>

                      {/* Footer & Action Button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSoldOut}
                          onClick={() => handleOpenTicketModal(event)}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>{isSoldOut ? 'Sold Out' : event.price > 0 ? `Get Ticket • ₹${event.price}` : 'RSVP Free Access'}</span>
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
      </main>

      {/* Ticket Checkout & RSVP Modal */}
      {selectedEvent && (
        <EventCheckoutModal
          business={business}
          event={selectedEvent}
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {business.name}. Powered by Storelly Creator Studio.</p>
      </footer>
    </div>
  );
};
