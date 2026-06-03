FROM node:20-bookworm-slim

WORKDIR /app

COPY mcp-server/package.json mcp-server/package-lock.json ./
RUN npm ci

COPY mcp-server/ ./
RUN npm run build

ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_HTTP_HOST=0.0.0.0
ENV MCP_HTTP_PORT=3100

EXPOSE 3100

CMD ["node", "dist/index.js"]
