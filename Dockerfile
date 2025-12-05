
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Create data and uploads directories (for volume mounting)
RUN mkdir -p src/data uploads

# Expose port
EXPOSE 3002

# Start server
CMD ["node", "server/api.js"]
