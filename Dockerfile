FROM keymetrics/pm2:12-alpine

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY pm2.json .
COPY src src

ADD . .

CMD ["pm2-runtime", "start", "pm2.json"]
