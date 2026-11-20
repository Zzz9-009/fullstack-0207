@echo off
chcp 65001 >nul
title 便携版 MySQL · 端口 3306
echo 正在启动 MySQL（保持此窗口不要关闭）……
"C:\Users\Asus\wzx-mysql\mysql-8.0.28-winx64\bin\mysqld.exe" --defaults-file="C:\Users\Asus\wzx-mysql\my-cache.ini"
pause
