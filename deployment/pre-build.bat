:: 构建镜像并上传到仓库
@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

set VERSION_TAG=%1
if "%VERSION_TAG%"=="" (
    set VERSION_TAG=latest
)

set "BUILD_ARGS="
for /f "tokens=1,* delims==" %%a in (.env) do (
    set "BUILD_ARGS=!BUILD_ARGS! --build-arg %%a=%%b"
)

:: 构建builder镜像：
docker build --target builder %BUILD_ARGS% -t doc-versioning-service-node20-alpine-builder:latest -f ./Dockerfile ../
:: docker build --target builder %BUILD_ARGS% -t doc-versioning-service-node20-slim-builder:latest -f ./Dockerfile ../

endlocal
