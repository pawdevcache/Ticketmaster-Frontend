import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdmin } from '../adminAuth';
import { IcoUser } from '../icons';

export default function AdminLogin() {
  const { admin, login } = useAdmin();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(form.email, form.password);
      nav('/admin');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="card reveal" onSubmit={submit} style={{ padding: 36, width: '100%', maxWidth: 400 }}>
        <div className="center" style={{ fontSize: 40, color: 'var(--accent)' }}><IcoUser /></div>
        <h2 className="center" style={{ margin: '6px 0 2px' }}>Admin Console</h2>
        <p className="center muted" style={{ marginBottom: 22 }}>Restricted access — staff only.</p>

        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
          <input className="field" type="text" placeholder="Admin email" value={form.email} onChange={set('email')} required autoFocus />
          <input className="field" type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
          {err && <p className="alert err">{err}</p>}
          <button className="btn" type="submit" disabled={busy} style={{ background: 'var(--dark)' }}>
            {busy ? 'Signing in…' : 'Enter console'}
          </button>
        </div>
      </form>
    </div>
  );
}
