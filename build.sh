#!/bin/bash

# 检查是否提供了足够的参数
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <NPM_USERNAME> <NPM_PASSWORD>"
  exit 1
fi

# 读取 package.json 中的版本号
version=$(cat package.json | grep '"version"' | sed 's/[^0-9.]*//g')

# 输出版本号
echo "version: $version"
echo '---'

# 创建并使用一个 buildx 构建器实例
docker buildx create --use

# 使用 docker buildx 构建多平台镜像
docker buildx build \
  --platform 'linux/amd64' \
  -t kcserver:$version \
  -f Dockerfile \
  --build-arg NPM_USERNAME=$1 \
  --build-arg NPM_PASSWORD=$2 \
  --load .  # 注意这里的最后的 "."