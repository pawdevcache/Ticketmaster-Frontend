import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import EventCard from '../components/EventCard';
import Footer from '../../shared/Footer';
import { EventGridSkeleton } from '../../shared/Skeletons';
import { cover, fmtDate, money } from '../../utils/format';
import { IcoSearch, IcoSpark, IcoFeatured, IcoAll, IcoDate, IcoArrow, SegIcon } from '../../utils/icons';

export default function Home() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [cities, setCities] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState('');   // classificationId filter
  const [city, setCity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [sort, setSort] = useState('date');   // 'date' | 'price-asc' | 'price-desc'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('search_history') || '[]'));
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { api.classifications().then(setClasses).catch(() => {}); }, []);
  // Build the city dropdown from existing venues.
  useEffect(() => {
    api.venues({ size: 100 }).then((vs) =>
      setCities([...new Set(vs.map((v) => v.city).filter(Boolean))].sort())).catch(() => {});
  }, []);
  // Re-query whenever a server-side filter changes (keyword applies on submit).
  useEffect(() => { load(); }, [active, city, fromDate]);

  const load = async (kw = keyword) => {
    setLoading(true); setError('');
    try {
      setEvents(await api.events({
        ...(kw && { keyword: kw }),
        ...(active && { classificationId: active }),
        ...(city && { city }),
        ...(fromDate && { startDateTime: new Date(fromDate).toISOString() }),
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Recent searches, kept in the browser.
  const saveHistory = (arr) => { localStorage.setItem('search_history', JSON.stringify(arr)); setHistory(arr); };
  const pushHistory = (term) => {
    const t = term.trim(); if (!t) return;
    saveHistory([t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(0, 8));
  };
  const runSearch = (term) => { setKeyword(term); setShowHistory(false); pushHistory(term); load(term); };
  const submitSearch = (e) => { e.preventDefault(); setShowHistory(false); pushHistory(keyword); load(keyword); };

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));
  const sorted = [...events].sort((a, b) =>
    sort === 'price-asc' ? a.priceMin - b.priceMin
    : sort === 'price-desc' ? b.priceMin - a.priceMin
    : new Date(a.date) - new Date(b.date));

  const hasFilters = active || keyword || city || fromDate;
  const featured = hasFilters ? null : sorted[0];
  const rest = featured ? sorted.slice(1) : sorted;
  const clearFilters = () => { setCity(''); setFromDate(''); setKeyword(''); setActive(''); };

  return (
    <>
      <header className="hero">
        <div className="orb a" /><div className="orb b" /><div className="orb c" />
        <div className="container reveal">
          <span className="badge"><IcoSpark /> Discover live events near you</span>
          <h1>Book tickets to the moments <em>you'll never forget.</em></h1>
          <p className="sub">Concerts, sports and theatre — discover, book and manage it all in one place.</p>
          <form className="searchbar" onSubmit={submitSearch}>
            <input
              placeholder="Search artists, teams, events…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            />
            <button className="btn" type="submit"><IcoSearch /> Search</button>

            {showHistory && history.length > 0 && (
              <div className="search-history">
                <div className="sh-head">
                  <span>Recent searches</span>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); saveHistory([]); }}>Clear</button>
                </div>
                {history.map((h) => (
                  <button type="button" key={h} className="sh-item" onMouseDown={(e) => { e.preventDefault(); runSearch(h); }}>
                    <IcoSearch /> <span style={{ flex: 1 }}>{h}</span>
                    <span
                      className="sh-remove"
                      role="button"
                      aria-label={`Remove ${h}`}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveHistory(history.filter((x) => x !== h)); }}
                    >×</span>
                  </button>
                ))}
              </div>
            )}
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
          <div className="filters">
            <select className="field filter" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="field filter" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
            <select className="field filter" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="date">Soonest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
            {hasFilters && <button className="btn ghost sm" onClick={clearFilters}>Clear</button>}
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
          <EventGridSkeleton />
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
          <div className="empty">
            <div className="empty-ico"><IcoSearch /></div>
            No events match your filters. Try widening your search.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
