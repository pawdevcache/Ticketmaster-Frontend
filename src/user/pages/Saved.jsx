import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useFavorites } from '../context/FavoritesContext';
import EventCard from '../components/EventCard';
import Footer from '../../shared/Footer';
import { IcoHeart } from '../../utils/icons';

export default function Saved() {
  const { ids } = useFavorites();
  const [events, setEvents] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => { api.classifications().then(setClasses).catch(() => {}); }, []);
  // Resolve saved ids to events; drop any that no longer exist.
  useEffect(() => {
    Promise.all(ids.map((id) => api.event(id).catch(() => null)))
      .then((r) => setEvents(r.filter(Boolean)));
  }, [ids.length]); // refetch when the set grows/shrinks

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));

  return (
    <>
      <main className="container reveal" style={{ padding: '32px 24px 80px' }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><IcoHeart /> Saved events</h2>
        </div>

        {events === null ? (
          <div className="spinner" />
        ) : events.length === 0 ? (
          <div className="empty">
            No saved events yet — tap the heart on any event to save it.<br />
            <Link to="/" className="btn" style={{ marginTop: 16 }}>Discover events</Link>
          </div>
        ) : (
          <div className="grid" style={{ paddingBottom: 20 }}>
            {events.map((e, i) => <EventCard key={e.id} event={e} cat={classMap[e.classificationId]} index={i} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
