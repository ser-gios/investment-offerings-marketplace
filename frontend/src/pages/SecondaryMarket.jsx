import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../context/LangContext';
import { ShoppingBag } from 'lucide-react';

export default function SecondaryMarket() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    api.get('/investments/market')
      .then(r => setListings(r.data))
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false));
  }, []);

  const buy = async (listingId) => {
    setBuying(listingId);
    try {
      await api.post(`/investments/market/${listingId}/buy`);
      setListings(l => l.filter(x => x.id !== listingId));
    } catch (e) { alert(e.response?.data?.error || 'Purchase failed'); }
    finally { setBuying(null); }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {t('sec_title')}{' '}
          <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('sec_title_2')}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('sec_subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid-3">{Array(3).fill(0).map((_, i) => <div key={i} className="card skeleton" style={{ height: 280 }} />)}</div>
      ) : listings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.15 }} />
          <h3 style={{ marginBottom: '0.75rem' }}>{t('sec_no_listings')}</h3>
          <p style={{ color: 'var(--text-muted)' }}>{t('sec_no_sub')}</p>
        </div>
      ) : (
        <div className="grid-3">
          {listings.map(l => (
            <div key={l.id} className="card" style={{ padding: '1.5rem', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,214,0,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,214,0,0.1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="tag tag-gold">{t(`freq_${l.payout_frequency}`)}</span>
                <span className={`tag tag-${l.risk_level === 'low' ? 'emerald' : l.risk_level === 'high' ? 'ruby' : 'amber'}`}>{t(`risk_${l.risk_level}`)}</span>
              </div>
              <h4 style={{ marginBottom: '0.3rem', fontSize: '1rem', fontWeight: 700 }}>{l.project_name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{t('sec_listed_by')} {l.seller_name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {[
                  { label: t('sec_asking'), value: `$${l.asking_price.toLocaleString()}`, grad: true },
                  { label: t('sec_original'), value: `$${l.original_amount.toLocaleString()}`, color: 'var(--text-secondary)' },
                  { label: t('sec_current'), value: `$${l.current_value.toLocaleString()}`, color: 'var(--emerald)' },
                  { label: t('sec_interest'), value: `${l.interest_rate}%`, color: 'var(--amber)' },
                ].map(({ label, value, color, grad }) => (
                  <div key={label} style={{ background: 'var(--obsidian)', padding: '0.65rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 600, background: grad ? 'var(--grad-yellow-text)' : undefined, WebkitBackgroundClip: grad ? 'text' : undefined, WebkitTextFillColor: grad ? 'transparent' : undefined, backgroundClip: grad ? 'text' : undefined, color: !grad ? color : undefined }}>{value}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => buy(l.id)} disabled={buying === l.id} style={{ width: '100%', justifyContent: 'center' }}>
                {buying === l.id ? t('sec_buying') : `${t('sec_buy')} $${l.asking_price.toLocaleString()}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
