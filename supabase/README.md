## Canonical Supabase Root

This directory is the canonical source of truth for the product database.

Rules:
- Run Supabase CLI commands from the repository root against this `supabase/` directory.
- Add all new migrations here.
- Reconcile legacy migrations from `next-app/supabase/` into this tree before deleting or archiving them.
- Do not introduce schema or RLS changes from app routes or ad hoc SQL pages.

Why:
- The database is a platform concern, not a subfolder concern of `next-app`.
- Keeping one authoritative migration history prevents drift between environments and contributors.
