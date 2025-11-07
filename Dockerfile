# === Stage 1: Install Dependencies ===
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies (prod + dev)
RUN npm ci

# === Stage 2: Build Application ===
FROM node:18-alpine AS builder
WORKDIR /app
# Copy all dependencies from 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source code
COPY . .
# Generate Prisma client based on the copied schema
RUN npx prisma generate
# Build the application (compiles TS to JS)
RUN npm run build

# === Stage 3: Final Production Image ===
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV production

# Create non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package files to install *only* production dependencies
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copy built code from 'builder' stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
# Copy Prisma client from 'builder' stage (generated with all fields)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# Copy Prisma schema
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Create uploads directory and set ownership
RUN mkdir uploads && chown nestjs:nodejs uploads
# Fix ownership for node_modules and prisma folder
RUN chown -R nestjs:nodejs /app/node_modules
RUN chown -R nestjs:nodejs /app/prisma

# Switch to the non-root user
USER nestjs

# Expose the internal port
EXPOSE 3000

# Run the application
CMD ["node", "dist/main"]