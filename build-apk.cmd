@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ============================================
echo   Echo 口语 - Android APK 构建
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 没有找到 Node.js。请先安装 Node.js 20 或更高版本。
  echo https://nodejs.org/
  pause
  exit /b 1
)

rem 不使用 Git 也可以构建；EAS 会按照 .gitignore 打包项目文件。
set EAS_NO_VCS=1

echo [1/3] 检查 Expo 登录状态...
call npx eas-cli@latest whoami >nul 2>&1
if errorlevel 1 (
  echo.
  echo 还没有登录 Expo 账号。请先注册一个免费账号：
  echo https://expo.dev/signup
  echo.
  call npx eas-cli@latest login
  if errorlevel 1 (
    echo [错误] 登录失败，请重试。
    pause
    exit /b 1
  )
)

echo.
echo [2/3] 开始云端构建 APK...
echo 首次构建会询问是否生成 Android Keystore，选择 Yes 即可。
echo 构建在 Expo 云端进行，关闭窗口不会中断构建。
echo.
call npx eas-cli@latest build --platform android --profile preview

echo.
echo [3/3] 构建命令结束。
echo 如果成功，上面的链接可以下载 APK，也可以直接用手机扫码。
echo 如果失败，把上面最后 20 行错误发给我。
pause
