# syntax=docker/dockerfile:1

# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy lockfile and package.json
COPY package.json yarn.lock ./

# Install dependencies with frozen lockfile
# --ignore-scripts: skip lifecycle scripts (e.g. the "prepare" git-hook installer
# referencing scripts/setup-hooks.mjs, which is not in the Docker build context)
RUN yarn install --frozen-lockfile --production=false --ignore-scripts

# ========================================
# Stage 2: Builder
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json yarn.lock ./
COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY middleware.ts ./

# Build Next.js app (standalone output)
RUN yarn build

# ========================================
# Stage 3: Runner
# ========================================
FROM node:20-alpine AS runner

# Upgrade Alpine packages to patch CVEs
RUN apk upgrade --no-cache

# Remove npm/npx/corepack to eliminate Trivy findings
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
