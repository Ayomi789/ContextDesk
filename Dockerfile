# ContextDesk API — production image.
#
# Build from the repo root:
#   docker build -t contextdesk-api .
# Run (env required: DATABASE_URL, JWT_SECRET; plus FRONTEND_URL in prod):
#   docker run -p 5011:5011 --env-file apps/api/.env contextdesk-api
#   docker run -p 5011:5011 -e DATABASE_URL=... -e JWT_SECRET=... contextdesk-api

FROM node:24-slim AS build

# Prisma engines need OpenSSL (node:24-slim trixie omits it).
RUN apt-get update -y && \
  apt-get install -y --no-install-recommends openssl && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Workspace metadata first for a cached dependency layer.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install the full workspace tree (api + shared-types + web metadata).
RUN npm ci

# Sources needed for the build.
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types

RUN npm run build --workspace=@contextdesk/shared-types
RUN npm exec --workspace=api -- prisma generate
RUN npm run build --workspace=api
RUN npm prune --omit=dev

FROM node:24-slim AS runtime

# Prisma engines need OpenSSL at runtime too.
RUN apt-get update -y && \
  apt-get install -y --no-install-recommends openssl && \
  rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages/shared-types ./packages/shared-types

EXPOSE 5011

CMD ["node", "apps/api/dist/server.js"]
