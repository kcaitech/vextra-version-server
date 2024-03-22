:: 设置k8s节点机的ssh端口的转发（通过跳板机）
@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

call add_ssh_key.bat root@192.168.0.18 22

:: 如果存在ssh_pids文件则执行stop.bat脚本删除之前的ssh进程
:: if exist ssh_pids.txt (
    :: call stop.bat
:: )

:: 定义端口映射规则
:: kuboard访问端口
set ports[0]=30001:172.16.0.20:30001

:: 获取数组长度
set length=0
:loop
if defined ports[%length%] (
    set /a length+=1
    goto loop
)
if %length%==0 (
    echo 未定义端口映射规则
    pause > nul
    exit /b
)

set /a end=length-1
for /L %%i in (0,1,%end%) do (
    set port=!ports[%%i]!
    powershell.exe -NoProfile -Command "$process = Start-Process -FilePath 'ssh' -ArgumentList '-N -L !port! root@192.168.0.18' -NoNewWindow -PassThru; $process.Id | Out-File ssh_pids.txt"
)

echo 脚本已执行...
pause > nul

endlocal
