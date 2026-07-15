import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Footer from '../components/Footer';
import { cover, money, fmtDate } from '../util';
import { IcoDate, IcoTickets } from '../icons';

export default function Bookings() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState(null); // null = loading

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

  const cancel = async (id) => {
    await api.cancelBooking(id);
    load();
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
              <div key={b.id} className="card" style={{ display: 'flex', overflow: 'hidden', opacity: cancelled ? 0.6 : 1 }}>
                <div
                  style={{ width: 140, minWidth: 140, backgroundImage: `url(${cover(b.eventId)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <div style={{ padding: 18, flex: 1 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h3>{b.event?.name || 'Event'}</h3>
                    <span className={`pill ${cancelled ? 'off' : 'on'}`}>{b.status}</span>
                  </div>
                  {b.event && <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcoDate /> {fmtDate(b.event.date).full}</p>}
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                    <span className="muted">{b.quantity} ticket(s) · <strong>{money(b.total)}</strong></span>
                    {!cancelled && (
                      <button className="btn sm danger" onClick={() => cancel(b.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
    <Footer />
    </>
  );
}
