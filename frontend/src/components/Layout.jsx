import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { LayoutGrid, TrendingUp, PlusCircle, BarChart3, Shield, LogOut, Coins, Wallet } from 'lucide-react';

const navItems = {
  investor: [
    { to: '/marketplace', labelKey: 'nav_marketplace', icon: LayoutGrid },
    { to: '/portfolio', labelKey: 'nav_portfolio', icon: TrendingUp },
    { to: '/my-account', labelKey: 'nav_my_account', icon: Wallet },
    { to: '/secondary', labelKey: 'nav_secondary', icon: Coins },
  ],
  business: [
    { to: '/marketplace', labelKey: 'nav_marketplace', icon: LayoutGrid },
    { to: '/business-account', labelKey: 'nav_business_account', icon: Wallet },
    { to: '/my-projects', labelKey: 'nav_my_projects', icon: BarChart3 },
    { to: '/create', labelKey: 'nav_create', icon: PlusCircle },
  ],
  admin: [
    { to: '/marketplace', labelKey: 'nav_marketplace', icon: LayoutGrid },
    { to: '/admin', labelKey: 'nav_admin', icon: Shield },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const items = user ? (navItems[user.role] || navItems.investor) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,7,15,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: 64, gap: '1rem' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '2rem', flexShrink: 0, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--grad-yellow-btn)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(255,214,0,0.35)',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#05070F' }}>IM</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Investment{' '}
              <span style={{
                background: 'var(--grad-yellow-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Market</span>
            </div>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '0.15rem', flex: 1 }}>
            {items.map(({ to, labelKey, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.85rem', borderRadius: 'var(--r-md)',
                  fontSize: '0.84rem', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--yellow)' : 'var(--text-secondary)',
                  background: active ? 'var(--yellow-glow)' : 'transparent',
                  border: active ? '1px solid rgba(255,214,0,0.18)' : '1px solid transparent',
                  transition: 'all 0.18s',
                  textDecoration: 'none',
                }}>
                  <Icon size={14} />
                  {t(labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            {/* Language toggle */}
            <button
              onClick={toggle}
              title={lang === 'en' ? 'Cambiar a Español' : 'Switch to English'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.38rem 0.7rem', borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 700,
                letterSpacing: '0.06em', transition: 'all 0.18s', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '0.88rem' }}>{lang === 'en' ? '🇺🇸' : '🇲🇽'}</span>
              {lang === 'en' ? 'ES' : 'EN'}
            </button>

            {user ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.55rem',
                  padding: '0.38rem 0.75rem', borderRadius: 'var(--r-md)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 27, height: 27, borderRadius: '50%',
                    background: 'var(--grad-yellow-btn)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: '#05070F',
                    flexShrink: 0,
                  }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.2 }}>{user.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => { logout(); navigate('/auth'); }}
                  style={{ padding: '0.4rem 0.65rem' }}
                  title={t('nav_logout')}
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/auth" className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>{t('nav_signin')}</Link>
                <Link to="/auth?mode=register" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>{t('nav_get_started')}</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '2rem' }}>
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.9rem',
          background: 'var(--grad-yellow-text)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Investment Market
        </span>
        {'  '}{t('copyright')}
      </footer>
    </div>
  );
}
