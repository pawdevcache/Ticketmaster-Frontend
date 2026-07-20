import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import EventCard from '../components/EventCard';
import Footer from '../components/Footer';
import { cover, fmtDate, money } from '../util';
import { IcoSearch, IcoSpark, IcoFeatured, IcoAll, IcoDate, IcoArrow, SegIcon } from '../icons';

export default function Home() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState('');   // classificationId filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api.classifications().then(setClasses).catch(() => {}); }, []);
  useEffect(() => { load(active); }, [active]);

  const load = async (classificationId = active, kw = keyword) => {
    setLoading(true); setError('');
    try {
      setEvents(await api.events({ ...(kw && { keyword: kw }), ...(classificationId && { classificationId }) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));
  const featured = !active && !keyword ? events[0] : null;
  const rest = featured ? events.slice(1) : events;

  return (
    <>
      <header className="hero">
        <div className="orb a" /><div className="orb b" /><div className="orb c" />
        <div className="container reveal">
          <span className="badge"><IcoSpark /> Discover live events near you</span>
          <h1>Book tickets to the moments <em>you'll never forget.</em></h1>
          <p className="sub">Concerts, sports and theatre — discover, book and manage it all in one place.</p>
          <form className="searchbar" onSubmit={(e) => { e.preventDefault(); load(active, keyword); }}>
            <input placeholder="Search artists, teams, events…" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <button className="btn" type="submit"><IcoSearch /> Search</button>
          </form>
        </div>
      </header>

      <main className="container">
        {featured && (
          <div className="feature reveal" style={{ marginTop: 44 }} onClick={() => nav(`/events/${featured.id}`)}>
            <div className="bg" style={{ backgroundImage: `url(${cover(featured.id, 1200, 600)})` }} />
            <div className="inner">
              <span className="tag"><IcoFeatured /> Featured</span>
              <h2>{featured.name}</h2>
              <p style={{ opacity: .9, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IcoDate /> {fmtDate(featured.date).full}
              </p>
              <div className="row" style={{ marginTop: 16 }}>
                <span className="btn">Get tickets · {money(featured.priceMin)}+ <IcoArrow /></span>
              </div>
            </div>
          </div>
        )}

        <div className="section-head">
          <div>
            <h2>Browse events</h2>
            <p>Filter by what you love.</p>
          </div>
        </div>

        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 30 }}>
          <button className={`chip ${!active ? 'active' : ''}`} onClick={() => setActive('')}><IcoAll /> All</button>
          {classes.map((c) => (
            <button key={c.id} className={`chip ${active === c.id ? 'active' : ''}`} onClick={() => setActive(c.id)}>
              <SegIcon segment={c.segment} /> {c.segment} · {c.genre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : error ? (
          <div className="empty">
            <p className="alert err" style={{ display: 'inline-block' }}>⚠️ Couldn't load events.</p>
            <p className="muted" style={{ marginTop: 12, maxWidth: 520, marginInline: 'auto' }}>{error}</p>
          </div>
        ) : rest.length ? (
          <div className="grid" style={{ paddingBottom: 20 }}>
            {rest.map((e, i) => <EventCard key={e.id} event={e} cat={classMap[e.classificationId]} index={i} />)}
          </div>
        ) : (
          <div className="empty">No events match your search. Try another keyword.</div>
        )}
      </main>
      <Footer />
    </>
  );
}
