# Deployment guide

## Recommended topology

- **App:** Node 22 runtime (Vercel, Railway, Render, Fly.io, or the included `Dockerfile`). Needs full ICU (default in official Node builds) for historical timezones.
- **PostgreSQL 16:** managed (Neon, Supabase, RDS, Railway). Enable encrypted storage and automated backups.
- **Redis 7:** managed (Upstash, Railway, ElastiCache). Used for rate limits and caches; the app degrades to per-instance memory if unavailable.
- **Region:** for Indian users, an Indian region (e.g. ap-south-1 / Mumbai) reduces latency and simplifies data-localisation discussions.

## Steps

1. Provision Postgres + Redis; set `DATABASE_URL`, `REDIS_URL`.
2. Generate secrets: `openssl rand -base64 48` → `BETTER_AUTH_SECRET`; `openssl rand -base64 32` → `BIRTH_DATA_ENCRYPTION_KEY` (store it in a secrets manager — losing it makes stored charts unreadable).
3. Set `APP_ENV=production`, `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your HTTPS origin.
4. PayU (primary): set `PAYU_CLIENT_ID`, `PAYU_CLIENT_SECRET`, `PAYU_MERCHANT_ID`, `PAYMENTS_MODE=live`. In PayU Dashboard → Settings → Webhooks add `https://<host>/api/payments/webhook/payu` (payment success/failure/pending). Buyers return to `/dashboard/billing?payu=<id>`, where the order is confirmed server-to-server. Make one ₹1-equivalent live purchase (temporarily lower a price in /admin/pricing) and one refund before launch.
   Razorpay (alternative): create API keys, set `RAZORPAY_KEY_ID/SECRET`, `PAYMENTS_MODE=live`. Add a webhook to `https://<host>/api/payments/webhook/razorpay` for `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`; copy its secret to `RAZORPAY_WEBHOOK_SECRET`. Run one Razorpay **test-mode** purchase + refund end-to-end before switching to live keys.
5. Optional Stripe: keys + webhook `…/api/payments/webhook/stripe` (`checkout.session.completed`, `charge.refunded`), then enable the `stripe` flag in `/admin/pricing`.
6. Google OAuth: authorised redirect URI `https://<host>/api/auth/callback/google`.
7. Resend: verify the sending domain; set `RESEND_API_KEY`, `EMAIL_FROM`.
8. Legal identity: set the `NEXT_PUBLIC_LEGAL_*`, `NEXT_PUBLIC_GRIEVANCE_*` and `NEXT_PUBLIC_GSTIN` variables (shown on policy pages).
9. AI: `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (or `openai-compatible` + base URL/key). Set `AI_MONTHLY_BUDGET_USD`.
10. Deploy; run `npx prisma migrate deploy` then `npm run db:seed` once.
11. Sign up with an `ADMIN_EMAILS` address; review `/admin` integration status (all green before launch).

## Operations

- Health: `/admin` shows integration status, 24 h error count and AI spend.
- Reconciliation: `/admin/payments` lists stale unpaid orders; compare with the Razorpay dashboard daily during launch.
- Backups: daily DB snapshots; test restore monthly. Keep the encryption key versioned alongside.
- Rolling a computation change: bump `COMPUTATION_VERSION.id`, add fixtures, deploy. Old snapshots stay reproducible; new saves use the new version.
