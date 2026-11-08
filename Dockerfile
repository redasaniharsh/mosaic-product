FROM node:20-alpine AS builder

WORKDIR /app

# Copy ALL package files to root
COPY package.json package-lock* ./
RUN npm install

# Copy server sources (server/ at root level) into /app/server
COPY server/package.json /app/server/package.json
COPY server/package-lock.json /app/server/package-lock.json 2>/dev/null || true
RUN npm install --prefix /app/server || true

# Copy web sources (web/ at root level) into /app/web
COPY web/package.json /app/web/package.json
COPY web/package-lock.json /app/web/package-lock.json 2>/dev/null || true
RUN npm install --prefix /app/web || true

# Copy all source code to their locations
COPY server ./server
COPY web ./web

# --- Build frontend ---
WORKDIR /app/web
RUN npm run build   # tsc -b && vite build

# --- Final stage: combined server serving built web ---
FROM node:20-alpine

WORKDIR /app

# Copy only the built outputs from the builder stage
COPY --from=builder /app/server ./server
COPY --from=builder /app/web/dist ./web/dist

# Install only server deps (no dev deps)
WORKDIR /app/server
RUN npm ci --production 2>/dev/null || npm install --production 2>/dev/null || true

# Expose API port
EXPOSE 4000

# Start the Express server (serves web/dist in production)
CMD ["node", "src/index.js"]