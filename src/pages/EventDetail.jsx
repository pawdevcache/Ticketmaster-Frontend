import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Footer from '../components/Footer';
import { cover, money, fmtDate, availability } from '../util';
import { IcoDate, IcoVenue, IcoMic } from '../icons';

export default function EventDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [acts, setActs] = useState([]);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState(null);        // { ok, text }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.event(id).then(async (e) => {
      setEvent(e);
      if (e.venueId) api.venue(e.venueId).then(setVenue).catch(() => {});
      Promise.all((e.attractionIds || []).map((a) => api.attraction(a).catch(() => null)))
        .then((r) => setActs(r.filter(Boolean)));
    }).catch(() => setEvent(false));
  }, [id]);

  if (event === false) return <div className="empty container">Event not found.</div>;
  if (!event) return <div className="spinner" />;

  const d = fmtDate(event.date);
  const { left } = availability(event);
  const soldOut = left <= 0 || event.status !== 'onsale';

  const book = async () => {
    if (!user) return nav('/login');
    setBusy(true); setMsg(null);
    try {
      await api.book({ eventId: event.id, quantity: qty });
      setMsg({ ok: true, text: `Booked ${qty} ticket(s)! View them under My Tickets.` });
      setEvent(await api.event(id)); // refresh availability
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <main className="container" style={{ padding: '28px 24px 80px' }}>
      <div className="banner reveal" style={{ backgroundImage: `url(${cover(event.id, 1200, 500)})` }}>
        <div className="cap">
          <span className={`pill ${soldOut ? 'off' : 'on'}`}>{soldOut ? 'Sold out' : 'On sale'}</span>
          <h1 style={{ marginTop: 10 }}>{event.name}</h1>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcoDate /> {d.full}</p>
        </div>
      </div>

      <div className="detail-grid">
        <section>
          <h2 style={{ marginBottom: 12 }}>About this event</h2>
          <p className="muted">
            {event.description?.trim()
              ? event.description
              : `Prices range from ${money(event.priceMin)} to ${money(event.priceMax)}. ` +
                `${left.toLocaleString()} of ${(event.ticketsTotal || 0).toLocaleString()} tickets remaining.`}
          </p>

          {venue && (
            <>
              <h3 style={{ margin: '24px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><IcoVenue /> Venue</h3>
              <div className="card" style={{ padding: 18 }}>
                <strong>{venue.name}</strong>
                <p className="muted">{[venue.address, venue.city, venue.state, venue.country].filter(Boolean).join(', ')}</p>
                {venue.capacity ? <p className="muted">Capacity: {venue.capacity.toLocaleString()}</p> : null}
              </div>
            </>
          )}

          {acts.length > 0 && (
            <>
              <h3 style={{ margin: '24px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><IcoMic /> Line-up</h3>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {acts.map((a) => <span key={a.id} className="pill">{a.name}</span>)}
              </div>
            </>
          )}
        </section>

        <aside className="card book-card">
          <span className="muted">From</span>
          <div className="price">{money(event.priceMin)}</div>

          <div style={{ margin: '20px 0' }}>
            <label className="muted" style={{ fontSize: 14 }}>Quantity</label>
            <div className="stepper" style={{ marginTop: 8 }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <strong style={{ fontSize: 18 }}>{qty}</strong>
              <button onClick={() => setQty((q) => Math.min(left || 1, q + 1))}>+</button>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="muted">Total</span>
            <strong style={{ fontSize: 20 }}>{money(event.priceMin * qty)}</strong>
          </div>

          <button className="btn" style={{ width: '100%' }} disabled={soldOut || busy} onClick={book}>
            {soldOut ? 'Sold out' : busy ? 'Booking…' : user ? 'Book now' : 'Sign in to book'}
          </button>

          {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} style={{ marginTop: 14 }}>{msg.text}</p>}
        </aside>
      </div>
    </main>
    <Footer />
    </>
  );
}
