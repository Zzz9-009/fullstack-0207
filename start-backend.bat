@echo off
chcp 65001 >nul
title 科技图文站 - 后端服务
cd /d %~dp0backend

rem 项目自带 Node 24 便携版时优先使用，找不到则退回系统 node
set "WZX_NODE=%~dp0..\tools\node-v24.11.0-win-x64"
if exist "%WZX_NODE%\node.exe" set "PATH=%WZX_NODE%;%PATH%"

call npm run start
echo.
echo 服务已退出，按任意键关闭窗口。
pause
