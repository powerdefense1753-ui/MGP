# Community deployment

The website remains on GitHub Pages. Supabase provides the private database, Auth and the submission Edge Function. No service-role key may be placed in Vite variables or committed.

## Setup
1. Create a Supabase project in the owner's account. Apply `supabase/migrations/202610160001_community.sql` in SQL Editor.
2. Deploy `supabase/functions/submit-message/index.ts` as the `submit-message` Edge Function. Keep JWT verification on when using the legacy anon JWT key. Set `COMMUNITY_RATE_SALT` to a random secret in function secrets. Built-in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY stay server-side.
3. Create the moderator's Auth user through the dashboard invite flow. The owner sets their own password. Add that user's UUID to `public.community_moderators` using SQL Editor. Do not expose this operation to anonymous or ordinary authenticated users. Disable public user signups if they are not needed.
4. Set local build variables `VITE_COMMUNITY_URL=https://api.findcoolgame.com` and `VITE_COMMUNITY_ANON_KEY=LEGACY_ANON_JWT`. This is a public restricted client key, not a service key. Build only after the project is ready.
5. The moderation page is `https://findcoolgame.com/#moderation`. Access control is database RLS, not the URL. Session access tokens remain in memory and expire normally; reload requires login again.

## Validation before publication
- Anonymous comment POST returns 201 but is not publicly readable while pending.
- Approve it as moderator, verify it appears only for its game.
- Reject another message and verify it never becomes public.
- Feedback remains unreadable anonymously even if its status is approved.
- Direct anonymous table INSERT/PATCH and ordinary-user moderation must fail.
- A second submission within 60 seconds returns 429. Maximum 10/day per salted IP hash. Test trusted gateway IP headers on deployment; missing IP fails closed.
- Ensure UI retains input on failure and renders submitted HTML as plain text.
- Verify account logout and refresh revoke local access.

Comments require 3–2000 characters, optional nickname up to 40. Anonymous authors cannot edit or delete their submissions; moderators can reject previously approved content via Supabase table editor. First UI lists 50 approved comments/game, and 100 pending submissions per moderation batch. Feedback has no email field and no reply delivery. User content is never added to Google Analytics events. Salted IP hashes are stored for rate limits; no raw IP is stored in application tables. Platform logs have their own retention.

The UI has Chinese text for Chinese locales and English fallback otherwise. Replies, attachments, reactions and full forum functionality are outside this version.

## Provisioned deployment (2026-10-16)
Project: `zhgjbbvgjnyqthfiqdrc` (Find Cool Game Community, free tier, Singapore).
Migration applied; submit-message deployed with legacy JWT verification enabled. Moderator owner account created and associated.
Live console checks: submission 201; immediate repeat 429; moderator approval exposes the comment; anonymous pending/feedback visibility both zero; anonymous INSERT and status UPDATE privileges both false. Test comment archived as rejected.
Local production configuration is in ignored `.env.local`; only the public anon key is used in the browser.
Current-network limitation: both Node/PowerShell and Edge report connection reset for the project `supabase.co` endpoint, while the Supabase dashboard function tester succeeds. Direct visitor submission and moderator browser sign-in could not be verified from this network. Do not report these as fully verified.

## Connection repair gateway
2026-10-16 diagnosis: project DNS resolves to Cloudflare addresses; TCP/TLS handshake to project API resets before HTTP/authentication. Dashboard management and its function tester work. Node, Windows curl and Edge independently reproduce the reset. Exact network policy source is not proven.
Owner approved a free Vercel gateway at api.findcoolgame.com. Pending owner Vercel signup/terms and domain access.
Deploy `infrastructure/community-gateway` as a separate Vercel project (Other framework, no build step). Environment: SUPABASE_URL (fixed project URL), SUPABASE_ANON_KEY (public client key), COMMUNITY_GATEWAY_SECRET (random shared server-only HMAC key). No service-role key is required by the gateway. Set the same gateway secret in the Supabase function only after deploying its updated index.ts and gateway-identity.js. When that secret is set, unsigned submissions fail closed.
Gateway allows only existing community REST/Auth/function routes and methods. It retains end-user bearer tokens and relies on RLS. No request bodies, passwords or tokens are logged by application code; provider access logs remain subject to provider retention. Vercel overwrites X-Forwarded-For; the gateway signs that IP, timestamp and body digest. Backend accepts only valid signatures within 60 seconds, preserving per-client rate limits. No proxy trust in caller-provided identity headers.
Configure DNS using the actual Vercel domain verification instructions (do not guess record values); leave website apex unchanged. Verify TLS, CORS, signed submission 201/429, anonymous isolation and owner login from the affected network before switching VITE_COMMUNITY_URL. Do not claim the prepared gateway fixes connectivity until these live checks pass.


## Completed verification (2026-10-16)
Free Vercel Hobby project findcoolgame-community-api is active under pu-172b. api.findcoolgame.com has A 76.76.21.21 and valid HTTPS. Updated Supabase function and matching server-only signature secret are active. The website now builds against https://api.findcoolgame.com.
From the previously failing network: public comments GET 200, signed submission 201, immediate duplicate 429. Real website feedback submitted successfully; owner logged into /#moderation and loaded private feedback. A game comment was submitted, hidden while pending, approved through the owner UI, then rendered publicly as plain text including literal HTML tags. Exact test records were archived. 44 automated tests pass. Source repair commit f88e813, Pages release 11677fc451bbb858c1206ed73a1a0d8e6523840d. The original supabase.co route may remain unreachable directly; clients must use the verified API domain. No paid add-on was enabled.

## Website experience board (2026-10-16)
Public comments now describe the website experience, reached from the top navigation or #website-comments. The existing moderated comment storage uses reserved scope `game_id=website-experience`; the public query requires both this scope and approved status. No schema, credentials or RLS changes are needed. Historical game comments and private feedback are not converted into public website comments. Game detail forms are removed. Private feedback remains a separate dialog, and the moderator can approve site-experience comments or archive private feedback. Historical game comments can only be rejected in this UI.
Validation: 45 automated tests; local headless desktop/mobile checks cover public submission scope, private feedback scope, responsive layout and absence of a game-detail form. Live submission for the website scope returned 201 and remained absent from anonymous approved queries. Deployment uses the previously uploaded catalog snapshot rather than automatically publishing unrelated crawler changes.
