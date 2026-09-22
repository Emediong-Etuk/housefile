# Hackathon log

- **Project:** Housefile
- **Event:** Convex All Gas Hackathon
- **What it does:** Gives a short-term-rental property a memory — imports a listing, lets the host add the private facts guests actually ask about, and answers guest questions from that property file, only citing what it truly knows and learning from the host's corrections.
- **Live app:** https://fine-hornet-3.convex.site
- **Repo:** https://github.com/Emediong-Etuk/housefile
- **Frontend:** Convex static hosting
- **Convex deployment:** https://fine-hornet-3.convex.cloud (production); https://nautical-oyster-722.convex.cloud (dev)
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema (listings, faqs, stays, drafts, opsMessages, agentmailInboxes) with indexes, queries, mutations, actions, an HTTP action webhook (`convex/http.ts`), scheduled functions (`ctx.scheduler.runAfter`), typed env vars (`convex/convex.config.ts`), realtime `useQuery` on the frontend
- **Auth:** none
- **AI models:** gpt-4o-mini (default, configurable via `OPENAI_MODEL`; called directly via the OpenAI API). Confirmed live-reachable, but every call is currently rejected with `insufficient_quota` — the OpenAI account has no billing/credits.
- **Started:** 2026-09-19T18:49:14Z
- **Last updated:** 2026-09-21T21:33:55Z

## Log

### 2026-09-19 - 4a9dc06
Repository initialized (Next.js/TypeScript scaffold).

### 2026-09-19 - f8c46ad
Built the Tessera Clubs MVP: club creation/join flow, a club dashboard, and a
savings comparison page for pooled vs. solo T-Token buys. Added the Solana
wallet provider wiring, Jupiter quote helpers, and the pooled-buy savings math
with its own test suite (`src/lib/savings.ts`, `src/lib/jupiter.ts`,
`src/lib/solana.ts`, `src/app/clubs/[code]/page.tsx`,
`src/lib/__tests__/savings.test.ts`).

### 2026-09-19 - 3f3e512
Added a public, read-only club page so a club's status can be shared without
requiring the viewer to connect a wallet, and verified the full flow in a
real browser (`src/app/clubs/[code]/public/page.tsx`).

### 2026-09-19 - c9f02a8
Switched the database from the initial setup to Postgres and deployed the app
live to Render (new Prisma migration, `package.json`, `.npmrc`,
`prisma/schema.prisma`).

### 2026-09-19 - 83246d9
Surfaced the club's on-chain wallet SOL balance on the club dashboard
(`src/lib/solana.ts`, `src/app/clubs/[code]/page.tsx`).

### 2026-09-19 - 3e8241a
Added a live T-Token price grid to the landing page with automatic retry on
failed price fetches (`src/components/TokenPriceGrid.tsx`).

### 2026-09-19 - 1aacebf
Fixed slow-feeling navigation and added a back link on every page for
smoother browsing (`src/components/BackLink.tsx`,
`src/components/NavLink.tsx`, `src/components/SiteHeader.tsx`).

### 2026-09-21 - working tree
Repurposed this repo for the Convex All Gas Hackathon as **Housefile**, a
property-knowledge layer for solo short-term-rental hosts: a listing is
imported (Firecrawl + OpenAI) into a per-property file, guest questions are
answered only from facts the file actually contains (grounded, cited, no
invented door codes or policies), and a host's answer to a flagged question
teaches the file for next time. Scope for the hackathon build is Import →
Complete → Create stay → Ask → Learn, with AgentMail as the operations
inbox and analytics (coverage %, question debt) reduced to a demo-only
stub. The prior Tessera Clubs (Solana T-Token club-buying) code and its
Render deployment remain in the repo but are no longer the active build.

### 2026-09-21 - working tree
Installed the `convex` package and added `convex/schema.ts` defining the
four core tables: `listings` (the property file: seed facts, private
facts, learned FAQs, readiness), `stays` (per-guest stay with door-code/
parking/wifi overrides and a shareable slug), `drafts` (a guest question,
its grounded reply with citations, confidence, and flag/approve status),
and `opsMessages` (AgentMail inbound/outbound log). Indexed by host,
listing, stay, slug, and status for every read path the app will need.
Type-checks cleanly (`tsc --noEmit`). Not yet linked to a live Convex
deployment — `npx convex dev` needs an interactive browser login this
session can't complete.

### 2026-09-21 - working tree
Moved `faqs` out of `listings` into its own table with a `by_listing`
index (an unbounded array field on a document is a Convex anti-pattern),
added typed env vars for `OPENAI_API_KEY`/`OPENAI_MODEL`/
`FIRECRAWL_API_KEY` (`convex/convex.config.ts`), and started a local
anonymous Convex dev deployment (`CONVEX_AGENT_MODE=anonymous`) so the
schema could actually push and codegen, since a real login still needs
the host. Wrote and pushed the full Import → Complete → Create stay →
Ask → Learn backend:
- `convex/listings.ts` — create from import, per-host list, private-facts
  completion with live readiness tracking, apply a learned fact.
- `convex/faqs.ts`, `convex/stays.ts` — FAQ storage; stay creation with a
  unique shareable slug and per-stay door-code/parking/wifi overrides.
- `convex/importListing.ts` (action) — Firecrawl scrape → OpenAI
  extraction → `listings.createFromImport`.
- `convex/answerQuestion.ts` (action) — grounds a guest question in the
  listing's seed/private facts/stay overrides/learned FAQs; enforces
  "no source, no sendable answer" by flagging instead of guessing.
- `convex/learn.ts` (action) + `drafts.approveLearnedPatch` — turns a
  host's freeform answer to a flagged question into a proposed fact, and
  on approval writes it into the listing and logs it as a learned FAQ.

Verified against the local dev backend end-to-end with `npx convex run`
(bypassing the two AI calls, which need `OPENAI_API_KEY`/
`FIRECRAWL_API_KEY` the host hasn't supplied yet): created a listing,
completed its private facts and watched readiness flip to ready, created
a stay with a working slug lookup, filed a flagged question, proposed and
approved a learned patch, and confirmed the fact landed in both the
listing and the FAQ log. Whole project type-checks clean.

### 2026-09-21 - working tree
Built the frontend: `/host` (paste-a-listing import form + property
list), `/host/[listingId]` (complete the required private facts with
live readiness, create stays with per-stay door-code/parking/wifi
overrides and a copyable link, an inbox to paste a guest question and
approve/edit/discard the grounded draft, and a "teach Housefile" flow for
flagged questions), and the public `/stays/[slug]` guest page. Gave
Housefile its own chrome (`AppChrome`) separate from the existing Tessera
Clubs wallet UI so the two products don't bleed into each other in the
same Next.js app, and wired a `ConvexClientProvider` at the root. No
accounts yet — a random id in `localStorage` (`src/lib/hostId.ts`) scopes
a browser to its own properties until real auth is added.

Verified in a real headless-Chromium session against the running dev
servers, not just `tsc`: `/host`'s import form submitted a URL and
surfaced the expected `FIRECRAWL_API_KEY is not set` error cleanly
instead of crashing; `/stays/oak-street-apartment-maya` rendered the
guest page end to end from real Convex data — stay-specific door code
and parking override, listing wifi, the quirk, and the "hair dryer"
fact and FAQ entry from the earlier learn-loop test — with nothing
invented for facts that weren't set. Whole project still type-checks
clean.

### 2026-09-21 - working tree
Added the thin AgentMail path: `convex/agentmail.ts` (`provisionInbox`
creates a dedicated inbox per listing plus a webhook scoped to it;
`sendApprovedReply` sends an approved draft back through AgentMail,
threaded to the original message), `convex/http.ts` (the webhook
receiver, verified against real AgentMail API docs pulled live —
`docs.agentmail.to/llms.txt` and the API reference pages — rather than
guessed from memory; the reference pages caught a real mistake, the
`/v0` path prefix the quickstart snippet omits), and
`convex/lib/svix.ts` (hand-rolled Svix signature verification via Web
Crypto, since the runtime is V8 not Node — no `svix` package). New
`agentmailInboxes` table keeps the webhook secret out of any public
query; a public `getAddressByListing` exposes only the address. Added
`convex/opsMessages.ts` (inbound/outbound log) and a best-effort
stay-by-guest-email match so an inbound email can ground a reply in
that guest's stay overrides. Frontend: an "Email inbox" section on
`/host/[listingId]` to provision the address, and drafts with
`channel: "email"` now show "Approve & send" (calls
`agentmail.sendApprovedReply`) instead of the plain approve mutation.

Verified what's verifiable without a real API key or a public URL:
`tsc` clean project-wide (this surfaced and fixed several
Convex-generated-API circularity errors — same-file type annotations
weren't enough once `http.ts` closed a reference cycle through
`_generated/api`); `provisionInbox` fails with the intended clear
`AGENTMAIL_API_KEY is not set` error rather than crashing, confirmed
both via `npx convex run` and live in the browser on
`/host/[listingId]`; `env.CONVEX_SITE_URL` confirmed populated (so the
webhook URL `provisionInbox` registers will resolve correctly once
deployed); and the Svix verification logic itself independently
tested against 5 cases (valid signature, tampered body, wrong secret,
expired timestamp, multi-signature header) — all passed against the
actual shipped `svix.ts`, not a copy. What's *not* verified: an actual
signed webhook delivery from AgentMail, since that needs a real API
key and a public HTTPS URL neither of which this environment has.

Deliberately not built (see PRD's own "Nice-to-Have"/"Explicitly Out of
Scope" sections): coverage-% and question-debt analytics, cleaner
workflows, and anything needing Airbnb/Vrbo OAuth or auto-send. The
Import → Complete → Create stay → Ask → Learn loop plus a real (if
untested-live) AgentMail path is the full built scope for this
hackathon window.

### 2026-09-21 - working tree
Logged into Convex for real (device-code flow — no local browser
needed) and provisioned an actual cloud project and dev deployment:
`emedionggregory12:housefile:dev`, live at
`https://nautical-oyster-722.convex.cloud` /
`https://nautical-oyster-722.convex.site`. Pushed the full schema and
every function to it — this repo is no longer running on the throwaway
local anonymous backend. Removed the disposable local `.convex/`
backend state and its stale `.env.local` once the real one replaced it.
`OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, and `AGENTMAIL_API_KEY` are still
unset on this deployment — that, deploying the frontend to
`convex.site`, and a live end-to-end test are what's left before
submission.

### 2026-09-21 - working tree
Moved the project to its own repository (this one) and trimmed it down
to just Housefile: dropped the prior Tessera Clubs code (Solana
wallet UI, Prisma/Postgres schema, its API routes) and the dependencies
that came with it (`@solana/*`, `prisma`) — 398 packages and 0
`npm audit` findings now, down from 1,346 and 62. Simplified the root
layout to a single Convex-backed shell (no more dual-chrome switching
between two products) and added a `/` → `/host` redirect. Rewrote
`README.md` for Housefile specifically. Re-linked to the same Convex
deployment (`nautical-oyster-722`, unchanged) from the new location —
`npx convex dev --once` pushed cleanly, `tsc --noEmit` is clean, and
`/` and `/host` were confirmed rendering correctly in a real browser
against the real deployment.

Correction to the previous entry: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`,
and `AGENTMAIL_API_KEY` are now set on the deployment (values not
recorded here). A live end-to-end test with them and the `convex.site`
frontend deploy are still the two things left before submission.

### 2026-09-21 - working tree
Ran the real end-to-end test against the live deployment, against a
real listing (`listings:createFromImport`), real facts, a real
AgentMail inbox (`agentmail:provisionInbox`), and a real email sent
from a second AgentMail inbox to it — the first genuine, non-simulated
run of every piece.

Results: AgentMail is fully proven live — the signed webhook actually
fired, `convex/http.ts` verified its Svix signature correctly, and the
inbound message landed in `opsMessages` with the right message ID and
text. Firecrawl is confirmed reachable and working (a real scrape
completed). OpenAI is confirmed reachable but every call currently
fails with `insufficient_quota` — the account has no billing set up,
so no draft was produced by either the import or the answer path. That
one live email also caught and led to fixing a real bug: AgentMail's
`from_` field arrived as a single "Display Name <address>" string, not
the array of bare addresses shown in its own docs example, so
`message?.from_?.[0]` silently returned a single character instead of
the sender's address. `convex/http.ts` now handles both shapes and
extracts the address out of angle brackets when present; re-tested
live and confirmed the second inbound message logged the correct
sender address. Nothing else needed fixing — schema, mutations, and
the webhook plumbing all matched their live payloads on the first try.

What's left before submission: OpenAI billing (host has to add it —
outside what this session can do), then a quick re-run of the same
test with an actual grounded/flagged draft produced.

### 2026-09-21 - working tree
Deployed to `convex.site`, in production, and it required real fixes,
not just running the deploy command:

- **Dynamic routes don't survive a static export.** `/host/[listingId]`
  and `/stays/[slug]` depend on a server to resolve a path segment it
  has never seen before; a static host only has the exact files it was
  given at build time. Moved both to query-param routes —
  `/host/listing?id=` and `/stays/guest?slug=` — reading
  `useSearchParams()` instead of `useParams()`, each wrapped in
  `<Suspense>` as the static export requires. Added `output: "export"`
  to `next.config.ts`; the build went from 2 dynamic (ƒ) routes to all
  static (○).
- **`redirect()` needs a server to complete.** The `/` → `/host`
  redirect used Next's server `redirect()`, which relies on a server
  interpreting an RSC signal — with no server, it just did nothing.
  Client-side `router.replace()` didn't work either: it fetches RSC
  flight data the same way, which a plain static host doesn't resolve
  the same way. A hard `window.location.replace("/host")` in a
  `useEffect` is what actually works under static hosting, confirmed
  live.
- **The static build was pointed at the wrong deployment.** The setup
  tool's own instructions require mapping `VITE_CONVEX_URL` into
  `NEXT_PUBLIC_CONVEX_URL` in the `build` script; skipping that step
  (easy to miss) meant `.env.local`'s dev URL got embedded into the
  production static bundle instead of the real prod URL. Caught by
  grepping the built JS for the embedded `.convex.cloud` URL before
  trusting the deploy, not by assuming the tool handled it.

Deployed the backend to a real production deployment
(`fine-hornet-3`, distinct from the `nautical-oyster-722` dev one) with
`npx convex deploy --yes` (the documented non-interactive flag for
exactly this), then the static frontend with
`npx @convex-dev/static-hosting upload --dist out --prod`. Verified
live: every route (`/`, `/host`, `/host/listing`, `/stays/guest`)
returns 200, the embedded Convex URL is the production one, and a
real headless-browser run confirmed the `/` → `/host` redirect
actually completing end to end (repeat runs were flaky purely from
this sandbox's own outbound network reliability to `convex.site`, not
the app — even a plain CSS file failed to load on the flaky runs).

`hackathon.md`'s Live app and Convex deployment fields now point at
the real production URLs. What's left before submission is unchanged:
add OpenAI billing, then re-run the live test end to end with a real
draft produced.

### 2026-09-21 - working tree
Host reported `/host` on the live site "never finished" loading. Found
and fixed a real, separate bug while investigating: the build script's
`NEXT_PUBLIC_CONVEX_URL=${VITE_CONVEX_URL:-$NEXT_PUBLIC_CONVEX_URL}`
pattern always assigns the variable, so a plain `npm run build` outside
the static-hosting deploy wrapper set it to an empty string rather than
falling back to `.env.local` — silently breaking `ConvexReactClient`'s
URL validation. Only reproduces via a manual build, not the deploy path
actually used to ship, so it isn't confirmed as the cause of the
reported hang, but it's a real latent bug now fixed regardless (only
override the var when the wrapper actually provides one). Extracted
the dashboard into a shared `HostDashboard` component along the way.

The reported hang itself remains open. Server-side, `/host` is
reliably healthy: 5/5 direct HTTP requests succeeded in under 0.35s
each. A sandboxed headless-Chromium test hit repeated
`ERR_TOO_MANY_RETRIES` on the same URL that `curl` never did — this
points at an HTTP/3-over-QUIC negotiation issue specific to that
sandbox (the deployment is served through Cloudflare, which advertises
`alt-svc: h3`), not a confirmed server or app bug. Waiting on the host
to test with QUIC disabled in their own browser to confirm or rule
this out before deciding whether static hosting via convex.site is
viable as configured.

**Root cause found and fixed.** QUIC-off, Incognito, a second network
(mobile data), and a second browser entirely all still hung — ruling
out the browser/extension/network theories above. The host's own
Chrome DevTools Network tab was the actual signal: the `/host`
*document* request itself sat "Pending" forever, initiated by a script
chunk whose content was exactly the root page's
`window.location.replace("/host")`. `/host` was rendering the root
redirect component, not `HostDashboard` — an infinite self-redirect
(navigate to `/host` → runs the root page's effect → replaces to
`/host` → repeat), matching every symptom (blank page, spinner that
never stops, tab title rendering fine because the outer HTML shell is
identical either way).

Cause: `@convex-dev/static-hosting`'s asset resolver
(`node_modules/@convex-dev/static-hosting/src/component/lib.ts`,
`resolveAssetDocument`) only does an exact path match, and falls back
unconditionally to `/index.html` for any extension-less miss — there's
no `/host` → `/host.html` normalization. Next's static export writes
`out/host.html`, `out/host/listing.html`, `out/stays/guest.html` as
sibling files (confirmed distinct locally, and confirmed served
correctly when fetched with the literal `.html` extension), but a
request for the clean path `/host` doesn't exact-match `/host.html`,
has no extension, and so silently falls back to serving `/index.html`
— which is the redirect page. curl never caught this because a plain
GET can't see that it received the *wrong* 200, and my own diagnostics
kept looking at server health and browser/network theories instead of
diffing the actual bytes returned for `/` vs `/host`.

Fix: since this hosting component is effectively single-page-app
shaped (one real entry point, everything else reachable only by exact
filename), every in-app navigation now links to the real `.html`
filename instead of the clean Next.js route: root's redirect target
(`src/app/page.tsx`), the dashboard→listing link and the "all
properties" back-link (now plain `<a>` tags instead of `next/link`,
which would otherwise try an RSC-based soft navigation to a path with
no matching Next.js route), and the guest stay-page links generated in
`host/listing/page.tsx`. Rebuilt, redeployed
(`npx convex deploy -y` + `npx @convex-dev/static-hosting deploy
--skip-convex --dist ./out`, since neither step prompts cleanly in a
non-interactive shell), and re-ran the Playwright network trace:
`document.readyState: complete`, 0 pending requests. The live site now
actually finishes loading.

### 2026-09-22 - working tree
Several rounds, not individually logged as they happened — catching up now:

**Dropped OpenAI, switched to Gemini.** The host has no OpenAI billing
set up (confirmed `insufficient_quota` earlier), so every import/answer/
learn call was permanently broken. Google AI Studio issues a free API
key with no card required, and Gemini exposes an OpenAI-compatible
`/v1beta/openai/chat/completions` endpoint, so `convex/importListing.ts`,
`answerQuestion.ts`, and `learn.ts`'s direct `fetch` calls were routed
through a new shared `convex/lib/llm.ts` (`chatJSON()`), configurable via
`LLM_API_KEY`/`LLM_BASE_URL`/`LLM_MODEL` env vars instead of hardcoded to
OpenAI. Verified live: import → Gemini extraction → listing created,
end to end. Also hit and fixed a real free-tier issue: Gemini's
`gemini-3.6-flash` returns transient 429/503 "high demand" errors fairly
often (reproduced directly with curl — failed once, succeeded on retry
seconds later), so `chatJSON()` now retries up to 4 times with backoff
on those two statuses before surfacing an error.

**Full visual redesign.** The UI was plain zinc/black Tailwind defaults.
Rebuilt as a warm "house-listing" theme: Fraunces/Inter font pairing,
a cream/clay/sage/amber color system, rounded card surfaces with soft
shadows, a reused house-mark icon, fade-up/stagger/hover-lift animations
and shimmering skeleton loaders (including two spots where the redesign
had accidentally left the loading state rendering nothing — caught and
fixed with proper skeletons). Added a shared `AmbientBackground`
component (fixed, slow-drifting blurred warm gradient blobs + paper
grain + a house-silhouette that draws itself in on the dashboard) as a
lightweight stand-in for a literal background video, since generating
or sourcing an actual video file isn't something this session can do —
flagged that substitution to the host rather than silently doing
something else. Added a concrete one-line tagline and a new
`/how-it-works` page walking through the full loop in detail.

**Closed several one-way doors in the core loop.** Learned/seeded facts
(`faqs` table) were counted but never listed or removable; added a
"Things Housefile knows" section with per-fact delete. "Extra" private
facts could be added but not removed; added `listings.removePrivateFact`.
There was no way to delete a bad/test listing at all; added
`listings.remove`, cascading its faqs/stays/drafts/opsMessages/inbox
row. The guest stay page's "need something else" section always said
"message your host on Airbnb" even when a real AgentMail inbox existed;
it now shows the actual address with a `mailto:` link. Added a small
copy-to-clipboard control for the stay link and inbox address.

Also flipped stay-page links (host dashboard → guest page) from
`target="_blank"` back to same-tab per host feedback, adding a
`window.history.back()` "← Back" control on the guest page instead.

Every round rebuilt, typechecked (`tsc --noEmit`), deployed via
`npx convex deploy -y` + `npx @convex-dev/static-hosting deploy
--skip-convex --dist ./out`, and spot-checked live — either via a
Playwright screenshot when this sandbox's flaky connectivity to
`convex.site` cooperated, or by grepping the deployed JS bundle for the
new code's literal strings when it didn't (curl to this domain has been
reliable throughout; this sandbox's own Chromium has not).

### 2026-09-22 - working tree (continued)
Host reported "Teach Housefile" taking too long / appearing stuck.
Also caught a real bug while investigating: `DraftCard`'s teach button
had no `catch` at all — a rejected `proposePatch` call went unhandled,
so a genuine failure looked identical to "still working" until the
button silently flipped back with zero feedback. Added a `teachError`
state and now shows the actual message, matching the pattern already
used for send/import errors elsewhere on the page.

Root-caused the slowness itself by hitting the Gemini endpoint
directly rather than guessing: `gemini-3.6-flash` (the default set
when OpenAI was dropped) is a "thinking" model — the same prompt used
~470 total tokens against it vs ~190 on a plain model, all hidden
reasoning overhead — and it returned 429 "quota exceeded" on 4 of 5
consecutive calls in one direct test, likely from this session's own
heavy curl testing plus retries compounding within the same per-minute
quota window. Tried `reasoning_effort: "minimal"` first (cut latency
roughly in half) but the quota errors persisted regardless of effort
level, so it was a model choice problem, not a tuning one. Switched
the default to `gemini-flash-lite-latest`: 6/6 back-to-back calls
succeeded with zero rate-limit errors, consistently under ~2.5s, and
equally correct structured JSON for these extraction/classification
prompts, which never needed deep reasoning. Retry count stayed at 5
as cheap insurance for whatever load the free tier is actually under
at demo time.

### 2026-09-22 - working tree (continued 2)
Restyled the "Delete property" trigger and per-fact "Remove" buttons on
the listing page — both had been plain text links with no visual weight.
Delete now uses the same solid-clay primary-button treatment (hover/
active/focus states) as Save and Import elsewhere; Remove now matches
the outlined Add button directly below it in the same section.

Host raised a real question after testing: nothing stopped importing a
listing that isn't yours (tried it with someone else's Airbnb listing —
worked fine, no ownership check anywhere). Built a real answer rather
than a checkbox: `listings.getVerificationCode` derives a deterministic
code from `(hostId, sourceUrl)`, shown on the dashboard as soon as a URL
is typed; `importListing.run` now refuses to import unless Firecrawl's
scrape of that exact page actually contains the code, which only
someone who can edit the real listing's description could arrange —
same pattern as domain/site-ownership verification elsewhere on the
web. Deployed and confirmed live via the JS bundle.

Host then asked for it reverted — wanted the plain paste-and-go import
back. Reverted cleanly with `git revert` (single commit, clean tree),
redeployed both the Convex backend and the static frontend, confirmed
the plain flow is back. Net effect on this repo: shipped, then
un-shipped, on request — noted here so the log matches what's actually
live rather than what was tried.

Also produced a demo-video script (as a separate artifact, not a repo
file) covering the walkthrough end to end with on-screen actions and
voiceover lines split per scene, since the submission needs a video and
the deadline is today.
