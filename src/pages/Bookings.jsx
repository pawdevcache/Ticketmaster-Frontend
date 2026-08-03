import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { cover, money, fmtDate, addToCalendar } from '../utils/format';
import { IcoDate, IcoTickets } from '../utils/icons';

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

  // Enrich each booking with its event so we can show name/date/image.
  const load = async () => {
    const bookings = await api.bookings();
    const withEvents = await Promise.all(
      bookings.map(async (b) => ({ ...b, event: await api.event(b.eventId).catch(() => null) }))
    );
    setItems(withEvents);
  };

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
            const cancelled = b.status === 'cancelled';
            return (
              <div key={b.id} className="card booking-card" style={{ opacity: cancelled ? 0.6 : 1 }}>
                <div className="booking-thumb" style={{ backgroundImage: `url(${cover(b.eventId)})` }} />
                <div style={{ padding: 18, flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h3>{b.event?.name || 'Event'}</h3>
                    <span className={`pill ${cancelled ? 'off' : 'on'}`}>{b.status}</span>
                  </div>
                  {b.event && <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcoDate /> {fmtDate(b.event.date).full}</p>}
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                    <span className="muted">{b.quantity} ticket(s) · <strong>{money(b.total)}</strong></span>
                    {!cancelled && (
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn sm ghost" onClick={() => setTicket(b)}>View ticket</button>
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
        <div className="card eticket" onClick={(e) => e.stopPropagation()}>
          <div className="eticket-head">
            <span className="tag">E-Ticket</span>
            <h3>{ticket.event?.name || 'Event'}</h3>
            {ticket.event && (
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: .9 }}>
                <IcoDate /> {fmtDate(ticket.event.date).full}
              </p>
            )}
          </div>
          <div className="eticket-body">
            <div className="eticket-qr">
              <QRCodeSVG value={`TIXWAVE:${ticket.id}`} size={172} level="M" />
            </div>
            <div className="eticket-meta">
              <div><span className="muted">Tickets</span><strong>{ticket.quantity}</strong></div>
              <div><span className="muted">Total</span><strong>{money(ticket.total)}</strong></div>
              <div><span className="muted">Ref</span><strong>{ticket.id.slice(-8).toUpperCase()}</strong></div>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 4 }}>
              <button className="btn ghost" style={{ flex: 1 }} disabled={!ticket.event} onClick={() => addToCalendar(ticket.event, ticket.quantity)}>Add to calendar</button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setTicket(null)}>Done</button>
            </div>
          </div>
        </div>
      </div>
    )}

    <Footer />
    </>
  );
}
