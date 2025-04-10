FROM node:20-alpine3.19

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific npm version and clean npm cache
RUN apk add --no-cache dumb-init && \
    npm install -g npm@latest && \
    npm ci --only=production && \
    npm cache clean --force && \
    # Remove unnecessary files
    rm -rf /tmp/* /var/cache/apk/*

COPY --chown=appuser:appgroup . .

# Use non-root user
USER appuser

EXPOSE 3000


CMD ["node", "src/server.js"]
