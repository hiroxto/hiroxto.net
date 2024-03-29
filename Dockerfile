FROM node:20.2.0-slim

WORKDIR /app

ENV HOST "0.0.0.0"

RUN apt update -y && \
    apt install -y --no-install-recommends tzdata && \
    apt clean && \
    rm -rf /var/lib/opt/lists/*

COPY . /app

RUN yarn install

EXPOSE 5173
