import 'server-only'

import { transporter } from '@/lib/email/transporter'

export interface ReviewLinkEmailPayload {
  email: string
  name?: string | null
  reviewToken: string
  workspaceName: string
  expiresAt?: string | null
}

export async function sendReviewLinkEmail(payload: ReviewLinkEmailPayload) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const reviewUrl = `${baseUrl}/review/${payload.reviewToken}`
  const recipient = payload.name?.trim() || 'there'

  return transporter.sendMail({
    from: `"Product Lifecycle Platform" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: payload.email,
    subject: `Review request for ${payload.workspaceName}`,
    html: `
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
              <h1>Review Request</h1>
            </div>
            <p>Hello ${recipient},</p>
            <p>You've been invited to review <strong>${payload.workspaceName}</strong>.</p>
            <div class="button-container">
              <a href="${reviewUrl}" class="button">Open Review</a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this URL into your browser:<br>
              <a href="${reviewUrl}" style="color: #2563eb; word-break: break-all;">${reviewUrl}</a>
            </p>
            ${payload.expiresAt ? `<p style="font-size: 14px; color: #666;">This link expires on ${new Date(payload.expiresAt).toLocaleDateString()}.</p>` : ''}
            <div class="footer">
              <p>If you weren't expecting this review request, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
