# === Stage 1: Build Dependencies & Application ===
# Use Node.js 18 Alpine as the base for building
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ONLY production dependencies first
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client (Needs @prisma/client, installed above)
RUN npx prisma generate

# Now install ALL dependencies (including dev) needed for build
RUN npm install --include=dev

# Copy the rest of the application source code
COPY . .

# Build the NestJS application (compiles TS to JS in /dist)
RUN npm run build

# === Stage 2: Final Production Image ===
# Use a fresh, clean Node.js 18 Alpine image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV production

# Create non-root user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy essential files from the 'builder' stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder /app/prisma ./prisma/
COPY package.json ./

# Create uploads directory and set ownership
RUN mkdir uploads && chown nestjs:nodejs uploads

# --- THIS IS THE CRITICAL FIX ---
# Change ownership of node_modules and prisma to the 'nestjs' user
# This gives the user permission to run 'prisma generate'
RUN chown -R nestjs:nodejs /app/node_modules
RUN chown -R nestjs:nodejs /app/prisma
# --- END OF FIX ---

# Switch execution to the non-root user
USER nestjs

# Expose the internal port the NestJS app listens on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "dist/main"]