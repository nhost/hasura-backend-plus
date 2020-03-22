FROM keymetrics/pm2:12-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# git is required for testing with jest --watch
RUN if [ "$NODE_ENV" != "production" ]; then apk update && apk upgrade && apk add git; fi

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY pm2.json .
COPY src src

ADD . .

CMD ["pm2-runtime", "start", "pm2.json"]
