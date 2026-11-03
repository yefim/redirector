# base node image
FROM node:26-bookworm-slim as base

# install openssl and sqlite3 for prisma
RUN apt-get update && apt-get install -y openssl sqlite3

# install all node_modules, including dev
FROM base as deps

RUN mkdir /app/
WORKDIR /app/

ADD package.json package-lock.json ./
RUN npm install

# setup production node_modules
FROM base as production-deps

RUN mkdir /app/
WORKDIR /app/

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json package-lock.json ./
RUN npm prune --omit=dev

# Catch missing native binaries before deploying the image.
RUN node -e "require('@sentry/profiling-node')"
RUN node -e "new (require('@prisma/adapter-better-sqlite3').PrismaBetterSqlite3)({url:':memory:'}).connect().then(db => db.dispose())"

# build app
FROM base as build

RUN mkdir /app/
WORKDIR /app/

COPY --from=deps /app/node_modules /app/node_modules

# app code changes all the time
ADD . .
RUN npm run build

# build smaller image for running
FROM base

ENV DATABASE_URL="file:/data/sqlite.db"
ENV PORT="8080"
ENV NODE_ENV="production"

RUN mkdir /app/
WORKDIR /app/

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

ADD . .

CMD ["node", "./start.js"]
