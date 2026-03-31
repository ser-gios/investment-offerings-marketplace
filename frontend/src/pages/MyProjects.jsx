import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useLang } from '../context/LangContext';
import RatingStars from '../components/RatingStars';
import EditProjectModal from '../components/EditProjectModal';
import { PlusCircle, TrendingUp, Edit2 } from 'lucide-react';

export default function MyProjects() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('nv_token');
    console.log('MyProjects - Token exists:', !!token);
    api.get('/projects/my/listings')
      .then(r => {
        console.log('MyProjects - API response:', r.data);
        setProjects(r.data);
      })
      .catch(err => {
        console.error('MyProjects - API error:', err.response?.status, err.response?.data);
        navigate('/auth');
      })
      .finally(() => setLoading(false));
  }, []);

  const statusColor = { active: 'var(--emerald)', pending: 'var(--amber)', closed: 'var(--text-muted)', suspended: 'var(--ruby)' };
  const paymentColor = { pending: 'var(--ruby)', paid: 'var(--emerald)' };

  const handleSaveProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setEditingProject(null);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {t('my_title')}{' '}
            <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('my_title_2')}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('my_subtitle')}</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <PlusCircle size={14} /> {t('my_new')}
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.15 }} />
          <h3 style={{ marginBottom: '0.75rem' }}>{t('my_no_offerings')}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{t('my_no_sub')}</p>
          <Link to="/create" className="btn btn-primary">{t('my_create')}</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {projects.map(p => (
            <div key={p.id} className="card" style={{ padding: '1.5rem', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px', gap: '1rem', alignItems: 'center' }}>
                <div style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  onClick={() => navigate(`/offering/${p.id}`)}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className="tag tag-gold">{p.category}</span>
                    <span className="tag tag-gold">{t(`freq_${p.payout_frequency}`)}</span>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="mono" style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700, fontSize: '1.1rem' }}>{p.interest_rate}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('my_annual_rate')}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="mono" style={{ fontWeight: 500 }}>${(p.funded_amount || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ ${(p.total_pool || 0).toLocaleString()}</div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, marginTop: '0.3rem' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${p.funding_pct}%`, background: 'var(--grad-yellow)', transition: 'width 0.5s' }} />
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="mono" style={{ fontWeight: 500 }}>{p.investments_count || 0}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('my_investors')}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>{p.rating ? <RatingStars value={p.rating.overall} size={14} /> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.22rem 0.65rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: `${statusColor[p.status]}18`, color: statusColor[p.status], border: `1px solid ${statusColor[p.status]}30`, textTransform: 'capitalize', width: 'fit-content' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor[p.status] }} />
                    {t(`status_${p.status}`)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.22rem 0.65rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: `${paymentColor[p.payment_status] || 'var(--amber)'}18`, color: paymentColor[p.payment_status] || 'var(--amber)', border: `1px solid ${paymentColor[p.payment_status] || 'var(--amber)'}30`, textTransform: 'capitalize', width: 'fit-content' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: paymentColor[p.payment_status] || 'var(--amber)' }} />
                    {p.payment_status === 'paid' ? 'Pagado' : 'Pendiente de Pago'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingProject(p)}
                    style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--r-md)',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--yellow)';
                      e.currentTarget.style.color = 'var(--yellow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}
