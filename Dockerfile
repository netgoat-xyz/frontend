# =============================
# NetGoat Frontend Dockerfile
# =============================
# Maintainer: Duckey Dev <ducky@cloudable.dev>
# Description: Production-ready container for NetGoat Frontend (Next.js + Bun)
# =============================

# ---- Build Stage ----
FROM oven/bun:1 AS builder

LABEL org.opencontainers.image.title="NetGoat Frontend"
LABEL org.opencontainers.image.description="Production container for NetGoat Frontend (Next.js + Bun)"
LABEL org.opencontainers.image.authors="Duckey Dev <ducky@cloudable.dev>"
LABEL org.opencontainers.image.source="https://github.com/Cloudable-dev/netgoat"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# ---- Install deps first for caching ----
COPY package.json ./
RUN bun install

# ---- Copy full source ----
COPY . .

# ---- Build Next.js app ----
RUN bun run build

# ---- Runtime Stage ----
FROM oven/bun:1 AS runtime
WORKDIR /app

# ---- Copy only necessary files ----
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

RUN bun install

# ---- Set environment ----
ENV NODE_ENV=production
EXPOSE 3000

# ---- Healthcheck ----
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -f http://localhost:3000 || exit 1

# ---- Start server ----
CMD ["bun", "run", "start"]
