FROM node:hydrogen-alpine as build

ARG COMMIT_SHA=<not-specified>
ENV NPM_CONFIG_CACHE="/tmp"

WORKDIR /build-dir

COPY LICENSE .
COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY schemas ./schemas
COPY scripts ./scripts
COPY src ./src
COPY tsconfig.json .
COPY .eslintrc.js .

RUN npm run build

RUN echo "microlc/middleware: $COMMIT_SHA" >> ./commit.sha

########################################################################################################################

FROM node:hydrogen-alpine

# - stop vulnerabilities:package HIGH Vulnerability found in os package type (APKG) - libcrypto3 (fixed in: 3.0.8-r2)(CVE-2023-0464 - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-0464)
# - stop vulnerabilities:package HIGH Vulnerability found in os package type (APKG) - libssl3 (fixed in: 3.0.8-r1)(CVE-2023-0464 https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-0464)
# - stop vulnerabilities:package MEDIUM Vulnerability found in os package type (APKG) - libssl3 (fixed in: 3.0.8-r2)(CVE-2023-0465 https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-0465)
# - stop vulnerabilities:package MEDIUM Vulnerability found in os package type (APKG) - libssl3 (fixed in: 3.0.8-r3)(CVE-2023-0466 https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-0466)
RUN apk add --no-cache --upgrade libcrypto3 libssl3

RUN apk add --no-cache tini

LABEL name="middleware" \
      description="micro-lc config server implementing parsing and acl utils"

ENV LOG_LEVEL=info
ENV SERVICE_PREFIX=/
ENV HTTP_PORT=3000
ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE="/tmp"

COPY --from=build /build-dir/package.json package.json
COPY --from=build /build-dir/package-lock.json package-lock.json
COPY --from=build /build-dir/LICENSE LICENSE
COPY --from=build /build-dir/dist dist
COPY --from=build /build-dir/commit.sha commit.sha

RUN npm ci --omit=dev

USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD ./node_modules/.bin/lc39 ./dist/server.js --port=${HTTP_PORT} --log-level=${LOG_LEVEL}
