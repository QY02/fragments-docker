# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY start_server.sh /start_server.sh
COPY ping_server.sh /ping_server.sh
RUN chmod +x /start_server.sh
RUN chmod +x /ping_server.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/vue-app

RUN npx nuxi@latest init . --packageManager=npm --gitInit=no -f
RUN npx nuxi@latest module add tailwindcss
COPY nuxt.config.ts /home/user/vue-app/nuxt.config.ts

WORKDIR /home/user

# Move the Vue app to the home directory and remove the Vue directory
RUN mv /home/user/vue-app/* /home/user/ && rm -rf /home/user/vue-app
