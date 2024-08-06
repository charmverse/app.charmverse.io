# Install dependencies only when needed

# Use node-slim because node-alpine does not seem to supports the `sharp` npm library that gets built
FROM node:18.19.0-slim AS base-app

# useful for node-alpine
# RUN apk add --no-cache libc6-compat git
RUN apt update
RUN apt install openssl -y

WORKDIR /app

# We should split out dependencies copying into separate layer
COPY . .

ENV PORT=3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=debug

EXPOSE 3000
# need something to keep docker container running until docker-compose runs its command
CMD ["tail", "-f", "/dev/null"]
