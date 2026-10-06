import React, { useState, useEffect } from 'react';
import { DashboardEmptyState } from '../common/DashboardEmptyState';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
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
  QrCode,
  Globe,
  Repeat,
  ChevronDown,
  ChevronUp,
  Armchair,
  ShieldCheck,
} from 'lucide-react';
import {
  BusinessProfile,
  EventItem,
  EventFormat,
  EventStatus,
  MeetingPlatform,
  EventSeatingChart,
  EventScheduleType,
  EventScheduleDate,
  EventTimeSlot,
} from '../../types';
import {
  subscribeToEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  getModuleDeepUrl,
} from '../../services/firebaseService';
import { uploadToCloudinary } from '../../services/cloudinary';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { isCreatorProfile } from '../../utils/profileHelper';
import { EventAttendeesModal } from './EventAttendeesModal';
import { EventCalendarView } from './EventCalendarView';
import { ModuleQrModal } from '../common/ModuleQrModal';
import { VisualSeatingChartCreator } from '../events/VisualSeatingChartCreator';

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

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+5:30)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT - UTC-5/4)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - UTC-8/7)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT - UTC-6/5)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST - UTC+0/1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - UTC+1/2)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT - UTC+10/11)' },
];

export const EventManager: React.FC<EventManagerProps> = ({ business, onOpenStorefront }) => {
  const isCreator = isCreatorProfile(business);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'sold_out' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedScheduleEventId, setExpandedScheduleEventId] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<EventItem | null>(null);
  const [cancellingEvent, setCancellingEvent] = useState<EventItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelledResult, setCancelledResult] = useState<{ event: EventItem; tickets: any[] } | null>(null);

  // Core Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState(PRESET_EVENT_COVERS[0]);
  const [formTimezone, setFormTimezone] = useState('Asia/Kolkata');
  const [formFormat, setFormFormat] = useState<EventFormat>('online');
  const [formMeetingUrl, setFormMeetingUrl] = useState('');
  const [formMeetingPlatform, setFormMeetingPlatform] = useState<MeetingPlatform>('google_meet');
  const [formVenueAddress, setFormVenueAddress] = useState('');
  const [formVenueCity, setFormVenueCity] = useState('');
  const [formIsFree, setFormIsFree] = useState(false);
  const [formPrice, setFormPrice] = useState(499);
  const [formCapacity, setFormCapacity] = useState(50);
  const [formDuration, setFormDuration] = useState(60);
  const [formRegStartDate, setFormRegStartDate] = useState('');
  const [formRegEndDate, setFormRegEndDate] = useState('');
  const [formCancellationPolicy, setFormCancellationPolicy] = useState('');
  const [formSeatingChart, setFormSeatingChart] = useState<EventSeatingChart | undefined>(undefined);

  // Advanced Schedule State
  const [scheduleMode, setScheduleMode] = useState<EventScheduleType>('single');
  const [singleDate, setSingleDate] = useState('');
  const [rangeStartDate, setRangeStartDate] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');
  const [customNewDate, setCustomNewDate] = useState('');
  const [scheduleDates, setScheduleDates] = useState<EventScheduleDate[]>([]);
  const [defaultSlotStart, setDefaultSlotStart] = useState('18:00');
  const [defaultSlotEnd, setDefaultSlotEnd] = useState('19:00');

  // Recurring Schedule State
  const [recurringFreq, setRecurringFreq] = useState<'weekly' | 'weekdays' | 'daily' | 'custom_days'>('weekly');
  const [recurringDays, setRecurringDays] = useState<number[]>([1]); // 1 = Monday
  const [recurringStartDate, setRecurringStartDate] = useState('');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [copiedLinkEventId, setCopiedLinkEventId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedQrModal, setSelectedQrModal] = useState<{
    title: string;
    subtitle?: string;
    badge?: string;
    url: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Subscribe to Events
  useEffect(() => {
    if (!business?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToEvents(business.id, (loadedEvents) => {
      setEvents(loadedEvents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [business?.id]);

  // Helper: create a default slot
  const createDefaultSlot = (startTime = '18:00', endTime = '19:00', capacity = 50, label = 'Main Session'): EventTimeSlot => ({
    id: `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    startTime,
    endTime,
    capacity,
    ticketsSold: 0,
    seatsRemaining: capacity,
    label,
  });

  // Reset & Populate Form
  const handleOpenCreateModal = (presetDate?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormCoverImage(PRESET_EVENT_COVERS[Math.floor(Math.random() * PRESET_EVENT_COVERS.length)]);
    setFormTimezone('Asia/Kolkata');
    setFormFormat('online');
    setFormMeetingUrl('');
    setFormMeetingPlatform('google_meet');
    setFormVenueAddress('');
    setFormVenueCity('');
    setFormIsFree(false);
    setFormPrice(499);
    setFormCapacity(50);
    setFormDuration(60);
    setFormRegStartDate('');
    setFormRegEndDate('');
    setFormCancellationPolicy('Cancellations allowed up to 24 hours before the session start time for a full refund.');
    setFormSeatingChart(undefined);

    // Date defaults
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = presetDate || tomorrow.toISOString().split('T')[0];
    
    setScheduleMode('single');
    setSingleDate(targetDate);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setRangeStartDate(targetDate);
    setRangeEndDate(nextWeek.toISOString().split('T')[0]);
    setRecurringStartDate(targetDate);
    setRecurringEndDate(nextWeek.toISOString().split('T')[0]);

    // Initial default schedule
    const initialSlot = createDefaultSlot('18:00', '19:00', 50, 'Evening Session');
    setScheduleDates([
      {
        id: `date_${targetDate}`,
        date: targetDate,
        slots: [initialSlot],
      },
    ]);

    setIsFormOpen(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormCoverImage(event.coverImage || PRESET_EVENT_COVERS[0]);
    setFormTimezone(event.timezone || 'Asia/Kolkata');
    setFormFormat(event.format);
    setFormMeetingUrl(event.meetingUrl || '');
    setFormMeetingPlatform(event.meetingPlatform || 'google_meet');
    setFormVenueAddress(event.venueAddress || '');
    setFormVenueCity(event.venueCity || '');
    setFormIsFree(event.price === 0);
    setFormPrice(event.price || 0);
    setFormCapacity(event.capacity || 50);
    setFormDuration(event.eventDurationMinutes || 60);
    setFormRegStartDate(event.registrationStartDate || '');
    setFormRegEndDate(event.registrationEndDate || '');
    setFormCancellationPolicy(event.cancellationPolicy || '');
    setFormSeatingChart(event.seatingChart);

    setScheduleMode(event.scheduleType || 'single');
    setSingleDate(event.eventDate || '');
    setRangeStartDate(event.eventDate || '');
    setRangeEndDate(event.eventEndDate || event.eventDate || '');

    if (event.scheduleDates && event.scheduleDates.length > 0) {
      setScheduleDates(event.scheduleDates);
    } else {
      // Legacy fallback
      const initialSlot: EventTimeSlot = {
        id: `slot_legacy_${Date.now()}`,
        startTime: event.eventTime || '18:00',
        endTime: '',
        capacity: event.capacity || 50,
        ticketsSold: event.ticketsSold || 0,
        seatsRemaining: event.seatsRemaining || event.capacity || 50,
        label: 'Session',
      };
      setScheduleDates([
        {
          id: `date_${event.eventDate}`,
          date: event.eventDate,
          slots: [initialSlot],
        },
      ]);
    }

    setIsFormOpen(true);
  };

  // Helper to generate dates from a continuous range
  const generateRangeSchedule = () => {
    if (!rangeStartDate || !rangeEndDate) {
      showToast('Please specify both Start Date and End Date for the range.', 'error');
      return;
    }
    const start = new Date(rangeStartDate);
    const end = new Date(rangeEndDate);
    if (end < start) {
      showToast('End Date cannot be earlier than Start Date.', 'error');
      return;
    }

    const datesList: EventScheduleDate[] = [];
    const current = new Date(start);
    let count = 0;
    while (current <= end && count < 60) {
      const dStr = current.toISOString().split('T')[0];
      datesList.push({
        id: `date_${dStr}`,
        date: dStr,
        slots: [createDefaultSlot(defaultSlotStart, defaultSlotEnd, formCapacity, 'Session')],
      });
      current.setDate(current.getDate() + 1);
      count++;
    }

    setScheduleDates(datesList);
    showToast(`Generated schedule for ${datesList.length} date(s).`, 'success');
  };

  // Helper to generate recurring schedule
  const generateRecurringSchedule = () => {
    if (!recurringStartDate || !recurringEndDate) {
      showToast('Please choose recurring Start Date and End Date.', 'error');
      return;
    }
    const start = new Date(recurringStartDate);
    const end = new Date(recurringEndDate);
    if (end < start) {
      showToast('End Date cannot be earlier than Start Date.', 'error');
      return;
    }

    const datesList: EventScheduleDate[] = [];
    const current = new Date(start);
    let count = 0;
    while (current <= end && count < 90) {
      const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      let match = false;

      if (recurringFreq === 'daily') match = true;
      else if (recurringFreq === 'weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) match = true;
      else if (recurringDays.includes(dayOfWeek)) match = true;

      if (match) {
        const dStr = current.toISOString().split('T')[0];
        datesList.push({
          id: `date_${dStr}`,
          date: dStr,
          slots: [createDefaultSlot(defaultSlotStart, defaultSlotEnd, formCapacity, 'Recurring Session')],
        });
      }
      current.setDate(current.getDate() + 1);
      count++;
    }

    if (datesList.length === 0) {
      showToast('No dates matched the selected recurring days.', 'error');
      return;
    }

    setScheduleDates(datesList);
    showToast(`Generated ${datesList.length} recurring event date(s).`, 'success');
  };

  // Add individual custom date
  const handleAddCustomDate = () => {
    if (!customNewDate) return;
    if (scheduleDates.some((d) => d.date === customNewDate)) {
      showToast('This date is already added to the schedule.', 'error');
      return;
    }

    const newDateEntry: EventScheduleDate = {
      id: `date_${customNewDate}`,
      date: customNewDate,
      slots: [createDefaultSlot(defaultSlotStart, defaultSlotEnd, formCapacity, 'Session')],
    };

    setScheduleDates((prev) => [...prev, newDateEntry].sort((a, b) => a.date.localeCompare(b.date)));
    setCustomNewDate('');
    showToast(`Added date ${customNewDate}`, 'success');
  };

  // Remove date
  const handleRemoveDate = (dateId: string) => {
    if (scheduleDates.length <= 1) {
      showToast('An event must have at least one scheduled date.', 'error');
      return;
    }
    setScheduleDates((prev) => prev.filter((d) => d.id !== dateId));
  };

  // Add slot to a specific date
  const handleAddSlotToDate = (dateId: string) => {
    setScheduleDates((prev) =>
      prev.map((d) => {
        if (d.id !== dateId) return d;
        const newSlot = createDefaultSlot('10:00', '11:00', formCapacity, `Session ${d.slots.length + 1}`);
        return {
          ...d,
          slots: [...d.slots, newSlot],
        };
      })
    );
  };

  // Update slot field
  const handleUpdateSlot = (dateId: string, slotId: string, field: keyof EventTimeSlot, val: any) => {
    setScheduleDates((prev) =>
      prev.map((d) => {
        if (d.id !== dateId) return d;
        return {
          ...d,
          slots: d.slots.map((s) => {
            if (s.id !== slotId) return s;
            const updated = { ...s, [field]: val };
            if (field === 'capacity') {
              const numCap = Number(val) || 1;
              updated.capacity = numCap;
              updated.seatsRemaining = Math.max(0, numCap - (s.ticketsSold || 0));
            }
            return updated;
          }),
        };
      })
    );
  };

  // Remove slot from date
  const handleRemoveSlot = (dateId: string, slotId: string) => {
    setScheduleDates((prev) =>
      prev.map((d) => {
        if (d.id !== dateId) return d;
        if (d.slots.length <= 1) {
          showToast('Each date must have at least one time slot.', 'error');
          return d;
        }
        return {
          ...d,
          slots: d.slots.filter((s) => s.id !== slotId),
        };
      })
    );
  };

  // Copy slots from a source date to all other dates
  const handleApplySlotsToAllDates = (sourceDateId: string) => {
    const source = scheduleDates.find((d) => d.id === sourceDateId);
    if (!source || !source.slots.length) return;

    setScheduleDates((prev) =>
      prev.map((d) => {
        if (d.id === sourceDateId) return d;
        const clonedSlots: EventTimeSlot[] = source.slots.map((s, idx) => ({
          ...s,
          id: `slot_${d.date}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          ticketsSold: 0,
          seatsRemaining: s.capacity || formCapacity,
        }));
        return {
          ...d,
          slots: clonedSlots,
        };
      })
    );

    showToast('Applied time slots across all event dates!', 'success');
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter an event title.', 'error');
      return;
    }

    if (scheduleDates.length === 0) {
      showToast('Please configure at least one date with a valid time slot.', 'error');
      return;
    }

    try {
      setFormSubmitting(true);
      const price = formIsFree ? 0 : Number(formPrice) || 0;
      const capacity = Math.max(1, Number(formCapacity) || 1);

      // Primary date & time from first schedule entry
      const primaryDate = scheduleDates[0]?.date || singleDate;
      const primaryTime = scheduleDates[0]?.slots[0]?.startTime || defaultSlotStart;
      const endDate = scheduleDates[scheduleDates.length - 1]?.date || primaryDate;

      // Calculate total capacity
      const totalSlotCapacity = scheduleDates.reduce((sum, d) => {
        return sum + d.slots.reduce((slotSum, s) => slotSum + (Number(s.capacity) || capacity), 0);
      }, 0);

      const effectiveCapacity = totalSlotCapacity > 0 ? totalSlotCapacity : capacity;

      if (editingEvent) {
        if (effectiveCapacity < (editingEvent.ticketsSold || 0)) {
          showToast(`Capacity cannot be lower than the ${editingEvent.ticketsSold} tickets already sold.`, 'error');
          setFormSubmitting(false);
          return;
        }

        const remaining = Math.max(0, effectiveCapacity - (editingEvent.ticketsSold || 0));
        const status: EventStatus = remaining <= 0 ? 'sold_out' : (editingEvent.status === 'sold_out' ? 'upcoming' : editingEvent.status);

        await updateEvent(business.id, editingEvent.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          coverImage: formCoverImage,
          eventDate: primaryDate,
          eventEndDate: endDate,
          eventTime: primaryTime,
          eventDurationMinutes: Number(formDuration) || 60,
          timezone: formTimezone,
          format: formFormat,
          meetingUrl: formFormat !== 'offline' ? formMeetingUrl.trim() : undefined,
          meetingPlatform: formFormat !== 'offline' ? formMeetingPlatform : undefined,
          venueAddress: formFormat !== 'online' ? formVenueAddress.trim() : undefined,
          venueCity: formFormat !== 'online' ? formVenueCity.trim() : undefined,
          price,
          isFree: price === 0,
          capacity: effectiveCapacity,
          seatsRemaining: remaining,
          status,
          scheduleType: scheduleMode,
          scheduleDates: scheduleDates,
          registrationStartDate: formRegStartDate || undefined,
          registrationEndDate: formRegEndDate || undefined,
          cancellationPolicy: formCancellationPolicy.trim() || undefined,
          seatingChart: formSeatingChart,
        });
      } else {
        await createEvent(business.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          coverImage: formCoverImage,
          eventDate: primaryDate,
          eventEndDate: endDate,
          eventTime: primaryTime,
          eventDurationMinutes: Number(formDuration) || 60,
          timezone: formTimezone,
          format: formFormat,
          meetingUrl: formFormat !== 'offline' ? formMeetingUrl.trim() : undefined,
          meetingPlatform: formFormat !== 'offline' ? formMeetingPlatform : undefined,
          venueAddress: formFormat !== 'online' ? formVenueAddress.trim() : undefined,
          venueCity: formFormat !== 'online' ? formVenueCity.trim() : undefined,
          price,
          isFree: price === 0,
          capacity: effectiveCapacity,
          status: 'upcoming',
          scheduleType: scheduleMode,
          scheduleDates: scheduleDates,
          registrationStartDate: formRegStartDate || undefined,
          registrationEndDate: formRegEndDate || undefined,
          cancellationPolicy: formCancellationPolicy.trim() || undefined,
          seatingChart: formSeatingChart,
        });
      }

      setIsFormOpen(false);
      showToast('Event and schedule saved successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to save event:', err);
      showToast(err.message || 'Error saving event', 'error');
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
      showToast('Event cancelled successfully.', 'success');
    } catch (err: any) {
      console.error('Error cancelling event:', err);
      showToast(err.message || 'Failed to cancel event', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = (event: EventItem) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      await deleteEvent(business.id, eventToDelete.id, eventToDelete.coverImage);
      setEventToDelete(null);
      showToast('Event deleted successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      showToast(err.message || 'Failed to delete event', 'error');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleCopyPublicLink = (event: EventItem) => {
    const url = `${getModuleDeepUrl(business, 'events')}#event-${event.id}`;
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
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                {isCreator ? 'Masterclasses, Workshops & Webinars' : 'Event & Webinar Ticketing'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Create single-day, multi-day, recurring, or custom date schedules with atomic slot capacities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
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
            onClick={() =>
              setSelectedQrModal({
                title: 'Events & Workshops Hub',
                subtitle: `Browse all upcoming masterclasses, workshops, and webinars by ${business.name}.`,
                badge: 'Live Events',
                url: getModuleDeepUrl(business, 'events'),
              })
            }
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="View, download, and print QR code for Events Hub"
          >
            <QrCode className="w-4 h-4 text-pink-600" />
            <span>Events QR</span>
          </button>

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
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Upcoming</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-heading">
            {upcomingEvents}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Active registration open</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Tickets Sold</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 font-heading">
            {totalTicketsSold}
          </div>
          <p className="text-[11px] text-blue-700 font-medium">Attendees registered</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 font-heading">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-purple-700 font-medium">Gross ticket earnings</p>
        </div>
      </div>

      {/* Main View: Calendar vs List */}
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
          onCreateEventOnDate={(dateString) => handleOpenCreateModal(dateString)}
        />
      ) : (
        <>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events by title, description, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'upcoming', 'sold_out', 'past', 'cancelled'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                    activeFilter === filter
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
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
              description={searchQuery ? 'No events match your search query.' : 'Host your first webinar or workshop! Multiple dates & time slots are fully supported.'}
              actionLabel="Create Masterclass / Event"
              onAction={() => handleOpenCreateModal()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((event) => {
                const seatsLeft = event.seatsRemaining ?? Math.max(0, event.capacity - event.ticketsSold);
                const percentSold = Math.min(100, Math.round((event.ticketsSold / (event.capacity || 1)) * 100));
                const isCancelled = event.status === 'cancelled';
                const isSoldOut = event.status === 'sold_out' || seatsLeft <= 0;

                const datesCount = event.scheduleDates?.length || 1;
                const totalSlotsCount = event.scheduleDates?.reduce((acc, d) => acc + (d.slots?.length || 0), 0) || 1;
                const isScheduleExpanded = expandedScheduleEventId === event.id;

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
                              : event.format === 'hybrid'
                              ? 'bg-purple-900/80 text-white border border-purple-400/30'
                              : 'bg-emerald-900/80 text-white border border-emerald-400/30'
                          }`}
                        >
                          {event.format === 'online' ? (
                            <>
                              <Video className="w-3 h-3 text-blue-300" />
                              <span>Online Webinar</span>
                            </>
                          ) : event.format === 'hybrid' ? (
                            <>
                              <Globe className="w-3 h-3 text-purple-300" />
                              <span>Hybrid</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3 text-emerald-300" />
                              <span>In-Person Offline</span>
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
                          {event.price > 0 ? `₹${event.price}` : 'Free Entry'}
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
                          {/* Schedule summary */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium">
                              {datesCount > 1
                                ? `${datesCount} Dates (${event.eventDate} → ${event.eventEndDate || event.eventDate})`
                                : `${event.eventDate} at ${event.eventTime}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {totalSlotsCount} time slot{totalSlotsCount > 1 ? 's' : ''} configured
                              {event.timezone ? ` • ${event.timezone}` : ''}
                            </span>
                          </div>

                          {event.format === 'online' ? (
                            <div className="flex items-center gap-2 text-slate-500">
                              <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">
                                {event.meetingPlatform === 'google_meet' ? 'Google Meet' : event.meetingPlatform || 'Online Platform'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">
                                {event.venueAddress || 'Venue'}{event.venueCity ? `, ${event.venueCity}` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Schedule Breakdown Button */}
                      {event.scheduleDates && event.scheduleDates.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setExpandedScheduleEventId(isScheduleExpanded ? null : event.id)}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-emerald-600" />
                              <span>View Schedule Breakdown ({event.scheduleDates.length} Dates, {totalSlotsCount} Slots)</span>
                            </span>
                            {isScheduleExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isScheduleExpanded && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 max-h-48 overflow-y-auto text-[11px]">
                              {event.scheduleDates.map((sd) => (
                                <div key={sd.id || sd.date} className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                                  <div className="font-bold text-slate-900 flex items-center justify-between">
                                    <span>📅 {sd.date}</span>
                                    <span className="text-[10px] text-slate-400">{sd.slots.length} slot(s)</span>
                                  </div>
                                  <div className="space-y-1 pl-2">
                                    {sd.slots.map((s) => (
                                      <div key={s.id} className="flex items-center justify-between text-slate-600">
                                        <span>⏰ {s.startTime}{s.endTime ? ` - ${s.endTime}` : ''} {s.label ? `(${s.label})` : ''}</span>
                                        <span className="font-semibold text-emerald-700">
                                          {s.ticketsSold || 0}/{s.capacity || event.capacity} seats
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Capacity & Progress */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            {event.seatingChart?.enabled && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                <Armchair className="w-2.5 h-2.5 text-purple-600" />
                                Seating Active
                              </span>
                            )}
                            <span>{event.ticketsSold} of {event.capacity} total seats booked</span>
                          </span>
                          <span className={seatsLeft <= 5 && seatsLeft > 0 ? 'text-amber-600 font-black' : 'text-slate-500'}>
                            {isSoldOut ? '0 seats left' : `${seatsLeft} seats left`}
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
                          onClick={() =>
                            setSelectedQrModal({
                              title: event.title,
                              subtitle: `${event.format === 'online' ? '🌐 Online' : `📍 ${event.venueCity || 'In-Person'}`} • ₹${event.price || 0}`,
                              badge: `${event.format.toUpperCase()} EVENT`,
                              url: `${getModuleDeepUrl(business, 'events')}#event-${event.id}`,
                            })
                          }
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-pink-600 transition text-xs font-bold cursor-pointer"
                          title="View, download, and print QR code for this event"
                        >
                          <QrCode className="w-4 h-4 text-pink-600" />
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
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  {editingEvent ? 'Edit Event / Masterclass' : 'Create New Event / Masterclass'}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure custom dates, time slots, capacity, timezone, and pricing.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Event / Webinar Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass: Advanced Full-Stack Architecture 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Description & Agenda */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Description & Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="What will attendees learn? Agenda, prerequisites, session outcomes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <ImageUploadInput
                  label="Cover Banner Image"
                  value={formCoverImage}
                  onChange={(val) => setFormCoverImage(val)}
                  aspectRatio="banner"
                  suggestedPresetType="banner"
                  placeholder="Enter event banner URL (HTTPS/HTTP) or upload..."
                  helperText="Displayed on event ticket pages, public registrations, and social shares."
                />
              </div>

              {/* Format & Timezone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Format Toggle */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block">Event Format</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormFormat('online')}
                      className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer ${
                        formFormat === 'online'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Online</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormFormat('offline')}
                      className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer ${
                        formFormat === 'offline'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>In-Person</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormFormat('hybrid')}
                      className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer ${
                        formFormat === 'hybrid'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Hybrid</span>
                    </button>
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block">Event Timezone</label>
                  <select
                    value={formTimezone}
                    onChange={(e) => setFormTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Location / Link Details */}
              {formFormat !== 'offline' && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Online Meeting Platform</label>
                      <select
                        value={formMeetingPlatform}
                        onChange={(e) => setFormMeetingPlatform(e.target.value as MeetingPlatform)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="google_meet">Google Meet</option>
                        <option value="zoom">Zoom</option>
                        <option value="teams">Microsoft Teams</option>
                        <option value="youtube_live">YouTube Live Stream</option>
                        <option value="other">Other Link</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Private Meeting Link URL</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/xyz-abc-def"
                        value={formMeetingUrl}
                        onChange={(e) => setFormMeetingUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Security: This link remains private and is only automatically dispatched to confirmed ticket buyers.</span>
                  </p>
                </div>
              )}

              {formFormat !== 'online' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Physical Venue Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Innov8 Coworking, 2nd Floor, MG Road"
                        value={formVenueAddress}
                        onChange={(e) => setFormVenueAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">City / Landmark</label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru, Karnataka"
                        value={formVenueCity}
                        onChange={(e) => setFormVenueCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: CREATOR EVENT DATE & SLOT SCHEDULE CONFIGURATION */}
              {/* ========================================================================= */}
              <div className="space-y-4 p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Event Dates &amp; Time Slots Schedule</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure any date schedule: single day, continuous date range, non-consecutive dates, or recurring weekly.
                    </p>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setScheduleMode('single')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        scheduleMode === 'single'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('multi_date')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        scheduleMode === 'multi_date'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Date Range
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('custom_dates')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        scheduleMode === 'custom_dates'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Custom Dates
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode('recurring')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        scheduleMode === 'recurring'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Recurring
                    </button>
                  </div>
                </div>

                {/* Generator Sub-panels based on scheduleMode */}
                {scheduleMode === 'single' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Select Date <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={singleDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSingleDate(val);
                          if (val) {
                            setScheduleDates([
                              {
                                id: `date_${val}`,
                                date: val,
                                slots: scheduleDates[0]?.slots?.length ? scheduleDates[0].slots : [createDefaultSlot(defaultSlotStart, defaultSlotEnd, formCapacity)],
                              },
                            ]);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Default Start Time</label>
                      <input
                        type="time"
                        value={defaultSlotStart}
                        onChange={(e) => setDefaultSlotStart(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Default End Time</label>
                      <input
                        type="time"
                        value={defaultSlotEnd}
                        onChange={(e) => setDefaultSlotEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                )}

                {scheduleMode === 'multi_date' && (
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Start Date</label>
                        <input
                          type="date"
                          value={rangeStartDate}
                          onChange={(e) => setRangeStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">End Date</label>
                        <input
                          type="date"
                          value={rangeEndDate}
                          onChange={(e) => setRangeEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Default Slot Time</label>
                        <input
                          type="time"
                          value={defaultSlotStart}
                          onChange={(e) => setDefaultSlotStart(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={generateRangeSchedule}
                          className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                        >
                          Generate Date Range
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {scheduleMode === 'custom_dates' && (
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:w-64 space-y-1">
                        <label className="font-bold text-slate-700">Pick Date to Add</label>
                        <input
                          type="date"
                          value={customNewDate}
                          onChange={(e) => setCustomNewDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        />
                      </div>
                      <div className="self-end w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleAddCustomDate}
                          disabled={!customNewDate}
                          className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Date to Event</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {scheduleMode === 'recurring' && (
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Repeat Frequency</label>
                        <select
                          value={recurringFreq}
                          onChange={(e) => setRecurringFreq(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        >
                          <option value="weekly">Selected Weekdays</option>
                          <option value="weekdays">Every Weekday (Mon - Fri)</option>
                          <option value="daily">Every Day</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Start Date</label>
                        <input
                          type="date"
                          value={recurringStartDate}
                          onChange={(e) => setRecurringStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">End Date</label>
                        <input
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    {recurringFreq === 'weekly' && (
                      <div className="space-y-1.5 pt-1">
                        <label className="font-bold text-slate-700 block text-[11px]">Choose Recurring Days</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { day: 0, label: 'Sun' },
                            { day: 1, label: 'Mon' },
                            { day: 2, label: 'Tue' },
                            { day: 3, label: 'Wed' },
                            { day: 4, label: 'Thu' },
                            { day: 5, label: 'Fri' },
                            { day: 6, label: 'Sat' },
                          ].map(({ day, label }) => {
                            const isSelected = recurringDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    if (recurringDays.length > 1) {
                                      setRecurringDays(recurringDays.filter((d) => d !== day));
                                    }
                                  } else {
                                    setRecurringDays([...recurringDays, day]);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={generateRecurringSchedule}
                        className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Repeat className="w-4 h-4" />
                        <span>Generate Recurring Schedule</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Configured Dates & Time Slots List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Configured Dates ({scheduleDates.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {scheduleDates.reduce((acc, d) => acc + d.slots.length, 0)} total time slots
                    </span>
                  </div>

                  {scheduleDates.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-300 text-center text-slate-400 space-y-1">
                      <Calendar className="w-6 h-6 mx-auto text-slate-300" />
                      <p className="font-bold text-xs text-slate-600">No dates configured yet</p>
                      <p className="text-[11px]">Select a single date or generate a date range above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {scheduleDates.map((dateEntry, dIdx) => (
                        <div
                          key={dateEntry.id || dateEntry.date}
                          className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                        >
                          {/* Date Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                {dateEntry.date}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {new Date(`${dateEntry.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {scheduleDates.length > 1 && dIdx === 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleApplySlotsToAllDates(dateEntry.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                                  title="Copy this date's slots to all other dates"
                                >
                                  Apply to All Dates
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleAddSlotToDate(dateEntry.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Slot</span>
                              </button>

                              {scheduleDates.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDate(dateEntry.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Remove this date"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Time Slots for this Date */}
                          <div className="space-y-2">
                            {dateEntry.slots.map((slot, sIdx) => (
                              <div
                                key={slot.id}
                                className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center"
                              >
                                <div className="space-y-0.5">
                                  <label className="text-[10px] font-bold text-slate-500">Start Time</label>
                                  <input
                                    type="time"
                                    required
                                    value={slot.startTime}
                                    onChange={(e) => handleUpdateSlot(dateEntry.id, slot.id, 'startTime', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <label className="text-[10px] font-bold text-slate-500">End Time</label>
                                  <input
                                    type="time"
                                    value={slot.endTime || ''}
                                    onChange={(e) => handleUpdateSlot(dateEntry.id, slot.id, 'endTime', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <label className="text-[10px] font-bold text-slate-500">Slot Capacity</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={slot.capacity || formCapacity}
                                    onChange={(e) => handleUpdateSlot(dateEntry.id, slot.id, 'capacity', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                  />
                                </div>

                                <div className="flex items-center justify-between gap-2 sm:pt-4">
                                  <input
                                    type="text"
                                    placeholder="Label (e.g. Morning Batch)"
                                    value={slot.label || ''}
                                    onChange={(e) => handleUpdateSlot(dateEntry.id, slot.id, 'label', e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                                  />

                                  {dateEntry.slots.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlot(dateEntry.id, slot.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                      title="Remove slot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Global Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Ticket Pricing</label>
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
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  ) : (
                    <div className="py-2.5 px-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-bold text-center">
                      Free Entry for Attendees
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block">
                    Default Slot Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-500">
                    Each time slot maintains an independent atomic seat limit to prevent overbooking.
                  </p>
                </div>
              </div>

              {/* Registration Window & Cancellation Policy (Optional) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">Registration Window &amp; Policies</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Registration Opens (Optional)</label>
                    <input
                      type="date"
                      value={formRegStartDate}
                      onChange={(e) => setFormRegStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Registration Closes (Optional)</label>
                    <input
                      type="date"
                      value={formRegEndDate}
                      onChange={(e) => setFormRegEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-slate-700">Cancellation &amp; Refund Policy</label>
                  <input
                    type="text"
                    placeholder="e.g. Cancellations allowed up to 24 hours prior to session start."
                    value={formCancellationPolicy}
                    onChange={(e) => setFormCancellationPolicy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Visual Seating Chart Designer */}
              <VisualSeatingChartCreator
                value={formSeatingChart}
                onChange={setFormSeatingChart}
                onCapacityChange={setFormCapacity}
              />

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
                placeholder="e.g. Unforeseen schedule conflict, rescheduled to next month..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancellingEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                Keep Event Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={formSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
              >
                {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDEES ROSTER MODAL */}
      {selectedEventForAttendees && (
        <EventAttendeesModal
          event={selectedEventForAttendees}
          business={business}
          isOpen={Boolean(selectedEventForAttendees)}
          onClose={() => setSelectedEventForAttendees(null)}
        />
      )}

      {/* QR MODAL */}
      {selectedQrModal && (
        <ModuleQrModal
          isOpen={Boolean(selectedQrModal)}
          onClose={() => setSelectedQrModal(null)}
          title={selectedQrModal.title}
          subtitle={selectedQrModal.subtitle}
          badge={selectedQrModal.badge}
          url={selectedQrModal.url}
          businessName={business.name}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmActionModal
        isOpen={Boolean(eventToDelete)}
        title="Delete Event?"
        message={`Are you sure you want to delete "${eventToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Event"
        confirmVariant="danger"
        isLoading={isDeletingEvent}
        onConfirm={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
