import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Disclaimer() {
  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link to="/marketplace" style={{ textDecoration: 'none', color: 'var(--yellow)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Volver al Marketplace
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={32} style={{ color: 'var(--ruby)' }} />
          <h1 style={{ fontSize: '2.5rem', color: 'var(--ruby)' }}>⚠️ Aviso Legal Importante</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Disclaimer - Términos y Condiciones de Uso de la Plataforma
        </p>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: '2.5rem', lineHeight: 1.8 }}>
        {/* Section 1 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>1. Naturaleza de la Plataforma</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            La plataforma <strong>Mercado de Inversiones</strong> actúa exclusivamente como un <strong>intermediario digital</strong> que conecta a inversores con empresas que ofrecen oportunidades de inversión.
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Esta plataforma facilita la conexión entre partes interesadas, pero <strong>no participa en la gestión, negociación, ejecución o supervisión directa de las inversiones</strong>.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>2. Lo Que No Es Mercado de Inversiones</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Mercado de Inversiones <strong>NO es</strong>:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Una entidad financiera regulada</li>
            <li>Un banco o institución de crédito</li>
            <li>Una casa de bolsa o agente de valores</li>
            <li>Un asesor financiero o de inversiones</li>
            <li>Un custodio o administrador de fondos</li>
            <li>Un gestor de cartera de inversiones</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)' }}>
            Por lo tanto, Mercado de Inversiones <strong>no participa en</strong> la custodia, administración, gestión o control de los fondos de los usuarios.
          </p>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>3. Responsabilidad de las Empresas Oferentes</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Todas las inversiones publicadas en la plataforma son <strong>responsabilidad exclusiva de las empresas que las ofrecen</strong>.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Mercado de Inversiones <strong>NO garantiza</strong>:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>La veracidad de la información publicada</li>
            <li>La existencia real o viabilidad de los proyectos</li>
            <li>Los retornos o intereses prometidos</li>
            <li>El cumplimiento de pagos por parte de las empresas</li>
            <li>La ejecución exitosa de los proyectos</li>
            <li>La solvencia o credibilidad de las empresas</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>4. Riesgos de Inversión</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <strong>Toda inversión implica riesgos</strong>, incluyendo, pero no limitado a:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Pérdida de capital:</strong> Posible pérdida total o parcial del monto invertido</li>
            <li><strong>Riesgo de incumplimiento:</strong> La empresa puede no pagar los intereses o devolver el capital</li>
            <li><strong>Riesgo de liquidez:</strong> Es posible que no puedas recuperar tu dinero cuando lo necesites</li>
            <li><strong>Riesgo de proyecto:</strong> El proyecto puede fracasar o no cumplir sus objetivos</li>
            <li><strong>Riesgo de mercado:</strong> Fluctuaciones económicas pueden afectar los retornos</li>
            <li><strong>Riesgo sistémico:</strong> Crisis económicas o financieras pueden impactar negativamente</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)' }}>
            El usuario <strong>reconoce y acepta</strong> que realiza sus decisiones de inversión bajo su propio criterio y <strong>asume la responsabilidad total por las consecuencias</strong>.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>5. Limitaciones de Responsabilidad</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Mercado de Inversiones <strong>NO se hace responsable por</strong>:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Incumplimiento de pagos por parte de las empresas</li>
            <li>Retrasos en pagos de intereses o devolución de capital</li>
            <li>Pérdidas económicas sufridas por los inversores</li>
            <li>Fraude o engaño por parte de las empresas oferentes</li>
            <li>Disputas, conflictos o litigios entre inversores y empresas</li>
            <li>Errores o inexactitudes en la información publicada</li>
            <li>Cambios en la rentabilidad o términos de inversión</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)' }}>
            <strong>En ningún caso</strong> Mercado de Inversiones será responsable por daños indirectos, consecuentes o especiales derivados del uso de la plataforma.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>6. Información sobre Confiabilidad ("Scores")</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Los indicadores, puntuaciones o "scores" de confiabilidad mostrados en la plataforma son <strong>estimaciones basadas en información disponible</strong> proporcionada por otros usuarios y datos públicos.
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Estos scores <strong>NO constituyen</strong> garantías ni recomendaciones de inversión. Son meramente informativos y no deben ser el único criterio para tomar decisiones de inversión.
          </p>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>7. Diligencia Debida del Usuario</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Cada usuario es responsable de:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Revisar cuidadosamente toda la información disponible sobre un proyecto</li>
            <li>Realizar su propio análisis y evaluación de riesgos</li>
            <li>Invertir solo lo que puede permitirse perder</li>
            <li>Diversificar sus inversiones</li>
            <li>Mantener registros de todas sus transacciones</li>
            <li>Reportar cualquier actividad sospechosa o fraudulenta</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>8. Recomendación de Asesoramiento Profesional</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <strong>Se recomienda fuertemente</strong> que:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Realices un análisis independiente antes de invertir</li>
            <li>Consultes con un asesor financiero profesional y licenciado</li>
            <li>Verifiques la información con fuentes externas independientes</li>
            <li>Consideres tu situación financiera y capacidad de riesgo personal</li>
            <li>No inviertas basándote únicamente en información de esta plataforma</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)' }}>
            Mercado de Inversiones <strong>no proporciona asesoramiento financiero</strong> ni recomendaciones de inversión.
          </p>
        </section>

        {/* Section 9 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>9. Aceptación de Términos</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Al acceder y utilizar la plataforma Mercado de Inversiones, el usuario <strong>automáticamente acepta y reconoce</strong>:
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Haber leído y comprendido este aviso legal</li>
            <li>Haber entendido todos los riesgos asociados a las inversiones</li>
            <li>Asumir la responsabilidad completa por sus decisiones de inversión</li>
            <li>No responsabilizar a Mercado de Inversiones por pérdidas económicas</li>
            <li>Cumplir con todas las leyes y regulaciones aplicables</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--yellow)' }}>10. Cambios en el Aviso Legal</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Mercado de Inversiones se reserva el derecho de modificar este aviso legal en cualquier momento sin previo aviso. Los cambios serán efectivos inmediatamente después de su publicación.
          </p>
        </section>

        {/* Final Notice */}
        <div style={{
          background: 'var(--obsidian)',
          border: '2px solid var(--ruby)',
          borderRadius: 'var(--r-md)',
          padding: '1.5rem',
          marginTop: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--ruby)', fontSize: '0.95rem', fontWeight: 600 }}>
            ⚠️ Este documento es un aviso legal vinculante. Al continuar usando la plataforma, confirmas que aceptas todos estos términos y condiciones.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
