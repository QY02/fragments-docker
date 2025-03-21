# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY start_server.sh /start_server.sh
COPY ping_server.sh /ping_server.sh
RUN chmod +x /start_server.sh
RUN chmod +x /ping_server.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx create-next-app@14.2.20 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir
COPY _app.tsx pages/_app.tsx

RUN npx shadcn@2.1.7 init -d
RUN npx shadcn@2.1.7 add --all
RUN npm install posthog-js

WORKDIR /home/user

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
