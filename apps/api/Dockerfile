FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm install

COPY apps/api apps/api
COPY packages/shared-types packages/shared-types
RUN npm run build --workspace=@fox-blackjack/api

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm install --omit=dev --workspace=@fox-blackjack/api --include-workspace-root
COPY --from=build /app/apps/api/dist ./apps/api/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
