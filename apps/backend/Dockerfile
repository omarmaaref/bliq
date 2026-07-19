# syntax=docker/dockerfile:1.7

# --- build stage: install ALL deps + compile TypeScript -----------------------
FROM node:22-alpine AS build
WORKDIR /app

# Deps first — good layer caching when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build

# --- runtime stage: production deps only, non-root user ----------------------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=developement
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

# node:alpine ships wget via busybox — good enough for a health probe.
HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health >/dev/null || exit 1

USER node
CMD ["node", "dist/main.js"]
