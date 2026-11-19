FROM node:20-alpine AS builder

WORKDIR /app

# Copy ALL root-level files
COPY package.json package-lock* ./
RUN npm install

# Copy server from server/ directory at root level
COPY server ./server
RUN npm install --prefix /app/server || true

# Copy web from web/ directory at root level  
COPY web ./web
RUN npm install --prefix /app/web || true

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

# Single Express process serves the API and the built SPA on port 3000.
ENV PORT=3000
EXPOSE 3000

# Start the Express server (serves web/dist in production)
CMD ["node", "src/index.js"]