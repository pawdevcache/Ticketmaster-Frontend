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

// Remaining tickets + percent sold, guarding missing fields.
export const availability = (e) => {
  const total = e?.ticketsTotal || 0;
  const left = total - (e?.ticketsSold || 0);
  return { left, pct: total ? Math.min(100, ((e.ticketsSold || 0) / total) * 100) : 0 };
};
