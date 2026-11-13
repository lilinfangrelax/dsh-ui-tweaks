# dsh-ui-tweaks

中文 | [English](README.en.md)

对 DeepSeek Harness 默认 Web 界面的两处可用性微调，打包成一个 bundle 插件。

两项改动互相独立，各自的 CSS 和逻辑都不引用对方，删掉任意一项不影响另一项。

## 它改了什么

### 1. 右侧悬浮全屏把手

手机上浏览器地址栏和工具栏会吃掉很大一块视口。默认界面没有全屏入口，只能翻浏览器菜单。

这个插件在屏幕右缘垂直居中放一个细长把手，点一下进入网页全屏，再点一下退出。

- 支持 `requestFullscreen` 及其 `webkit` / `ms` 前缀变体
- 按钮状态跟随 `fullscreenchange` 事件，视频等外部触发的全屏也能正确显示「退出」
- 浏览器不支持或拒绝授权时，会在把手左侧出现一条 3.8 秒的提示
- 只在浏览器这一层生效，不修改布局、输入框和抽屉

### 2. 工作区「新建会话」按钮常显

侧栏里每个工作区行都有「新建会话」按钮，但上游把它整组操作做成 `display:none`，只有鼠标悬停到该行才显示。

用 Vimium 这类键盘 hint 浏览器时，只有已渲染且可见的元素才会被 hint 到，于是「按 f 选中某个项目、在它下面开会话」这条路走不通，只能退回顶部的「新会话」，被迫建在当前项目。

这个插件让：

- 「新建会话」按钮常显，无需悬停
- 三点菜单按钮保持原有 hover 行为（悬停、`aria-expanded=true`、`:focus-visible` 时出现），避免一行里挤两个按钮

## 安装

```sh
dsh plugin --profile web add github:lilinfangrelax/dsh-ui-tweaks
```

包名与仓库均为 `dsh-ui-tweaks`（插件 id 仍为 `ui-tweaks`）。

也可以先克隆，再按本地路径安装：

```sh
git clone https://github.com/lilinfangrelax/dsh-ui-tweaks.git
dsh plugin --profile web add file:/path/to/dsh-ui-tweaks
```

安装或升级后重启 Web UI 生效。

卸载：

```sh
dsh plugin --profile web remove dsh-ui-tweaks
```

## 工作原理

两处改动都在 Client 侧完成，host 侧 `index.js` 是空的。

**全屏把手** 通过 `ctx.slots.register` 在 `shell.overlay` 插槽注册一个 React 组件，样式随之渲染。所有类名以 `dsh-fs-` 前缀限定，颜色用 `--dsw-alias-*` 主题变量，因此跟随明暗主题。

**行操作** 直接注入一段 `<style>`：

- 行用稳定的 `data-row-key^="workspace:"` 定位，操作组用 `_rowActions` 类名后缀定位，菜单按钮用 ARIA 属性定位，都不依赖上游的哈希类名
- 声明带 `!important`，因为覆盖的是已发布样式表
- `<style>` 带 `data-dsh-plugin="dsh-ui-tweaks"`，插件卸载时随 `ctx.effect` 的清理函数一起移除

## 已知限制

行操作的覆盖写在 `@media (hover: hover)` 里——只对能用悬停区分状态的设备生效，触屏上保持上游原有的显隐逻辑。

两项改动都依赖上游的稳定标识（插槽名 `shell.overlay`、`data-row-key`、`_rowActions` 类名后缀、`aria-haspopup="menu"`）。上游如果改了这些，插件会失效而不是报错，需要跟着调整。

上游若正式提供可见的无障碍入口，行操作这部分就可以删掉。

## 文件结构

```
client.js         两项改动的全部实现
index.js          host 侧占位
cordis.patch.yml  往 profile 里插入 ui-tweaks 条目
locale/zh.json    插件列表里的名称与说明（中文）
locale/en.json    同上（英文）
icon.svg          插件列表图标
```
