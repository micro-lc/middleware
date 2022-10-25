FROM node:gallium-alpine

LABEL name="mia-microlc-config-manager" \
      description="The Mia-Platform micro fontend solution configuration manager" \
      eu.mia-platform.url="https://www.mia-platform.eu" \
      eu.mia-platform.version="0.8.1"

ENV LOG_LEVEL=info
ENV SERVICE_PREFIX=/
ENV HTTP_PORT=3000
ENV NODE_ENV=production
ENV PATH="${PATH}:/home/node/app/node_modules/.bin/"

WORKDIR /usr/src/app

COPY package.json ./
COPY .yarn ./.yarn
COPY yarn.lock ./
COPY .yarnrc.yml ./

RUN corepack enable
RUN yarn install --immutable

COPY src ./src
COPY tsconfig.json ./tsconfig.json

RUN yarn build

USER node

CMD yarn lc39 ./dist/server.js --port "$HTTP_PORT" --log-level "$LOG_LEVEL" --prefix="$SERVICE_PREFIX"
