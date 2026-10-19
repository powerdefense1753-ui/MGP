# Usage analytics

Admin: open /#moderation and sign in with the existing moderator account. The usage panel shares the in-memory session; it does not persist passwords or bearer tokens.

Activation order:
1. Run work/activate-usage-analytics.sql in the existing Supabase SQL editor. This creates only independent usage tables/functions and registers a SHA-256 digest of the existing gateway secret. The raw secret never enters the SQL file. The transaction rolls back on SQL errors.
2. Deploy the updated infrastructure/community-gateway to the existing free Vercel project. No new secret or paid service is required.
3. Verify anonymous summary access denied; ingest an explicit test event, verify duplicate ignored, rate limited requests rejected, and the moderator summary loads. Exclude/archive only exact test IDs from reports.
4. Build frontend with VITE_USAGE_ENABLED=true only after backend validation. Preserve the last published game catalog snapshot.

Events: visit, user-driven discovery, game_open (details), store_click, save, feedback_open, submit_attempt/success/failure, media_error. Queries, messages, email, passwords, exact URLs, IP addresses and full user agents are not stored in usage events. Source is direct/search/social/referral only. Daily keyed IP hashes are used only for ingestion limits. Browser IDs expire after 30 days; sessions expire after 30 minutes of inactivity. DNT/GPC and the visitor's opt-out prevent collection. No replay, keystroke capture or automatic site modifications.

Counts cover observed browser activity, not people or installs. Bot and self traffic can remain. New instrumentation cannot recreate historical search/filter data. UTC date buckets are used; the latest day is incomplete. Compare previous equal-length windows cautiously. Recommendations require 30 sessions and issue-specific minimum sample sizes. Missing backend data is an error state, not a zero.

Raw events older than 90 days and rate-limit rows older than two days are cleaned during successful ingestion; inactive projects retain old rows until ingestion resumes. Summary access requires community_moderators membership. No raw-event reading grants are given to visitors or authenticated accounts.
