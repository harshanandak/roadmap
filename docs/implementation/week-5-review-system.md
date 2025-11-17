# **WEEK 5: External Review System**

**Last Updated:** 2025-11-14
**Status:** ❌ Not Started

[← Previous: Week 4](week-4-dependencies.md) | [Back to Plan](README.md) | [Next: Week 6 →](week-6-timeline-execution.md)

---

## Goal
Invite-based, public links, embedded forms

---

## Module Overview

### Review & Feedback Module 👥 **[PRO TIER ONLY]**

**Active By Default:** Review, Testing phases

**Purpose:** Collect feedback from stakeholders, users, investors

---

## Tasks

### Day 1-2: Review Link Generator
- [ ] "Share for Review" modal: `components/review/review-link-generator.tsx`
- [ ] Three tabs:
  - [ ] Invite specific people (email input)
  - [ ] Generate public link (copy button)
  - [ ] Get embed code (iframe snippet)
- [ ] Settings checkboxes:
  - [ ] Allow comments
  - [ ] Allow voting
  - [ ] Require email
  - [ ] Expiration date picker

### Day 3-4: Email Invitations
- [ ] Resend API integration
- [ ] Email template (HTML):
  - [ ] Subject: "You've been invited to review features"
  - [ ] Body: Workspace name, feature count, CTA button
  - [ ] Link: `https://app.platform.com/public/review/[token]`
- [ ] Send invitations (batch)
- [ ] Track invitation status (sent, opened, submitted)

### Day 5-7: External Review Page
- [ ] Public review page: `/app/public/review/[token]/page.tsx`
- [ ] No authentication required
- [ ] Load review link by token
- [ ] Display features (cards)
- [ ] Feedback form per feature:
  - [ ] Rating (1-5 stars or thumbs)
  - [ ] Comment (textarea)
  - [ ] Custom questions (from settings)
  - [ ] Attachments (file upload to Supabase Storage)
- [ ] Submit feedback (insert to `feedback` table)
- [ ] Thank you page

### Day 8-9: Iframe Embed
- [ ] Generate embed code:
  ```html
  <iframe
    src="https://app.platform.com/public/review/[token]/embed"
    width="100%"
    height="600px"
    frameborder="0"
  ></iframe>
  ```
- [ ] Embed view (`/app/public/review/[token]/embed/page.tsx`)
- [ ] Minimal UI (fits in iframe)
- [ ] Post message API (communicate with parent window)

### Day 10-12: Review Dashboard
- [ ] Review dashboard: `/app/(dashboard)/review/page.tsx`
- [ ] List all feedback (table view)
- [ ] Filters:
  - [ ] By feature
  - [ ] By rating
  - [ ] By status (new, reviewed, implemented, rejected)
  - [ ] By date
- [ ] Update feedback status (dropdown)
- [ ] View attachments (modal)

### Day 13-14: AI Feedback Summary
- [ ] "Summarize feedback" button
- [ ] Call Claude Haiku with all feedback for a feature
- [ ] Generate:
  - [ ] Common themes (e.g., "15 users want social login")
  - [ ] Sentiment breakdown (positive/negative/neutral %)
  - [ ] Action items (prioritized list)
- [ ] Display in summary card
- [ ] Save summary to database (cache)

---

## Features

### Three Sharing Methods:

**A) Invite-Based Review**
- Send email invites with unique access tokens
- Reviewers click link → See features → Submit feedback
- Track by email address
- Revoke access anytime

**B) Public Review Link**
- Generate shareable URL (no login required)
- Anyone with link can review
- Optional: Require email to submit feedback
- Set expiration date

**C) Embedded Iframe Form**
- Get embed code: `<iframe src="..." />`
- Embed feedback form on website or app
- Collects feedback seamlessly in your existing flow

### Feedback Form (Customizable):
- **Rating** - 1-5 stars or thumbs up/down
- **Text Feedback** - Open-ended comments
- **Multiple Choice** - Custom questions per feature
- **Attachments** - Screenshots, videos, files
- **Voting** - Upvote/downvote (priority)

### Review Dashboard (Team View):
- All feedback in one place
- Status tracking: New → Reviewed → Implemented → Rejected
- Filter by feature, reviewer, rating, date
- Sort by priority (most requested)

### AI Summarization:
- Analyzes all feedback automatically
- **Common Themes** - "15 reviewers want social login"
- **Sentiment Analysis** - Positive/Negative/Neutral breakdown
- **Action Items** - "3 users reported privacy concerns" (prioritized by frequency)

---

## Deliverables

✅ Three sharing methods (invite, public, iframe)
✅ Email invitations sent via Resend
✅ External review page (no login)
✅ Feedback form with ratings and comments
✅ Review dashboard (team view)
✅ AI-powered feedback summarization

---

## Testing

- [ ] Create review link for 5 features
- [ ] Send invite to 2 email addresses
- [ ] Open public link in incognito window
- [ ] Submit feedback with 5-star rating
- [ ] Upload screenshot attachment
- [ ] View feedback in dashboard
- [ ] Run AI summary
- [ ] Verify common themes extracted

---

[← Previous: Week 4](week-4-dependencies.md) | [Back to Plan](README.md) | [Next: Week 6 →](week-6-timeline-execution.md)
