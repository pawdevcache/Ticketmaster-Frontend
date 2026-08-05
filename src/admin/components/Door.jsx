import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

// Live gate dashboard: admitted vs sold per event. Polls every few seconds so a
// door attendant can watch arrivals during a performance.
export default function Door() {
  const [rows, setRows] = useState(null);   // null = first load
  const [err, setErr] = useState('');
  const [live, setLive] = useState(true);
  const [updated, setUpdated] = useState(null);

  const load = async () => {
    try { setRows(await adminApi.door()); setErr(''); setUpdated(new Date()); }
    catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [live]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <h3>Door — admitted vs sold</h3>
        <div className="row" style={{ gap: 12 }}>
          {updated && <span className="muted" style={{ fontSize: 13 }}>Updated {updated.toLocaleTimeString()}</span>}
          <button className={`live-toggle ${live ? 'on' : ''}`} onClick={() => setLive((v) => !v)}>
            <span className="live-dot" /> {live ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {err && <p className="alert err" style={{ marginBottom: 16 }}>{err}</p>}

      {rows === null ? (
        <div className="spinner" />
      ) : rows.length === 0 ? (
        <div className="empty">No confirmed tickets yet — figures appear once tickets sell.</div>
      ) : (
        <div className="stat-grid">
          {rows.map((r) => {
            const pct = r.sold ? Math.round((r.admitted / r.sold) * 100) : 0;
            const toArrive = Math.max(0, r.sold - r.admitted);
            return (
              <div className="card door-card" key={r.eventId}>
                <h4 title={r.name}>{r.name}</h4>
                <div className="door-nums">
                  <b>{r.admitted.toLocaleString()}</b>
                  <span className="muted"> / {r.sold.toLocaleString()} admitted</span>
                </div>
                <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                <div className="door-meta muted">
                  <span><strong style={{ color: 'var(--text)' }}>{pct}%</strong> in</span>
                  <span>{toArrive.toLocaleString()} to arrive</span>
                  {r.capacity ? <span>cap {r.capacity.toLocaleString()}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
