import { useState, useRef, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../context/LangContext';
import { CheckCircle, Upload, X, FileText, Image, ChevronRight, ChevronLeft, Sparkles, DollarSign, CreditCard } from 'lucide-react';

const CATEGORIES = ['Energy', 'Logistics', 'Agriculture', 'Real Estate', 'Finance', 'Technology', 'Healthcare', 'General'];

// Combined labeled input components to prevent re-renders
const LabeledTextInput = memo(({ label, hint, value, onChange, placeholder }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    <input value={value} onChange={onChange} placeholder={placeholder} />
    {hint && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{hint}</span>}
  </div>
));

const LabeledTextArea = memo(({ label, hint, value, onChange, rows, placeholder }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} />
    {hint && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{hint}</span>}
  </div>
));

const LabeledNumberInput = memo(({ label, hint, value, onChange, placeholder, step, min, max }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    <input type="number" value={value} onChange={onChange} placeholder={placeholder} step={step} min={min} max={max} />
    {hint && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{hint}</span>}
  </div>
));

const LabeledSelect = memo(({ label, hint, value, onChange, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    <select value={value} onChange={onChange}>{children}</select>
    {hint && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{hint}</span>}
  </div>
));

function StepIndicator({ current, t }) {
  const steps = [
    { id: 1, labelKey: 'step_basic', icon: Sparkles },
    { id: 2, labelKey: 'step_financial', icon: DollarSign },
    { id: 3, labelKey: 'step_files', icon: Upload },
    { id: 4, labelKey: 'step_review', icon: CheckCircle },
    { id: 5, labelKey: 'step_payment', icon: CreditCard },
  ];
  return (
    <div style={{ display: 'flex', marginBottom: '2.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, left: '12.5%', right: '12.5%', height: 6, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ height: '100%', background: 'var(--grad-yellow)', width: `${((current - 1) / (steps.length - 1)) * 100}%`, transition: 'width 0.4s ease', borderRadius: 99 }} />
      </div>
      {steps.map(s => {
        const done = current > s.id, active = current === s.id;
        return (
          <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', zIndex: 1, background: done ? 'var(--yellow)' : active ? 'var(--surface-3)' : 'var(--surface)', border: active ? '2px solid var(--yellow)' : done ? 'none' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: active ? '0 0 0 4px var(--yellow-glow)' : 'none' }}>
              {done ? <CheckCircle size={16} color="#05070F" fill="#05070F" /> : <s.icon size={15} color={active ? 'var(--yellow)' : 'var(--text-muted)'} />}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: active ? 700 : 400, color: active ? 'var(--yellow)' : done ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{t(s.labelKey)}</span>
          </div>
        );
      })}
    </div>
  );
}

function InterestPreview({ rate, amount, freq, t }) {
  if (!rate || !amount) return null;
  const n = { monthly: 12, quarterly: 4, annual: 1 }[freq] || 1;
  const annual = amount * (rate / 100);
  const perPeriod = annual / n;
  const compounded = amount * Math.pow(1 + (rate / 100) / n, n) - amount;
  const perLabel = freq === 'monthly' ? t('preview_per_month') : freq === 'quarterly' ? t('preview_per_quarter') : t('preview_per_year');
  return (
    <div style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{t('preview_title')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: perLabel, value: `$${perPeriod.toFixed(2)}` },
          { label: t('preview_annual'), value: `$${annual.toFixed(2)}` },
          { label: t('preview_compounded'), value: `$${compounded.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 500, background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreateOffering() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const [form, setForm] = useState({ name: '', description: '', category: 'General', risk_level: 'medium', duration_months: 12, payout_frequency: 'quarterly', interest_rate: '', min_investment: 1000, max_investment: '', total_pool: '', files: [] });
  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);
  
  // Memoize translated strings to avoid re-renders
  const strings = useMemo(() => ({
    // Labels
    projectName: t('create_project_name'),
    projectNameHint: t('create_project_name_hint'),
    description: t('create_description'),
    descriptionHint: t('create_description_hint'),
    category: t('create_category'),
    risk: t('create_risk'),
    duration: t('create_duration'),
    durationHint: t('create_duration_hint'),
    payoutFreq: t('create_payout_freq'),
    interestRate: t('create_interest_rate'),
    interestHint: t('create_interest_hint'),
    pool: t('create_pool'),
    poolHint: t('create_pool_hint'),
    minInv: t('create_min_inv'),
    maxInv: t('create_max_inv'),
    maxInvHint: t('create_max_inv_hint'),
    // Placeholders
    placeholderProjectName: 'e.g. Solar Farm Phase II',
    placeholderDescription: t('create_description_placeholder'),
    placeholderInterest: 'e.g. 10.5',
    placeholderPool: '500000',
    placeholderMinInv: '1000',
  }), [t]);

  const nextStep = useCallback(() => {
    setStep(s => {
      console.log('NextStep - Current step:', s);
      if (s === 1 && (!form.name || !form.description)) {
        console.log('Step 1 validation failed - name:', form.name, 'desc:', form.description);
        setError(t('create_project_name') + ' / ' + t('create_description') + ' required');
        return s;
      }
      if (s === 2 && (!form.interest_rate || !form.total_pool)) {
        console.log('Step 2 validation failed - rate:', form.interest_rate, 'pool:', form.total_pool);
        setError(t('create_interest_rate') + ' / ' + t('create_pool') + ' required');
        return s;
      }
      setError('');
      const next = Math.min(s + 1, 5);
      console.log('NextStep - Moving to step:', next);
      return next;
    });
  }, [form, t]);
  const prevStep = useCallback(() => { setError(''); setStep(s => Math.max(s - 1, 1)); }, []);

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setForm(f => ({ ...f, files: [...f.files, ...newFiles] }));
  };
  const removeFile = (idx) => setForm(f => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));

  const submit = async () => {
    console.log('Submit - Starting project creation, form:', form);
    setLoading(true); setError('');
    try {
      console.log('Creating project with:', form.name, form.category, 'Rate:', form.interest_rate, 'Pool:', form.total_pool);
      const payload = { 
        name: form.name, 
        description: form.description, 
        payout_frequency: form.payout_frequency, 
        interest_rate: +form.interest_rate, 
        min_investment: +form.min_investment, 
        max_investment: form.max_investment ? +form.max_investment : undefined, 
        total_pool: +form.total_pool, 
        category: form.category, 
        risk_level: form.risk_level, 
        duration_months: +form.duration_months 
      };
      console.log('Submit payload:', JSON.stringify(payload));
      const { data } = await api.post('/projects', payload);
      console.log('Project created successfully:', data.id);
      if (form.files.length > 0) {
        const fd = new FormData();
        form.files.forEach(f => fd.append('files', f));
        await api.post(`/uploads/${data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setCreatedId(data.id); 
      console.log('Setting step to 5 and createdId to:', data.id);
      setStep(5);
    } catch (e) { 
      console.error('Create project error - Status:', e.response?.status, 'Data:', e.response?.data, 'Message:', e.message);
      setError(e.response?.data?.error || 'Failed to create offering'); 
    }
    finally { setLoading(false); }
  };

  const Label = ({ k, hint, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t(k)}</label>
      {children}
      {hint && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{t(hint)}</span>}
    </div>
  );

  // This is the SUCCESS page after project is created
  if (step === 5 && createdId) return (
    <div style={{ maxWidth: 560, margin: '4rem auto', textAlign: 'center' }} className="fade-up">
      <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem', background: 'var(--emerald-dim)', border: '2px solid var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={36} color="var(--emerald)" />
      </div>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{t('create_success_title')}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('create_success_sub')}</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/my-projects')}>{t('create_my_projects')}</button>
        <button className="btn btn-primary" onClick={() => navigate(`/offering/${createdId}`)}>{t('create_view_offering')} →</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {t('create_title')}{' '}
          <span style={{ background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('create_title_2')}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('create_subtitle')}</p>
      </div>

      <StepIndicator current={step} t={t} />

      <div className="card" style={{ padding: '2.5rem' }}>
        {error && <div style={{ background: 'var(--ruby-dim)', border: '1px solid rgba(255,61,90,0.2)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--ruby)', marginBottom: '1.5rem' }}>{error}</div>}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.1rem' }}>{t('step_basic')}</h3>
            <LabeledTextInput label={strings.projectName} hint={strings.projectNameHint} value={form.name} onChange={e => set('name', e.target.value)} placeholder={strings.placeholderProjectName} />
            <LabeledTextArea label={strings.description} hint={strings.descriptionHint} value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder={strings.placeholderDescription} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <LabeledSelect label={strings.category} hint={null} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </LabeledSelect>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{strings.risk}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['low', 'medium', 'high'].map(r => {
                    const colors = { low: 'var(--emerald)', medium: 'var(--amber)', high: 'var(--ruby)' };
                    return (
                      <button key={r} type="button" onClick={() => set('risk_level', r)} style={{ flex: 1, padding: '0.6rem 0', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600, background: form.risk_level === r ? `${colors[r]}18` : 'var(--surface)', color: form.risk_level === r ? colors[r] : 'var(--text-muted)', border: form.risk_level === r ? `1px solid ${colors[r]}50` : '1px solid var(--border)', transition: 'all 0.15s', cursor: 'pointer', textTransform: 'capitalize' }}>{t(`risk_${r}`)}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <LabeledNumberInput label={strings.duration} hint={strings.durationHint} value={form.duration_months} onChange={e => set('duration_months', e.target.value)} min={1} max={120} step={1} />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.1rem' }}>{t('step_financial')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{strings.payoutFreq}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['monthly', 'quarterly', 'annual'].map(f => (
                  <button key={f} type="button" onClick={() => set('payout_frequency', f)} style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 600, background: form.payout_frequency === f ? 'var(--yellow-glow)' : 'var(--surface)', color: form.payout_frequency === f ? 'var(--yellow)' : 'var(--text-muted)', border: form.payout_frequency === f ? '1px solid rgba(255,214,0,0.3)' : '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}>{t(`freq_${f}`)}</button>
                ))}
              </div>
            </div>
            <LabeledNumberInput label={strings.interestRate} hint={strings.interestHint} value={form.interest_rate} onChange={e => set('interest_rate', e.target.value)} placeholder={strings.placeholderInterest} step="0.1" min={0.1} max={99} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <LabeledNumberInput label={strings.pool} hint={strings.poolHint} value={form.total_pool} onChange={e => set('total_pool', e.target.value)} placeholder={strings.placeholderPool} />
              <LabeledNumberInput label={strings.minInv} hint={null} value={form.min_investment} onChange={e => set('min_investment', e.target.value)} placeholder={strings.placeholderMinInv} />
            </div>
            <LabeledNumberInput label={strings.maxInv} hint={strings.maxInvHint} value={form.max_investment} onChange={e => set('max_investment', e.target.value)} placeholder={strings.maxInvHint} />
            <InterestPreview rate={+form.interest_rate} amount={1000} freq={form.payout_frequency} t={t} />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.1rem' }}>{t('create_files_title')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('create_files_subtitle')}</p>
            <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: '3rem', textAlign: 'center', cursor: 'pointer', background: 'var(--obsidian)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,214,0,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,214,0,0.1)'}
            >
              <Upload size={32} color="var(--yellow)" style={{ marginBottom: '0.75rem', opacity: 0.7 }} />
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{t('create_drop')}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('create_drop_hint')}</div>
              <input ref={fileRef} type="file" multiple accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp" onChange={handleFiles} style={{ display: 'none' }} />
            </div>
            {form.files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--obsidian)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', padding: '0.6rem 0.9rem' }}>
                    {f.type.includes('image') ? <Image size={13} color="var(--sapphire)" /> : <FileText size={13} color="var(--yellow)" />}
                    <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(0)}kb</span>
                    <button onClick={() => removeFile(i)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-md)', padding: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--sapphire)', flexShrink: 0 }}>ℹ</span>
              {t('create_files_note')}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{t('create_review_title')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                [t('create_project_name'), form.name],
                [t('create_category'), form.category],
                [t('create_risk'), form.risk_level],
                [t('create_duration'), `${form.duration_months} ${t('month')}`],
                [t('create_interest_rate'), `${form.interest_rate}%`],
                [t('create_payout_freq'), t(`freq_${form.payout_frequency}`)],
                [t('create_pool'), `$${(+form.total_pool).toLocaleString()}`],
                [t('create_min_inv'), `$${(+form.min_investment).toLocaleString()}`],
                [t('step_files'), form.files.length > 0 ? `${form.files.length} file(s)` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--obsidian)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
                  <span className="mono" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--yellow-glow)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Note: </span>{t('create_review_note')}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{t('step_payment')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.875rem' }}>{t('create_payment_subtitle')}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
              <div style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,214,0,0.15)', padding: '1.25rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.4rem' }}>{t('create_annual_fee')}</div>
                <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$100</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>USDT / {t('create_per_year')}</div>
              </div>

              <div style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,214,0,0.15)', padding: '1.25rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.4rem' }}>{t('create_platform_fee')}</div>
                <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, background: 'var(--grad-yellow-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>2%</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t('create_of_raised')}</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>{t('create_payment_info')}</div>
              <div style={{ background: 'var(--obsidian)', borderRadius: 'var(--r-md)', padding: '1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
                0xB9705cEB7821D96bF5083f70E20E268e19c1a156
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                <span>🔗 Network:</span>
                <span style={{ fontWeight: 500, color: 'var(--yellow)' }}>BNB Chain</span>
              </div>
            </div>

            <div style={{ background: 'var(--emerald-dim)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: 'var(--r-md)', padding: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--emerald)', flexShrink: 0 }}>✓</span>
              {t('create_payment_note')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={prevStep} disabled={step === 1} style={{ cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={15} /> {t('btn_back')}
          </button>
          {step < 5 ? (
            <button className="btn btn-primary" onClick={nextStep}>{t('btn_continue')} <ChevronRight size={15} /></button>
          ) : (
            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ minWidth: 160, justifyContent: 'center' }}>
              {loading ? t('create_submitting') : `${t('create_submit')} ✓`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
