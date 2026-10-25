# 把 Echo 打包成 Android APK

这份说明对应「B 方案」：用 Expo 的云端构建服务 EAS Build，生成一个可以独立安装的 APK。电脑不需要安装 Android Studio，也不需要 JDK。

## 0. 准备

- 一台 Windows 电脑，已安装 Node.js 20+
- 一个 Android 手机
- 一个免费的 Expo 账号：<https://expo.dev/signup>
- 项目目录：`D:\新建文件夹\echo-speaking`

不需要 Git：项目里的构建脚本会设置 `EAS_NO_VCS=1`，EAS 会按 `.gitignore` 打包文件。

## 1. 一键构建

双击项目根目录的 **`build-apk.cmd`**。

脚本会依次做三件事：

1. 检查 Node.js 和 Expo 登录状态；
2. 没登录就打开 EAS 登录流程；
3. 执行 `eas build --platform android --profile preview`。

首次运行时 `npx` 需要下载 EAS CLI，可能要等一两分钟。

## 2. 手动命令（如果你想自己敲）

打开 PowerShell：

```powershell
cd "D:\新建文件夹\echo-speaking"
$env:EAS_NO_VCS = "1"
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

`eas login` 会要求输入 Expo 账号的邮箱/用户名和密码。密码只输入给 Expo 官方 CLI，不要发给任何人。

检查当前登录账号：

```powershell
npx eas-cli@latest whoami
```

## 3. 第一次构建会问什么

| 提示 | 选择 |
| --- | --- |
| Would you like to create a project for @yourname/echo-speaking? | **Yes** |
| Generate a new Android Keystore? | **Yes** |
| Do you want to upload the project? | **Yes** |

- 第一次构建会在 expo.dev 创建项目，并把 `projectId` 写进 `app.json`。
- EAS 会托管 Android 签名证书（Keystore）。以后更新 App 必须用同一个 Expo 账号，不要删除这个项目。
- `eas.json` 里已经配置了 `preview` 使用 APK，而不是应用商店的 AAB。

## 4. 下载和安装

构建完成后，终端会输出类似链接：

```text
https://expo.dev/accounts/你的账号/projects/echo-speaking/builds/xxxxxxxx
```

1. 用手机浏览器打开这个链接，或直接扫构建页面上的二维码；
2. 下载 `.apk`；
3. 系统提示「禁止安装未知应用」时，允许浏览器/文件管理器安装；
4. 安装完成后打开 **Echo 口语**。

第一次录音时，App 会请求麦克风权限，选择允许。

## 5. 改了代码之后怎么更新

每次重新构建前，把 `app.json` 里的两个数字加一：

```json
"version": "1.0.1",
"android": {
  "versionCode": 2
}
```

然后再次运行 `build-apk.cmd`。如果 `versionCode` 不变，Android 可能会拒绝覆盖安装。

## 6. 常见问题

### 构建一直排队

免费账号有队列，通常几分钟到十几分钟。可以关闭终端，构建在云端继续；之后打开 expo.dev 的 Builds 页面查看。

### 登录时报网络错误

EAS 需要访问 `expo.dev` 和 `api.expo.dev`。如果公司网络需要代理，先在 PowerShell 里设置：

```powershell
$env:HTTPS_PROXY = "http://你的代理地址:端口"
```

### 安装时提示「应用未安装」

- 手机上已经装过同包名、但签名不同的版本：先卸载旧版再装；
- 磁盘空间不足；
- APK 下载不完整，重新下载。

### 打开后白屏

- 确认下载的是构建成功的那一次 APK；
- 用 `adb logcat` 或 EAS 构建日志排查；
- 如果是原生模块问题，重新构建而不是用 Expo Go 打开。

### 朗读没有声音

APK 使用手机系统的 en-US 语音。到系统设置里安装/启用英文语音数据（Android：设置 → 系统 → 语言和输入 → 文字转语音输出）。

### 录音没反应

到系统设置 → 应用 → Echo 口语 → 权限，打开麦克风。Android 13+ 首次使用也会弹权限框。

## 7. 费用和数据

- EAS Build 免费账号可以构建 Android APK，有排队和每月额度限制；个人测试足够。
- 构建时项目源码会上传到 Expo 云端。不要在里面放 API Key、密码等敏感信息。
- 当前 App 不需要后端，所有练习记录只保存在手机本地。

## 8. iPhone 怎么办

iOS 不能安装 APK。自己用可以继续用 Expo Go；要独立安装需要 Apple Developer 账号（$99/年）并通过 TestFlight，或注册设备 UDID 做 ad hoc 分发。
