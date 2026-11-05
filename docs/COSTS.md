# Infrastructure & AI cost drivers (estimates, not guarantees)

## Compute
- Chart calculation is CPU-only, ~40–100 ms per chart, ~60 ms per transit summary (cached per chart per day). A single small instance handles thousands of charts per hour.
- PDF generation: ~20–50 ms each, in-process.
- Static/marketing pages are server-rendered; put a CDN in front.

## Data
- Postgres: ~30–60 KB per saved chart (encrypted payload + 27 placements + 90 dasha rows) + conversations. 100k users ≈ single-digit GB.
- Redis: small (rate-limit counters, transit and answer caches with TTLs).

## AI (the main variable cost)
Per AURA reply the model sees ~1.5–3k input tokens (system prompt + compact evidence + up to 6 history turns) and writes ~300–600 output tokens (plus internal reasoning tokens on models that think).

Using list prices from the model table (USD per 1M tokens) configured in `/admin/ai`:

| Model | Typical cost / reply | Notes |
|---|---|---|
| `claude-haiku-5-5` (everyday) | ≈ $0.0005–0.001 | Starter users |
| `claude-opus-5-5` (deep/priority) | ≈ $0.02–0.05 | Cosmic Plus users |

At ₹199 / 10 messages (≈ ₹19.9 each) and ₹599 / 25 (≈ ₹24 each), AI cost is a small fraction of price even on the deep model; payment fees (~2% Razorpay domestic, higher international) and GST are larger line items. Controls in place: per-user daily cap, monthly global budget with automatic rule-engine fallback, 24 h answer cache for repeated questions, prompt caching of the stable system prompt, output token limits, guardrail answers and failed generations never charged.

Re-check prices before launch; they change.
