import React, { useState } from 'react';
import { useAdminSession, sessionChanged } from '../lib/adminSession';
import { navigateTo } from '../utils/router';
import { useI18n } from '../i18n';

export function AdminAccess({ children }: { children?: React.ReactNode }) {
  const { profile, loading } = useAdminSession();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <p className="p-8 text-center">{t.authChecking}</p>;
  if (profile?.role === 'admin') return children || <div className="p-8 text-center"><button className="glass-btn px-4 py-2 rounded-xl" onClick={() => navigateTo({ type: 'admin' })}>{t.navAdmin}</button></div>;
  return (
    <form className="glass-panel rounded-2xl p-6 mx-auto my-12 max-w-md space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      try {
        const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        if (!response.ok) { setError(response.status === 503 ? t.authUnavailable : t.authDenied); return; }
        setPassword(''); sessionChanged(); navigateTo({ type: 'admin' });
      } catch { setError(t.authUnavailable); }
      finally { setBusy(false); }
    }}>
      <h1 className="text-xl font-semibold">{t.adminLoginHeading}</h1>
      <p className="text-sm text-neutral-500">{t.adminLoginDescription}</p>
      <label className="block text-sm">{t.authEmail}<input className="block w-full glass-input rounded-lg p-2 mt-1" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className="block text-sm">{t.authPassword}<input className="block w-full glass-input rounded-lg p-2 mt-1" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="glass-btn-primary rounded-lg px-4 py-2 w-full disabled:opacity-50">{busy ? t.authChecking : t.signIn}</button>
    </form>
  );
}
