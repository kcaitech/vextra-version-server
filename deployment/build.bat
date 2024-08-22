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
:: docker build --target builder --build-arg NPM_USERNAME=xxx --build-arg NPM_PASSWORD=xxx -t doc-versioning-service-node20-alpine-builder:latest -f ./Dockerfile ../
:: docker build --target builder --build-arg NPM_USERNAME=xxx --build-arg NPM_PASSWORD=xxx -t doc-versioning-service-node20-slim-builder:latest -f ./Dockerfile ../
:: 构建runner镜像：
:: docker build --target runner --build-arg NPM_USERNAME=xxx --build-arg NPM_PASSWORD=xxx -t doc-versioning-service:latest -f ./Dockerfile ../

docker build --target runner %BUILD_ARGS% -t doc-versioning-service:%VERSION_TAG% -f ./Dockerfile ../
docker tag doc-versioning-service:%VERSION_TAG% registry.protodesign.cn:36000/kcserver/doc-versioning-service:%VERSION_TAG%
docker login registry.protodesign.cn:36000 -u kcserver1 -p gnRY=Sha9_J]DXS
docker push registry.protodesign.cn:36000/kcserver/doc-versioning-service:%VERSION_TAG%

endlocal
