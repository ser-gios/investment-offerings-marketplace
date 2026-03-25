const axios = require('axios');

const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY not configured, skipping email');
      return false;
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1B1C20;">Recupera tu contraseña</h1>
          </div>
          
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Hemos recibido una solicitud para resetear tu contraseña. Si no fuiste tú, puedes ignorar este email.
          </p>
          
          <div style="background: #f9f9f9; border-left: 4px solid #FFD600; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Importante:</strong> Este link expira en 1 hora. Si no lo usas en ese tiempo, deberás solicitar un nuevo reset de contraseña.
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #FFD600 0%, #FF8C00 100%); color: #1B1C20; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Resetear Contraseña
            </a>
          </div>
          
          <p style="margin: 25px 0 0 0; color: #999; font-size: 13px; line-height: 1.6;">
            O copia y pega este enlace en tu navegador:
            <br/>
            <span style="word-break: break-all; color: #666;">${resetLink}</span>
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p style="margin: 0;">© 2026 Investment Market. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    `;

    // Llamar a la API REST de Brevo v3
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        email: 'noreply@investmentmarket.app',
        name: 'Investment Market'
      },
      to: [{ email }],
      subject: 'Recupera tu contraseña - Investment Market',
      htmlContent,
      replyTo: {
        email: 'support@investmentmarket.app'
      }
    }, {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      }
    });

    console.log(`✉️ Password reset email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('Email service error:', err.response?.data || err.message);
    return false;
  }
};

module.exports = { sendPasswordResetEmail };
