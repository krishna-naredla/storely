import React, { useState } from 'react';
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

  // Filter out cancelled events on public storefront
  const activeEvents = events.filter((e) => e.status !== 'cancelled');
  React.useEffect(() => {
    // Cleanup stale holds for all active events when showcase mounts
    activeEvents.forEach(evt => {
      cleanupStaleEventHolds(business.id, evt.id).catch(() => {});
    });
  }, [business.id]); // Only run once on mount or business change


  if (activeEvents.length === 0) return null;

  const handleOpenTicketModal = (event: EventItem) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      {/* Section Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Ticket className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            {subtitle}
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 self-start sm:self-auto">
          {activeEvents.length} Active Session{activeEvents.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeEvents.map((event) => {
          const seatsLeft = event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold);
          const isSoldOut = event.status === 'sold_out' || seatsLeft <= 0;
          const percentBooked = Math.min(100, Math.round((event.ticketsSold / event.capacity) * 100));

          return (
            <div
              key={event.id}
              id={`event-${event.id}`}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Cover Banner with Overlays */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
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
                        <span>Offline Masterclass</span>
                      </>
                    )}
                  </span>

                  {isSoldOut && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Price Tag */}
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    {event.price > 0 ? `₹${event.price}` : 'Free'}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-black text-base text-slate-900 font-heading leading-tight line-clamp-1 group-hover:text-emerald-700 transition">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Date & Time Highlights */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">{event.eventDate} at {event.eventTime}</span>
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

                {/* Capacity & Ticket CTA */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600">
                        {event.ticketsSold} of {event.capacity} seats taken
                      </span>
                      <span className={seatsLeft <= 5 && !isSoldOut ? 'text-amber-600 font-black' : 'text-slate-500'}>
                        {isSoldOut ? 'Fully booked' : `${seatsLeft} seats left`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isSoldOut
                            ? 'bg-amber-500'
                            : percentBooked > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${percentBooked}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenTicketModal(event)}
                    disabled={isSoldOut}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
