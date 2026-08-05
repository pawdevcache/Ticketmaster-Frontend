import { useNavigate } from 'react-router-dom';
import { cover, money, fmtDate, availability } from '../../utils/format';
import { SegIcon, IcoHeart } from '../../utils/icons';
import { useFavorites } from '../context/FavoritesContext';

export default function EventCard({ event, cat, index = 0 }) {
  const nav = useNavigate();
  const { has, toggle } = useFavorites();
  const d = fmtDate(event.date);
  const { left, pct } = availability(event);
  const soldOut = left <= 0 || event.status !== 'onsale';
  const saved = has(event.id);

  return (
    <div
      className="card ev-card reveal"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      onClick={() => nav(`/events/${event.id}`)}
    >
      <div className="ev-img" style={{ backgroundImage: `url(${cover(event.id)})` }}>
        <div className="ev-date"><b>{d.day}</b><span>{d.mon}</span></div>
        {cat && <span className="ev-cat"><SegIcon segment={cat.segment} /> {cat.segment}</span>}
        <button
          className={`fav-btn ${saved ? 'on' : ''}`}
          title={saved ? 'Remove from saved' : 'Save event'}
          aria-label="Save event"
          onClick={(e) => { e.stopPropagation(); toggle(event.id); }}
        >
          <IcoHeart />
        </button>
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
