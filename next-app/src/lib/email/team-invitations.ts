import 'server-only'

import {
  escapeHtml,
  getEmailBaseUrl,
  getEmailFromAddress,
  renderEmailTemplate,
} from '@/lib/email/templates'
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
  const baseUrl = getEmailBaseUrl()
  const invitationUrl = `${baseUrl}/accept-invite?token=${payload.invitationToken}`
  const inviterDisplay = escapeHtml(payload.inviterName || payload.inviterEmail || 'A team admin')
  const roleLabel = escapeHtml(payload.role === 'admin' ? 'Admin' : 'Member')
  const roleDescription =
    payload.role === 'admin'
      ? escapeHtml('You will be able to manage team members and settings.')
      : escapeHtml('You will be able to view and edit workspaces.')
  const teamName = escapeHtml(payload.teamName)

  return transporter.sendMail({
    from: getEmailFromAddress(),
    to: payload.email,
    subject: `You've been invited to join ${payload.teamName}`,
    html: renderEmailTemplate({
      title: 'Team Invitation',
      actionLabel: 'Accept Invitation',
      actionUrl: invitationUrl,
      bodyHtml: `
        <p>Hello!</p>
        <p><strong>${inviterDisplay}</strong> has invited you to join <strong>${teamName}</strong>.</p>
        <div style="background: #f8f9fa; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <strong>Role:</strong> ${roleLabel}<br>
          ${roleDescription}
        </div>
        <p style="font-size: 14px; color: #666;">
          This invitation will expire on ${escapeHtml(new Date(payload.expiresAt).toLocaleDateString())}.
        </p>
      `,
      footerHtml: `<p>If you weren't expecting this invitation, you can safely ignore this email.</p>`,
    }),
  })
}
