FROM node:12-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PORT 3000

# git is required for testing with jest --watch
RUN if [ "$NODE_ENV" != "production" ]; then apk update && apk upgrade && apk add git; fi

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY src src

ADD . .

HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD wget localhost:${PORT}/healthz -q -O - > /dev/null 2>&1

CMD ["yarn", "start"]
