import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StatCard from '../components/StatCard';
import { useLang } from '../context/LangContext';
import { TrendingUp, DollarSign, BarChart2, Percent, Clock, ShoppingBag } from 'lucide-react';

function InvestmentRow({ inv, onList, t }) {
  const navigate = useNavigate();
  const roi = inv.amount > 0 ? ((inv.interest_earned / inv.amount) * 100).toFixed(2) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={() => navigate(`/offering/${inv.project_id}`)}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{inv.project_name}</div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <span className="tag tag-gold" style={{ fontSize: '0.62rem' }}>{t(`freq_${inv.payout_frequency}`)}</span>
          <span className={`tag tag-${inv.risk_level === 'low' ? 'emerald' : inv.risk_level === 'high' ? 'ruby' : 'amber'}`} style={{ fontSize: '0.62rem' }}>{t(`risk_${inv.risk_level}`)}</span>
        </div>
      </div>
      <div>
        <div className="mono" style={{ fontWeight: 500 }}>${inv.amount.toLocaleString()}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('portfolio_invested')}</div>
      </div>
      <div>
        <div className="mono" style={{ fontWeight: 500 }}>${inv.current_value.toLocaleString()}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('portfolio_current')}</div>
      </div>
      <div>
        <div className="mono positive" style={{ fontWeight: 600 }}>+${inv.interest_earned.toFixed(2)}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('portfolio_earned_col')}</div>
      </div>
      <div>
        <div className="mono" style={{ background: inv.interest_rate >= 10 ? 'var(--grad-yellow-text)' : undefined, WebkitBackgroundClip: inv.interest_rate >= 10 ? 'text' : undefined, WebkitTextFillColor: inv.interest_rate >= 10 ? 'transparent' : undefined, backgroundClip: inv.interest_rate >= 10 ? 'text' : undefined, color: inv.interest_rate < 10 ? 'var(--yellow)' : undefined, fontWeight: 600 }}>{inv.interest_rate}%</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ROI: {roi}%</div>
      </div>
      <div onClick={e => { e.stopPropagation(); onList(inv.id); }}>
        <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.32rem 0.55rem' }}>
          <ShoppingBag size={11} /> {t('portfolio_list_btn')}
        </button>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listModal, setListModal] = useState(null);
  const [askingPrice, setAskingPrice] = useState('');

  useEffect(() => {
    Promise.all([api.get('/investments/portfolio'), api.get('/investments/payouts')])
      .then(([pRes, payRes]) => { setData(pRes.data); setPayouts(payRes.data); })
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false));
  }, []);

  const listForSale = async () => {
    try {
      await api.post(`/investments/${listModal}/list`, { asking_price: +askingPrice });
      setListModal(null); setAskingPrice('');
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{t('loading')}</div>;
  if (!data) return null;

  const { summary, investments } = data;
  const active = investments.filter(i => i.status === 'active');

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {t('portfolio_title')}{' '}
          <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('portfolio_title_2')}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('portfolio_subtitle')}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard label={t('portfolio_total_invested')} value={`$${summary.total_invested.toLocaleString()}`} icon={DollarSign} color="var(--sapphire)" />
        <StatCard label={t('portfolio_value')} value={`$${summary.total_value.toLocaleString()}`} icon={BarChart2} color="var(--yellow)" />
        <StatCard label={t('portfolio_earned')} value={`$${summary.total_earned.toFixed(2)}`} icon={TrendingUp} color="var(--emerald)" />
        <StatCard label={t('portfolio_roi')} value={`${summary.roi}%`} icon={Percent} color="var(--amber)" />
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem' }}>{t('portfolio_positions')}</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{summary.active_count} positions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', gap: '1rem', padding: '0.55rem 1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', background: 'var(--obsidian)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          {['Project', t('portfolio_invested'), t('portfolio_current'), t('portfolio_earned_col'), 'Rate', ''].map(h => <span key={h}>{h}</span>)}
        </div>
        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {t('portfolio_no_investments')}{' '}
            <span style={{ color: 'var(--yellow)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/marketplace')}>{t('portfolio_browse')}</span>
          </div>
        ) : active.map(inv => <InvestmentRow key={inv.id} inv={inv} onList={setListModal} t={t} />)}
      </div>

      {payouts.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem' }}>{t('portfolio_upcoming')}</h3>
          </div>
          {payouts.slice(0, 8).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{p.project_name}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{t(`freq_${p.payout_frequency}`)}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span className="mono positive" style={{ fontWeight: 700 }}>+${p.amount.toFixed(2)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}><Clock size={11} /> {p.scheduled_date}</span>
                <span className={`tag tag-${p.status === 'processed' ? 'emerald' : p.status === 'failed' ? 'ruby' : 'amber'}`}>{t(`status_${p.status}`)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {listModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setListModal(null)}>
          <div className="card scale-in" style={{ padding: '2rem', width: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t('portfolio_list_title')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{t('portfolio_list_sub')}</p>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>{t('portfolio_asking')}</label>
            <input type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder={t('portfolio_asking_placeholder')} style={{ marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setListModal(null)}>{t('portfolio_cancel')}</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={listForSale}>{t('portfolio_list_sale')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
