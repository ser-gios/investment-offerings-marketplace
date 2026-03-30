import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLang } from '../context/LangContext';
import { DollarSign, TrendingUp, Wallet, History } from 'lucide-react';

export default function BusinessAccount() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get user balance from localStorage (fallback method)
      const user = JSON.parse(localStorage.getItem('nv_user') || '{}');
      setBalance(user.balance || 0);

      // Get business transactions
      const txRes = await api.get('/investments/business/transactions');
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error('Error loading account data:', err);
      // Continue loading even if there's an error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{t('loading')}</div>;
  }

  const totalReceived = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const totalCommissions = transactions.reduce((sum, tx) => sum + (parseFloat(tx.fee_amount) || 0), 0);

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          💼 Cuenta de Empresa
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gestiona tu balance y visualiza tus transacciones
        </p>
      </div>

      {/* Main Balance Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(255,214,0,0.1) 0%, rgba(59,130,246,0.1) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Balance Actual</p>
            <div style={{ fontSize: '3.5rem', fontWeight: 600, color: 'var(--yellow)', marginBottom: '0.5rem' }}>
              ${balance.toFixed(2)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>USDT disponible en tu cuenta</p>
          </div>
          <Wallet size={64} style={{ color: 'var(--yellow)', opacity: 0.2 }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Total Recibido */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--emerald)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Recibido</p>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--emerald)' }}>
            ${totalReceived.toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            De {transactions.length} inversi{transactions.length === 1 ? 'ón' : 'ones'}
          </p>
        </div>

        {/* Comisiones */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <DollarSign size={18} style={{ color: 'var(--amber)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Comisiones Plataforma</p>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--amber)' }}>
            ${totalCommissions.toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {totalReceived > 0 ? `${((totalCommissions / totalReceived) * 100).toFixed(1)}%` : '0%'} del total
          </p>
        </div>

        {/* Neto Recibido */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Wallet size={18} style={{ color: 'var(--blue)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Neto Recibido</p>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--blue)' }}>
            ${(totalReceived - totalCommissions).toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Después de comisiones
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <History size={20} />
          <h3 style={{ fontSize: '1.25rem' }}>Historial de Transacciones</h3>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>No hay inversiones aún. ¡Espera a que los inversores financien tus proyectos!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
            {transactions.map(tx => (
              <div
                key={tx.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--obsidian)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{tx.description}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(tx.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--emerald)', fontWeight: 600 }}>+${parseFloat(tx.amount).toFixed(2)}</p>
                  {parseFloat(tx.fee_amount) > 0 && (
                    <p style={{ color: 'var(--amber)', fontSize: '0.8rem' }}>
                      -${parseFloat(tx.fee_amount).toFixed(2)} comisión
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--blue)', fontWeight: 600 }}>
                    ${(parseFloat(tx.amount) - parseFloat(tx.fee_amount)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
