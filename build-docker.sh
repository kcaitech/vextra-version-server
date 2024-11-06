#!/bin/bash

# 检查是否提供了足够的参数
# if [ "$#" -ne 2 ]; then
#     echo "Usage: $0 <NPM_USERNAME> <NPM_PASSWORD>"
#     exit 1
# fi
# NPM_USERNAME=$1
# NPM_PASSWORD=$2

NPM_USERNAME=6393d66c28b61c88e7f83906
NPM_PASSWORD=z2tzwCltb1gk

docker pull node:22-alpine3.19

container_name='kcversion'

pre_version='1.0.1'
builder_version='1.0.1'
# 使用 docker images | grep 检查镜像是否存在
if [ "$(docker images | grep ${container_name}-pre | awk '{print $2}' | sed 's/[^0-9.]*//g')" != "${pre_version}" ]; then
    docker build -t ${container_name}-pre:${pre_version} -f Dockerfile-pre . || exit $?
fi

# 使用 docker images | grep 检查镜像是否存在
if [ "$(docker images | grep ${container_name}-builder | awk '{print $2}' | sed 's/[^0-9.]*//g')" != "${builder_version}" ]; then
    docker build \
        -t ${container_name}-builder:${builder_version} \
        -f Dockerfile-builder \
        --build-arg NPM_USERNAME=$NPM_USERNAME \
        --build-arg NPM_PASSWORD=$NPM_PASSWORD \
        . || exit $?
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
    --build-arg NPM_USERNAME=$NPM_USERNAME \
    --build-arg NPM_PASSWORD=$NPM_PASSWORD \
    . # 注意这里的最后的 "."
