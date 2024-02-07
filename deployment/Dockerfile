FROM node:20-alpine as runner
#FROM node:20-slim as runner

#ENV PROJECT_ENV production
#ENV NODE_ENV production

ENV TZ=Asia/Shanghai

RUN set -ex \
    && sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
    && apk --update add tzdata \
    && cp /usr/share/zoneinfo/"${TZ}" /etc/localtime \
    && apk --no-cache add ca-certificates \
    && apk --no-cache add fontconfig

#RUN sed -i 's@deb.debian.org@mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/debian.sources
#RUN echo "${TZ}" > /etc/timezone \
#    && ln -sf /usr/share/zoneinfo/"${TZ}" /etc/localtime \
#    && apt-get update \
#    && apt-get install -y tzdata \
#    && apt-get install -y ca-certificates \
#    && apt-get install -y -q --no-install-recommends libfontconfig1 \
#    && apt-get clean \
#    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN rm -rf ./*
COPY . .
ARG NPM_USERNAME
ARG NPM_PASSWORD
#RUN echo "_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc
RUN echo "//packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/:_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc
RUN echo "always-auth=true" >> ~/.npmrc
RUN echo "registry=https://packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/" >> ~/.npmrc
RUN npm i typescript -g && npm i
RUN rm -f ~/.npmrc
RUN npm run build
RUN rm -rf ./node_modules/skia-canvas

RUN mkdir -p /app/dist/log && touch /app/dist/log/all.log
CMD npm i && node /app/dist/server.js | tee /app/dist/log/all.log 2>&1
