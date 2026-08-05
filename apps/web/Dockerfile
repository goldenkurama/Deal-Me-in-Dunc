FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/game-core/package.json packages/game-core/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm install

COPY apps/web apps/web
COPY packages packages
RUN npm run build --workspace=@fox-blackjack/web

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
