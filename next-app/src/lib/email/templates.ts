import 'server-only'

interface EmailTemplateOptions {
  actionLabel: string
  actionUrl: string
  bodyHtml: string
  footerHtml: string
  title: string
}

export function getEmailBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function getEmailFromAddress() {
  return `"Product Lifecycle Platform" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderEmailTemplate({
  actionLabel,
  actionUrl,
  bodyHtml,
  footerHtml,
  title,
}: Readonly<EmailTemplateOptions>) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
          .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .button-container { text-align: center; margin: 30px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          ${bodyHtml}
          <div class="button-container">
            <a href="${actionUrl}" class="button">${actionLabel}</a>
          </div>
          <p style="font-size: 14px; color: #666;">
            Or copy and paste this URL into your browser:<br>
            <a href="${actionUrl}" style="color: #2563eb; word-break: break-all;">${actionUrl}</a>
          </p>
          <div class="footer">
            ${footerHtml}
          </div>
        </div>
      </body>
    </html>
  `
}
