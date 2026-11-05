<p align="center"><img src="public/brand/vyomira-stacked.svg" width="200" alt="VYOMIRA"></p>

# VYOMIRA — Your Universe. Your Story.

An AI-assisted Vedic astrology platform built on a **real astronomical engine**, a **versioned interpretation rule catalog**, and an **evidence-grounded AI companion (AURA)** that is not allowed to invent chart facts.

> Premium cosmic experience. Transparent Vedic calculations. Personal guidance at an accessible price.

## What's inside

| Area | Status |
|---|---|
| Cinematic homepage (WebGL planet, star field, constellations, scroll-linked transitions, reduced-motion & mobile fallbacks) | ✅ |
| Brand system — original SVG mark, horizontal / stacked / icon / favicon (`public/brand`, `src/components/brand/Logo.tsx`) | ✅ |
| Email + password auth, Google sign-in (needs credentials), password reset (needs Resend) | ✅ |
| Multi-step onboarding with GeoNames place search (34k cities + IANA zones), 12/24h time, exact / approximate / unknown precision | ✅ |
| Astronomy engine: sidereal positions, Lahiri ayanamsa, Lagna, whole-sign houses, retrograde, mean nodes, D1/D9/D10, Nakshatra & pada, Vimshottari (MD/AD/PD), Panchang, Parashari aspects, yoga catalog, transits & ingress search | ✅ verified vs Swiss Ephemeris |
| Historical timezone handling with ambiguous / nonexistent local-time detection | ✅ |
| Dashboard: overview, Kundli (North/South, D1/D9/D10, artistic sky view), Dasha timeline, daily insights & 14-day calendar, partial compatibility, reports + PDFs, saved readings, billing, settings | ✅ |
| AURA chat: layered evidence → optional LLM → fact validator → rule-engine fallback; EN/HI/Hinglish; ratings, reports, save, delete | ✅ (LLM path needs an API key) |
| Payments: Razorpay orders, checkout signature + webhook verification, idempotent fulfilment, refunds; optional Stripe; regional pricing; local test simulator | ✅ (live keys needed for real money) |
| Admin: metrics, users (no birth data), AI usage & model config, payments reconciliation, pricing & feature flags, rule versions, feedback, error/audit log | ✅ |
| Privacy: AES-256-GCM encryption of birth data, consent records, export, deletion, no birth data in logs | ✅ |
| Tests: 55 unit/integration (Vitest) + 6 end-to-end (Playwright) | ✅ passing |

See **[Clearly marked incomplete functionality](#incomplete--blocked)** below.

## Quick start

```bash
cp .env.example .env
```

```bash
docker compose up -d          # PostgreSQL 16 + Redis 7
```

```bash
npm install                   # also runs prisma generate
```

```bash
npx prisma migrate deploy && npm run db:seed
```

```bash
npm run dev                   # http://localhost:3000
```

With the defaults you get the full product in **local demo mode**: payments open a clearly-labelled simulator (no money moves) and AURA answers with the deterministic rule engine (labelled "rule engine — no AI language model was used"). Nothing pretends to be live.

To enable the real integrations, set the keys in `.env` (see comments there): `ANTHROPIC_API_KEY` or an OpenAI-compatible key + `AI_PROVIDER`, `RAZORPAY_*` + `PAYMENTS_MODE=live`, `GOOGLE_CLIENT_*`, `RESEND_API_KEY`. Add your email to `ADMIN_EMAILS` before signing up to get the admin console at `/admin`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` | ESLint (Next + React Compiler rules) · `tsc --noEmit` (strict) |
| `npm test` | Vitest: ephemeris regression, timezone, dasha/varga, chart, validator, guardrails, DB isolation, billing races |
| `npm run test:e2e` | Playwright against `next start` on :3100 (run `npm run build` first) |
| `npm run db:migrate` · `db:deploy` · `db:seed` | Prisma |
| `npm run data:cities <dir>` | Rebuild `data/places.json` from a GeoNames dump |
| `node scripts/build-brand.mjs` | Regenerate standalone brand SVGs |
| `python scripts/reference/generate_se_fixtures.py` | Regenerate the Swiss Ephemeris test oracle (dev-only, needs `pyswisseph`) |

## Architecture (short)

```
src/lib/astro        Layer 1 — deterministic astronomy & Vedic computation (pure TS, no I/O)
src/lib/interpret    Layer 2/3 — rule catalog, evidence builder, topic personalization, daily insights
src/server/ai        Layer 4/5 — provider-independent LLM adapters, AURA orchestration, guardrails (+ lib/interpret/validate.ts)
src/server/billing   Razorpay / Stripe adapters, entitlements, idempotent fulfilment
src/server           auth, db, crypto, rate limiting, config, audit, places
src/app              Next.js App Router: marketing, onboarding, dashboard, admin, API routes
prisma               schema & migrations
```

Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · [docs/SECURITY_AND_LAUNCH_CHECKLIST.md](docs/SECURITY_AND_LAUNCH_CHECKLIST.md) · [docs/COSTS.md](docs/COSTS.md) · [/methodology](src/app/(marketing)/methodology/page.tsx)

## Calculation accuracy

`tests/unit/ephemeris.test.ts` compares every planet, the mean node, the ascendant and the ayanamsa against Swiss Ephemeris (Moshier) for 16 charts: 1868–2030, India pre-standard time, leap days, US/UK DST transitions, southern hemisphere, equator, Reykjavík and Tromsø (above the Arctic circle), Pacific and future dates. Observed differences are ≤ 10″ for planets and < 1″ for the ascendant and ayanamsa; test tolerances are 30″ / 30″ / 2″. Swiss Ephemeris is **only** a dev-time oracle — it is AGPL/commercial and is not shipped or linked.

We make **no claims of predictive accuracy**. Interpretations are presented as traditional readings.

## Pricing (editable in /admin/pricing)

| | India | Default (USD) |
|---|---|---|
| Free | Full Kundli, D9/D10, dasha, 1 AURA question, daily insight | same |
| Starter | ₹199 · 10 messages | $4.99 |
| Cosmic Plus | ₹599 · 25 messages + all detailed reports & PDFs + deeper model | $12.99 |

Regional prices exist for US, UK, Eurozone, UAE, Singapore, Canada, Australia and Nepal. Region comes from the CDN geo header (`cf-ipcountry`, `x-vercel-ipcountry`…) or the visitor's own choice; India is the default when unknown.

## Incomplete / blocked

Honest status of what is **not** finished or not verifiable in this environment:

- **Live AI generation not exercised.** The Anthropic (official SDK) and OpenAI-compatible adapters, structured output schema, retry-on-violation and budget cut-off are implemented and type-checked, but no API key was available, so all automated tests run the rule-engine path. Hindi/Hinglish fluency depends on the LLM; the rule-engine fallback is English with a localized note.
- **Razorpay/Stripe live payments not exercised.** Order creation, signature and webhook verification, idempotency and refunds are implemented; signature logic and fulfilment are tested locally. A Razorpay test-mode run with real keys (and webhook URL `…/api/payments/webhook/razorpay`) is required before launch. International currencies on Razorpay require international payments to be enabled on the merchant account.
- **Google sign-in, Resend email** need credentials; untested live.
- **Not implemented by design until validated:** Ashtakavarga, Shadbala, divisional charts beyond D9/D10, full 36-point Guna Milan (only Nadi/Bhakoot/Gana shown), true node, Western tropical system, yoga cancellation rules.
- **PDF reports** use standard PDF fonts → English/Latin only (no Devanagari in PDFs yet).
- **Legal pages are drafts** and must be reviewed by counsel (DPDP Act 2023, consumer protection, payment-aggregator terms). No compliance is claimed.
- **Encryption key rotation** is designed (`v1.` ciphertext prefix) but a rotation script is not written.
- **"Taste Skill" and "impeccable"** design skills were requested but are not installed in this build environment; their principles (restraint, hierarchy, no generic AI-template patterns) were applied manually.
- Places are limited to GeoNames cities with ≥ 15k inhabitants; a geocoding-provider adapter for villages is a recommended next step.
