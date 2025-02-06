FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app


COPY lib ./lib
COPY types ./types
COPY package*json tsconfig.json server.ts index.ts ./
RUN ls -la && echo "Contents of types directory:" && ls -la types/

RUN npm ci && \
    npm run build && \
    npm prune --production

FROM base AS runner
WORKDIR /app

ENV HOARDER_URL=https://hoarder
ENV HOARDER_API_KEY=apikey
ENV ACCESS_TOKEN=access_token

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3000

CMD ["node", "/app/dist/server.js"]