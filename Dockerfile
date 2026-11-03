# syntax=docker/dockerfile:1
FROM docker.io/library/node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build

WORKDIR /build

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npm run build

FROM docker.io/library/node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS cleanup

WORKDIR /build

ENV NODE_ENV=production

COPY --from=build /build/LICENSE LICENSE
COPY --from=build /build/package.json .
COPY --from=build /build/package-lock.json .

RUN npm ci

COPY --from=build /build/dist dist


########################################################################################################################

FROM docker.io/library/node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914

# libcrypto3 for 3.3.2-r0 vulnerability
RUN apk add --no-cache --upgrade \
  libcrypto3 \
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
