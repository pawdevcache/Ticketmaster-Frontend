import { useNavigate } from 'react-router-dom';
import { cover, money, fmtDate, availability } from '../util';
import { SegIcon } from '../icons';

export default function EventCard({ event, cat, index = 0 }) {
  const nav = useNavigate();
  const d = fmtDate(event.date);
  const { left, pct } = availability(event);
  const soldOut = left <= 0 || event.status !== 'onsale';

  return (
    <div
      className="card ev-card reveal"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      onClick={() => nav(`/events/${event.id}`)}
    >
      <div className="ev-img" style={{ backgroundImage: `url(${cover(event.id)})` }}>
        <div className="ev-date"><b>{d.day}</b><span>{d.mon}</span></div>
        {cat && <span className="ev-cat"><SegIcon segment={cat.segment} /> {cat.segment}</span>}
      </div>
      <div className="ev-body">
        <h3>{event.name}</h3>
        <p className="muted" style={{ fontSize: 14 }}>{d.full}</p>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
          <strong style={{ fontSize: 16 }}>{money(event.priceMin)}+</strong>
          <span className={`pill ${soldOut ? 'off' : 'on'}`}>
            {soldOut ? 'Sold out' : `${left.toLocaleString()} left`}
          </span>
        </div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
