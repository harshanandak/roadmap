# Testing Documentation

> Purpose: Quality assurance, E2E testing guides, and security audit reports
> Last Updated: 2026-04-03

[Back to Docs Index](../INDEX.md) | [Back to Root](../../README.md)

---

## Documents

| Document | Purpose |
| -------- | ------- |
| [E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md) | Playwright E2E testing setup and patterns |
| [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) | Security audit findings and recommendations |

---

## Quick Reference

### Running Tests

```bash
# Run all E2E tests
cd next-app && bun run test:e2e

# Run a specific test file
cd next-app && bunx playwright test e2e/01-auth.spec.ts

# Run with UI mode
cd next-app && bun run test:e2e:ui
```

### Test Configuration

- Framework: Playwright
- Browser: Chromium (CI), all browsers (local)
- Parallel: Configured in `next-app/playwright.config.ts`

---

[Back to Docs Index](../INDEX.md) | [Back to Root](../../README.md)
