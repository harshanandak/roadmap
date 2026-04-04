import 'server-only'

import {
  escapeHtml,
  getEmailBaseUrl,
  getEmailFromAddress,
  renderEmailTemplate,
  sanitizeEmailSubject,
} from '@/lib/email/templates'
import { transporter } from '@/lib/email/transporter'

export interface ReviewLinkEmailPayload {
  email: string
  name?: string | null
  reviewToken: string
  workspaceName: string
  expiresAt?: string | null
}

export async function sendReviewLinkEmail(payload: ReviewLinkEmailPayload) {
  const baseUrl = getEmailBaseUrl()
  const reviewUrl = `${baseUrl}/review/${payload.reviewToken}`
  const recipient = escapeHtml(payload.name?.trim() || 'there')
  const workspaceName = escapeHtml(payload.workspaceName)
  const expiryHtml = payload.expiresAt
    ? `<p style="font-size: 14px; color: #666;">This link expires on ${escapeHtml(new Date(payload.expiresAt).toLocaleDateString())}.</p>`
    : ''

  return transporter.sendMail({
    from: getEmailFromAddress(),
    to: payload.email,
    subject: sanitizeEmailSubject(`Review request for ${payload.workspaceName}`),
    html: renderEmailTemplate({
      title: 'Review Request',
      actionLabel: 'Open Review',
      actionUrl: reviewUrl,
      bodyHtml: `
        <p>Hello ${recipient},</p>
        <p>You've been invited to review <strong>${workspaceName}</strong>.</p>
        ${expiryHtml}
      `,
      footerHtml: `<p>If you weren't expecting this review request, you can safely ignore this email.</p>`,
    }),
  })
}
