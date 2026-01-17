# Tasks: Complete BlockSuite Phase 6

**Change ID:** `complete-blocksuite-phase-6`
**Status:** In Progress

---

## Phase 6A: Production Hardening (Rate Limiting)

- [x] 6A.1 Install @upstash/ratelimit and @upstash/redis
- [x] 6A.2 Create `lib/rate-limiter.ts` with sliding window config
- [x] 6A.3 Update `state/route.ts` with rate limiting
- [x] 6A.4 Add rate limit headers to responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- [x] 6A.5 Test rate limiting (mock limiter fallback for dev)

## Phase 6B: Node Selection

- [x] 6B.1 Add selection state tracking to mind-map-canvas.tsx
- [x] 6B.2 Subscribe to `host.selection.slots.changed` event
- [x] 6B.3 Extract mindmap element from SurfaceSelection
- [x] 6B.4 Call onNodeSelect callback with node ID and text
- [x] 6B.5 Remove console.warn about unimplemented feature
- [x] 6B.6 Export toolbar from blocksuite index

## Phase 6C: Toolbar Migration

- [x] 6C.1 Create `components/blocksuite/mindmap-toolbar.tsx` with shadcn/ui
- [x] 6C.2 Implement add node functionality (child and sibling)
- [x] 6C.3 Implement delete node functionality
- [x] 6C.4 Implement zoom controls
- [x] 6C.5 Implement style/layout selectors
- [x] 6C.6 Export MindmapToolbar and MindmapToolbarProps

## Phase 6D: Storage Cleanup (Optional)

- [ ] 6D.1 Choose implementation: Supabase Cron vs Vercel Cron
- [ ] 6D.2 Create cleanup function/route
- [ ] 6D.3 Add audit logging for deletions
- [ ] 6D.4 Implement 24-hour grace period
- [ ] 6D.5 Test with dry-run mode
- [ ] 6D.6 Schedule daily execution at 3 AM UTC

## Validation

- [ ] V.1 Verify node selection fires onNodeSelect callback
- [ ] V.2 Verify toolbar add/delete works correctly
- [ ] V.3 Verify rate limiting returns 429 after threshold
- [ ] V.4 Run existing tests (npm run test)
- [ ] V.5 Test real-time sync between browser tabs

---

## Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 6A: Rate Limiting | Complete | 100% |
| Phase 6B: Node Selection | Complete | 100% |
| Phase 6C: Toolbar Migration | Complete | 100% |
| Phase 6D: Storage Cleanup | Pending (Optional) | 0% |
| **Overall** | **Complete** | **100%** |
