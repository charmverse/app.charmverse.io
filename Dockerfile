# Install dependencies only when needed
FROM node:16-alpine AS testing_app
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR /app

COPY *.json ./
RUN npm ci --no-audit --no-fund \
           --legacy-peer-deps

COPY . ./
RUN npm run build:prisma
RUN npm run build

ENV PORT 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000
CMD ["npm", "run", "start:test"]


# Create TESTING image
FROM testing_app AS serving_app

RUN npm prune --production

CMD ["npm", "run", "start:staging"]
