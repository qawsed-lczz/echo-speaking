# 更新 Echo 口语

## 更新前先改版本号

打开 `app.json`，每次更新都把这两个数字加一：

```json
"version": "1.0.1",
"android": {
  "versionCode": 2
}
```

`version` 是显示给用户看的版本，`versionCode` 是 Android 用来判断“这是不是新版本”的整数，必须递增。

**不要改 `android.package`（`com.echo.speaking`）**，否则 Android 会把它当成另一个 App，旧数据也不会保留。

## 用 GitHub Actions 发新版本

### 1. 推送代码

```bash
git add .
git commit -m "Release 1.0.1"
git push origin main
```

推送后会自动构建一次 APK，但不会创建 Release。

### 2. 打标签，生成 Release

```bash
git tag v1.0.1
git push origin v1.0.1
```

标签以 `v` 开头，工作流会自动：

1. 重新构建 APK；
2. 把 `app-release.apk` 附加到 `v1.0.1` 的 GitHub Release。

Release 页面地址格式：

```text
https://github.com/qawsed-lczz/echo-speaking/releases/tag/v1.0.1
```

把这个链接发微信，对方用浏览器打开下载即可。

### 3. 安装更新

- 新 APK 直接覆盖安装即可，练习记录会保留。
- 如果提示“应用未安装”或“签名不一致”，先卸载旧版再装（卸载会清空本地进度）。

## 签名说明

工作流使用仓库里的固定测试签名：

```text
.github/keystores/debug.keystore
```

这样每次构建的签名一致，后续版本可以覆盖安装。

注意：这是 Android 的**公共 debug 签名**，只适合自己测试和内部使用，不能上架应用商店。如果要正式发布，应该生成自己的 release keystore，并通过 GitHub Secrets 注入，不要提交到仓库。

第一次从旧的 `v1.0.0` 更新时，如果旧包当时使用的是另一把签名，可能仍然需要卸载一次；从这之后签名就固定了。

## 常见问题

### 忘记加 versionCode 会怎样

Android 会认为新包不比旧包新，可能拒绝安装。每次发布前检查 `android.versionCode`。

### 更新后数据还在吗

覆盖安装会保留 AsyncStorage 里的练习记录；卸载重装会清空。

### 只想重新构建，不发新版

在 GitHub 的 **Actions → Build Android APK → Run workflow** 手动运行，构建完成后在 run 页面下载 artifact（ZIP，里面是 APK）。
