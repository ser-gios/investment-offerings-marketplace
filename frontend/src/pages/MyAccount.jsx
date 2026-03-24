import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../context/LangContext';
import { DollarSign, History, TrendingUp, Copy, Check } from 'lucide-react';

export default function MyAccount() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');

  const BLOCKCHAIN_ADDRESS = '0xB9705cEB7821D96bF5083f70E20E268e19c1a156';
  const MIN_DEPOSIT = 200;

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const [balRes, depRes, invRes] = await Promise.all([
        api.get('/deposits/balance/current'),
        api.get('/deposits'),
        api.get('/investments/portfolio')
      ]);

      setBalance(balRes.data.balance || 0);
      setDeposits(depRes.data || []);
      setInvestments(invRes.data.investments || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      if (err.response?.status === 401) navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) < MIN_DEPOSIT) {
      alert(lang === 'es' ? `Monto mínimo: $${MIN_DEPOSIT} USDT` : `Minimum amount: $${MIN_DEPOSIT} USDT`);
      return;
    }

    try {
      const res = await api.post('/deposits', {
        amount: parseFloat(depositAmount)
      });
      setSelectedDeposit(res.data);
      setDepositAmount('');
      alert(lang === 'es' ? 'Depósito creado. Ingrese el hash de la transacción para verificar.' : 'Deposit created. Enter transaction hash to verify.');
      loadAccountData();
    } catch (err) {
      alert(err.response?.data?.error || (lang === 'es' ? 'Error creando depósito' : 'Error creating deposit'));
    }
  };

  const handleVerifyDeposit = async () => {
    if (!selectedDeposit || !txHash.trim()) {
      alert(lang === 'es' ? 'Ingrese el hash de la transacción' : 'Enter transaction hash');
      return;
    }

    try {
      setVerifying(true);
      await api.post(`/deposits/${selectedDeposit.id}/verify`, { tx_hash: txHash });
      alert(lang === 'es' ? 'Transacción verificada. Saldo acreditado.' : 'Transaction verified. Balance credited.');
      setSelectedDeposit(null);
      setTxHash('');
      loadAccountData();
    } catch (err) {
      alert(err.response?.data?.error || (lang === 'es' ? 'Error verificando transacción' : 'Error verifying transaction'));
    } finally {
      setVerifying(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(BLOCKCHAIN_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>{lang === 'es' ? 'Cargando...' : 'Loading...'}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'white' }}>{lang === 'es' ? 'Mi Cuenta' : 'My Account'}</h1>
        <p style={{ color: '#999' }}>{lang === 'es' ? 'Gestiona tus depósitos e inversiones' : 'Manage your deposits and investments'}</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)', border: '1px solid rgba(255, 214, 0, 0.3)', borderRadius: '12px', padding: '30px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <DollarSign size={32} style={{ color: 'rgb(255, 214, 0)' }} />
          <h2 style={{ fontSize: '18px', color: '#999', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{lang === 'es' ? 'Saldo Disponible' : 'Available Balance'}</h2>
        </div>
        <h3 style={{ fontSize: '48px', color: 'rgb(255, 214, 0)', margin: '10px 0', fontWeight: '900' }}>${parseFloat(balance).toFixed(2)} USDT</h3>
        <p style={{ color: '#666', margin: '15px 0 0 0' }}>{lang === 'es' ? 'Fondos disponibles para invertir' : 'Funds available to invest'}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0' }}>
        {[{ id: 'balance', label: lang === 'es' ? 'Depositar' : 'Deposit' }, { id: 'deposits', label: lang === 'es' ? 'Historial' : 'History' }, { id: 'investments', label: lang === 'es' ? 'Inversiones' : 'Investments' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '15px 20px', background: activeTab === tab.id ? 'rgba(255, 214, 0, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid rgb(255, 214, 0)' : '2px solid transparent', color: activeTab === tab.id ? 'white' : '#999', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.3s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'balance' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '30px' }}>
            <h3 style={{ fontSize: '20px', color: 'white', marginTop: '0', marginBottom: '20px' }}>{lang === 'es' ? 'Crear Nuevo Depósito' : 'Create New Deposit'}</h3>

            {!selectedDeposit ? (
              <form onSubmit={handleCreateDeposit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>{lang === 'es' ? 'Monto (USDT)' : 'Amount (USDT)'}</label>
                  <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="200" style={{ width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box' }} min={MIN_DEPOSIT} step="0.01" />
                  <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>{lang === 'es' ? `Mínimo: $${MIN_DEPOSIT} USDT` : `Minimum: $${MIN_DEPOSIT} USDT`}</p>
                </div>

                <button type="submit" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, rgb(255, 214, 0) 0%, rgb(255, 140, 0) 100%)', border: 'none', borderRadius: '8px', color: 'rgb(27, 28, 32)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {lang === 'es' ? 'Crear Depósito' : 'Create Deposit'}
                </button>
              </form>
            ) : (
              <div>
                <h4 style={{ color: 'white', marginTop: '0' }}>{lang === 'es' ? 'Verificar Transacción' : 'Verify Transaction'}</h4>

                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <p style={{ color: '#999', fontSize: '12px', margin: '0 0 8px 0' }}>{lang === 'es' ? 'Dirección de depósito' : 'Deposit address'}:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <code style={{ color: 'rgb(255, 214, 0)', fontSize: '12px', flex: 1, wordBreak: 'break-all' }}>{BLOCKCHAIN_ADDRESS}</code>
                    <button onClick={copyAddress} style={{ padding: '8px', background: copiedAddress ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '4px', color: copiedAddress ? '#00ff00' : '#999', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      {copiedAddress ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#999', fontSize: '14px', marginBottom: '8px' }}>{lang === 'es' ? 'Hash de Transacción' : 'Transaction Hash'}</label>
                  <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>

                <button onClick={handleVerifyDeposit} disabled={verifying} style={{ padding: '12px 24px', background: verifying ? 'rgba(255, 214, 0, 0.3)' : 'linear-gradient(135deg, rgb(255, 214, 0) 0%, rgb(255, 140, 0) 100%)', border: 'none', borderRadius: '8px', color: 'rgb(27, 28, 32)', fontSize: '14px', fontWeight: '600', cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.6 : 1 }}>
                  {verifying ? (lang === 'es' ? 'Verificando...' : 'Verifying...') : (lang === 'es' ? 'Verificar Transacción' : 'Verify Transaction')}
                </button>

                <button onClick={() => { setSelectedDeposit(null); setTxHash(''); }} style={{ padding: '12px 24px', marginLeft: '10px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: '#999', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deposits' && (
          <div>
            {deposits.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>{lang === 'es' ? 'No hay depósitos aún' : 'No deposits yet'}</div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {deposits.map(dep => (
                  <div key={dep.id} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'white', margin: '0 0 8px 0', fontWeight: '600' }}>${parseFloat(dep.amount).toFixed(2)} USDT</p>
                      <p style={{ color: '#999', margin: '0', fontSize: '12px' }}>{new Date(dep.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}</p>
                      <code style={{ color: '#666', fontSize: '10px', wordBreak: 'break-all' }}>{dep.tx_hash?.substring(0, 16)}...</code>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ padding: '6px 12px', background: dep.status === 'confirmed' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)', color: dep.status === 'confirmed' ? '#00ff00' : '#ffa500', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                        {dep.status === 'confirmed' ? (lang === 'es' ? 'Confirmado' : 'Confirmed') : (lang === 'es' ? 'Pendiente' : 'Pending')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'investments' && (
          <div>
            {investments.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>{lang === 'es' ? 'No hay inversiones aún' : 'No investments yet'}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {investments.map(inv => (
                  <div key={inv.id} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: 'white', margin: '0 0 15px 0' }}>{inv.project_name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <p style={{ color: '#999', fontSize: '11px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{lang === 'es' ? 'Invertido' : 'Invested'}</p>
                        <p style={{ color: 'white', fontSize: '16px', margin: '0', fontWeight: '700' }}>${parseFloat(inv.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p style={{ color: '#999', fontSize: '11px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{lang === 'es' ? 'Estado' : 'Status'}</p>
                        <p style={{ color: 'rgb(255, 214, 0)', fontSize: '16px', margin: '0', fontWeight: '700' }}>{inv.status === 'active' ? (lang === 'es' ? 'Activa' : 'Active') : (lang === 'es' ? 'Completada' : 'Completed')}</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <p style={{ color: '#999', fontSize: '11px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{lang === 'es' ? 'Frecuencia' : 'Frequency'}</p>
                        <p style={{ color: 'white', fontSize: '14px', margin: '0', fontWeight: '700' }}>{inv.payout_frequency === 'monthly' ? (lang === 'es' ? 'Mensual' : 'Monthly') : inv.payout_frequency === 'quarterly' ? (lang === 'es' ? 'Trimestral' : 'Quarterly') : (lang === 'es' ? 'Anual' : 'Annual')}</p>
                      </div>
                      <div>
                        <p style={{ color: '#999', fontSize: '11px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{lang === 'es' ? 'Tasa Anual' : 'Annual Rate'}</p>
                        <p style={{ color: 'rgb(255, 214, 0)', fontSize: '18px', margin: '0', fontWeight: '900' }}>{inv.interest_rate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
