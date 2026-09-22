# Production Dockerfile for Jira-Lite Server
# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY src ./src

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/healthz || exit 1

CMD ["node", "src/server.js"]
