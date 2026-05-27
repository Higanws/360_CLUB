# Job único: aplica schema_mysql.sql + seed_mvp.sql (mismo flujo que npm run db:seed)
# Contexto de build: raíz del repo

FROM node:20-bookworm-slim

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./

ENV NODE_ENV=production

CMD ["npm", "run", "db:seed"]
