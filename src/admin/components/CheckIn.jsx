import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { adminApi } from '../../services/api';
import { fmtDate, money } from '../../utils/format';
import { IcoScan, IcoCheck } from '../../utils/icons';

const REGION = 'qr-region';
const QKEY = 'checkin_queue';
const CHUNK = 500; // server caps a batch at 1000

const TONE = {
  valid: { cls: 'ok', label: 'Admitted' },
  already_used: { cls: 'warn', label: 'Already used' },
  cancelled: { cls: 'err', label: 'Cancelled' },
  unpaid: { cls: 'err', label: 'Unpaid / expired' },
  not_found: { cls: 'err', label: 'Invalid ticket' },
  queued: { cls: 'ok', label: 'Queued' },
  error: { cls: 'err', label: 'Error' },
};

export default function CheckIn() {
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [offline, setOffline] = useState(false); // manual "queue everything" switch
  const [queue, setQueue] = useState(() => JSON.parse(localStorage.getItem(QKEY) || '[]'));
  const [summary, setSummary] = useState(null);  // last flush summary

  const scanner = useRef(null);
  const lastScan = useRef({ code: '', t: 0 });
  const handlerRef = useRef();

  const queueing = offline || !online; // when true, scans are saved instead of sent

  // Track connectivity so a gate that drops signal starts queuing automatically.
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const saveQueue = (next) => { localStorage.setItem(QKEY, JSON.stringify(next)); setQueue(next); };

  const stop = async () => {
    const s = scanner.current; scanner.current = null; setScanning(false);
    if (s) { try { await s.stop(); await s.clear(); } catch { /* already stopped */ } }
  };

  // Live single check-in (online, immediate).
  const checkNow = async (code) => {
    const c = (code || '').trim(); if (!c || busy) return;
    setBusy(true); await stop();
    try {
      const res = await adminApi.checkIn(c); const d = res?.data || {};
      setOutcome({ result: d.result || (res.ok ? 'valid' : 'not_found'), message: d.message, booking: d.booking });
    } catch (e) { setOutcome({ result: 'error', message: e.message }); }
    finally { setBusy(false); setManual(''); }
  };

  // Queue a scan for a later flush. Debounced so the camera firing on the same
  // code across frames doesn't enqueue it dozens of times.
  const enqueue = (code) => {
    const c = (code || '').trim(); if (!c) return;
    const now = Date.now();
    if (lastScan.current.code === c && now - lastScan.current.t < 3000) return;
    lastScan.current = { code: c, t: now };
    setQueue((prev) => {
      const next = [...prev, { code: c, scannedAt: new Date().toISOString() }];
      localStorage.setItem(QKEY, JSON.stringify(next));
      return next;
    });
    setOutcome({ result: 'queued', message: 'Saved to the offline queue' });
    setManual('');
  };

  // Keep the scanner callback pointing at the latest handler (fresh state).
  handlerRef.current = (code) => (queueing ? enqueue(code) : checkNow(code));

  const start = () => { setOutcome(null); setSummary(null); setScanning(true); };
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const h = new Html5Qrcode(REGION); scanner.current = h;
    h.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (d) => handlerRef.current(d), () => {})
      .catch(() => {
        if (cancelled) return;
        scanner.current = null; setScanning(false);
        setOutcome({ result: 'error', message: 'Camera unavailable — enter the code manually below.' });
      });
    return () => { cancelled = true; };
  }, [scanning]);
  useEffect(() => () => { stop(); }, []);

  // Flush the queue in chunks, aggregating the per-result summary.
  const sync = async () => {
    if (!queue.length || busy) return;
    setBusy(true); setSummary(null); setOutcome(null);
    try {
      const totals = {};
      for (let i = 0; i < queue.length; i += CHUNK) {
        const res = await adminApi.checkInBulk(queue.slice(i, i + CHUNK));
        for (const [k, v] of Object.entries(res.summary || {})) totals[k] = (totals[k] || 0) + v;
      }
      saveQueue([]);
      setSummary(totals);
    } catch (e) {
      setOutcome({ result: 'error', message: `Sync failed — your ${queue.length} scans are kept. ${e.message}` });
    } finally { setBusy(false); }
  };

  const clearQueue = () => {
    if (window.confirm(`Discard ${queue.length} un-synced scan(s)? This cannot be undone.`)) saveQueue([]);
  };

  const tone = outcome && (TONE[outcome.result] || TONE.error);

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IcoScan /> Ticket check-in</h3>
        <div className="row" style={{ gap: 10 }}>
          <span className={`pill ${online ? 'on' : 'off'}`}>{online ? 'Online' : 'Offline'}</span>
          {scanning
            ? <button className="btn sm ghost" onClick={stop}>Stop</button>
            : <button className="btn sm" onClick={start}><IcoScan /> Scan</button>}
        </div>
      </div>

      <label className="row" style={{ gap: 10, marginBottom: queueing ? 6 : 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
        <span style={{ fontSize: 14 }}>Offline mode — queue scans on this device and sync later</span>
      </label>
      {queueing && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Scans are saved locally{!online ? ' (no connection detected)' : ''}. They survive a reload — sync when you have signal.
        </p>
      )}

      <div id={REGION} className="qr-region" style={{ display: scanning ? 'block' : 'none' }} />

      {outcome && (
        <div className={`card checkin-result ${tone.cls}`}>
          <div className="checkin-badge">{outcome.result === 'valid' || outcome.result === 'queued' ? <IcoCheck /> : '!'} {tone.label}</div>
          <p className="muted" style={{ margin: '6px 0 0' }}>{outcome.message}</p>
          {outcome.booking && (
            <div className="checkin-booking">
              <strong>{outcome.booking.event?.name || 'Event'}</strong>
              {outcome.booking.event && <span className="muted"> · {fmtDate(outcome.booking.event.date).full}</span>}
              <div className="muted" style={{ marginTop: 4 }}>
                {outcome.booking.quantity} ticket(s) · {money(outcome.booking.total)}
                {outcome.booking.event?.venueName ? ` · ${outcome.booking.event.venueName}` : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {queue.length > 0 && (
        <div className="card checkin-result" style={{ padding: 16, marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <strong>{queue.length} scan{queue.length > 1 ? 's' : ''} queued</strong>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm ghost" onClick={clearQueue} disabled={busy}>Clear</button>
              <button className="btn sm" onClick={sync} disabled={busy || !online}>{busy ? 'Syncing…' : 'Sync now'}</button>
            </div>
          </div>
          {!online && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Waiting for a connection to sync.</p>}
        </div>
      )}

      {summary && (
        <div className="card checkin-result ok" style={{ padding: 16, marginTop: 16 }}>
          <div className="checkin-badge"><IcoCheck /> Synced</div>
          <div className="door-meta" style={{ marginTop: 8 }}>
            {Object.entries(summary).map(([k, v]) => (
              <span key={k}>{TONE[k]?.label || k}: <strong style={{ color: 'var(--text)' }}>{v}</strong></span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handlerRef.current(manual); }} className="row" style={{ gap: 10, marginTop: 18 }}>
        <input className="field" placeholder="Or enter ticket code…" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn" type="submit" disabled={busy || !manual.trim()}>{queueing ? 'Queue' : busy ? 'Checking…' : 'Check'}</button>
      </form>
      <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
        Scanning needs camera permission (works over HTTPS). No camera? Paste the code from the ticket QR.
      </p>
    </div>
  );
}
