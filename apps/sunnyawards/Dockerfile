#syntax=docker/dockerfile:1.7-labs

# Use node-slim because node-alpine does not seem to supports the `sharp` npm library that gets built
FROM node:18.19.0-slim AS base-app

# useful for node-alpine
# RUN apk add --no-cache libc6-compat git
RUN apt update
RUN apt install openssl -y

WORKDIR /app

# Copy dependencies
# TODO: run npm install in Dockerfile instead of copying node_modules, then we should be able to remove other apps
COPY --parents @connect-shared  \
  apps/*/package.json           \
  packages/*/package.json       \
  node_modules                  \
  apps/sunnyawards/node_modules \
  apps/sunnyawards/package.json \
  apps/sunnyawards/next.config.js \
  package.json                  \
  .

# Copy compiled code
COPY --parents apps/sunnyawards/.next apps/sunnyawards/public .

ENV PORT=3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=debug

EXPOSE 3000
# need something to keep docker container running until docker-compose runs its command
CMD ["tail", "-f", "/dev/null"]
