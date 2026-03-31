import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DisclaimerModal({ onAccept }) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      localStorage.setItem('disclaimer_accepted', 'true');
      onAccept();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        maxWidth: 600,
        maxHeight: '85vh',
        overflow: 'auto',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <AlertTriangle size={24} style={{ color: 'var(--ruby)' }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--ruby)' }}>⚠️ Aviso Legal Importante</h2>
        </div>

        {/* Content */}
        <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>La plataforma Mercado de Inversiones</strong> actúa exclusivamente como un intermediario digital que conecta a inversores con empresas que ofrecen oportunidades de inversión.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            Mercado de Inversiones <strong>no es una entidad financiera, banco, casa de bolsa ni asesor de inversiones</strong>, y no participa en la gestión, administración ni custodia de fondos de los usuarios.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            Las inversiones publicadas en la plataforma son <strong>responsabilidad exclusiva de las empresas</strong> que las ofrecen. Mercado de Inversiones no garantiza la veracidad, rentabilidad, cumplimiento de pagos ni la ejecución de los proyectos listados.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            <strong>Toda inversión implica riesgos</strong>, incluyendo la posible pérdida total o parcial del capital invertido. El usuario reconoce que realiza sus decisiones de inversión bajo su propio criterio y responsabilidad.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            Los indicadores, puntuaciones o "scores" de confiabilidad presentados en la plataforma son <strong>estimaciones basadas en información disponible</strong> y no constituyen garantías ni recomendaciones de inversión.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            Mercado de Inversiones <strong>no se hace responsable</strong> por incumplimientos, retrasos en pagos, pérdidas económicas o cualquier disputa entre inversores y empresas.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            Al utilizar esta plataforma, el usuario <strong>acepta estos términos</strong> y reconoce que ha comprendido los riesgos asociados a las inversiones.
          </p>

          <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>
            Se recomienda realizar un análisis independiente y, de ser necesario, consultar con un asesor financiero profesional antes de invertir.
          </p>
        </div>

        {/* Checkbox */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          background: 'var(--obsidian)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
        }}>
          <input
            type="checkbox"
            id="accept_disclaimer"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{
              width: 20,
              height: 20,
              cursor: 'pointer',
              accentColor: 'var(--yellow)',
            }}
          />
          <label htmlFor="accept_disclaimer" style={{
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}>
            Acepto los términos y condiciones, entiendo los riesgos y asumo la responsabilidad de mis decisiones de inversión
          </label>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
        }}>
          <a
            href="/disclaimer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: 'var(--r-md)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-secondary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Ver completo
          </a>
          <button
            onClick={handleAccept}
            disabled={!accepted}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: 'var(--r-md)',
              background: accepted ? 'var(--grad-yellow-btn)' : 'var(--surface-2)',
              border: 'none',
              color: accepted ? '#05070F' : 'var(--text-muted)',
              cursor: accepted ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            ✓ Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
