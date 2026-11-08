FROM node:20-alpine AS builder

WORKDIR /app

# --- Install deps (server + web in one stage) ---
COPY package.json package-lock* ./
RUN npm ci

# Copy server sources
COPY server/package.json server/package-lock* ./
RUN npm ci --prefix server

# Copy web sources
COPY web/package.json web/package-lock* ./
RUN npm ci --prefix web

# Copy all source code
COPY server/server ./server
COPY web/web ./web

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
RUN npm ci --production

# Expose API port
EXPOSE 4000

# Start the Express server (serves web/dist in production)
CMD ["node", "src/index.js"]