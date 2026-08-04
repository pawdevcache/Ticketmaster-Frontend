import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Footer from '../../shared/Footer';
import { money, fmtDate } from '../../utils/format';
import { IcoDate } from '../../utils/icons';

// Checkout for a held (pending) booking. The seats are already reserved; this
// completes payment and confirms them. In test mode the charge auto-succeeds,
// so "Pay" just calls the pay endpoint — no card entry. A real Stripe provider
// would collect the card via Stripe.js here using payment.clientSecret first.
export default function Checkout() {
  const { id } = useParams();
  const nav = useNavigate();
  const [booking, setBooking] = useState(null); // null loading, false not found
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.booking(id).then((b) => {
      if (b.status === 'confirmed') { nav(`/booking/${b.id}`, { replace: true }); return; } // already paid
      setBooking(b);
    }).catch(() => setBooking(false));
  }, [id]);

  const pay = async () => {
    setBusy(true); setErr('');
    try {
      await api.payBooking(id);
      nav(`/booking/${id}`, { replace: true });
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  if (booking === false) return <div className="empty container">Booking not found.</div>;
  if (!booking) return <div className="spinner" />;
  const ev = booking.event;

  return (
    <>
      <main className="container reveal" style={{ padding: '40px 24px 80px', maxWidth: 480 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Checkout</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Your seats are held while you pay — complete payment to confirm them.</p>

        <div className="card" style={{ padding: 22, marginBottom: 20 }}>
          <h3>{ev?.name || 'Event'}</h3>
          {ev && (
            <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <IcoDate /> {fmtDate(ev.date).full}
            </p>
          )}
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <span className="muted">{booking.quantity} ticket(s)</span>
            <strong style={{ fontSize: 22 }}>{money(booking.total)}</strong>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <strong>Payment</strong>
            <span className="pill">Test mode</span>
          </div>
          <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
            This demo runs in test mode — no real card is charged. Press Pay to complete the purchase.
          </p>
          {err && <p className="alert err" style={{ marginBottom: 14 }}>{err}</p>}
          <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={pay}>
            {busy ? 'Processing…' : `Pay ${money(booking.total)}`}
          </button>
        </div>

        <p className="center" style={{ marginTop: 16 }}>
          <Link to="/bookings" className="linkbtn">Pay later — it's held in My Tickets</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
