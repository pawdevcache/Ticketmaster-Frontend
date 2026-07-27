import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useAdmin } from '../adminAuth';
import { IcoTicket } from '../icons';

export default function Auth() {
  const { user, register, setSession } = useAuth();
  const { admin, apply: applyAdmin } = useAdmin();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');   // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in? Send admins to the console, users home.
  if (admin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'register') {
        await register(form.name, form.email, form.password);
        nav('/');
      } else {
        // One login for everyone: the role in the response decides the destination.
        const { token, user: u } = await api.login({ email: form.email, password: form.password });
        if (u?.role === 'admin') { applyAdmin(token, u); nav('/admin'); }
        else { setSession(u, token); nav('/'); }
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="orb" style={{ width: 400, height: 400, background: 'var(--accent)', top: -80, left: -60 }} />
      <div className="orb" style={{ width: 420, height: 420, background: 'var(--primary)', bottom: -120, right: -80 }} />
      <div className="card reveal" style={{ padding: 34, width: '100%', maxWidth: 430, position: 'relative' }}>
        <div className="center" style={{ fontSize: 40, marginBottom: 8, color: 'var(--primary)' }}><IcoTicket /></div>
        <h2 className="center" style={{ marginBottom: 4 }}>Welcome to TixWave</h2>
        <p className="center muted" style={{ marginBottom: 20 }}>Sign in to book and manage tickets.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={submit} className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
          {mode === 'register' && (
            <input className="field" placeholder="Full name" value={form.name} onChange={set('name')} required />
          )}
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input className="field" type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
          {err && <p className="alert err">{err}</p>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
