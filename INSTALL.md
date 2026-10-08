# dsh-ghostty-splits

在官方「新建终端」旁边增加 **多窗口终端**：一个标签页内部可以横向或纵向摆多个终端格子，可拖动分隔条。官方「新建终端」卡片和 `⌃\`` 不被替换。

做法：注册自己的页面类型 `terminalTiles`，复用官方终端 UI（xterm 6.0.0 的 chunk），PTY 仍由官方 `dsh-api-terminal-controller` 提供。不改 DSH 安装目录。`lib/client.terminal.js` 是已改写身份的官方 chunk 副本，来源见 [NOTICE](./NOTICE)。

- 开发目标：DeepSeek Harness `0.2.0-rc.2`
- 中文名称：多窗口终端；英文：Multi-window Terminal
- 打开：Start 页自己的卡片。macOS / Windows 桌面是 `Ctrl+Shift+\``。macOS 浏览器是 `⌘⇧\``，Windows 浏览器仍是 `Ctrl+Shift+\``。Linux 不设默认键。macOS 浏览器若登记 `Ctrl+Shift+\``，整条命令会被拒绝

## 1. 使用

| 操作 | 方式 |
|---|---|
| 打开多窗口终端 | Start 页「多窗口终端」。Mac/Windows 桌面 **Ctrl+Shift+`**；Mac 浏览器 **⌘⇧`**；Windows 浏览器 **Ctrl+Shift+`** |
| 打开官方终端 | 仍是「新建终端」卡片，或 `⌃\`` |
| 向右分屏（新格在右） | 工具栏「右分屏」。macOS **⌘D**，Windows **Ctrl+Shift+→** |
| 向下分屏（新格在下） | 工具栏「下分屏」。macOS **⌘⇧D**，Windows **Ctrl+Shift+↓** |
| 切换焦点 | 点任意格子（焦点格子有品牌色描边） |
| 调整大小 | 拖动格子之间的分隔条 |
| 关闭一格 | 格子右上角 `✕`（最后一格不可关） |
| 换 shell | 工具栏的 Shell 下拉（写入官方偏好 `dsh.terminal.shell`，对之后新建的格子生效） |

- 分屏作用于当前焦点格：新格出现在右或下并接管焦点。
- 布局按「会话 + 终端标签页」持久化。刷新后按内容标识重连原来的进程。
- 关闭标签页会关闭它的所有格子。收起侧边栏、切换标签页或会话、刷新都不会杀进程。
- 上限 8 格，即官方终端控制器 `maxTerminals` 的默认值。

## 2. 安装

```sh
dsh plugin --profile desktop add github:kaesi0/dsh-ghostty-splits
```

`dsh web` 使用 `--profile web`。桌面 profile 装完后刷新页面即可。

本地目录安装把上面的 `github:` 引用换成 `link:` 加本仓库的绝对路径。

## 3. 回退

在该 profile 的 `cordis.patch.yml` 里关掉这一行，或在设置 → 插件里关闭它。「多窗口终端」卡片和快捷键消失，官方终端本来就还在。

```yaml
- id: dsh-ghostty-splits
  disabled: true
```

彻底卸载：

```sh
dsh plugin --profile desktop remove dsh-ghostty-splits
```

## 4. 原理

| 环节 | 依据 |
|---|---|
| 独立类型 | `ctx.sidebarRightTabs.register({ id, kind: "terminalTiles", priority: "extension" })`。不占用官方 `terminal`，所以「新建终端」和 `⌃\`` 保持原样 |
| 终端渲染 | `lib/client.terminal.js` 来自官方 chunk（xterm 6.0.0 + addon-fit + CSS 内联），只 `require` 平台静态模块 |
| 组件契约 | 该 chunk 导出的 `TerminalBody` 只吃 props，不依赖 sidebar-right 的标签页上下文。每个格子给一份自己的 `view` / `useTerminal` / `useTabInfo` |
| 每格一个 PTY | `ctx.webTerminals.view(sessionId, key, contentId, terminalId, shellPath)` |
| chunk 加载 | `require.async("./client.terminal.js")`，由 client-modules 按本包提供 |
| 终端保活 | `ctx.webTerminals.retainTabs` 整体覆盖。本插件写入「官方终端标签页 ∪ 本插件格子」，并声明了对官方终端插件的 `dsh.client.inject` 依赖 |

三个已处理的约束：

1. 不注册 close handler。同 kind 已有 handler 时官方会直接抛错，所以改为监视 `openTabs`：终端标签页消失就关掉它的格子并清掉布局。
2. chunk 跟官方版本走。`tools/sync-chunk.mjs` 从本机 app.asar 重新拷贝并改写身份字符串，然后 touch `lib/client.js`。DSH 升级后跑一次。
3. 类型注册延后到 chunk 加载成功之后。chunk 拉不到就只记 error，不注册页面，官方终端不受影响。

## 5. 自检

在本仓库根目录：

```sh
node tools/sync-chunk.mjs   # 仅 DSH 升级后需要
node test/smoke.cjs         # 期望：smoke: all assertions passed
```

`test/smoke.cjs` 覆盖：chunk 身份、`inject` 列表、加载完成前不注册、页面类型不是 `terminal`、Mac/Windows 桌面打开键是 `Ctrl+Shift+\``、Mac 浏览器是 `⌘⇧\``、Windows 浏览器是 `Ctrl+Shift+\``、分屏与关闭、布局持久化、保留并集、焦点与分隔条比例、Shell 偏好写回。

## 6. 已知限制

- 分屏键与 Ghostty 一致：macOS 是 `⌘D` / `⌘⇧D`，Windows 是 `Ctrl+Shift+→` / `Ctrl+Shift+↓`。Linux 把方向键当保留键，登记后整条命令会被拒绝，所以 Linux 不设默认键，用工具栏。
- 只有二叉分屏，不做 N 叉、浮动或网格平铺。
- 最多 8 格；每格一个 PTY。
- 官方终端的 shell 下拉不变。多窗口终端自己的工具栏 `<select>` 写同一个偏好。
- chunk 的 props、CSS 类名和 `sidebarTerminal` 文案命名空间随官方版本变化。同步脚本只改身份字符串；props 变了要改 `lib/client.js`。
- `maxCols` / `maxRows` 500×200、`scrollback` 1000 仍是官方上限。
