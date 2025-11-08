# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Expose app port (3000)
EXPOSE 3000

# Start the backend app
CMD ["node", "server.js"]
