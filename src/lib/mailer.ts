import 'server-only'

export type MailResult = { sent: boolean; provider: boolean }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const mailProviderConfigured = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM)

async function sendMail(to: string, subject: string, text: string, html: string): Promise<MailResult> {
  if (!mailProviderConfigured()) return { sent: false, provider: false }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text, html }),
      cache: 'no-store',
    })
    if (!res.ok) console.error('[mailer] el proveedor respondió', res.status)
    return { sent: res.ok, provider: true }
  } catch {
    console.error('[mailer] error de red al enviar correo')
    return { sent: false, provider: true }
  }
}

export async function sendRecoveryCode(to: string, name: string, code: string, minutes: number): Promise<MailResult> {
  const subject = 'Tu código de recuperación · Mundo Pinturas Diana'
  const text = `Hola ${name},\n\nTu código para restablecer la contraseña es: ${code}\n\nVence en ${minutes} minutos. Si no lo solicitaste, ignora este mensaje: tu contraseña no cambiará.\n\nMundo Pinturas Diana`
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f6f1fa;font-family:Arial,Helvetica,sans-serif;color:#1f1830">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;border:2px solid #3b1f5e">
<tr><td style="background:#3b1f5e;padding:20px 28px;color:#fff;font-size:20px;font-weight:800">Mundo Pinturas Diana</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#e11d74;text-transform:uppercase">Recuperar contraseña</p>
<p style="margin:0 0 16px;font-size:16px">Hola ${esc(name)}, usa este código para crear una nueva contraseña:</p>
<p style="margin:0 0 16px;text-align:center;font-size:36px;font-weight:800;letter-spacing:10px;color:#3b1f5e;background:#f6f1fa;border-radius:12px;padding:16px">${esc(code)}</p>
<p style="margin:0;font-size:13px;color:#555">Vence en ${minutes} minutos. Si no lo solicitaste, ignora este mensaje: tu contraseña no cambiará.</p>
</td></tr></table></td></tr></table></body></html>`
  return sendMail(to, subject, text, html)
}
