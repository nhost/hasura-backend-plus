FROM node:14-alpine AS builder
WORKDIR /app
COPY . .
RUN apk add --update --no-cache python3 g++ make vips-dev

COPY package.json yarn.lock ./
RUN yarn install
RUN yarn build

FROM node:14-alpine
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PORT 3000
RUN apk add --update --no-cache vips-dev

ENV PGOPTIONS "-c search_path=auth"

WORKDIR /app

COPY package.json .

COPY --from=builder /app/dist dist
COPY --from=builder /app/node_modules node_modules
COPY custom custom
COPY migrations migrations
COPY prod-paths.js .

HEALTHCHECK --interval=60s --timeout=2s --retries=3 CMD wget localhost:${PORT}/healthz -q -O - > /dev/null 2>&1

EXPOSE $PORT
CMD ["yarn", "start"]
