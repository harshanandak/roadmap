import { describe, expect, it } from 'vitest'

import { escapeHtml, renderEmailTemplate, sanitizeEmailSubject } from './templates'

describe('escapeHtml', () => {
  it('escapes special HTML characters', () => {
    expect(escapeHtml(`R&D <Eng> "team"`)).toBe('R&amp;D &lt;Eng&gt; &quot;team&quot;')
  })
})

describe('renderEmailTemplate', () => {
  it('escapes title, action label, and action URL', () => {
    const html = renderEmailTemplate({
      actionLabel: `Open <Invite>`,
      actionUrl: 'https://example.com/?q=<test>&name="demo"',
      bodyHtml: '<p>Safe body</p>',
      footerHtml: '<p>Safe footer</p>',
      title: 'Team <Invite>',
    })

    expect(html).toContain('<h1>Team &lt;Invite&gt;</h1>')
    expect(html).toContain('Open &lt;Invite&gt;')
    expect(html).toContain('https://example.com/?q=&lt;test&gt;&amp;name=&quot;demo&quot;')
    expect(html).not.toContain('<h1>Team <Invite></h1>')
  })
})

describe('sanitizeEmailSubject', () => {
  it('removes line breaks from dynamic subject values', () => {
    expect(sanitizeEmailSubject('Review request\r\nfor Workspace')).toBe(
      'Review request for Workspace'
    )
  })
})
