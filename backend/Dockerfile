# ==========================================
# Stage 1: Build & Compilation Environment
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Enforce least-privilege security principle: run container as non-root 'node' user
USER node

# Expose HTTP application port
EXPOSE 5000

# Container healthcheck querying the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application server
CMD ["node", "dist/server.js"]
