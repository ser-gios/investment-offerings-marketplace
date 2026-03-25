import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Eye, EyeOff, TrendingUp, ShieldCheck, Coins, ArrowLeft } from 'lucide-react';
import api from '../api';

// Auth page with login, register, forgot password, and password reset functionality
// Using VITE_API_URL for backend connection

export default function Auth() {
  const [params] = useSearchParams();
  const resetToken = params.get('token');
  const initialMode = resetToken ? 'reset-password' : (params.get('mode') === 'register' ? 'register' : 'login');
  
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'investor', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        navigate(user.role === 'admin' ? '/admin' : user.role === 'business' ? '/my-projects' : '/marketplace');
      } else if (mode === 'register') {
        const user = await register(form.email, form.password, form.name, form.role);
        navigate(user.role === 'business' ? '/my-projects' : '/marketplace');
      } else if (mode === 'forgot-password') {
        await api.post('/auth/forgot-password', { email: form.email });
        setSuccess(lang === 'es' ? 'Se ha enviado un enlace de recuperación a tu email.' : 'A password reset link has been sent to your email.');
        setForm({ email: '', password: '', name: '', role: 'investor', newPassword: '', confirmPassword: '' });
      } else if (mode === 'reset-password') {
        if (form.newPassword !== form.confirmPassword) {
          return setError(lang === 'es' ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
        }
        await api.post('/auth/reset-password', { token: resetToken, newPassword: form.newPassword });
        setSuccess(lang === 'es' ? 'Contraseña actualizada. Ingresa con tu nueva contraseña.' : 'Password updated. Please sign in with your new password.');
        setTimeout(() => { setMode('login'); setForm({ email: '', password: '', name: '', role: 'investor', newPassword: '', confirmPassword: '' }); }, 2000);
      }
    } catch (e) { 
      setError(e.response?.data?.error || (lang === 'es' ? 'Error. Intenta de nuevo.' : 'Error. Please try again.')); 
    }
    finally { setLoading(false); }
  };

  const demoLogin = async (email, pwd) => {
    setLoading(true); setError('');
    try {
      const user = await login(email, pwd);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'business' ? '/my-projects' : '/marketplace');
    } catch { setError(lang === 'es' ? 'Demo fallido.' : 'Demo login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--void)',
      backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,214,0,0.07) 0%, transparent 65%)',
      padding: '2rem', position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,214,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,214,0,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* Lang toggle */}
      <button onClick={toggle} style={{ position: 'fixed', top: 20, right: 24, zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.38rem 0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}>
        <span>{lang === 'en' ? '🇺🇸' : '🇲🇽'}</span>{lang === 'en' ? 'ES' : 'EN'}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', maxWidth: 920, width: '100%', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {/* Left */}
        <div className="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--grad-yellow-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,214,0,0.4)', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#05070F' }}>IM</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em' }}>
              Investment{' '}
              <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Market</span>
            </div>
          </div>
          <h1 style={{ fontSize: '2.7rem', marginBottom: '1rem', lineHeight: 1.05 }}>
            {t('auth_tagline')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '0.95rem' }}>{t('auth_subtitle')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {[
              { icon: TrendingUp, key: 'auth_feature_1', color: 'var(--emerald)' },
              { icon: ShieldCheck, key: 'auth_feature_2', color: 'var(--sapphire)' },
              { icon: Coins, key: 'auth_feature_3', color: 'var(--yellow)' },
            ].map(({ icon: Icon, key, color }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="card fade-up" style={{ padding: '2.5rem', animationDelay: '0.08s' }}>
          {/* Back button for forgot/reset */}
          {['forgot-password', 'reset-password'].includes(mode) && (
            <button 
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={14} /> {lang === 'es' ? 'Volver' : 'Back'}
            </button>
          )}
          
          {/* Mode tabs for login/register */}
          {!['forgot-password', 'reset-password'].includes(mode) && (
            <div style={{ display: 'flex', background: 'var(--obsidian)', borderRadius: 'var(--r-md)', padding: 4, marginBottom: '2rem' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }} style={{ flex: 1, padding: '0.55rem', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 600, background: mode === m ? 'var(--surface-2)' : 'transparent', color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)', border: mode === m ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.18s', cursor: 'pointer' }}>
                  {m === 'login' ? t('auth_sign_in') : t('auth_create_account')}
                </button>
              ))}
            </div>
          )}

          {/* Form heading */}
          {mode === 'forgot-password' && (
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              {lang === 'es' ? 'Recuperar Contraseña' : 'Reset Password'}
            </h2>
          )}
          {mode === 'reset-password' && (
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              {lang === 'es' ? 'Nueva Contraseña' : 'New Password'}
            </h2>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Register - Name */}
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>{t('auth_full_name')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('auth_full_name')} required />
              </div>
            )}

            {/* Register - Account Type */}
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>{t('auth_account_type')}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[{ val: 'investor', label: `🧑‍💼 ${t('auth_investor')}` }, { val: 'business', label: `🏢 ${t('auth_business')}` }].map(({ val, label }) => (
                    <button key={val} type="button" onClick={() => set('role', val)} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 600, background: form.role === val ? 'var(--yellow-glow)' : 'var(--surface)', color: form.role === val ? 'var(--yellow)' : 'var(--text-secondary)', border: form.role === val ? '1px solid rgba(255,214,0,0.3)' : '1px solid var(--border)', transition: 'all 0.18s', cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Email (for login, register, forgot-password) */}
            {mode !== 'reset-password' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>{t('auth_email')}</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
              </div>
            )}

            {/* Password (for login and register) */}
            {mode === 'login' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>{t('auth_password')}</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>{t('auth_password')}</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Reset Password - New Password */}
            {mode === 'reset-password' && (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>
                    {lang === 'es' ? 'Nueva Contraseña' : 'New Password'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPwd ? 'text' : 'password'} value={form.newPassword} onChange={e => set('newPassword', e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingRight: '2.8rem' }} />
                    <button type="button" onClick={() => setShowNewPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>
                    {lang === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPwd ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingRight: '2.8rem' }} />
                    <button type="button" onClick={() => setShowNewPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Error message */}
            {error && <div style={{ background: 'var(--ruby-dim)', border: '1px solid rgba(255,61,90,0.2)', borderRadius: 'var(--r-md)', padding: '0.7rem 1rem', fontSize: '0.85rem', color: 'var(--ruby)' }}>{error}</div>}

            {/* Success message */}
            {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--r-md)', padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#22c55e' }}>{success}</div>}

            {/* Submit button */}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              {loading ? t('auth_wait') : 
                mode === 'login' ? t('auth_sign_in') : 
                mode === 'register' ? t('auth_create_account') :
                mode === 'forgot-password' ? (lang === 'es' ? 'Enviar Enlace' : 'Send Reset Link') :
                (lang === 'es' ? 'Actualizar Contraseña' : 'Update Password')}
            </button>
          </form>

          {/* Forgot password link (only on login) */}
          {mode === 'login' && (
            <button 
              onClick={() => { setMode('forgot-password'); setError(''); setSuccess(''); }}
              style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {lang === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
            </button>
          )}

          {/* Demo section (only on login/register) */}
          {['login', 'register'].includes(mode) && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('auth_demo')}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {[
                  { label: t('auth_investor'), email: 'investor@demo.com', pwd: 'demo123' },
                  { label: t('auth_business'), email: 'greentech@demo.com', pwd: 'demo123' },
                ].map(d => (
                  <button key={d.label} className="btn btn-ghost" onClick={() => demoLogin(d.email, d.pwd)} style={{ fontSize: '0.78rem', padding: '0.5rem', justifyContent: 'center', cursor: 'pointer' }}>{d.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
