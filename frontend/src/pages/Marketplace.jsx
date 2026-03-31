import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import RatingStars from '../components/RatingStars';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Search, TrendingUp, Users, Clock, ArrowUpRight, Filter, Zap, Shield, Leaf, Building2 } from 'lucide-react';

const CATEGORIES_EN = ['All', 'Energy', 'Logistics', 'Agriculture', 'Real Estate', 'Finance', 'Technology', 'Healthcare'];
const RISKS = ['All', 'low', 'medium', 'high'];
const FREQS = ['All', 'monthly', 'quarterly', 'annual'];
const riskColors = { low: 'emerald', medium: 'amber', high: 'ruby' };
const categoryIcons = { Energy: Leaf, Finance: TrendingUp, 'Real Estate': Building2, Logistics: Zap, default: Shield };

function FundingBar({ pct, t }) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        <span>{t('mkt_funded')}</span>
        <span className="mono" style={{ color: pct >= 80 ? 'var(--emerald)' : 'var(--yellow)', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(pct, 100)}%`, background: pct >= 80 ? 'linear-gradient(90deg, var(--emerald), #00a060)' : 'var(--grad-yellow)', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function OfferingCard({ project, index, t }) {
  const navigate = useNavigate();
  const CatIcon = categoryIcons[project.category] || categoryIcons.default;
  const riskTag = riskColors[project.risk_level] || 'amber';

  return (
    <div
      className="card"
      onClick={() => navigate(`/offering/${project.id}`)}
      style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s', animationDelay: `${index * 0.04}s`, position: 'relative', overflow: 'hidden', animation: `fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) ${index * 0.04}s both` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,214,0,0.3)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated), 0 0 30px rgba(255,214,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,214,0,0.1)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
    >
      {/* Top gradient accent on hover */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad-yellow)', opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none' }} />

      {/* Project Image */}
      {project.project_image && (
        <div style={{ marginBottom: '1rem', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginTop: '-1.5rem' }}>
          <img src={project.project_image} alt={project.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'var(--yellow-glow)', border: '1px solid rgba(255,214,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CatIcon size={20} color="var(--yellow)" />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className={`tag tag-${riskTag}`}>{t(`risk_${project.risk_level}`)}</span>
          <span className="tag tag-gold">{t(`freq_${project.payout_frequency}`)}</span>
        </div>
      </div>

      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', lineHeight: 1.3 }}>{project.name}</h4>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{project.business_name}</p>

      {/* Rate hero number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', margin: '1rem 0', padding: '0.75rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <span className="mono" style={{ fontSize: '2.1rem', fontWeight: 500, background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {project.interest_rate}%
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('mkt_annual_return')}</span>
      </div>

      <FundingBar pct={project.funding_pct} t={t} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} /> {project.investors_count || 0}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {project.duration_months}m</span>
        <span className="mono">{t('mkt_min')} ${(project.min_investment || 1000).toLocaleString()}</span>
      </div>

      {project.rating && (
        <div style={{ marginTop: '0.9rem', padding: '0.65rem 0.75rem', background: 'var(--obsidian)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <RatingStars value={project.rating.overall} size={12} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{project.rating.overall}/5 · {project.rating.count} {t('mkt_reviews')}</span>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', opacity: 0.2 }}>
        <ArrowUpRight size={15} color="var(--yellow)" />
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [risk, setRisk] = useState('All');
  const [freq, setFreq] = useState('All');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = { sort };
      if (search) p.search = search;
      if (category !== 'All') p.category = category;
      if (risk !== 'All') p.risk = risk;
      if (freq !== 'All') p.freq = freq;
      const { data } = await api.get('/projects', { params: p });
      setProjects(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, category, risk, freq, sort]);

  useEffect(() => { load(); }, [load]);

  const avgRate = projects.length ? (projects.reduce((s, p) => s + p.interest_rate, 0) / projects.length).toFixed(1) : 0;

  const chipStyle = (active) => ({
    padding: '0.28rem 0.7rem', borderRadius: 99, fontSize: '0.77rem', fontWeight: 600,
    background: active ? 'var(--yellow-glow)' : 'var(--surface-2)',
    color: active ? 'var(--yellow)' : 'var(--text-muted)',
    border: active ? '1px solid rgba(255,214,0,0.3)' : '1px solid var(--border)',
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div className="fade-in">
      {/* Hero */}
      <div style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--surface) 0%, var(--obsidian) 100%)', borderRadius: 'var(--r-2xl)', border: '1px solid var(--border)', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(255,214,0,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>
              {t('mkt_title')}{' '}
              <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('mkt_title_2')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {projects.length} {t('mkt_active')} · {t('mkt_avg_return')} <span className="mono" style={{ color: 'var(--yellow)' }}>{avgRate}%</span>
            </p>
          </div>
          {user?.role === 'business' && (
            <Link to="/create" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
              <TrendingUp size={15} /> {t('mkt_list_offering')}
            </Link>
          )}
          {!user && <Link to="/auth" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>{t('nav_get_started')} →</Link>}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('mkt_search')} style={{ paddingLeft: '2.2rem' }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', minWidth: 170 }}>
          <option value="newest">{t('mkt_sort_newest')}</option>
          <option value="rate_desc">{t('mkt_sort_rate_desc')}</option>
          <option value="rate_asc">{t('mkt_sort_rate_asc')}</option>
          <option value="funded">{t('mkt_sort_funded')}</option>
        </select>
        <button className="btn btn-ghost" onClick={() => setShowFilters(s => !s)} style={{ color: showFilters ? 'var(--yellow)' : undefined, borderColor: showFilters ? 'rgba(255,214,0,0.3)' : undefined }}>
          <Filter size={14} /> {t('mkt_filters')} {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card scale-in" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{t('mkt_category')}</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {CATEGORIES_EN.map(c => <button key={c} onClick={() => setCategory(c)} style={chipStyle(category === c)}>{c === 'All' ? t('mkt_all') : c}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{t('mkt_risk')}</div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {RISKS.map(r => <button key={r} onClick={() => setRisk(r)} style={chipStyle(risk === r)}>{r === 'All' ? t('mkt_all') : t(`risk_${r}`)}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{t('mkt_frequency')}</div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {FREQS.map(f => <button key={f} onClick={() => setFreq(f)} style={chipStyle(freq === f)}>{f === 'All' ? t('mkt_all') : t(`freq_${f}`)}</button>)}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid-3">{Array(6).fill(0).map((_, i) => <div key={i} className="card skeleton" style={{ height: 380 }} />)}</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p style={{ fontSize: '1.1rem' }}>{t('mkt_no_results')}</p>
        </div>
      ) : (
        <div className="grid-3">{projects.map((p, i) => <OfferingCard key={p.id} project={p} index={i} t={t} />)}</div>
      )}
    </div>
  );
}
