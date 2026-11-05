# Security & launch checklist

## Secrets & config
- [ ] `APP_ENV=production` (app refuses dev secrets and test payments)
- [ ] Fresh `BETTER_AUTH_SECRET`, `BIRTH_DATA_ENCRYPTION_KEY` in a secrets manager; key backup procedure written
- [ ] HTTPS origin in `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` (enables secure cookies)
- [ ] `ADMIN_EMAILS` limited to operators

## Payments
- [ ] Razorpay test-mode purchase, failure, refund verified end-to-end with webhooks
- [ ] Webhook secret set; invalid signatures return 400 (covered by e2e test)
- [ ] International payments enabled if selling in non-INR currencies
- [ ] GST/invoicing requirements reviewed with an accountant
- [ ] Refund policy reviewed by counsel

## Privacy & legal
- [ ] Privacy notice, terms, refund policy, disclaimer reviewed by counsel (DPDP Act 2023; GDPR if selling to EU)
- [ ] Grievance officer / contact designated
- [ ] Processor DPAs signed (hosting, DB, Redis, Razorpay, Stripe, Resend, AI provider)
- [ ] AI provider data-retention settings confirmed (zero/limited retention where available)
- [ ] Verified: no birth details in logs (`grep` application logs after a test session)
- [ ] Backup retention aligned with deletion promises

## Application security
- [x] Auth on all private routes; admin role check; IDOR-scoped queries (integration tests)
- [x] Per-IP and per-user rate limits (Redis-backed)
- [x] Zod validation on every input
- [x] AI output escaped before rendering
- [x] Atomic entitlement consumption (race test)
- [x] Idempotent payment fulfilment
- [ ] Add a Content-Security-Policy tuned for Razorpay checkout and Google Fonts
- [ ] Dependency audit (`npm audit`) and Dependabot enabled
- [ ] Penetration test / external review before scale

## Quality
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` green
- [ ] Lighthouse on production URL (mobile) ≥ 90 performance, ≥ 95 accessibility
- [ ] Manual screen-reader pass (VoiceOver/NVDA) of onboarding and AURA
- [ ] Live AI answers reviewed by a Jyotish practitioner for tone and tradition fidelity (sample 100)
