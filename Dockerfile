# ==========================================
# STAGE 1: Build the Vue Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies manifest
COPY frontend/package*.json ./
RUN npm install

# Copy source code and build static assets
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Final Production Runtime Image
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV UDP_PORT=5607
ENV WS_PORT=8080

# Install production dependencies only
COPY backend/package*.json ./
RUN npm install --only=production

# Copy plain JavaScript backend files directly
COPY backend/server.js backend/parser.js ./

# Copy compiled frontend assets to 'public' folder served by backend Express
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose WebSocket/HTTP port and UDP Telemetry port
EXPOSE 8080
EXPOSE 5607/udp

# Start the application
CMD ["node", "server.js"]
