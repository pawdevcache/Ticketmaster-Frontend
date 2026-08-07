import { useEffect, useState } from 'react';
import { IcoDate } from '../../utils/icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based

// Calendar + time picker. value is a naive local string "YYYY-MM-DDTHH:mm"
// (what the event form and backend expect), or '' when unset. Opens on the
// current month with today marked; navigate months with ‹ › and years with « ».
export default function DateTimePicker({ value, onChange }) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : today;
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [time, setTime] = useState(value ? value.slice(11, 16) : '19:00');

  const selectedYMD = value ? value.slice(0, 10) : '';
  const todayYMD = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  // New event with no date yet → default to today (the current date is selected
  // by default) so the required field is never left empty.
  useEffect(() => { if (!value) onChange(`${todayYMD}T${time}`); }, []); // eslint-disable-line

  const shiftMonth = (delta) => setView((v) => {
    const d = new Date(v.y, v.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const shiftYear = (delta) => setView((v) => ({ ...v, y: v.y + delta }));

  const pick = (day) => onChange(`${ymd(view.y, view.m, day)}T${time}`);
  const changeTime = (t) => { setTime(t); if (selectedYMD) onChange(`${selectedYMD}T${t}`); };

  const lead = new Date(view.y, view.m, 1).getDay();       // blank cells before day 1
  const count = new Date(view.y, view.m + 1, 0).getDate(); // days in month
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  const label = value
    ? new Date(value).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Select date & time';

  return (
    <div className="dtp">
      <button type="button" className="field dtp-trigger" onClick={() => setOpen((o) => !o)}>
        <span className={value ? '' : 'muted'}>{label}</span>
        <IcoDate style={{ color: 'var(--muted)' }} />
      </button>

      {open && (
        <div className="dtp-panel">
          <div className="dtp-head">
            <button type="button" onClick={() => shiftYear(-1)} aria-label="Previous year">«</button>
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <span className="dtp-title">{MONTHS[view.m]} {view.y}</span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            <button type="button" onClick={() => shiftYear(1)} aria-label="Next year">»</button>
          </div>

          <div className="dtp-grid dtp-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="dtp-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const cellYMD = ymd(view.y, view.m, d);
              const cls = ['dtp-day'];
              if (cellYMD === selectedYMD) cls.push('sel');
              else if (cellYMD === todayYMD) cls.push('today');
              return <button type="button" key={i} className={cls.join(' ')} onClick={() => pick(d)}>{d}</button>;
            })}
          </div>

          <div className="dtp-foot">
            <div className="dtp-time">
              <span className="fld-label">Time</span>
              <input type="time" className="field" value={time} onChange={(e) => changeTime(e.target.value)} />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}>Today</button>
              <button type="button" className="btn sm" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
