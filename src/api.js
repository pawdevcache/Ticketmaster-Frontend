// Thin fetch wrapper around the Go backend. Reads the bearer token from
// localStorage and unwraps Discovery's { _embedded: { <key>: [...] } } envelope.
//
// BASE is empty in dev so calls stay relative and Vite's proxy forwards them to
// :8080. In production set VITE_API_URL to the public backend origin.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const token = () => localStorage.getItem('token') || '';

async function req(path, { method = 'GET', body, auth } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(auth && { Authorization: `Bearer ${token()}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const ct = res.headers.get('content-type') || '';
  // A non-JSON response almost always means the request hit the static frontend
  // (SPA rewrite → index.html) instead of the API — i.e. the API base is wrong
  // or unset. Surface that clearly rather than silently returning empty data.
  if (!ct.includes('application/json')) {
    throw new Error(
      `Expected JSON from ${BASE || 'the app origin'}${path} but got "${ct || 'no content-type'}". ` +
      `Is VITE_API_URL set to the backend URL?`
    );
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

const embedded = (key) => (d) => d?._embedded?.[key] || [];

export const api = {
  // Discovery
  events: (params = {}) =>
    req(`/discovery/v2/events?${new URLSearchParams(params)}`).then(embedded('events')),
  event: (id) => req(`/discovery/v2/events/${id}`),
  venue: (id) => req(`/discovery/v2/venues/${id}`),
  attraction: (id) => req(`/discovery/v2/attractions/${id}`),
  classifications: () => req('/discovery/v2/classifications').then(embedded('classifications')),
  // Auth
  register: (body) => req('/api/register', { method: 'POST', body }),
  login: (body) => req('/api/login', { method: 'POST', body }),
  // Bookings (require auth)
  book: (body) => req('/api/bookings', { method: 'POST', body, auth: true }),
  bookings: () => req('/api/bookings', { auth: true }),
  cancelBooking: (id) => req(`/api/bookings/${id}`, { method: 'DELETE', auth: true }),
};
