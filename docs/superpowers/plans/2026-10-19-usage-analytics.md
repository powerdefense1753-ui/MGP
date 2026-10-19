# Website usage analytics implementation plan

Goal: Add private moderator analytics to guide discovery and usability improvements.
Architecture: Allowlisted anonymous events are batched to the existing Vercel gateway. A secret-authenticated Supabase RPC validates, limits and deduplicates writes. Moderator-only RPC returns aggregates, never event-level visitor records.
Tech stack: React, Node/Vercel, Supabase Postgres; no new paid services.

- [ ] Test privacy validation, duplicate/rejected events, transport failure, funnel calculations and recommendation thresholds.
- [ ] Implement browser telemetry with opt-out/DNT, bounded buffers, non-blocking delivery, and no search text or message content.
- [ ] Add independent usage tables, retention, secret-gated ingestion and moderator-only aggregate RPCs.
- [ ] Add overview, daily activity, sources/devices, discovery funnel, category/game interest, errors and evidence-based suggestions to moderation.
- [ ] Instrument existing discovery and feedback handlers; verify no passwords, text, URLs with queries, or admin actions are tracked.
- [ ] Run all tests and browser checks. Apply SQL and register gateway secret hash; deploy gateway and frontend only when backend smoke checks succeed.

Constraints: Existing crawler work stays separate. Do not alter community moderation policies. Reporting timezone UTC, date ranges explicit, compare preceding equal period. Browser IDs are pseudonymous and reset after 30 days; counts are not people. Retain raw events up to 90 days. Historical unavailable data remains absent. No automatic product changes from recommendations.
