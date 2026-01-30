# Git & Development Workflow

## Branch Naming
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code restructuring
- `test/description` - Test additions

## Commit Format
```
<type>: <short description>

[Optional body explaining WHY]
```
Types: feat, fix, docs, refactor, test, chore

## PR Protocol
1. Create branch from main
2. Implement with atomic commits
3. Self-review diff on GitHub
4. WAIT for review before merge
5. Squash merge to main

## Pre-Commit Checklist
- [ ] No `any` types
- [ ] `team_id` filter on all queries
- [ ] RLS policies if new table
- [ ] Mobile-first responsive
- [ ] No custom CSS files
