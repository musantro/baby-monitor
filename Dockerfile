# syntax=docker/dockerfile:1.7

ARG BUILD_IMAGE=node:24-bookworm-slim
ARG RUNTIME_IMAGE=node:24-alpine

FROM ${BUILD_IMAGE} AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY .ssl /usr/local/share/ca-certificates/
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

FROM deps AS build
COPY index.html vite.config.js server.mjs ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM ${RUNTIME_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

COPY --from=build --chown=node:node /app/server.mjs ./server.mjs
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 8080

CMD ["node", "server.mjs"]
