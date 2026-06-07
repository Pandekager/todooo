FROM oven/bun:1 AS builder
WORKDIR /app
COPY bun.lock package.json ./
COPY app/ app/
COPY server/ server/
COPY public/ public/
COPY nuxt.config.ts tsconfig.json vitest.config.ts ./
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
RUN mkdir -p /data
ENV NUXT_DATABASE_PATH=/data/todooo.db
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs", "--host", "0.0.0.0"]
