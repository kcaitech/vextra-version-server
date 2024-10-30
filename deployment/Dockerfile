# alpine
FROM node:20-alpine as builder

# debian12
#FROM node:20-slim as builder

USER root

WORKDIR /app

#ENV PROJECT_ENV production
#ENV NODE_ENV production

ENV TZ=Asia/Shanghai

RUN rm -rf ./*
COPY . .

RUN set -ex \
    && sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
    && apk --update add tzdata \
    && cp /usr/share/zoneinfo/"${TZ}" /etc/localtime \
    && apk --no-cache add ca-certificates \
    && apk --no-cache add fontconfig \
    && rm -rf /var/cache/*

# debian12
#RUN sed -i 's@deb.debian.org@mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/debian.sources
#RUN echo "${TZ}" > /etc/timezone \
#    && ln -sf /usr/share/zoneinfo/"${TZ}" /etc/localtime \
#    && apt-get update \
#    && apt-get install -y tzdata \
#    && apt-get install -y ca-certificates \
#    && apt-get install -y -q --no-install-recommends libfontconfig1 \
#    && apt-get clean \
#    && rm -rf /var/lib/apt/lists/*

ARG NPM_USERNAME
ARG NPM_PASSWORD

RUN rm -f ~/.npmrc

# node16-
#RUN echo "_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc

# node18+
RUN echo "//packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/:_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc
RUN echo "always-auth=true" >> ~/.npmrc

RUN echo "registry=https://packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/" >> ~/.npmrc

# 不需要私有镜像仓库
#RUN echo "registry=https://registry.npmmirror.com" >> ~/.npmrc
#RUN npm i webpack && npm i
RUN npm i typescript -g && npm i
#RUN npm update
RUN rm -f ~/.npmrc
RUN ls | grep -v node_modules | xargs rm -rf

FROM doc-versioning-service-node20-alpine-builder:latest as runner
#FROM doc-versioning-service-node20-slim-builder:latest as runner

USER root

WORKDIR /app
COPY . .

ARG NPM_USERNAME
ARG NPM_PASSWORD

RUN rm -f ~/.npmrc

# node16-
#RUN echo "_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc

# node18+
RUN echo "//packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/:_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc
RUN echo "always-auth=true" >> ~/.npmrc

RUN echo "registry=https://packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/" >> ~/.npmrc

RUN npm i
RUN rm -f ~/.npmrc
RUN ./node_modules/.bin/webpack --config webpack.config.js --mode production
RUN rm -rf ./node_modules/skia-canvas/lib/v6/index.node
RUN mv ./skia-canvas/lib/v6/index.node ./node_modules/skia-canvas/lib/v6/index.node

RUN mkdir -p /app/dist/log && touch /app/dist/log/all.log
CMD node /app/dist/server.js | tee /app/dist/log/all.log 2>&1
