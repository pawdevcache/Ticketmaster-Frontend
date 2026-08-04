import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { adminApi } from '../../services/api';
import { fmtDate, money } from '../../utils/format';
import { IcoScan, IcoCheck } from '../../utils/icons';

const REGION = 'qr-region';

// Maps a backend check-in result to how the banner should look.
const TONE = {
  valid: { cls: 'ok', label: 'Admitted' },
  already_used: { cls: 'warn', label: 'Already used' },
  cancelled: { cls: 'err', label: 'Cancelled' },
  unpaid: { cls: 'err', label: 'Unpaid / expired' },
  not_found: { cls: 'err', label: 'Invalid ticket' },
  error: { cls: 'err', label: 'Error' },
};

export default function CheckIn() {
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const [outcome, setOutcome] = useState(null); // { result, message, booking }
  const scanner = useRef(null);

  const stop = async () => {
    const s = scanner.current;
    scanner.current = null;
    setScanning(false);
    if (s) { try { await s.stop(); await s.clear(); } catch { /* already stopped */ } }
  };

  // Send a code to the backend and show the outcome.
  const check = async (code) => {
    const c = (code || '').trim();
    if (!c || busy) return;
    setBusy(true);
    await stop();
    try {
      const res = await adminApi.checkIn(c);
      const d = res?.data || {};
      setOutcome({ result: d.result || (res.ok ? 'valid' : 'not_found'), message: d.message, booking: d.booking });
    } catch (e) {
      setOutcome({ result: 'error', message: e.message });
    } finally {
      setBusy(false); setManual('');
    }
  };

  const start = () => { setOutcome(null); setScanning(true); };

  // Start the camera only after the region is visible in the DOM, so
  // html5-qrcode can measure it. Runs when `scanning` flips to true.
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const h = new Html5Qrcode(REGION);
    scanner.current = h;
    h.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (decoded) => check(decoded), () => {})
      .catch(() => {
        if (cancelled) return;
        scanner.current = null; setScanning(false);
        setOutcome({ result: 'error', message: 'Camera unavailable — enter the code manually below.' });
      });
    return () => { cancelled = true; };
  }, [scanning]);

  useEffect(() => () => { stop(); }, []);

  const tone = outcome && (TONE[outcome.result] || TONE.error);

  return (
    <div style={{ maxWidth: 460 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IcoScan /> Ticket check-in</h3>
        {scanning
          ? <button className="btn sm ghost" onClick={stop}>Stop</button>
          : <button className="btn sm" onClick={start}><IcoScan /> Scan QR</button>}
      </div>

      <div id={REGION} className="qr-region" style={{ display: scanning ? 'block' : 'none' }} />

      {outcome && (
        <div className={`card checkin-result ${tone.cls}`}>
          <div className="checkin-badge">{outcome.result === 'valid' ? <IcoCheck /> : '!'} {tone.label}</div>
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

      <form onSubmit={(e) => { e.preventDefault(); check(manual); }} className="row" style={{ gap: 10, marginTop: 18 }}>
        <input className="field" placeholder="Or enter ticket code…" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn" type="submit" disabled={busy || !manual.trim()}>{busy ? 'Checking…' : 'Check'}</button>
      </form>
      <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
        Scanning needs camera permission (works over HTTPS). No camera? Paste the code from the ticket QR.
      </p>
    </div>
  );
}
