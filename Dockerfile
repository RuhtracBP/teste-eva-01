FROM node:18.19-alpine3.19

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./

# Install dependencies and clean npm cache
RUN npm ci --only=production && \
    npm cache clean --force

COPY --chown=appuser:appgroup . .

# Use non-root user
USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
