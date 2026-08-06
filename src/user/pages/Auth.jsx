import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../../admin/context/AdminContext';
import { IcoTicket } from '../../utils/icons';

export default function Auth() {
  const { user, register, setSession } = useAuth();
  const { admin, apply: applyAdmin } = useAdmin();
  const nav = useNavigate();
  // 'login' | 'register' | 'forgot' (request token) | 'reset' (token + new password)
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', token: '' });
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in? Send admins to the console, users home.
  if (admin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const go = (m) => { setMode(m); setErr(''); setNotice(''); };

  const TOO_SHORT = 'Password must be at least 6 characters.';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const shortPw = form.password.length < 6;
  const needsHint = mode === 'register' || mode === 'reset';

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setNotice('');

    if (mode === 'forgot') {
      const email = form.email.trim();
      // Must be a valid email, and it must belong to a real account — you can
      // only reset your own password, not someone else's / a mistyped address.
      if (!EMAIL_RE.test(email)) { setErr('Enter a valid email address.'); return; }
      setBusy(true);
      try {
        const res = await api.forgotPassword(email);
        if (res?.resetToken) {
          // A token is only issued for a registered address → the email checks out.
          setForm({ ...form, email, token: res.resetToken, password: '' });
          setMode('reset');
          setNotice('We found your account — set a new password below.');
        } else {
          setErr('No account found with that email. Please use the email you registered with.');
        }
      } catch (e) { setErr(e.message); } finally { setBusy(false); }
      return;
    }

    if (mode === 'reset') {
      if (!form.token) { setErr('Enter the reset code from your email.'); return; }
      if (shortPw) { setErr(TOO_SHORT); return; }
      setBusy(true);
      try {
        await api.resetPassword(form.token, form.password);
        setForm({ name: '', email: form.email, password: '', token: '' });
        setMode('login');
        setNotice('Password updated — sign in with your new password.');
      } catch (e) { setErr(e.message); } finally { setBusy(false); }
      return;
    }

    if (mode === 'register') {
      if (shortPw) { setErr(TOO_SHORT); return; }
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

  const cta = mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account'
    : mode === 'forgot' ? 'Send reset code' : 'Reset password';
  const isRecovery = mode === 'forgot' || mode === 'reset';

  return (
    <div className="auth-wrap">
      <div className="orb" style={{ width: 400, height: 400, background: 'var(--accent)', top: -80, left: -60 }} />
      <div className="orb" style={{ width: 420, height: 420, background: 'var(--primary)', bottom: -120, right: -80 }} />
      <div className="card reveal" style={{ padding: 34, width: '100%', maxWidth: 430, position: 'relative' }}>
        <div className="center" style={{ fontSize: 40, marginBottom: 8, color: 'var(--primary)' }}><IcoTicket /></div>
        <h2 className="center" style={{ marginBottom: 4 }}>
          {isRecovery ? 'Reset your password' : 'Welcome to TixWave'}
        </h2>
        <p className="center muted" style={{ marginBottom: 20 }}>
          {mode === 'forgot' ? 'Enter your email to get a reset code.'
            : mode === 'reset' ? `Enter the code and a new password for ${form.email}.`
            : 'Sign in to book and manage tickets.'}
        </p>

        {!isRecovery && (
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
          {mode !== 'reset' && (
            <input className="field" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          )}
          {mode === 'reset' && (
            <input className="field" placeholder="Reset code" value={form.token} onChange={set('token')} required />
          )}
          {mode !== 'forgot' && (
            <input className="field" type="password" placeholder={mode === 'reset' ? 'New password' : 'Password'} value={form.password} onChange={set('password')} required />
          )}
          {needsHint && <span className="muted" style={{ fontSize: 13, marginTop: -6 }}>Use at least 6 characters.</span>}
          {err && <p className="alert err">{err}</p>}
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : cta}</button>
        </form>

        {mode === 'login' && (
          <p className="center" style={{ marginTop: 16 }}>
            <button className="linkbtn" onClick={() => go('forgot')}>Forgot password?</button>
          </p>
        )}
        {isRecovery && (
          <p className="center" style={{ marginTop: 16 }}>
            <button className="linkbtn" onClick={() => go('login')}>← Back to sign in</button>
          </p>
        )}
      </div>
    </div>
  );
}
