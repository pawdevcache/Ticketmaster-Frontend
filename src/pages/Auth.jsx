import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { IcoTicket } from '../utils/icons';

export default function Auth() {
  const { user, register, setSession } = useAuth();
  const { admin, apply: applyAdmin } = useAdmin();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');   // 'login' | 'register' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');    // success message (e.g. after reset)
  const [busy, setBusy] = useState(false);

  // Already signed in? Send admins to the console, users home.
  if (admin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const go = (m) => { setMode(m); setErr(''); setNotice(''); };

  const TOO_SHORT = 'Password must be at least 6 characters.';
  const shortPw = form.password.length < 6;
  const needsHint = mode === 'register' || mode === 'reset';

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setNotice('');

    if (mode === 'reset') {
      if (shortPw) { setErr(TOO_SHORT); return; }
      setBusy(true);
      try {
        await api.resetPassword(form.email, form.password);
        setForm({ name: '', email: form.email, password: '' });
        setMode('login');
        setNotice('Password updated — sign in with your new password.');
      } catch (e) { setErr(e.message); } finally { setBusy(false); }
      return;
    }

    if (mode === 'register') {
      if (shortPw) { setErr(TOO_SHORT); return; } // new accounts must meet the policy
      setBusy(true);
      try { await register(form.name, form.email, form.password); nav('/'); }
      catch (e) { setErr(e.message); } finally { setBusy(false); }
      return;
    }

    // Login: one form for everyone; the role in the response decides where to go.
    setBusy(true);
    try {
      const { token, user: u } = await api.login({ email: form.email, password: form.password });
      if (u?.role === 'admin') { applyAdmin(token, u); nav('/admin'); return; } // admins exempt from the length rule
      if (shortPw) { setErr(TOO_SHORT); return; }                                // regular users must meet it
      setSession(u, token); nav('/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cta = mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password';

  return (
    <div className="auth-wrap">
      <div className="orb" style={{ width: 400, height: 400, background: 'var(--accent)', top: -80, left: -60 }} />
      <div className="orb" style={{ width: 420, height: 420, background: 'var(--primary)', bottom: -120, right: -80 }} />
      <div className="card reveal" style={{ padding: 34, width: '100%', maxWidth: 430, position: 'relative' }}>
        <div className="center" style={{ fontSize: 40, marginBottom: 8, color: 'var(--primary)' }}><IcoTicket /></div>
        <h2 className="center" style={{ marginBottom: 4 }}>
          {mode === 'reset' ? 'Reset your password' : 'Welcome to TixWave'}
        </h2>
        <p className="center muted" style={{ marginBottom: 20 }}>
          {mode === 'reset' ? 'Enter your email and a new password.' : 'Sign in to book and manage tickets.'}
        </p>

        {mode !== 'reset' && (
          <div className="tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => go('login')}>Sign in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => go('register')}>Register</button>
          </div>
        )}

        {notice && <p className="alert ok" style={{ marginBottom: 14 }}>{notice}</p>}

        <form onSubmit={submit} className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
          {mode === 'register' && (
            <input className="field" placeholder="Full name" value={form.name} onChange={set('name')} required />
          )}
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input className="field" type="password" placeholder={mode === 'reset' ? 'New password' : 'Password'} value={form.password} onChange={set('password')} required />
          {needsHint && <span className="muted" style={{ fontSize: 13, marginTop: -6 }}>Use at least 6 characters.</span>}
          {err && <p className="alert err">{err}</p>}
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : cta}</button>
        </form>

        {mode === 'login' && (
          <p className="center" style={{ marginTop: 16 }}>
            <button className="linkbtn" onClick={() => go('reset')}>Forgot password?</button>
          </p>
        )}
        {mode === 'reset' && (
          <p className="center" style={{ marginTop: 16 }}>
            <button className="linkbtn" onClick={() => go('login')}>← Back to sign in</button>
          </p>
        )}
      </div>
    </div>
  );
}
