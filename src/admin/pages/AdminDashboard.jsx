import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, adminApi } from '../../services/api';
import { useAdmin } from '../context/AdminContext';
import ThemeToggle from '../../shared/ThemeToggle';
// Lazy so the ~450KB QR-scanner library loads only when Check-in is opened.
const CheckIn = lazy(() => import('../components/CheckIn'));
import { money, fmtDate, cover } from '../../utils/format';
import {
  IcoStats, IcoEvents, IcoVenue, IcoMic, IcoAll, IcoUsers, IcoTickets,
  IcoTrash, IcoAdd, IcoLogout, IcoTicket, IcoScan,
} from '../../utils/icons';

const TABS = [
  ['overview', 'Overview', IcoStats],
  ['events', 'Events', IcoEvents],
  ['venues', 'Venues', IcoVenue],
  ['attractions', 'Attractions', IcoMic],
  ['classifications', 'Categories', IcoAll],
  ['users', 'Users', IcoUsers],
  ['bookings', 'Bookings', IcoTickets],
  ['checkin', 'Check-in', IcoScan],
];

export default function AdminDashboard() {
  const { admin, logout } = useAdmin();
  const nav = useNavigate();
  const [tab, setTab] = useState('overview');
  const [d, setD] = useState({ events: [], venues: [], attractions: [], classes: [], users: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null); // { message, run, label }

  // Open a styled confirmation dialog for a destructive action.
  const ask = (message, run, label = 'Yes, delete') => setConfirm({ message, run, label });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [events, venues, attractions, classes, users, bookings] = await Promise.all([
        api.events({ size: 100 }), api.venues({ size: 100 }), api.attractions({ size: 100 }),
        api.classifications(), adminApi.users({ size: 100 }), adminApi.allBookings({ size: 100 }),
      ]);
      setD({ events, venues, attractions, classes, users, bookings });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  // Run a mutation, surface the result, refresh, and report success.
  const act = async (fn, okText) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: okText }); await loadAll(); return true; }
    catch (e) { setMsg({ ok: false, text: e.message }); return false; }
  };

  const nameOf = (list, id, key = 'name') => list.find((x) => x.id === id)?.[key] || '—';
  const confirmed = d.bookings.filter((b) => b.status === 'confirmed');
  const revenue = confirmed.reduce((s, b) => s + b.total, 0);

  // Analytics: revenue per event and tickets sold per category (confirmed only).
  const revByEvent = d.events
    .map((e) => ({ label: e.name, value: confirmed.filter((b) => b.eventId === e.id).reduce((s, b) => s + b.total, 0) }))
    .filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const catOf = Object.fromEntries(d.events.map((e) => [e.id, e.classificationId]));
  const ticketsByCat = d.classes
    .map((c) => ({ label: `${c.segment} · ${c.genre}`, value: confirmed.filter((b) => catOf[b.eventId] === c.id).reduce((s, b) => s + b.quantity, 0) }))
    .filter((x) => x.value > 0).sort((a, b) => b.value - a.value);

  // Dropdown option lists derived from loaded data.
  const venueOpts = d.venues.map((v) => ({ value: v.id, label: v.name }));
  const classOpts = d.classes.map((c) => ({ value: c.id, label: `${c.segment} · ${c.genre}` }));
  const attrOpts = d.attractions.map((a) => ({ value: a.id, label: a.name }));

  // Wire a Discovery resource's create/update/delete to the generic admin API.
  const content = (res) => ({
    onCreate: (body) => adminApi.create(res, body),
    onUpdate: (id, body) => adminApi.update(res, id, body),
    onDelete: (item) => adminApi.remove(res, item.id),
  });

  const CONFIG = {
    events: {
      label: 'Event', rows: d.events, ...content('events'),
      columns: [
        { key: 'name', label: 'Event', render: (e) => (
          <div className="row" style={{ gap: 12 }}>
            <span className="tbl-thumb" style={{ backgroundImage: `url(${cover(e.id, 100, 100)})` }} />
            <strong>{e.name}</strong>
          </div>
        ) },
        { key: 'date', label: 'Date', render: (e) => fmtDate(e.date).full },
        { key: 'price', label: 'Price', render: (e) => money(e.priceMin) + '+' },
        { key: 'sold', label: 'Sold', render: (e) => `${e.ticketsSold || 0}/${e.ticketsTotal || 0}` },
        { key: 'status', label: 'Status', render: (e) => <span className={`pill ${e.status === 'onsale' ? 'on' : 'off'}`}>{e.status}</span> },
      ],
      fields: [
        { key: 'name', label: 'Event name', type: 'text', required: true, wide: true },
        { key: 'date', label: 'Date & time', type: 'datetime', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['onsale', 'offsale', 'cancelled'].map((v) => ({ value: v, label: v })) },
        { key: 'venueId', label: 'Venue', type: 'select', options: venueOpts, required: true },
        { key: 'classificationId', label: 'Category', type: 'select', options: classOpts, required: true },
        { key: 'priceMin', label: 'Min price', type: 'number', required: true },
        { key: 'priceMax', label: 'Max price', type: 'number', required: true },
        { key: 'ticketsTotal', label: 'Total tickets', type: 'number', required: true },
        { key: 'attractionIds', label: 'Attractions', type: 'multiselect', options: attrOpts, wide: true },
        { key: 'title', label: 'Title', type: 'text', wide: true },
        { key: 'description', label: 'Description', type: 'textarea', wide: true },
      ],
    },
    venues: {
      label: 'Venue', rows: d.venues, ...content('venues'),
      columns: [
        { key: 'name', label: 'Venue', render: (v) => <strong>{v.name}</strong> },
        { key: 'city', label: 'City' }, { key: 'country', label: 'Country' },
        { key: 'capacity', label: 'Capacity', render: (v) => (v.capacity || 0).toLocaleString() },
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, wide: true },
        { key: 'city', label: 'City', type: 'text' }, { key: 'state', label: 'State', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'address', label: 'Address', type: 'text', wide: true },
        { key: 'capacity', label: 'Capacity', type: 'number' },
      ],
    },
    attractions: {
      label: 'Attraction', rows: d.attractions, ...content('attractions'),
      columns: [
        { key: 'name', label: 'Attraction', render: (a) => <strong>{a.name}</strong> },
        { key: 'type', label: 'Type' },
        { key: 'cat', label: 'Category', render: (a) => nameOf(d.classes, a.classificationId, 'segment') },
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, wide: true },
        { key: 'type', label: 'Type', type: 'text', placeholder: 'performer, team…' },
        { key: 'classificationId', label: 'Category', type: 'select', options: classOpts },
      ],
    },
    classifications: {
      label: 'Category', rows: d.classes, ...content('classifications'),
      columns: [
        { key: 'segment', label: 'Segment', render: (c) => <strong>{c.segment}</strong> },
        { key: 'genre', label: 'Genre' },
      ],
      fields: [
        { key: 'segment', label: 'Segment', type: 'text', required: true, placeholder: 'Music, Sports…' },
        { key: 'genre', label: 'Genre', type: 'text', placeholder: 'Rock, Basketball…' },
      ],
    },
    users: {
      label: 'User', rows: d.users, disableCreate: true, canDelete: (u) => u.id !== admin?.id,
      onUpdate: (id, body) => adminApi.updateUser(id, body),
      onDelete: (item) => adminApi.deleteUser(item.id),
      columns: [
        { key: 'name', label: 'Name', render: (u) => <strong>{u.name}</strong> },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', render: (u) => <span className={`pill ${u.role === 'admin' ? 'on' : ''}`}>{u.role}</span> },
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'select', options: [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }] },
        { key: 'password', label: 'New password', type: 'text', placeholder: 'leave blank to keep', wide: true },
      ],
    },
  };

  return (
    <div>
      <header className="admin-topbar">
        <div className="container row" style={{ justifyContent: 'space-between' }}>
          <span className="logo" style={{ color: '#fff' }}><IcoTicket /> <b>TixWave</b> Admin</span>
          <div className="row">
            <ThemeToggle light />
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
              <>
                <div className="stat-grid">
                  <Stat icon={IcoEvents} label="Events" value={d.events.length} />
                  <Stat icon={IcoVenue} label="Venues" value={d.venues.length} />
                  <Stat icon={IcoMic} label="Attractions" value={d.attractions.length} />
                  <Stat icon={IcoUsers} label="Users" value={d.users.length} />
                  <Stat icon={IcoTickets} label="Bookings" value={d.bookings.length} />
                  <Stat icon={IcoStats} label="Revenue" value={money(revenue)} />
                </div>
                <div className="chart-grid">
                  <div className="card chart-card">
                    <h3>Revenue by event</h3>
                    {revByEvent.length ? <BarList data={revByEvent} format={money} />
                      : <p className="muted">No confirmed bookings yet.</p>}
                  </div>
                  <div className="card chart-card">
                    <h3>Tickets sold by category</h3>
                    {ticketsByCat.length ? <BarList data={ticketsByCat} />
                      : <p className="muted">No confirmed bookings yet.</p>}
                  </div>
                </div>
              </>
            )}

            {CONFIG[tab] && <Resource key={tab} {...CONFIG[tab]} act={act} ask={ask} />}

            {tab === 'bookings' && (
              <>
                <h3 style={{ marginBottom: 16 }}>Bookings <span className="muted">({d.bookings.length})</span></h3>
                <Table head={['User', 'Event', 'Qty', 'Total', 'Status', '']}>
                  {d.bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{nameOf(d.users, b.userId, 'email')}</td>
                      <td>{nameOf(d.events, b.eventId)}</td>
                      <td>{b.quantity}</td>
                      <td>{money(b.total)}</td>
                      <td><span className={`pill ${b.status === 'confirmed' || b.status === 'pending' ? 'on' : 'off'}`}>{b.status}</span></td>
                      <td className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                        {(b.status === 'confirmed' || b.status === 'pending') &&
                          <button className="btn sm ghost" onClick={() => ask('Cancel this booking? The tickets will be returned to the event.', () => act(() => adminApi.cancelBooking(b.id), 'Booking cancelled'), 'Yes, cancel')}>Cancel</button>}
                        <DelBtn onClick={() => ask('Do you want to delete this booking?', () => act(() => adminApi.deleteBooking(b.id), 'Booking deleted'))} />
                      </td>
                    </tr>
                  ))}
                </Table>
              </>
            )}

            {tab === 'checkin' && <Suspense fallback={<div className="spinner" />}><CheckIn /></Suspense>}
          </>
        )}
      </main>

      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="card modal" style={{ maxWidth: 420, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Are you sure?</h3>
            <p className="muted" style={{ marginBottom: 22 }}>{confirm.message}</p>
            <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn danger" onClick={() => { const run = confirm.run; setConfirm(null); run(); }}>{confirm.label}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- generic resource manager: list + create/edit modal + delete ---

function Resource({ label, rows, columns, fields, onCreate, onUpdate, onDelete, act, ask, disableCreate, canDelete = () => true }) {
  const [editing, setEditing] = useState(null); // null=closed, {}=new, item=edit

  const save = async (body) => {
    const ok = await act(
      () => (editing.id ? onUpdate(editing.id, body) : onCreate(body)),
      `${label} ${editing.id ? 'updated' : 'created'}`
    );
    if (ok) setEditing(null);
  };
  const del = (item) => ask(`Do you want to delete this ${label.toLowerCase()}?`, () => act(() => onDelete(item), `${label} deleted`));

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h3>{label}s <span className="muted">({rows.length})</span></h3>
        {!disableCreate && <button className="btn sm" onClick={() => setEditing({})}><IcoAdd /> New {label.toLowerCase()}</button>}
      </div>
      <Table head={[...columns.map((c) => c.label), '']}>
        {rows.map((item) => (
          <tr key={item.id}>
            {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>)}
            <td className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn sm ghost" onClick={() => setEditing(item)}>Edit</button>
              {canDelete(item) && <DelBtn onClick={() => del(item)} />}
            </td>
          </tr>
        ))}
      </Table>
      {editing && <ResourceForm label={label} fields={fields} initial={editing} onSubmit={save} onClose={() => setEditing(null)} />}
    </>
  );
}

function ResourceForm({ label, fields, initial, onSubmit, onClose }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => {
    let v = initial[f.key];
    if (f.type === 'multiselect') v = Array.isArray(v) ? v : [];
    else { v = v ?? ''; if (f.type === 'datetime' && v) v = String(v).slice(0, 16); }
    return [f.key, v];
  })));
  const set = (f, val) => setVals((s) => ({ ...s, [f.key]: val }));
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return; // guard against double-submit → duplicate records
    const body = {};
    for (const f of fields) {
      let v = vals[f.key];
      if (f.type === 'number') v = v === '' ? 0 : Number(v);
      else if (f.type === 'datetime') v = v && v.length === 16 ? v + ':00' : v; // → 2006-01-02T15:04:05
      if (f.key === 'password' && v === '') continue; // omit → backend keeps current
      body[f.key] = v;
    }
    setSaving(true);
    await onSubmit(body);                       // closes on success, stays open on error
    if (mounted.current) setSaving(false);      // re-enable only if the form is still open
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="card modal reveal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 style={{ marginBottom: 16 }}>{initial.id ? 'Edit' : 'New'} {label.toLowerCase()}</h3>
        <div className="form-grid">
          {fields.map((f) => <Field key={f.key} f={f} value={vals[f.key]} onChange={(v) => set(f, v)} />)}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ f, value, onChange }) {
  const cls = f.wide || f.type === 'textarea' || f.type === 'multiselect' ? 'wide' : '';
  let control;
  if (f.type === 'select')
    control = (
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)} required={f.required}>
        <option value="">Select…</option>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  else if (f.type === 'multiselect')
    control = (
      <select className="field" multiple value={value} style={{ height: 96 }}
        onChange={(e) => onChange([...e.target.selectedOptions].map((o) => o.value))}>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  else if (f.type === 'textarea')
    control = <textarea className="field" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />;
  else
    control = (
      <input className="field" value={value} placeholder={f.placeholder} required={f.required}
        type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'}
        onChange={(e) => onChange(e.target.value)} />
    );
  return <label className={cls}><span className="fld-label">{f.label}</span>{control}</label>;
}

const Stat = ({ icon: Icon, label, value }) => (
  <div className="card stat-card">
    <div className="stat-ico"><Icon /></div>
    <div><b>{value}</b><span>{label}</span></div>
  </div>
);

// Single-series horizontal bars with direct value labels — magnitude by category.
const BarList = ({ data, format = (v) => v }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="barlist">
      {data.map((d) => (
        <div className="barrow" key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <span className="barlabel">{d.label}</span>
          <span className="bartrack"><span className="barfill" style={{ width: `${(d.value / max) * 100}%` }} /></span>
          <span className="barval">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
};

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
