FROM node:20.16.0-alpine3.20 AS node-builder

WORKDIR /backend

COPY package.json .
COPY pnpm-lock.yaml .
RUN corepack install -g pnpm@latest && \
    corepack enable pnpm && \
    pnpm install

COPY tsconfig.json .
COPY src/*.ts src/
RUN pnpm run build

FROM heroiclabs/nakama:3.22.0

COPY --from=node-builder /backend/build/*.js /nakama/data/modules/build/
COPY local.yml /nakama/data/