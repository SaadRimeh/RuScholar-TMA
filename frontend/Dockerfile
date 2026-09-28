# ==========================================
# Stage 1: Build & Asset Bundling
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build static production distribution with Vite
RUN npm run build

# ==========================================
# Stage 2: High-Performance Nginx Web Server
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy bundled static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
