# Install dependencies only when needed
FROM node:16-alpine AS running_app
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR /app

COPY *.json ./
RUN npm ci --no-audit --no-fund --omit dev \
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
CMD ["npm", "run", "start:staging"]


# Create TESTING image
FROM serving_app AS testing_app

RUN npm ci --no-audit --no-fund --include dev \
           --legacy-peer-deps

CMD ["npm", "run", "start:staging"]
