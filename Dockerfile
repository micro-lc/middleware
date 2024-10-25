# syntax=docker/dockerfile:1
FROM docker.io/library/node:20.18.0-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS build

WORKDIR /build

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npm run build

FROM docker.io/library/node:20.18.0-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS cleanup

WORKDIR /build

ENV NODE_ENV=production

COPY --from=build /build/LICENSE LICENSE
COPY --from=build /build/package.json .
COPY --from=build /build/package-lock.json .

RUN npm ci

COPY --from=build /build/dist dist


########################################################################################################################

FROM docker.io/library/node:20.18.0-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9

RUN apk add --no-cache --upgrade \
  tini

ENV LOG_LEVEL=info
ENV SERVICE_PREFIX=/
ENV HTTP_PORT=3000
ENV NODE_ENV=production

WORKDIR /node/app

COPY --from=cleanup /build .

USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD ./node_modules/.bin/lc39 ./dist/server.js --port=${HTTP_PORT} --log-level=${LOG_LEVEL}
