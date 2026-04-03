import 'server-only'

import { transporter } from '@/lib/email/transporter'

export interface TeamInvitationEmailPayload {
  email: string
  expiresAt: string
  invitationToken: string
  inviterEmail?: string | null
  inviterName?: string | null
  role: string
  teamName: string
}

export async function sendTeamInvitationEmail(payload: TeamInvitationEmailPayload) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/accept-invite?token=${payload.invitationToken}`
  const inviterDisplay = payload.inviterName || payload.inviterEmail || 'A team admin'

  return transporter.sendMail({
    from: `"Product Lifecycle Platform" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: payload.email,
    subject: `You've been invited to join ${payload.teamName}`,
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
            .info-box { background: #f8f9fa; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team Invitation</h1>
            </div>
            <p>Hello!</p>
            <p><strong>${inviterDisplay}</strong> has invited you to join <strong>${payload.teamName}</strong>.</p>
            <div class="info-box">
              <strong>Role:</strong> ${payload.role === 'admin' ? 'Admin' : 'Member'}<br>
              ${payload.role === 'admin'
                ? 'You will be able to manage team members and settings.'
                : 'You will be able to view and edit workspaces.'}
            </div>
            <div class="button-container">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this URL into your browser:<br>
              <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all;">${invitationUrl}</a>
            </p>
            <p style="font-size: 14px; color: #666;">
              This invitation will expire on ${new Date(payload.expiresAt).toLocaleDateString()}.
            </p>
            <div class="footer">
              <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
