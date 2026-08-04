import { QRCodeSVG } from 'qrcode.react';
import { fmtDate, money, addToCalendar } from '../utils/format';
import { IcoDate } from '../utils/icons';

// A single e-ticket card: dark header, scannable QR (readable details), stub,
// and an "Add to calendar" action. Pass onDone to render a closing button
// (used when shown inside a modal).
export default function ETicket({ booking, onDone }) {
  const qr = [
    'TixWave E-Ticket',
    `Event: ${booking.event?.name || 'Event'}`,
    booking.event ? `Date: ${fmtDate(booking.event.date).full}` : '',
    `Tickets: ${booking.quantity}`,
    `Ref: ${booking.id.slice(-8).toUpperCase()}`,
    `Booking ID: ${booking.id}`,
  ].filter(Boolean).join('\n');

  return (
    <div className="card eticket">
      <div className="eticket-head">
        <span className="tag">E-Ticket</span>
        <h3>{booking.event?.name || 'Event'}</h3>
        {booking.event && (
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: .9 }}>
            <IcoDate /> {fmtDate(booking.event.date).full}
          </p>
        )}
      </div>
      <div className="eticket-body">
        <div className="eticket-qr"><QRCodeSVG value={qr} size={172} level="M" /></div>
        <div className="eticket-meta">
          <div><span className="muted">Tickets</span><strong>{booking.quantity}</strong></div>
          <div><span className="muted">Total</span><strong>{money(booking.total)}</strong></div>
          <div><span className="muted">Ref</span><strong>{booking.id.slice(-8).toUpperCase()}</strong></div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 4 }}>
          <button className="btn ghost" style={{ flex: 1 }} disabled={!booking.event} onClick={() => addToCalendar(booking.event, booking.quantity)}>Add to calendar</button>
          {onDone && <button className="btn" style={{ flex: 1 }} onClick={onDone}>Done</button>}
        </div>
      </div>
    </div>
  );
}
