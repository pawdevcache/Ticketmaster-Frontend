import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import Footer from '../../shared/Footer';
import ETicket from '../components/ETicket';
import { cover, money, fmtDate } from '../../utils/format';
import { IcoDate, IcoTickets } from '../../utils/icons';

export default function Bookings() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState(null);  // null = loading
  const [confirm, setConfirm] = useState(null); // booking pending cancellation
  const [ticket, setTicket] = useState(null);   // booking shown as an e-ticket
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    load();
  }, []);

  // Bookings now carry an embedded event summary, so no per-booking fetch.
  const load = async () => setItems(await api.bookings());

  // Cancel only after the user confirms in the dialog.
  const doCancel = async () => {
    setBusy(true);
    try { await api.cancelBooking(confirm.id); await load(); setConfirm(null); }
    finally { setBusy(false); }
  };

  if (items === null) return <div className="spinner" />;

  return (
    <>
    <main className="container reveal" style={{ padding: '32px 24px 80px' }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><IcoTickets /> My Tickets</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          You have no bookings yet.<br />
          <Link to="/" className="btn" style={{ marginTop: 16 }}>Discover events</Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
          {items.map((b) => {
            const active = b.status === 'confirmed' || b.status === 'pending'; // holds seats
            return (
              <div key={b.id} className="card booking-card" style={{ opacity: active ? 1 : 0.6 }}>
                <div className="booking-thumb" style={{ backgroundImage: `url(${cover(b.eventId)})` }} />
                <div style={{ padding: 18, flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h3>{b.event?.name || 'Event'}</h3>
                    <span className={`pill ${active ? 'on' : 'off'}`}>{b.status}</span>
                  </div>
                  {b.event && <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcoDate /> {fmtDate(b.event.date).full}</p>}
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                    <span className="muted">{b.quantity} ticket(s) · <strong>{money(b.total)}</strong></span>
                    {active && (
                      <div className="row" style={{ gap: 8 }}>
                        {b.status === 'pending'
                          ? <button className="btn sm" onClick={() => nav(`/checkout/${b.id}`)}>Pay now</button>
                          : <button className="btn sm ghost" onClick={() => setTicket(b)}>View ticket</button>}
                        <button className="btn sm danger" onClick={() => setConfirm(b)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>

    {confirm && (
      <div className="modal-backdrop" onClick={() => !busy && setConfirm(null)}>
        <div className="card modal" style={{ maxWidth: 420, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🎟️</div>
          <h3 style={{ marginBottom: 8 }}>Cancel this ticket?</h3>
          <p className="muted" style={{ marginBottom: 22 }}>
            Do you want to cancel your booking for <strong>{confirm.event?.name || 'this event'}</strong>?
            This releases your {confirm.quantity} ticket(s) and can’t be undone.
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
            <button className="btn ghost" onClick={() => setConfirm(null)} disabled={busy}>Keep ticket</button>
            <button className="btn danger" onClick={doCancel} disabled={busy}>
              {busy ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      </div>
    )}

    {ticket && (
      <div className="modal-backdrop" onClick={() => setTicket(null)}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380 }}>
          <ETicket booking={ticket} onDone={() => setTicket(null)} />
        </div>
      </div>
    )}

    <Footer />
    </>
  );
}
