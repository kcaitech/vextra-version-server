#!/bin/bash

# 检查是否提供了足够的参数
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <NPM_USERNAME> <NPM_PASSWORD>"
    exit 1
fi

docker pull node:20-alpine

container_name='kcversion'

# 使用 docker images | grep 检查镜像是否存在
if [ "$(docker images | grep ${container_name}-pre | awk '{print $2}' | sed 's/[^0-9.]*//g')" != "1.0.0" ]; then
    docker build -t ${container_name}-pre:1.0.0 -f Dockerfile-pre . || exit $?
fi

# 读取 package.json 中的版本号
version=$(cat package.json | grep '"version"' | sed 's/[^0-9.]*//g')

# 输出版本号
echo "version: $version"
echo '---'

# 使用 docker buildx 构建多平台镜像
docker build \
    -t ${container_name}:$version \
    -f Dockerfile \
    --build-arg NPM_USERNAME=$1 \
    --build-arg NPM_PASSWORD=$2 \
    . # 注意这里的最后的 "."
