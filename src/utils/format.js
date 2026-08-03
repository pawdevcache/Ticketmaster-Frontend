// Small presentation helpers shared across pages.

// Deterministic cover image per event id (no image field in the API).
export const cover = (seed, w = 800, h = 500) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

export const money = (n) => `$${Number(n || 0).toLocaleString()}`;

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    mon: d.toLocaleString('en', { month: 'short' }),
    full: d.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' }),
  };
};

// Build an .ics file for an event and trigger a download ("Add to calendar").
export function addToCalendar(event, quantity = 1) {
  if (!event?.date) return;
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = stamp(event.date);
  const end = stamp(new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000)); // +2h
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TixWave//EN', 'BEGIN:VEVENT',
    `UID:${event.id || start}@tixwave`, `DTSTAMP:${start}`, `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${event.name || 'Event'}`, `DESCRIPTION:${quantity} ticket(s) booked on TixWave`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event.name || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// Remaining tickets + percent sold, guarding missing fields.
export const availability = (e) => {
  const total = e?.ticketsTotal || 0;
  const left = total - (e?.ticketsSold || 0);
  return { left, pct: total ? Math.min(100, ((e.ticketsSold || 0) / total) * 100) : 0 };
};
