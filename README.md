# dsh-ghostty-splits

Adds a **Multi-window Terminal** page next to the shipped right-sidebar terminal. The shipped "New terminal" card and `⌃\`` stay as they are. This page opens from its own card, The desktop shortcut is `Ctrl+Shift+\`` on macOS and Windows. A macOS browser uses `⌘⇧\`` instead, because it reserves `Ctrl+Shift+\``; Windows in a browser keeps `Ctrl+Shift+\``.

Inside that page, panes split Ghostty-style: right or down from the focused pane, with draggable dividers. Each pane is still an official PTY. Up to 8 panes.

- It registers its own tab kind (`terminalTiles`). It does not replace the shipped `terminal` kind.
- Rendering reuses the shipped terminal chunk (xterm 6.0.0, inlined). PTYs stay on `dsh-api-terminal-controller`.
- Split shortcuts follow Ghostty: macOS uses `⌘D` and `⌘⇧D`; Windows uses `Ctrl+Shift+→` and `Ctrl+Shift+↓`. Linux has no default because DSH treats those arrow chords as reserved, which would reject the command.
- Layout is stored per session and tab. A refresh reconnects the same processes.
- A Session with either terminal open shows a small terminal mark to the left of its name. The mark yields to the Session status dot while that Session is busy.

Developed against DeepSeek Harness `0.2.0-rc.2`. After a harness upgrade, run `node tools/sync-chunk.mjs` and then `node test/smoke.cjs`.

## Install

```sh
dsh plugin --profile desktop add github:kaesi0/dsh-ghostty-splits
```

Use `--profile web` instead when the plugin should load in `dsh web`. The desktop profile applies the bundle without a restart; refresh the page.

Open **Multi-window Terminal** from the Start page. On macOS and Windows desktop, press `Ctrl+Shift+\``. In a macOS browser press `⌘⇧\``; Windows in a browser keeps `Ctrl+Shift+\``. The shipped terminal card and `⌃\`` are unchanged. The toolbar also has split, close, and shell controls. The shell menu writes the official `dsh.terminal.shell` preference and applies to panes created afterwards.

## Limits

- Binary splits only (right or down). No n-way, floating, or grid layout.
- Eight panes is the controller `maxTerminals` default. Each pane is one PTY.
- The shipped terminal's shell menu is unchanged. This page has its own toolbar select, which writes the same preference.
- `lib/client.terminal.js` is vendored from the installed harness. See `NOTICE`.

Details, rollback, and the smoke checks are in [INSTALL.md](./INSTALL.md).

## 中文

在官方「新建终端」旁边增加「多窗口终端」。官方卡片和 `⌃\`` 保持不变；本页用自己的卡片打开，macOS 和 Windows 桌面是 `Ctrl+Shift+\``。macOS 浏览器改用 `⌘⇧\``，因为那里保留了前一个组合；Windows 浏览器仍是 `Ctrl+Shift+\``。

打开了官方终端或多窗口终端的会话，会在会话名左侧显示一个终端标记；会话忙碌时仍显示原来的状态点。页内向右或向下分屏，分隔条可拖动，每格仍是官方 PTY，最多 8 格。分屏快捷键跟 Ghostty：macOS 是 `⌘D` 和 `⌘⇧D`，Windows 是 `Ctrl+Shift+→` 和 `Ctrl+Shift+↓`。Linux 不能登记这组方向键，只用工具栏。
