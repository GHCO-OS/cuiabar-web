# SEO Technical Execution Plan

## Goal

Turn `cuiabar.com` and `reservas.cuiabar.com` into a technically consistent acquisition stack for:

- organic discovery
- local SEO
- paid media attribution
- reservation and order conversion tracking
- sustainable performance

This plan is written against the current repository state on 2026-03-22.

## Current Findings

### Confirmed strengths

- Per-route SEO metadata is generated at build time in `scripts/generate-seo-assets.mjs`.
- Route-level metadata and structured data already exist in `src/data/seoRoutes.json`.
- Google Tag, Google Ads and Meta Pixel are loaded in `index.html`.
- Meta Conversions API already exists in `functions/api/meta-conversions.js`.
- Main-site event tracking already exists in `src/lib/analytics.ts` and `src/components/AnalyticsTracker.tsx`.
- Main app build is reasonably light in JS size.

### Confirmed gaps

- Production `robots.txt` is currently being served by Cloudflare managed content, not by the build output generated in `dist/robots.txt`.
- Legacy URLs such as `/services-5` and `/online-ordering` still answer `200` instead of redirecting or returning `410`.
- The reservation funnel on `reservas.cuiabar.com` does not reuse the same analytics layer as the main site.
- Reservation SEO copy and structured data still mention WhatsApp-only reservations in some routes, while the live product now points to the reservation portal.
- Large static assets and OTF fonts are still being shipped without a stricter performance budget.
- Search Console verification is not present in the repository yet.

## Execution Order

1. Fix crawlability and canonicalization.
2. Fix analytics and attribution from landing page to reservation success.
3. Fix media and font performance.
4. Align schema, local SEO, and operational metadata.
5. Add monitoring and a recurring audit loop.

## Backlog

### P0-01 - Restore app-controlled `robots.txt` and sitemap discoverability

Priority: `P0`
Owner: `Dev`
Estimate: `0.5 day`
Dependencies: none

#### Scope

- Decide whether `cuiabar.com` should keep Cloudflare managed content rules.
- Ensure the public `robots.txt` contains:
  - `User-agent: *`
  - `Allow: /`
  - `Sitemap: https://cuiabar.com/sitemap.xml`
- Ensure `https://cuiabar.com/sitemap.xml` remains public and current.

#### Systems and files

- Cloudflare Pages project for `cuiabar.com`
- `scripts/generate-seo-assets.mjs`
- `dist/robots.txt`

#### Implementation notes

- If Cloudflare managed content overrides `robots.txt`, disable that override for the apex site or replace it with a worker/pages rule that serves the app-generated file.
- Keep the current sitemap generation in `scripts/generate-seo-assets.mjs` as the source of truth.

#### Acceptance criteria

- `https://cuiabar.com/robots.txt` shows the sitemap line in production.
- Googlebot is not blocked from the main site.
- `https://cuiabar.com/sitemap.xml` is fetchable without auth.

#### Verification

```powershell
Invoke-WebRequest https://cuiabar.com/robots.txt -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest https://cuiabar.com/sitemap.xml -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

### P0-02 - Retire legacy URLs with `301` or `410`

Priority: `P0`
Owner: `Dev`
Estimate: `1 day`
Dependencies: `P0-01`

#### Scope

- Stop serving the SPA shell as `200` for legacy Wix-era URLs.
- Redirect legacy pages with a clear replacement to the correct current page.
- Return `410` for dead routes with no modern equivalent.

#### Known targets

- `/delivery` -> `/pedidos-online` (already present)
- `/services-5` -> `/pedidos-online`
- `/online-ordering` -> `/pedidos-online`
- `/asianrestaurant` -> `/`
- `/canal` -> `/links` or dedicated destination after business decision
- any other high-impression legacy route found in Search Console

#### Systems and files

- `public/_redirects`
- `src/app/App.tsx`
- `src/data/seoRoutes.json`
- Search Console removals tool

#### Implementation notes

- Prefer edge-level redirects in `public/_redirects`.
- Keep app-level `Navigate` only as a safety net, not as the primary SEO mechanism.
- If a dead route has backlinks but no equivalent, prefer a curated landing page over `410`.

#### Acceptance criteria

- Legacy routes no longer return `200` with homepage metadata.
- Each mapped route returns a single-hop `301`.
- Removed routes are queued for cleanup in Search Console.

#### Verification

```powershell
$urls = @(
  'https://cuiabar.com/services-5',
  'https://cuiabar.com/online-ordering',
  'https://cuiabar.com/asianrestaurant'
)
foreach ($u in $urls) {
  try {
    Invoke-WebRequest -Uri $u -MaximumRedirection 0 -ErrorAction Stop
  } catch {
    $_.Exception.Response.StatusCode.value__
    $_.Exception.Response.Headers.Location
  }
}
```

### P0-03 - Add Search Console verification and baseline Google setup

Priority: `P0`
Owner: `Dev + Marketing`
Estimate: `0.5 day`
Dependencies: `P0-01`

#### Scope

- Add Search Console verification via DNS or HTML/meta method.
- Ensure GA4 property is linked to Search Console.
- Ensure Google Ads conversion linker and conversion events are available.
- Confirm Meta Pixel + CAPI health in production.

#### Systems and files

- Google Search Console
- GA4
- Google Ads
- Meta Events Manager
- `index.html`
- `src/lib/analytics.ts`
- `functions/api/meta-conversions.js`

#### Implementation notes

- Prefer DNS verification when possible.
- If HTML/meta verification is used, keep the token in versioned source.
- Document property IDs outside the repo or in secure ops docs.

#### Acceptance criteria

- Search Console property is verified.
- GA4 receives page views from `cuiabar.com`.
- Google Ads can receive conversion events.
- Meta CAPI endpoint returns `configured: true`.

#### Verification

```powershell
Invoke-WebRequest https://cuiabar.com/api/meta-conversions -UseBasicParsing | Select-Object -ExpandProperty Content
```

### P0-04 - Track the reservation funnel end-to-end

Priority: `P0`
Owner: `Dev`
Estimate: `1.5 days`
Dependencies: `P0-03`

#### Scope

- Reuse or adapt the analytics layer for `reservas.cuiabar.com`.
- Track the following events:
  - `reservation_page_view`
  - `reservation_form_start`
  - `reservation_submit`
  - `reservation_success`
  - `reservation_whatsapp_click`
- Map success to Google Ads and Meta as a lead/reservation conversion.

#### Systems and files

- `src/reservations/ReservationsApp.tsx`
- `src/reservations/components/ReservationFormPage.tsx`
- `src/reservations/components/ReservationSuccessPage.tsx`
- `src/reservations/api.ts`
- shared analytics module in `src/lib/analytics.ts`

#### Implementation notes

- Introduce a shared tracker component or reservation-specific tracker.
- Fire `reservation_form_start` on the first meaningful interaction, not only on submit.
- Fire `reservation_success` only after API success and route transition.
- Keep event IDs aligned between browser and server-side events when the event is mirrored to Meta.

#### Acceptance criteria

- A reservation journey from landing to success appears in GA4 DebugView.
- Meta receives a success event with deduplicated `event_id`.
- Google Ads can import or directly count the final reservation event.

#### Verification

- Use browser DevTools Network and GA4 DebugView.
- Complete a full reservation in staging or production-safe mode.

### P0-05 - Preserve attribution across `cuiabar.com` -> `reservas.cuiabar.com`

Priority: `P0`
Owner: `Dev`
Estimate: `1 day`
Dependencies: `P0-04`

#### Scope

- Carry `utm_*`, `gclid`, `wbraid`, `gbraid`, `fbclid`, `fbc`, and `fbp` from landing pages into the reservation subdomain.
- Store attribution in browser storage or cookies when appropriate.
- Include attribution on reservation conversion events and, if useful, in reservation records.

#### Systems and files

- `src/lib/analytics.ts`
- `src/pages/ReservasPage.tsx`
- `src/reservations/api.ts`
- reservation API payload and backend if persistence is required

#### Implementation notes

- Extend outbound URL decoration to include `reservas.cuiabar.com`.
- For same-root subdomains, prefer first-party cookies or explicit query transfer.
- If attribution is persisted in DB, add new nullable fields with a migration.

#### Acceptance criteria

- Reservation CTA links keep attribution parameters.
- Success events still include the original acquisition context.
- At least one test reservation proves attribution survives the subdomain handoff.

### P1-01 - Fix metadata and schema consistency for reservations

Priority: `P1`
Owner: `Dev + Marketing`
Estimate: `0.5 day`
Dependencies: `P0-02`

#### Scope

- Update route metadata where reservation messaging is outdated.
- Remove WhatsApp-only reservation messaging from schema where the portal is now the primary path.
- Align homepage, reservation page, and FAQ structured data with the current journey.

#### Systems and files

- `src/data/seoRoutes.json`
- `src/pages/ReservasPage.tsx`
- `src/pages/HomePage.tsx`

#### Acceptance criteria

- Reservation-related titles, descriptions, and FAQ answers mention the online portal where appropriate.
- Structured data does not contradict the live product.
- Rich-result validators return no reservation/schema conflicts.

### P1-02 - Add stronger local business schema

Priority: `P1`
Owner: `Dev + Marketing`
Estimate: `0.5 day`
Dependencies: `P1-01`

#### Scope

- Expand `Restaurant` structured data with:
  - `openingHoursSpecification`
  - `geo`
  - reservation URL
  - menu URL confirmation
  - stronger `sameAs`
- Ensure business info stays consistent with GBP.

#### Systems and files

- `src/data/seoRoutes.json`
- `src/data/siteConfig.ts`

#### Acceptance criteria

- Local business schema includes hours and geo details.
- NAP values match Google Business Profile exactly.

### P1-03 - Optimize top-priority images

Priority: `P1`
Owner: `Dev`
Estimate: `1.5 days`
Dependencies: none

#### Scope

- Convert heavy above-the-fold assets to optimized formats where appropriate.
- Reduce oversized logo and favicon assets.
- Add explicit `width` and `height` where practical to reduce layout instability.

#### Highest-priority assets

- `public/logo-villa-cuiabar.png`
- `public/favicon.png`
- `public/home/home-salao-dia-da-mulher.jpg`
- `public/home/home-mascote-salao.jpg`
- hero and card assets in `public/burguer` and `public/prorefeicao`

#### Systems and files

- `public/`
- image usages in:
  - `src/sections/HeroSection.tsx`
  - `src/pages/PedidosOnlinePage.tsx`
  - `src/pages/BurguerCuiabarPage.tsx`
  - `src/pages/ProRefeicaoPage.tsx`
  - `src/components/Footer.tsx`

#### Implementation notes

- Preserve JPG/PNG fallback only where needed for OG compatibility.
- Consider WebP or AVIF for render images.
- Keep OG images stable and public.

#### Acceptance criteria

- Largest above-the-fold images are materially smaller than current versions.
- No visual regressions on desktop or mobile.
- Lighthouse mobile LCP improves compared with baseline.

### P1-04 - Replace OTF delivery with WOFF2 and add `font-display`

Priority: `P1`
Owner: `Dev`
Estimate: `1 day`
Dependencies: none

#### Scope

- Convert the Moranga font files to WOFF2.
- Load only the weights actually used.
- Add `font-display: swap`.

#### Systems and files

- `public/fonts/`
- `src/styles/global.css`
- `tailwind.config.ts` if font references need adjustment

#### Acceptance criteria

- No OTF files are required on the critical rendering path.
- Text paints without a long invisible period.
- Typography remains visually acceptable across pages.

### P1-05 - Add performance guardrails to CI

Priority: `P1`
Owner: `Dev`
Estimate: `1 day`
Dependencies: `P1-03`, `P1-04`

#### Scope

- Add a lightweight performance audit to CI.
- Enforce at least one of:
  - bundle size check
  - Lighthouse CI for key routes
  - image-size budget script

#### Systems and files

- `.github/workflows/ci.yml`
- optional new scripts under `scripts/`

#### Acceptance criteria

- Pull requests surface a failure when budgets are exceeded.
- Team has a documented way to refresh the baseline.

### P1-06 - Build a keyword-to-route map for current pages

Priority: `P1`
Owner: `Marketing + Dev`
Estimate: `0.5 day`
Dependencies: `P1-01`

#### Scope

- Assign one primary keyword cluster per important route.
- Prevent cannibalization between `/`, `/menu`, `/pedidos-online`, `/reservas`, and `/prorefeicao`.

#### Deliverable

- A simple map stored in repo or ops docs:
  - route
  - primary keyword
  - secondary keywords
  - primary conversion

#### Acceptance criteria

- Each core route has one primary target intent.
- Titles and descriptions support that target intent.

### P1-07 - Harden Google Business Profile and local entity consistency

Priority: `P1`
Owner: `Marketing + Operations`
Estimate: `1 day`
Dependencies: `P1-02`

#### Scope

- Align business name, address, phone, hours, site URL, reservation URL, and menu URL across:
  - site
  - Google Business Profile
  - Facebook
  - Instagram
  - delivery listings where relevant

#### Acceptance criteria

- NAP is consistent everywhere.
- GBP uses tagged URLs for website, menu, and reservations.
- A monthly photo/review cadence is defined.

### P2-01 - Stand up recurring crawl and ranking ops

Priority: `P2`
Owner: `Dev + Marketing`
Estimate: `1 day`
Dependencies: `P0-02`, `P1-06`

#### Scope

- Choose one crawler for recurring technical checks:
  - `Screaming Frog Free`, or
  - `SEOnaut`, or
  - `RustySEO`
- Stand up `SerpBear` for local keyword tracking.

#### Acceptance criteria

- Weekly crawl exports exist.
- Rank tracking exists for the agreed keyword set.

### P2-02 - Create local landing/content backlog

Priority: `P2`
Owner: `Marketing`
Estimate: `1 day`
Dependencies: `P1-06`

#### Suggested route backlog

- `restaurante com musica ao vivo em campinas`
- `reserva para aniversario em campinas`
- `almoco executivo em campinas`
- `marmita corporativa campinas`
- `restaurante para grupos campinas`

#### Acceptance criteria

- Content backlog is prioritized by search intent and business value.
- Each topic has a mapped route or future route.

### P2-03 - Add reporting dashboard for SEO and conversion health

Priority: `P2`
Owner: `Marketing + BI`
Estimate: `1 day`
Dependencies: `P0-03`, `P0-04`, `P0-05`

#### Scope

- Build a Looker Studio dashboard or equivalent with:
  - indexed pages
  - clicks and impressions
  - top landing pages
  - reservations started
  - reservations completed
  - WhatsApp contacts
  - order-channel clicks

#### Acceptance criteria

- Dashboard updates automatically.
- Core KPIs are visible in one place.

## Suggested Sprint Plan

### Sprint 1

- `P0-01`
- `P0-02`
- `P0-03`

### Sprint 2

- `P0-04`
- `P0-05`
- `P1-01`
- `P1-02`

### Sprint 3

- `P1-03`
- `P1-04`
- `P1-05`

### Sprint 4

- `P1-06`
- `P1-07`
- `P2-01`
- `P2-03`

## Definition of Done

The SEO technical foundation is considered ready when all items below are true:

- production `robots.txt` exposes the sitemap
- legacy URLs no longer return `200` shell responses
- Search Console is verified and receiving sitemap data
- reservation success is measurable in GA4, Ads, and Meta
- attribution survives the cross-subdomain reservation flow
- reservation metadata matches the live booking product
- major image and font bottlenecks are reduced
- the team has a recurring crawl and reporting cadence

## Immediate Next Action

Start with `P0-01` and `P0-02` in the same branch, then validate production behavior before touching performance work.
