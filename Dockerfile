FROM node:12.22.3-alpine

WORKDIR /app

ENV HOST "0.0.0.0"

RUN apk add --no-cache --update tzdata avahi-dev && \
    apk add --no-cache --virtual .gyp python make g++ && \
    apk upgrade --no-cache && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    apk del tzdata && \
    rm -rf /var/cache/apk/*

COPY . /app

RUN yarn install

EXPOSE 8080
