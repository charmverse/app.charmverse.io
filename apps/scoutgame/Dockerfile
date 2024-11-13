#syntax=docker/dockerfile:1.7-labs

# Use node-slim because node-alpine does not seem to supports the `sharp` npm library that gets built
FROM node:18.19.0-slim AS base-app

# useful for node-alpine
# RUN apk add --no-cache libc6-compat git
RUN apt update
RUN apt install openssl -y

WORKDIR /app

# Copy dependencies
COPY --parents @connect-shared   \
  apps/*/package.json            \
  packages/*/package.json        \
  node_modules                   \
  package.json                   \
  apps/scoutgame/node_modules    \
  apps/scoutgame/package.json    \
  apps/scoutgame/next.config.mjs \
  .

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN npx puppeteer browsers install chrome

# Copy compiled code
COPY --parents apps/*/.next apps/*/public .

ENV PORT=3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=debug

EXPOSE 3000
# need something to keep docker container running until docker-compose runs its command
CMD ["tail", "-f", "/dev/null"]