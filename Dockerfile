FROM keymetrics/pm2:10-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY pm2.json .
COPY src src

ADD . .

CMD ["pm2-runtime", "start", "pm2.json"]
