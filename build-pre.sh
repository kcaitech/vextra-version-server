#!/bin/bash


version='1.0.0'

# 输出版本号
echo "version: $version"
echo '---'

# 创建并使用一个 buildx 构建器实例
docker buildx create --use

# 使用 docker buildx 构建多平台镜像
docker buildx build \
  --platform 'linux/amd64' \
  -t kcnode:$version \
  -f Dockerfile-pre \
  --load .  # 注意这里的最后的 "."