import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import RatingStars from '../components/RatingStars';
import { TrendingUp, Users, Clock, Shield, FileText, Image, Star, DollarSign, ChevronRight, ExternalLink, Building2 } from 'lucide-react';

function RatingBar({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 150, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 99 }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${(value / 5) * 100}%`, background: 'var(--grad-yellow)', transition: 'width 0.5s ease' }} />
      </div>
      <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--yellow)', width: 28, textAlign: 'right', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function OfferingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [investError, setInvestError] = useState('');
  const [investSuccess, setInvestSuccess] = useState(false);
  const [ratingForm, setRatingForm] = useState({ payout_reliability: 0, transparency: 0, overall: 0, feedback: '' });
  const [showRatingForm, setShowRatingForm] = useState(false);

  const load = async () => {
    try { const { data } = await api.get(`/projects/${id}`); setProject(data); }
    catch { navigate('/marketplace'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const invest = async () => {
    if (!user) return navigate('/auth');
    if (!amount || +amount < project.min_investment) return setInvestError(`${t('detail_min_investment')}: $${project.min_investment}`);
    setInvesting(true); setInvestError('');
    try { await api.post('/investments', { project_id: id, amount: +amount }); setInvestSuccess(true); load(); }
    catch (e) { setInvestError(e.response?.data?.error || 'Investment failed'); }
    finally { setInvesting(false); }
  };

  const postRating = async () => {
    if (!ratingForm.payout_reliability || !ratingForm.transparency || !ratingForm.overall) return;
    try { await api.post(`/ratings/${id}`, ratingForm); setShowRatingForm(false); load(); }
    catch (e) { alert(e.response?.data?.error || 'Rating failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{t('loading')}</div>;
  if (!project) return null;

  const n = { monthly: 12, quarterly: 4, annual: 1 }[project.payout_frequency] || 1;
  const returnOn1k = +(1000 * Math.pow(1 + (project.interest_rate / 100) / n, n) - 1000).toFixed(2);

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <span style={{ cursor: 'pointer', color: 'var(--yellow)', fontWeight: 600 }} onClick={() => navigate('/marketplace')}>{t('detail_breadcrumb')}</span>
        <ChevronRight size={12} />
        <span>{project.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
        {/* LEFT */}
        <div>
          <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="tag tag-gold">{project.category}</span>
                <span className={`tag tag-${project.risk_level === 'low' ? 'emerald' : project.risk_level === 'high' ? 'ruby' : 'amber'}`}>{t(`risk_${project.risk_level}`)}</span>
                <span className="tag tag-sapphire">{t(`freq_${project.payout_frequency}`)}</span>
                <span className={`tag ${project.status === 'active' ? 'tag-emerald' : 'tag-ruby'}`}>{t(`status_${project.status}`)}</span>
              </div>
              {project.funding_pct >= 100 && <span className="tag tag-gold">{t('detail_fully_funded')}</span>}
            </div>

            <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>{project.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <Building2 size={13} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{project.business_name}</span>
              {project.rating && (
                <>
                  <span style={{ color: 'var(--border)', margin: '0 0.1rem' }}>·</span>
                  <RatingStars value={project.rating.overall} size={13} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{project.rating.overall}/5</span>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.25rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              {[
                { label: t('detail_annual_rate'), value: `${project.interest_rate}%`, color: 'var(--yellow)', icon: TrendingUp },
                { label: t('detail_duration'), value: `${project.duration_months}m`, color: 'var(--sapphire)', icon: Clock },
                { label: t('detail_investors'), value: project.investors_count, color: 'var(--emerald)', icon: Users },
                { label: `$1k ${t('detail_yields')}`, value: `$${returnOn1k}`, color: 'var(--amber)', icon: DollarSign },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <Icon size={15} color={color} style={{ marginBottom: '0.35rem' }} />
                  <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 500, background: color === 'var(--yellow)' ? 'var(--grad-yellow-text)' : undefined, WebkitBackgroundClip: color === 'var(--yellow)' ? 'text' : undefined, WebkitTextFillColor: color === 'var(--yellow)' ? 'transparent' : undefined, backgroundClip: color === 'var(--yellow)' ? 'text' : undefined, color: color !== 'var(--yellow)' ? color : undefined }}>{value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('detail_funded_progress')}</span>
                <span className="mono" style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>
                  ${project.funded_amount.toLocaleString()} / ${project.total_pool.toLocaleString()}
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(project.funding_pct, 100)}%`, background: project.funding_pct >= 80 ? 'linear-gradient(90deg, var(--emerald), #00a060)' : 'var(--grad-yellow)', transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{project.funding_pct}%</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('detail_about')}</h3>
            <p style={{ lineHeight: 1.85, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{project.description}</p>
          </div>

          {project.files?.length > 0 && (
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('detail_docs')}</h3>
              {project.files.map(f => (
                <a key={f.id} href={`http://localhost:3001/uploads/${f.file_path}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--obsidian)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '0.5rem', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,214,0,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,214,0,0.1)'}
                >
                  {f.file_type === 'visual' ? <Image size={14} color="var(--sapphire)" /> : <FileText size={14} color="var(--yellow)" />}
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{f.file_name}</span>
                  <span className="tag tag-gold">{f.file_type}</span>
                  <ExternalLink size={12} color="var(--text-muted)" />
                </a>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{t('detail_ratings')}</h3>
              {user && (
                <button className="btn btn-ghost" onClick={() => setShowRatingForm(s => !s)} style={{ fontSize: '0.8rem' }}>
                  <Star size={13} /> {t('detail_rate_btn')}
                </button>
              )}
            </div>

            {project.rating ? (
              <>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="mono" style={{ fontSize: '3.5rem', fontWeight: 500, lineHeight: 1, background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{project.rating.overall}</div>
                    <RatingStars value={project.rating.overall} size={16} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{project.rating.count} {t('mkt_reviews')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, paddingTop: '0.5rem' }}>
                    <RatingBar label={t('detail_payout_reliability')} value={project.rating.payout_reliability} />
                    <RatingBar label={t('detail_transparency')} value={project.rating.transparency} />
                    <RatingBar label={t('detail_overall')} value={project.rating.overall} />
                  </div>
                </div>

                {showRatingForm && (
                  <div className="scale-in" style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>{t('detail_rate_btn')}</h4>
                    {[
                      { key: 'payout_reliability', label: t('detail_payout_reliability') },
                      { key: 'transparency', label: t('detail_transparency') },
                      { key: 'overall', label: t('detail_overall') },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', width: 160, flexShrink: 0 }}>{label}</span>
                        <RatingStars value={ratingForm[key]} size={22} interactive onChange={v => setRatingForm(f => ({ ...f, [key]: v }))} />
                      </div>
                    ))}
                    <textarea value={ratingForm.feedback} onChange={e => setRatingForm(f => ({ ...f, feedback: e.target.value }))} placeholder={t('detail_feedback_placeholder')} rows={3} style={{ marginTop: '0.5rem' }} />
                    <button className="btn btn-primary" onClick={postRating} style={{ marginTop: '0.75rem' }}>{t('detail_submit_rating')}</button>
                  </div>
                )}

                {project.ratings_list?.map(r => (
                  <div key={r.id} style={{ padding: '1rem', background: 'var(--obsidian)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.investor_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RatingStars value={r.overall} size={11} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.created_at?.split('T')[0]}</span>
                      </div>
                    </div>
                    {r.feedback && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.feedback}</p>}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <Star size={36} style={{ marginBottom: '0.75rem', opacity: 0.2 }} />
                <p>{t('detail_no_ratings')}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT sticky panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="mono" style={{ fontSize: '2.6rem', fontWeight: 500, lineHeight: 1, background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {project.interest_rate}%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{t('detail_annual_rate')}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {[
                [t('detail_payout'), t(`freq_${project.payout_frequency}`)],
                [t('detail_min_investment'), `$${project.min_investment.toLocaleString()}`],
                [t('detail_duration'), `${project.duration_months} ${t('month')}`],
                [t('detail_pool_remaining'), `$${(project.total_pool - project.funded_amount).toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="mono" style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ margin: '1rem 0' }} />

            {investSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{t('detail_success')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('detail_success_sub')}</div>
                <button className="btn btn-ghost" onClick={() => navigate('/portfolio')} style={{ width: '100%', justifyContent: 'center' }}>{t('detail_view_portfolio')}</button>
              </div>
            ) : project.status !== 'active' ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('detail_inactive')}</div>
            ) : project.funding_pct >= 100 ? (
              <div style={{ textAlign: 'center', color: 'var(--emerald)', fontWeight: 700 }}>✓ {t('detail_fully_funded')}</div>
            ) : (
              <>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }}>{t('portfolio_total_invested')} ($)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`${t('detail_min_investment')} $${project.min_investment.toLocaleString()}`} style={{ marginBottom: '0.75rem' }} min={project.min_investment} />
                {amount && +amount >= project.min_investment && (
                  <div style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-md)', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('detail_est_annual')}</span>
                      <span className="mono positive" style={{ fontWeight: 600 }}>+${(+amount * project.interest_rate / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('detail_per_period')} {t(`freq_${project.payout_frequency}`)}</span>
                      <span className="mono positive" style={{ fontWeight: 600 }}>+${(+amount * project.interest_rate / 100 / n).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {investError && <div style={{ color: 'var(--ruby)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{investError}</div>}
                <button className="btn btn-primary" onClick={invest} disabled={investing || !user} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}>
                  {!user ? t('detail_signin_btn') : investing ? t('detail_processing') : t('detail_invest_btn')}
                </button>
                {!user && <button className="btn btn-ghost" onClick={() => navigate('/auth')} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>{t('auth_create_account')}</button>}
              </>
            )}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={20} color="var(--emerald)" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.15rem' }}>{t('detail_verified')}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{t('detail_verified_sub')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
