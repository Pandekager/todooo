FROM oven/bun:1 AS builder
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
COPY app/ app/
COPY server/ server/
COPY public/ public/
COPY nuxt.config.ts tsconfig.json ./
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NUXT_DATABASE_PATH=/data/todooo.db
RUN mkdir -p /data
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
