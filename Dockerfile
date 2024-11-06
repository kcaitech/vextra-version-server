# alpine
FROM kcversion-builder:1.0.1 AS builder
#FROM doc-versioning-service-node20-slim-builder:latest as runner

USER root

WORKDIR /app
COPY . .

ARG NPM_USERNAME
ARG NPM_PASSWORD

RUN rm -f .npmrc
# node16-
#RUN echo "_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> ~/.npmrc
    
# node18+
RUN echo "//packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/:_auth=$(echo -n "$NPM_USERNAME:$NPM_PASSWORD" | base64)" >> .npmrc
RUN echo "always-auth=true" >> .npmrc
RUN echo "registry=https://packages.aliyun.com/6393d698d690c872dceedcc0/npm/npm-registry/" >> .npmrc
# RUN cat .npmrc

RUN cat package.json | sed '/skia-canvas/d' > package1.json
RUN rm -f package.json
RUN mv package1.json package.json
RUN npm i
RUN mv skia-canvas/lib-linux-x64-musl/v6 skia-canvas/lib
RUN mv skia-canvas node_modules

RUN npm run build

RUN mv node_modules/skia-canvas .
RUN rm -rf node_modules
RUN npm i --omit=dev
RUN mv skia-canvas node_modules

FROM kcversion-pre:1.0.1
USER root
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY ./static ./static
RUN mkdir -p /app/log && touch /app/log/all.log
CMD node /app/dist/server.js 2>&1 | tee /app/log/all.log
# CMD sleep 330000
