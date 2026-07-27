import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, adminApi } from '../api';
import { useAdmin } from '../adminAuth';
import { money, fmtDate } from '../util';
import { IcoStats, IcoEvents, IcoUsers, IcoTickets, IcoTrash, IcoAdd, IcoLogout, IcoTicket } from '../icons';

const TABS = [
  ['overview', 'Overview', IcoStats],
  ['events', 'Events', IcoEvents],
  ['users', 'Users', IcoUsers],
  ['bookings', 'Bookings', IcoTickets],
];
const BLANK = { name: '', date: '', venueId: '', classificationId: '', priceMin: '', priceMax: '', ticketsTotal: '', status: 'onsale' };

export default function AdminDashboard() {
  const { admin, logout } = useAdmin();
  const nav = useNavigate();
  const [tab, setTab] = useState('overview');
  const [d, setD] = useState({ events: [], venues: [], classes: [], users: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);      // { ok, text }
  const [ev, setEv] = useState(BLANK);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [events, venues, classes, users, bookings] = await Promise.all([
        api.events({ size: 100 }), api.venues({ size: 100 }), api.classifications(),
        adminApi.users({ size: 100 }), adminApi.allBookings({ size: 100 }),
      ]);
      setD({ events, venues, classes, users, bookings });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  // Run a mutation, surface the result, and refresh.
  const act = async (fn, okText) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); loadAll(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  const nameOf = (list, id, key = 'name') => list.find((x) => x.id === id)?.[key] || '—';
  const revenue = d.bookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.total, 0);

  const createEvent = (e) => {
    e.preventDefault();
    const date = ev.date.length === 16 ? ev.date + ':00' : ev.date; // datetime-local → RFC3339-ish
    act(() => adminApi.createEvent({
      ...ev, date,
      priceMin: +ev.priceMin, priceMax: +ev.priceMax, ticketsTotal: +ev.ticketsTotal,
    }), 'Event created');
    setEv(BLANK);
  };
  const setF = (k) => (e) => setEv({ ...ev, [k]: e.target.value });

  return (
    <div>
      <header className="admin-topbar">
        <div className="container row" style={{ justifyContent: 'space-between' }}>
          <span className="logo" style={{ color: '#fff' }}><IcoTicket /> <b>TixWave</b> Admin</span>
          <div className="row">
            <span className="pill">{admin?.email}</span>
            <button className="btn sm danger" onClick={() => { logout(); nav('/admin/login'); }}><IcoLogout /> Logout</button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '28px 24px 80px' }}>
        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 24 }}>
          {TABS.map(([key, label, Icon]) => (
            <button key={key} className={`chip ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              <Icon /> {label}
            </button>
          ))}
        </div>

        {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 20 }}>{msg.text}</p>}
        {loading ? <div className="spinner" /> : (
          <>
            {tab === 'overview' && (
              <div className="stat-grid">
                <Stat icon={IcoEvents} label="Events" value={d.events.length} />
                <Stat icon={IcoUsers} label="Users" value={d.users.length} />
                <Stat icon={IcoTickets} label="Bookings" value={d.bookings.length} />
                <Stat icon={IcoStats} label="Revenue" value={money(revenue)} />
              </div>
            )}

            {tab === 'events' && (
              <>
                <form className="card" onSubmit={createEvent} style={{ padding: 20, marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 14 }}><IcoAdd /> Create event</h3>
                  <div className="form-grid">
                    <input className="field" placeholder="Event name" value={ev.name} onChange={setF('name')} required />
                    <input className="field" type="datetime-local" value={ev.date} onChange={setF('date')} required />
                    <select className="field" value={ev.venueId} onChange={setF('venueId')} required>
                      <option value="">Select venue…</option>
                      {d.venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <select className="field" value={ev.classificationId} onChange={setF('classificationId')} required>
                      <option value="">Select category…</option>
                      {d.classes.map((c) => <option key={c.id} value={c.id}>{c.segment} · {c.genre}</option>)}
                    </select>
                    <input className="field" type="number" placeholder="Min price" value={ev.priceMin} onChange={setF('priceMin')} required />
                    <input className="field" type="number" placeholder="Max price" value={ev.priceMax} onChange={setF('priceMax')} required />
                    <input className="field" type="number" placeholder="Total tickets" value={ev.ticketsTotal} onChange={setF('ticketsTotal')} required />
                    <select className="field" value={ev.status} onChange={setF('status')}>
                      <option value="onsale">On sale</option>
                      <option value="offsale">Off sale</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <button className="btn" type="submit" style={{ marginTop: 14 }}><IcoAdd /> Create event</button>
                </form>

                <Table head={['Event', 'Date', 'Price', 'Sold', 'Status', '']}>
                  {d.events.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.name}</strong></td>
                      <td>{fmtDate(e.date).full}</td>
                      <td>{money(e.priceMin)}+</td>
                      <td>{e.ticketsSold || 0}/{e.ticketsTotal || 0}</td>
                      <td><span className={`pill ${e.status === 'onsale' ? 'on' : 'off'}`}>{e.status}</span></td>
                      <td><DelBtn onClick={() => act(() => adminApi.deleteEvent(e.id), 'Event deleted')} /></td>
                    </tr>
                  ))}
                </Table>
              </>
            )}

            {tab === 'users' && (
              <Table head={['Name', 'Email', 'Role', '']}>
                {d.users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`pill ${u.role === 'admin' ? 'on' : ''}`}>{u.role}</span></td>
                    <td>{u.id !== admin?.id && <DelBtn onClick={() => act(() => adminApi.deleteUser(u.id), 'User deleted')} />}</td>
                  </tr>
                ))}
              </Table>
            )}

            {tab === 'bookings' && (
              <Table head={['User', 'Event', 'Qty', 'Total', 'Status', '']}>
                {d.bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{nameOf(d.users, b.userId, 'email')}</td>
                    <td>{nameOf(d.events, b.eventId)}</td>
                    <td>{b.quantity}</td>
                    <td>{money(b.total)}</td>
                    <td><span className={`pill ${b.status === 'confirmed' ? 'on' : 'off'}`}>{b.status}</span></td>
                    <td className="row" style={{ gap: 8 }}>
                      {b.status === 'confirmed' &&
                        <button className="btn sm ghost" onClick={() => act(() => adminApi.cancelBooking(b.id), 'Booking cancelled')}>Cancel</button>}
                      <DelBtn onClick={() => act(() => adminApi.deleteBooking(b.id), 'Booking deleted')} />
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const Stat = ({ icon: Icon, label, value }) => (
  <div className="card stat-card">
    <div className="stat-ico"><Icon /></div>
    <div><b>{value}</b><span>{label}</span></div>
  </div>
);

const Table = ({ head, children }) => (
  <div className="card" style={{ overflowX: 'auto' }}>
    <table className="tbl">
      <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const DelBtn = ({ onClick }) => (
  <button className="btn sm danger" title="Delete" onClick={onClick}><IcoTrash /></button>
);
