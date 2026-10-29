# syntax=docker/dockerfile:1

FROM oven/bun:1.4.0-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM oven/bun:1.4.0-alpine AS builder
WORKDIR /app
# `lib/auth.ts` constructs the Better Auth instance at module scope, so the
# env contract is validated during `next build`. These are build-time
# placeholders only — real values are injected at runtime and never baked in.
ARG MONGODB_URI="mongodb://127.0.0.1:27017/netgoat"
ARG BETTER_AUTH_SECRET="build-time-placeholder-not-a-real-secret"
ARG RESEND_APIKEY="re_build_time_placeholder"
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    MONGODB_URI=$MONGODB_URI \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    RESEND_APIKEY=$RESEND_APIKEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM gcr.io/distroless/nodejs22-debian13:nonroot AS runner
LABEL org.opencontainers.image.description="NetGoat frontend (Next.js) runtime" \
      org.opencontainers.image.base.name="gcr.io/distroless/nodejs22-debian13:nonroot" \
      org.opencontainers.image.source="https://github.com/netgoat-xyz/frontend"
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3002 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=512
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
USER nonroot:nonroot
EXPOSE 3002
HEALTHCHECK --interval=15s --timeout=5s --retries=10 --start-period=30s \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3002/').then(r=>process.exit(r.ok||r.status===401||r.status===307?0:1)).catch(()=>process.exit(1))"]
CMD ["server.js"]
