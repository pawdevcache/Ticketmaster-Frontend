import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import Footer from '../../shared/Footer';
import { IcoUser } from '../../utils/icons';

const field = { display: 'flex', flexDirection: 'column', gap: 6 };

export default function Profile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.me()
      .then((u) => setForm((f) => ({ ...f, name: u.name || '', email: u.email || '' })))
      .catch((e) => setMsg({ ok: false, text: e.message }))
      .finally(() => setLoaded(true));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword && form.newPassword.length < 6) {
      setMsg({ ok: false, text: 'New password must be at least 6 characters.' });
      return;
    }
    setBusy(true);
    try {
      const body = { name: form.name, email: form.email };
      if (form.currentPassword) body.currentPassword = form.currentPassword;
      if (form.newPassword) body.newPassword = form.newPassword;
      const updated = await api.updateMe(body);
      updateUser(updated);                                 // reflect in the navbar
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
      setMsg({ ok: true, text: 'Profile updated.' });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="container reveal" style={{ padding: '32px 24px 80px', maxWidth: 520 }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><IcoUser /> My profile</h2>
        </div>

        {!loaded ? (
          <div className="card" style={{ padding: 26 }}>
            <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 46, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 46 }} />
          </div>
        ) : (
          <form className="card" onSubmit={submit} style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={field}><span className="fld-label">Name</span>
              <input className="field" value={form.name} onChange={set('name')} required />
            </label>
            <label style={field}><span className="fld-label">Email</span>
              <input className="field" type="email" value={form.email} onChange={set('email')} required />
            </label>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
                To change your <strong>email</strong> or set a <strong>new password</strong>, confirm your current password.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={field}><span className="fld-label">Current password</span>
                  <input className="field" type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="Required for email / password changes" />
                </label>
                <label style={field}><span className="fld-label">New password</span>
                  <input className="field" type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="Leave blank to keep current" />
                </label>
              </div>
            </div>

            {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
