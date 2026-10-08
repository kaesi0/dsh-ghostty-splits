# dsh-ghostty-splits

Adds a **Multi-window Terminal** page next to the shipped right-sidebar terminal. The shipped "New terminal" card and `⌃\`` stay as they are. This page opens from its own card, or with `Ctrl+Shift+\`` on every platform.

Inside that page, panes split Ghostty-style: right or down from the focused pane, with draggable dividers. Each pane is still an official PTY. Up to 8 panes.

- It registers its own tab kind (`terminalTiles`). It does not replace the shipped `terminal` kind.
- Rendering reuses the shipped terminal chunk (xterm 6.0.0, inlined). PTYs stay on `dsh-api-terminal-controller`.
- macOS desktop split shortcuts: `⌘D` split right, `⌘⇧D` split down. Windows and Linux use the toolbar for those, because `Ctrl+D` is EOF in a terminal.
- Layout is stored per session and tab. A refresh reconnects the same processes.

Developed against DeepSeek Harness `0.2.0-rc.2`. After a harness upgrade, run `node tools/sync-chunk.mjs` and then `node test/smoke.cjs`.

## Install

```sh
dsh plugin --profile desktop add github:kaesi0/dsh-ghostty-splits
```

Use `--profile web` instead when the plugin should load in `dsh web`. The desktop profile applies the bundle without a restart; refresh the page.

Open **Multi-window Terminal** from the Start page, or press `Ctrl+Shift+\``. The shipped terminal card and `⌃\`` are unchanged. The toolbar also has split, close, and shell controls. The shell menu writes the official `dsh.terminal.shell` preference and applies to panes created afterwards.

## Limits

- Binary splits only (right or down). No n-way, floating, or grid layout.
- Eight panes is the controller `maxTerminals` default. Each pane is one PTY.
- The shipped terminal's shell menu is unchanged. This page has its own toolbar select, which writes the same preference.
- `lib/client.terminal.js` is vendored from the installed harness. See `NOTICE`.

Details, rollback, and the smoke checks are in [INSTALL.md](./INSTALL.md).

## 中文

在官方「新建终端」旁边增加「多窗口终端」。官方卡片和 `⌃\`` 保持不变；本页用自己的卡片打开，默认快捷键是各平台的 `Ctrl+Shift+\``。

页内向右或向下分屏，分隔条可拖动，每格仍是官方 PTY，最多 8 格。macOS 桌面另有 `⌘D`（右分屏）和 `⌘⇧D`（下分屏）。Windows / Linux 的分屏只用工具栏，避免吃掉终端里的 `Ctrl+D`。
