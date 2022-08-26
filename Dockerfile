# Install dependencies only when needed
FROM node:16-alpine AS BASE_APP
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .

ENV PORT 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000
CMD ["npm", "run", "start:test"]

# Start of Staging web app
# FROM BASE_APP as Staging_WebAPP
# LABEL "com.datadoghq.ad.logs"='[{"source": "nodejs", "service": "webapp"}]'
# CMD ["npm", "run", "start:staging"]


# # Start of Prod web app
# FROM BASE_APP as Prod_WebAPP 
# LABEL "com.datadoghq.ad.logs"='[{"source": "nodejs", "service": "webapp"}]'
# CMD ["npm", "run", "start:prod"]


# FROM BASE_APP as Prod_Cron
# LABEL "com.datadoghq.ad.logs"='[{"source": "nodejs", "service": "cron"}]'
# CMD ["npm", "run", "cron:prod"]
