# alpine
FROM node:20-alpine AS builder
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
RUN npm run build

FROM node:20-alpine AS runner
USER root
WORKDIR /app
COPY --from=builder /app/node_modules ./
COPY --from=builder /app/dist ./
COPY ./static ./static
RUN mkdir -p /app/log && touch /app/log/all.log
CMD node /app/dist/server.js | tee /app/log/all.log 2>&1
