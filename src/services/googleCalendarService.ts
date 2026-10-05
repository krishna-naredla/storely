import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { EventItem, EventTicket } from '../types';

export const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// In-memory token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear cached token on sign-out
onAuthStateChanged(auth, (user: User | null) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

/**
 * Obtain Google Calendar Access Token via Firebase Google Auth Provider
 */
export async function getCalendarAccessToken(forcePrompt = false): Promise<string> {
  if (cachedAccessToken && !forcePrompt) {
    return cachedAccessToken;
  }

  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    CALENDAR_SCOPES.forEach((scope) => provider.addScope(scope));

    if (forcePrompt) {
      provider.setCustomParameters({ prompt: 'consent select_account' });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Calendar OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (err: any) {
    console.error('[GoogleCalendar] Auth error:', err);
    throw new Error(err.message || 'Google Calendar authorization failed.');
  } finally {
    isSigningIn = false;
  }
}

/**
 * Format RFC3339 start & end dateTime strings
 */
function calculateEventDates(eventDate: string, eventTime: string, durationMinutes = 60) {
  try {
    // Normalize time (e.g., "18:00" or "06:00 PM")
    let hours = 18;
    let minutes = 0;

    if (eventTime.includes(':')) {
      const parts = eventTime.split(':');
      hours = parseInt(parts[0], 10) || 18;
      const minPart = parts[1].split(' ')[0];
      minutes = parseInt(minPart, 10) || 0;

      if (eventTime.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
      } else if (eventTime.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
      }
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const startIso = `${eventDate}T${pad(hours)}:${pad(minutes)}:00`;

    const startDate = new Date(startIso);
    if (isNaN(startDate.getTime())) {
      // Fallback
      return {
        start: { dateTime: `${eventDate}T18:00:00Z` },
        end: { dateTime: `${eventDate}T19:00:00Z` },
      };
    }

    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    return {
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
    };
  } catch (e) {
    return {
      start: { dateTime: `${eventDate}T18:00:00Z` },
      end: { dateTime: `${eventDate}T19:00:00Z` },
    };
  }
}

/**
 * Export a confirmed event and its attendees directly to Google Calendar
 */
export async function exportEventToGoogleCalendar(
  event: EventItem,
  attendees: EventTicket[] = []
): Promise<{ success: boolean; eventId: string; htmlLink: string; attendeesCount: number }> {
  const token = await getCalendarAccessToken();

  const { start, end } = calculateEventDates(
    event.eventDate,
    event.eventTime,
    event.eventDurationMinutes || 60
  );

  const activeAttendees = attendees.filter((a) => a.paymentStatus !== 'refunded');

  let attendeeSummaryText = '';
  if (activeAttendees.length > 0) {
    attendeeSummaryText = `\n\n👥 Confirmed Attendees (${activeAttendees.length}):\n` +
      activeAttendees.map((a, i) => `${i + 1}. ${a.customerName} (${a.customerPhone}) - Ticket: ${a.ticketId} [${a.paymentStatus.toUpperCase()}]`).join('\n');
  }

  let location = '';
  if (event.format === 'online') {
    location = event.meetingUrl || 'Online Meeting';
  } else {
    location = [event.venueAddress, event.venueCity].filter(Boolean).join(', ') || 'In-Person Venue';
  }

  const description = `${event.description || ''}\n\n` +
    `📌 Format: ${event.format.toUpperCase()}\n` +
    (event.meetingUrl ? `🔗 Meeting URL: ${event.meetingUrl}\n` : '') +
    (event.venueAddress ? `📍 Venue: ${event.venueAddress}${event.venueCity ? `, ${event.venueCity}` : ''}\n` : '') +
    `🎟 Total Tickets Sold: ${event.ticketsSold || activeAttendees.length} / ${event.capacity || 'Unlimited'}\n` +
    attendeeSummaryText +
    `\n\nSynchronized via Storelly Creator Events Platform`;

  const calendarPayload: any = {
    summary: event.title,
    description,
    location,
    start,
    end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 120 },
        { method: 'email', minutes: 24 * 60 },
      ],
    },
  };

  // Add Google Meet conference data if format is online
  if (event.format === 'online' && (!event.meetingUrl || event.meetingPlatform === 'google_meet')) {
    calendarPayload.conferenceData = {
      createRequest: {
        requestId: `meet_${event.id}_${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarPayload),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Calendar access expired. Please click sync again to re-authorize.');
    }
    throw new Error(errorData.error?.message || 'Failed to create event in Google Calendar.');
  }

  const result = await res.json();

  return {
    success: true,
    eventId: result.id,
    htmlLink: result.htmlLink || 'https://calendar.google.com',
    attendeesCount: activeAttendees.length,
  };
}

/**
 * Check if the user has an active in-memory Google Calendar token
 */
export function hasGoogleCalendarSession(): boolean {
  return !!cachedAccessToken;
}
