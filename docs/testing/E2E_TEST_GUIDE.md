# E2E Testing Guide

**Last Updated**: 2026-04-03  
**Status**: Active  
**Framework**: Playwright with TypeScript

---

## Quick Start

```bash
cd next-app
bun install --frozen-lockfile
bunx playwright install
```

Run the main workflows:

```bash
bun run test:e2e
bun run test:e2e:ui
bun run test:e2e:headed
bun run test:e2e:debug
```

Useful targeted runs:

```bash
bunx playwright test e2e/01-auth.spec.ts
bunx playwright test e2e/01-auth.spec.ts -g "should display login page"
bun run test:e2e:chrome
bun run test:e2e:single
```

Reports:

```bash
bun run test:report
bun run test:trace
```

---

## Project Layout

```text
next-app/
├── e2e/                  # End-to-end specs
├── tests/                # Helpers, fixtures, and database utilities
├── playwright.config.ts  # Playwright configuration
├── .env.test             # Test environment values
└── package.json          # Bun scripts
```

---

## CI Notes

The repo CI uses Bun throughout:

```bash
bun install --frozen-lockfile
bunx playwright install --with-deps chromium
bun run test:e2e
```

If a test fails only in CI, reproduce locally with:

```bash
cd next-app
CI=true bun run test:e2e
```

---

## Debugging

Preferred options:

```bash
bun run test:e2e:ui
bun run test:e2e:debug
bun run test:e2e:headed
```

Artifacts:

- `next-app/test-results/`
- `next-app/playwright-report/`

---

## Current Conventions

- Use Bun commands, never `npm` or `npx`, for this repo.
- Keep tests isolated with unique timestamp-based data.
- Prefer explicit waits over arbitrary timeouts.
- Run a single-worker pass when debugging flaky behavior.

---

## References

- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Debugging](https://playwright.dev/docs/debug)
