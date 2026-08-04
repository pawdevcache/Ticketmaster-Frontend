// Thin fetch wrapper around the Go backend. Reads the bearer token from
// localStorage and unwraps Discovery's { _embedded: { <key>: [...] } } envelope.
//
// BASE is empty in dev so calls stay relative and Vite's proxy forwards them to
// :8080. In production set VITE_API_URL to the public backend origin.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const token = () => localStorage.getItem('token') || '';
const adminToken = () => localStorage.getItem('admin_token') || '';

async function req(path, { method = 'GET', body, auth, admin } = {}) {
  const bearer = admin ? adminToken() : auth ? token() : '';
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(bearer && { Authorization: `Bearer ${bearer}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (res.status === 204) return null;
  // A non-JSON response almost always means the request never reached the API
  // (e.g. it hit the SPA fallback or the backend is unreachable). Surface it as
  // a clean error instead of silently returning empty data.
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`The server is unavailable right now. Please try again in a moment.`);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

const embedded = (key) => (d) => d?._embedded?.[key] || [];
const qs = (p) => new URLSearchParams(p).toString();

export const api = {
  // Discovery
  events: (params = {}) => req(`/discovery/v2/events?${qs(params)}`).then(embedded('events')),
  event: (id) => req(`/discovery/v2/events/${id}`),
  venues: (params = {}) => req(`/discovery/v2/venues?${qs(params)}`).then(embedded('venues')),
  venue: (id) => req(`/discovery/v2/venues/${id}`),
  attractions: (params = {}) => req(`/discovery/v2/attractions?${qs(params)}`).then(embedded('attractions')),
  attraction: (id) => req(`/discovery/v2/attractions/${id}`),
  classifications: () => req('/discovery/v2/classifications').then(embedded('classifications')),
  // Auth
  register: (body) => req('/api/register', { method: 'POST', body }),
  login: (body) => req('/api/login', { method: 'POST', body }),
  resetPassword: (email, newPassword) => req('/api/reset-password', { method: 'POST', body: { email, newPassword } }),
  // Bookings (require auth)
  book: (body) => req('/api/bookings', { method: 'POST', body, auth: true }),
  bookings: () => req('/api/bookings', { auth: true }),
  booking: (id) => req(`/api/bookings/${id}`, { auth: true }),
  cancelBooking: (id) => req(`/api/bookings/${id}`, { method: 'DELETE', auth: true }),
};

// Admin API — every call carries the separate admin bearer token.
export const adminApi = {
  login: (email, password) => req('/api/admin/login', { method: 'POST', body: { email, password } }),
  me: () => req('/api/admin/me', { admin: true }),
  // Content management (Discovery writes) — res is events|venues|attractions|classifications.
  create: (res, body) => req(`/discovery/v2/${res}`, { method: 'POST', body, admin: true }),
  update: (res, id, body) => req(`/discovery/v2/${res}/${id}`, { method: 'PUT', body, admin: true }),
  remove: (res, id) => req(`/discovery/v2/${res}/${id}`, { method: 'DELETE', admin: true }),
  // Users
  users: (params = {}) => req(`/api/admin/users?${qs(params)}`, { admin: true }).then(embedded('users')),
  updateUser: (id, body) => req(`/api/admin/users/${id}`, { method: 'PUT', body, admin: true }),
  deleteUser: (id) => req(`/api/admin/users/${id}`, { method: 'DELETE', admin: true }),
  // Bookings across all users
  allBookings: (params = {}) => req(`/api/admin/bookings?${qs(params)}`, { admin: true }).then(embedded('bookings')),
  cancelBooking: (id) => req(`/api/admin/bookings/${id}/cancel`, { method: 'POST', admin: true }),
  deleteBooking: (id) => req(`/api/admin/bookings/${id}`, { method: 'DELETE', admin: true }),
};
