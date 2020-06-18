FROM node:12.18.1-alpine

WORKDIR /app

ENV HOST "0.0.0.0"

RUN apk add --no-cache --update tzdata && \
    apk upgrade --no-cache && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    apk del tzdata && \
    rm -rf /var/cache/apk/*

COPY . /app

RUN yarn install

EXPOSE 8080
