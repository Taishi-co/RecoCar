FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY nest-cli.json tsconfig.json ./
COPY src ./src
RUN pnpm build && pnpm prune --prod

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dist ./dist

EXPOSE 34532

CMD ["node", "dist/main.js", "-p", "34532"]
