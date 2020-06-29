FROM node:14.4.0-alpine3.11

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PORT 3000

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn build

HEALTHCHECK --interval=60s --timeout=2s --retries=3 CMD wget ${HOST}:${PORT}/healthz -q -O - > /dev/null 2>&1

CMD ["yarn", "start"]
