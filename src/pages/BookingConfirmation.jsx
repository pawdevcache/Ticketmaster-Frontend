import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Footer from '../components/Footer';
import ETicket from '../components/ETicket';

export default function BookingConfirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null); // null = loading, false = not found

  useEffect(() => {
    api.booking(id)
      .then(async (b) => { b.event = await api.event(b.eventId).catch(() => null); setBooking(b); })
      .catch(() => setBooking(false));
  }, [id]);

  if (booking === false) return <div className="empty container">Booking not found.</div>;
  if (!booking) return <div className="spinner" />;

  return (
    <>
      <main className="container" style={{ padding: '40px 24px 80px', maxWidth: 520 }}>
        <div className="center reveal">
          <div style={{ fontSize: 52, lineHeight: 1 }}>✅</div>
          <h1 style={{ fontSize: 30, margin: '10px 0 6px' }}>Booking confirmed!</h1>
          <p className="muted" style={{ marginBottom: 28 }}>
            Your tickets are ready — a copy is always in <strong>My Tickets</strong>.
          </p>
        </div>

        <ETicket booking={booking} />

        <div className="row" style={{ gap: 12, marginTop: 22 }}>
          <Link to="/bookings" className="btn" style={{ flex: 1, justifyContent: 'center' }}>My Tickets</Link>
          <Link to="/" className="btn ghost" style={{ flex: 1, justifyContent: 'center' }}>Browse events</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
