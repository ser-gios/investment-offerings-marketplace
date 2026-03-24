export default function StatCard({ label, value, sub, color = 'var(--yellow)', icon: Icon, trend }) {
  return (
    <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 90, height: 90, borderRadius: '50%',
        background: color, opacity: 0.07, filter: 'blur(24px)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem', fontWeight: 600 }}>
            {label}
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 500, color, lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: trend >= 0 ? 'var(--emerald)' : 'var(--ruby)', fontWeight: 600 }}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-lg)',
            background: `${color}18`, border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={20} color={color} />
          </div>
        )}
      </div>
    </div>
  );
}
