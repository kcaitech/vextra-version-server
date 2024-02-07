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

docker build %BUILD_ARGS% -t doc-versioning-service:%VERSION_TAG% -f ./Dockerfile ../
docker tag doc-versioning-service:%VERSION_TAG% docker-registry.protodesign.cn:35000/doc-versioning-service:%VERSION_TAG%
docker login docker-registry.protodesign.cn:35000 -u kcai -p kcai1212
docker push docker-registry.protodesign.cn:35000/doc-versioning-service:%VERSION_TAG%

endlocal
