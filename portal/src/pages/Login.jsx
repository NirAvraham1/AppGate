import React, { useState } from 'react';
import { api, setSession } from '../api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@appgate.dev');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErr('');
    try {
      const { token, user } = await api.login(email, password);
      setSession(token, user);
      onLogin();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="logo" style={{ marginBottom: 16 }}>App<span style={{ color: 'var(--accent)' }}>Gate</span> · חדר בקרה</div>
        <div className="field"><label>אימייל</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
        <div className="field"><label>סיסמה</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password"
                 onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy} onClick={submit}>כניסה</button>
        {err && <div className="error">{err}</div>}
      </div>
    </div>
  );
}
