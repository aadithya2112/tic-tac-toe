FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

COPY . .

RUN pnpm install 

# Build the specific app
RUN pnpm run build --filter=ws

EXPOSE 8080

# Start the app (assuming the start script is in the ws package)

CMD ["pnpm", "run", "dev", "--filter=ws"]