# Base image
FROM node:19

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port 3000 for the Node.js app
EXPOSE 3000

# Start the Node.js app
CMD [ "npm", "start" ]
