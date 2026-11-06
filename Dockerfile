# Production image (Railway, Fly, Render, any Docker host).
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
# Public values are inlined into statically generated pages, so they must be present at build time.
# (Railway passes service variables to declared ARGs.)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_LEGAL_ENTITY_NAME
ARG NEXT_PUBLIC_LEGAL_ADDRESS
ARG NEXT_PUBLIC_LEGAL_JURISDICTION_CITY
ARG NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME
ARG NEXT_PUBLIC_GRIEVANCE_EMAIL
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_PRIVACY_EMAIL
ARG NEXT_PUBLIC_GSTIN
# Google Search Console "HTML tag" verification code (content value only)
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV NEXT_TELEMETRY_DISABLED=1
# Build-only placeholders: server secrets are injected at runtime, never baked into the image.
RUN npx prisma generate && \
    DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    BETTER_AUTH_SECRET="build-only-placeholder-secret-0123456789" \
    BIRTH_DATA_ENCRYPTION_KEY="YnVpbGQtb25seS1wbGFjZWhvbGRlci1rZXktMzJieXQ=" \
    APP_ENV=development PAYMENTS_MODE=test AI_PROVIDER=none \
    npm run build

FROM build AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
