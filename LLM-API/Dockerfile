FROM node:22.14.0-alpine

WORKDIR /app

# Copy package.json and install dependencies early
COPY app/package*.json ./

RUN npm install

# Copy the rest of the app (excluding node_modules)
COPY app/ .

# Copy .env file from root (optional - can also use --env-file at runtime)
COPY .env .env

CMD ["npm", "run", "dev"]