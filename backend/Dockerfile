# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for compilation tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    git \
    curl

# Install Vyper compiler (optional)
RUN pip3 install vyper

# Install Solidity compiler (optional)
RUN curl -L https://github.com/ethereum/solidity/releases/download/v0.8.19/solc-static-linux > /usr/local/bin/solc && \
    chmod +x /usr/local/bin/solc

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Create necessary directories
RUN mkdir -p logs temp uploads

# Copy application source
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S arbitpy -u 1001

# Change ownership of app directory
RUN chown -R arbitpy:nodejs /app
USER arbitpy

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/v1/utils/health || exit 1

# Start the application
CMD ["npm", "start"]

# Labels for metadata
LABEL maintainer="ArbitPy Team <support@arbitpy.com>"
LABEL description="ArbitPy Backend - Smart contract compilation and deployment service"
LABEL version="1.0.0"