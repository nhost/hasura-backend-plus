FROM keymetrics/pm2:12-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV SERVER_PORT 3000

# git is required for testing with jest --watch
RUN if [ "$NODE_ENV" == "development" ]; then apk update && apk upgrade && apk add git; fi

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY pm2.json .
COPY src src

ADD . .

HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD wget localhost:${SERVER_PORT}/healthz -q -O - > /dev/null 2>&1

CMD ["pm2-runtime", "start", "pm2.json"]
