# Architecture

## Layers

| Layer | Code | Responsibility | Determinism |
|---|---|---|---|
| 1 Computation | `src/lib/astro/*` | Local time → UTC (IANA history), ephemeris positions, ayanamsa, Lagna, houses, vargas, nakshatra, dasha, panchang, aspects, yogas, transits | Pure, reproducible, versioned (`COMPUTATION_VERSION`) |
| 2 Rules & evidence | `src/lib/interpret/catalog.ts`, `evidence.ts`, `rule-catalog.ts` | Turn chart facts into `Factor`s: statement + traditional reading + polarity + rule id; timing windows | Pure, versioned (`RULES_VERSION`, `YOGA_RULES_VERSION`) |
| 3 Personalization | `evidence.ts` (topic houses/karakas, active dasha, gochara), `daily.ts` | Pick the factors relevant to the user's question, period and transits | Pure |
| 4 Narrative | `src/server/ai/aura.ts`, `providers.ts` | Compact evidence JSON + question → LLM with JSON schema; or deterministic writer (`narrative.ts`) | LLM optional |
| 5 Validation | `src/lib/interpret/validate.ts`, `src/server/ai/guardrails.ts` | Pre-routing of crisis/high-stakes questions; post-check every planet–sign, planet–house, nakshatra, yoga, dasha, year and guardrail phrase against the evidence whitelist; regenerate once, then fall back | Pure |

The LLM never sees the database, the user's name, birth date, time or place — only `compactEvidence()` and the question.

## Request flow — AURA

1. `POST /api/aura/chat` → auth, rate limit (IP + user), feature flag, daily cap.
2. Guardrail routing (free, never charged).
3. Atomic conditional decrement of one `ai_messages` entitlement (`consume`), logged in `UsageLedger`.
4. Evidence build (transits cached per chart per day in Redis).
5. Cache lookup for identical solo questions (24 h) → refunded unit.
6. LLM (fast model; deep model for Cosmic Plus) → JSON → validator → retry → fallback.
7. Persist messages with evidence, generator, validation status, tokens and cost; record token ledger.
8. Any exception refunds the unit.

## Data model

See `prisma/schema.prisma`. Highlights:

- `BirthProfile.encryptedDetails` and `ChartSnapshot.encryptedPayload` are AES-256-GCM ciphertexts (`src/server/crypto.ts`).
- `PlanetaryPlacement` / `DashaPeriod` are normalized, non-identifying projections for querying.
- `ChartSnapshot.inputHash` + `ComputationVersion` make recomputation explicit.
- `Report.factsHash` (chart facts + date context) gives duplicate-free regeneration.
- `Entitlement(paymentId, kind)` unique → idempotent fulfilment; `UsageLedger` records every unit and token.
- `Consent` is append-only history; latest row wins.
- `AuditEvent` stores operational events without PII.

## Security model

- All private routes go through `authed()` (`src/server/http/index.ts`): session check, optional admin check, per-IP + per-user rate limit, error masking.
- Every query is scoped by `userId` (IDOR-safe); covered by `tests/integration/server.test.ts`.
- Webhooks verify HMAC signatures with constant-time comparison; amounts are cross-checked.
- AI output is rendered through an escape-first markdown subset (`src/lib/markdown.ts`).
- Security headers in `next.config.ts`.
