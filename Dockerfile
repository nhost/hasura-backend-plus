FROM node:12-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PORT 3000
ENV HOST localhost

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

HEALTHCHECK --interval=60s --timeout=2s --retries=3 CMD wget ${HOST}:${PORT}/healthz -q -O - > /dev/null 2>&1

CMD ["yarn", "start"]
