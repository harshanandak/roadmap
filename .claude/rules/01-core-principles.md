# Core Development Principles

## Package Manager: Bun ONLY
- ALWAYS use `bun` instead of `npm`/`npx`
- `bun install`, `bun run dev`, `bunx playwright`, etc.

## ID Format: Timestamp
- ALWAYS: `Date.now().toString()` 
- NEVER: UUID

## Database: Team Isolation
- ALL queries MUST filter by `team_id`
- ALL tables MUST have `team_id TEXT NOT NULL`
- RLS policies on EVERY table

## TypeScript: Strict
- NO `any` types
- NO `@ts-ignore` or `@ts-expect-error`
- Explicit error handling

## UI: shadcn/ui Only
- Import from `@/components/ui/*`
- NO custom CSS files
- Tailwind classes, mobile-first
