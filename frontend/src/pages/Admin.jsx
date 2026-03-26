import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StatCard from '../components/StatCard';
import RatingStars from '../components/RatingStars';
import { useLang } from '../context/LangContext';
import { Users, BarChart2, DollarSign, Clock, Shield, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';

const CATEGORIES_EN = ['All', 'Energy', 'Logistics', 'Agriculture', 'Real Estate', 'Finance', 'Technology', 'Healthcare'];
const categoryColors = {
  'Energy': '#4ADE80',
  'Logistics': '#60A5FA',
  'Agriculture': '#34D399',
  'Real Estate': '#FBBF24',
  'Finance': '#F87171',
  'Technology': '#A78BFA',
  'Healthcare': '#FB7185',
  'General': '#9CA3AF'
};

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLang();
  const TABS = [
    { key: 'overview', label: t('admin_tab_overview') },
    { key: 'projects', label: t('admin_tab_projects') },
    { key: 'users', label: t('admin_tab_users') },
    { key: 'payouts', label: t('admin_tab_payouts') },
    { key: 'deposits', label: 'Depósitos' },
  ];
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/projects'), api.get('/admin/users'), api.get('/admin/payouts'), api.get('/admin/deposits')])
      .then(([s, p, u, pay, dep]) => { setStats(s.data); setProjects(p.data); setUsers(u.data); setPayouts(pay.data); setDeposits(dep.data); })
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false));
  }, []);

  const updateProjectStatus = async (id, status) => {
    await api.patch(`/admin/projects/${id}/status`, { status });
    setProjects(ps => ps.map(p => p.id === id ? { ...p, status } : p));
  };
  const toggleUser = async (id) => {
    const { data } = await api.patch(`/admin/users/${id}/toggle`);
    setUsers(us => us.map(u => u.id === id ? { ...u, is_active: data.is_active ? 1 : 0 } : u));
  };
  const updatePayout = async (id, status) => {
    await api.patch(`/admin/payouts/${id}`, { status });
    setPayouts(ps => ps.map(p => p.id === id ? { ...p, status } : p));
  };
  const deleteProject = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects(ps => ps.filter(p => p.id !== id));
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    }
  };

  const Badge = ({ status }) => {
    const map = { active: 'var(--emerald)', pending: 'var(--amber)', closed: 'var(--text-muted)', suspended: 'var(--ruby)', processed: 'var(--emerald)', failed: 'var(--ruby)' };
    const color = map[status] || 'var(--text-muted)';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30`, textTransform: 'capitalize' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
        {t(`status_${status}`) || status}
      </span>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{t('loading')}</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--grad-yellow-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={22} color="#05070F" />
        </div>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.2rem' }}>
            {t('admin_title')}{' '}
            <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('admin_title_2')}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('admin_subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '2rem', background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: '4px', width: 'fit-content' }}>
        {TABS.map(tab_ => (
          <button key={tab_.key} onClick={() => setTab(tab_.key)} style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 600, background: tab === tab_.key ? 'var(--surface-2)' : 'transparent', color: tab === tab_.key ? 'var(--text-primary)' : 'var(--text-muted)', border: tab === tab_.key ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.18s', cursor: 'pointer' }}>
            {tab_.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <StatCard label={t('admin_total_users')} value={stats.users} icon={Users} color="var(--sapphire)" />
            <StatCard label={t('admin_active_projects')} value={stats.active_projects} sub={`${t('admin_of')} ${stats.projects} ${t('admin_total')}`} icon={BarChart2} color="var(--yellow)" />
            <StatCard label={t('admin_total_capital')} value={`$${(stats.total_invested || 0).toLocaleString()}`} icon={DollarSign} color="var(--emerald)" />
            <StatCard label={t('admin_pending_payouts')} value={stats.pending_payouts} sub={`$${(stats.pending_payouts_amount || 0).toFixed(0)} ${t('admin_due')}`} icon={Clock} color="var(--amber)" />
          </div>
          <div className="card">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: '1.1rem' }}>{t('admin_recent_projects')}</h3></div>
            {stats.recent_projects?.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 4, height: 24, borderRadius: 99, background: categoryColors[p.category] || categoryColors['General'] }} />
                  <div><span style={{ fontWeight: 600 }}>{p.name}</span><span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.78rem' }}>{p.business_name}</span></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className="mono" style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>{p.interest_rate}%</span>
                  <Badge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t('admin_all_projects')} ({projects.filter(p => categoryFilter === 'All' || p.category === categoryFilter).length})</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES_EN.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: categoryFilter === cat ? '2px solid var(--border)' : '1px solid var(--border)',
                  background: categoryFilter === cat ? 'var(--surface-2)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}>{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 180px', gap: '1rem', padding: '0.55rem 1.25rem', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', background: 'var(--obsidian)', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
            {[t('admin_project_col'), t('admin_rate_col'), t('admin_funded_col'), t('admin_investors_col'), t('admin_status_col'), 'Pago', t('admin_actions_col')].map(h => <span key={h}>{h}</span>)}
          </div>
          {projects.filter(p => categoryFilter === 'All' || p.category === categoryFilter).map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 180px', gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {p.business_name}
                  <span style={{
                    marginLeft: '0.4rem',
                    display: 'inline-block',
                    padding: '0.2rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: categoryColors[p.category] + '25',
                    color: categoryColors[p.category]
                  }}>{p.category}</span>
                </div>
              </div>
              <span className="mono" style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>{p.interest_rate}%</span>
              <div>
                <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.funding_pct}%</div>
                <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, marginTop: '0.2rem' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${p.funding_pct}%`, background: categoryColors[p.category] || categoryColors['General'] }} />
                </div>
              </div>
              <span className="mono">{p.investors_count}</span>
              <Badge status={p.status} />
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: p.payment_status === 'paid' ? 'rgba(0,200,100,0.15)' : 'rgba(255,100,100,0.15)', color: p.payment_status === 'paid' ? 'var(--emerald)' : 'var(--ruby)', border: p.payment_status === 'paid' ? '1px solid rgba(0,200,100,0.3)' : '1px solid rgba(255,100,100,0.3)', textTransform: 'capitalize' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: p.payment_status === 'paid' ? 'var(--emerald)' : 'var(--ruby)' }} />
                  {p.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {p.payment_status === 'pending' && <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }} onClick={() => api.patch(`/admin/projects/${p.id}/payment`, { payment_status: 'paid' }).then(() => location.reload())}><CheckCircle size={10} /> Aprobar</button>}
                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }} onClick={() => navigate(`/offering/${p.id}`)}><Eye size={10} /></button>
                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }} onClick={() => deleteProject(p.id)}><Trash2 size={10} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: '1.1rem' }}>{t('admin_all_users')} ({users.length})</h3></div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <div><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{u.email}</div></div>
              <span className={`tag tag-${u.role === 'admin' ? 'ruby' : u.role === 'business' ? 'sapphire' : 'gold'}`}>{u.role}</span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.investments_count} / {u.projects_count}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.created_at?.split('T')[0]}</span>
              <button className={u.is_active ? 'btn btn-danger' : 'btn btn-success'} style={{ fontSize: '0.73rem', padding: '0.28rem 0.55rem' }} onClick={() => toggleUser(u.id)}>
                {u.is_active ? t('admin_suspend_btn') : t('admin_restore_btn')}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'payouts' && (
        <div className="card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>{t('admin_all_payouts')} ({payouts.length})</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('admin_pending')}: {payouts.filter(p => p.status === 'pending').length} · {t('admin_processed')}: {payouts.filter(p => p.status === 'processed').length}
            </span>
          </div>
          {payouts.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 160px', gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <div><div style={{ fontWeight: 600 }}>{p.project_name}</div><div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{p.investor_name}</div></div>
              <span className="mono positive" style={{ fontWeight: 700 }}>${p.amount.toFixed(2)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.scheduled_date}</span>
              <Badge status={p.status} />
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.investor_email}</span>
              {p.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn btn-success" style={{ padding: '0.28rem 0.55rem', fontSize: '0.68rem' }} onClick={() => updatePayout(p.id, 'processed')}><CheckCircle size={10} /> {t('admin_process_btn')}</button>
                  <button className="btn btn-danger" style={{ padding: '0.28rem 0.55rem', fontSize: '0.68rem' }} onClick={() => updatePayout(p.id, 'failed')}><XCircle size={10} /> {t('admin_fail_btn')}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'deposits' && (
        <div className="card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Depósitos ({deposits.length})</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Pendientes: {deposits.filter(d => d.status === 'pending').length} · Confirmados: {deposits.filter(d => d.status === 'confirmed').length}
            </span>
          </div>
          {deposits.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No hay depósitos registrados
            </div>
          ) : (
            deposits.map(d => (
              <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr', gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{d.investor_name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{d.investor_email}</div>
                </div>
                <span className="mono positive" style={{ fontWeight: 700 }}>${(parseFloat(d.amount) || 0).toFixed(2)}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(d.created_at).toLocaleDateString('es-ES')}
                </span>
                <Badge status={d.status} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                  {d.tx_hash ? d.tx_hash.substring(0, 10) + '...' : '-'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
