window.__ModuleLoader__.load({
	id: "dsh-ghostty-splits",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const h = react.createElement;

		//#region identity
		/** Browser module id; equals the npm package name, which is also the tab-type and slot key. */
		const ID = "dsh-ghostty-splits";
		/**
		 * This plugin's own page kind. It must not be `terminal`: that kind belongs
		 * to the shipped "New terminal" card and its `⌃\`` command.
		 */
		const KIND = "terminalTiles";
		/** Shipped terminal tabs stay on this kind and keep their own shortcut. */
		const SHIPPED_TERMINAL_KIND = "terminal";
		/** Locale namespace owned by this plugin. */
		const NS = "terminalTiles";
		/** The shipped terminal's copy namespace, which the official body reads through its `t` prop. */
		const TERMINAL_NS = "sidebarTerminal";
		/** One persisted tiling layout per Session and this plugin's tab. */
		const LAYOUT_PREFIX = "dsh-ghostty-splits.v1.";
		/** The shipped shell preference, honoured when a tile is created. */
		const SHELL_KEY = "dsh.terminal.shell";
		/** Opens this plugin's page. It does not reuse `terminal.new`. */
		const OPEN_COMMAND_ID = "terminalTiles.new";
		/** Split commands. */
		const SPLIT_RIGHT_ID = "terminalTiles.splitRight";
		const SPLIT_DOWN_ID = "terminalTiles.splitDown";
		/** The controller's `maxTerminals` default: retained terminals and pending allocations per Session. */
		const MAX_TILES = 8;
		/** Divider limits, as a fraction of the split box. */
		const MIN_RATIO = 0.15;
		const MAX_RATIO = 0.85;
		//#endregion

		//#region copy
		/** Simplified Chinese dictionary (key-set source of truth). */
		const zh = {
			"type.label": "多窗口终端",
			"guide.title": "多窗口终端",
			"guide.description": "同一页内分屏",
			"shortcut.open": "多窗口终端",
			"shortcut.right": "多窗口终端：向右分屏",
			"shortcut.down": "多窗口终端：向下分屏",
			"shortcut.noSession": "请先打开一个会话",
			"shortcut.noTerminal": "请先打开多窗口终端",
			"bar.splitRight": "右分屏",
			"bar.splitDown": "下分屏",
			"bar.shell": "Shell",
			"bar.limit": "已达上限（{count}）",
			"bar.hint": "Mac ⌘D / ⌘⇧D · Windows Ctrl+Shift+→ / ↓ · 拖动分隔条调整",
			"tile.close": "关闭此格",
			"state.loading": "正在加载终端界面…",
			"state.failed": "终端界面加载失败，已保留 DSH 自带终端。",
			"session.marker": "此会话打开了终端"
		};
		/** English dictionary. */
		const en = {
			"type.label": "Multi-window Terminal",
			"guide.title": "Multi-window Terminal",
			"guide.description": "Split inside one page",
			"shortcut.open": "Multi-window Terminal",
			"shortcut.right": "Multi-window Terminal: split right",
			"shortcut.down": "Multi-window Terminal: split down",
			"shortcut.noSession": "Open a Session first",
			"shortcut.noTerminal": "Open a multi-window terminal first",
			"bar.splitRight": "Split right",
			"bar.splitDown": "Split down",
			"bar.shell": "Shell",
			"bar.limit": "Limit reached ({count})",
			"bar.hint": "Mac ⌘D / ⌘⇧D · Windows Ctrl+Shift+→ / ↓ · drag a divider to resize",
			"tile.close": "Close this pane",
			"state.loading": "Loading the terminal surface…",
			"state.failed": "The terminal surface failed to load; the shipped terminal is kept.",
			"session.marker": "This Session has a terminal open"
		};
		//#endregion

		//#region styles
		/** Inline styles over the shipped theme tokens: no CSS injection, no build step. */
		const styles = {
			root: {
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
				minWidth: 0,
				background: "var(--dsw-alias-bg-base)"
			},
			bar: {
				display: "flex",
				alignItems: "center",
				flexWrap: "wrap",
				gap: "6px",
				padding: "5px 8px",
				borderBottom: "0.5px solid var(--dsw-alias-border-l1)",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "12px"
			},
			button: {
				border: "0.5px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				color: "var(--dsw-alias-label-primary)",
				borderRadius: "5px",
				padding: "3px 8px",
				font: "inherit",
				cursor: "pointer"
			},
			select: {
				border: "0.5px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				color: "var(--dsw-alias-label-primary)",
				borderRadius: "5px",
				padding: "3px 6px",
				font: "inherit",
				maxWidth: "140px"
			},
			hint: { color: "var(--dsw-alias-label-secondary)", marginInlineStart: "auto" },
			limit: { color: "var(--dsw-alias-state-warn-primary)" },
			box: { position: "relative", flex: 1, width: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" },
			pane: { position: "absolute", display: "flex", minWidth: 0, minHeight: 0, overflow: "hidden" },
			dividerRow: { position: "absolute", top: 0, bottom: 0, width: "5px", marginLeft: "-2px", cursor: "col-resize", zIndex: 2 },
			dividerColumn: { position: "absolute", left: 0, right: 0, height: "5px", marginTop: "-2px", cursor: "row-resize", zIndex: 2 },
			dividerLine: { position: "absolute", background: "var(--dsw-alias-border-l2)" },
			tile: { position: "relative", display: "flex", flex: 1, flexDirection: "column", width: "100%", height: "100%", minWidth: 0, minHeight: 0, overflow: "hidden" },
			tileFocused: { position: "relative", display: "flex", flex: 1, flexDirection: "column", width: "100%", height: "100%", minWidth: 0, minHeight: 0, overflow: "hidden", boxShadow: "inset 0 0 0 1px var(--dsw-alias-brand-primary)" },
			tileClose: {
				position: "absolute",
				top: "2px",
				insetInlineEnd: "2px",
				zIndex: 2,
				border: "none",
				borderRadius: "4px",
				background: "var(--dsw-alias-bg-layer-2)",
				color: "var(--dsw-alias-label-secondary)",
				font: "inherit",
				lineHeight: 1,
				padding: "2px 5px",
				cursor: "pointer"
			},
			notice: { padding: "12px", color: "var(--dsw-alias-label-secondary)", fontSize: "12px" }
		};
		//#endregion

		//#region glyph
		/**
		* Guide glyph: one window with a split line.
		* @param props - guide-provided `size` (22 or 26) and `className`.
		* @returns the SVG element.
		*/
		function TilesGlyph(props) {
			const size = props && typeof props.size === "number" ? props.size : 22;
			return h("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				className: props ? props.className : undefined,
				"aria-hidden": "true",
				focusable: "false"
			}, [
				h("rect", { key: "frame", x: 3, y: 4.5, width: 18, height: 15, rx: 2.5, stroke: "currentColor", strokeWidth: 1.5 }),
				h("path", { key: "split", d: "M13.5 4.5v15", stroke: "currentColor", strokeWidth: 1.5 }),
				h("path", { key: "prompt", d: "M6 10l1.6 1.6L6 13.2", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" })
			]);
		}
		/**
		* Session-list mark for a Session whose sidebar still has a terminal open.
		* The workspace hides this slot while a status dot is showing, so the mark
		* never replaces the loading indicator.
		* @param props - the row passes `session: { id }`, plus the open-tab inventory and copy.
		* @returns the mark, or null when that Session has no terminal tab.
		*/
		function SessionTerminalMarker(props) {
			const sessionId = props.session !== undefined && props.session !== null ? props.session.id : props.sessionId;
			const open = react.useSyncExternalStore(props.openTabs.subscribe, () => props.openTabs.getSnapshot().some((tab) => tab.sessionId === sessionId && (tab.kind === KIND || tab.kind === SHIPPED_TERMINAL_KIND)));
			if (!open) return null;
			const label = props.t("session.marker");
			return h("span", {
				role: "img",
				"aria-label": label,
				title: label,
				style: { display: "inline-flex", flex: "0 0 auto", color: "var(--dsw-alias-label-secondary)" }
			}, h(TilesGlyph, { size: 14 }));
		}
		//#endregion

		//#region layout tree
		/** One pane. */
		function leaf(key) {
			return { type: "leaf", key };
		}
		/** Two panes side by side (`row`) or stacked (`column`). */
		function splitNode(axis, first, second, ratio) {
			return { type: "split", axis, ratio, first, second };
		}
		/** The first pane of a tree: where focus falls when the focused one closes. */
		function firstKey(tree) {
			return tree.type === "leaf" ? tree.key : firstKey(tree.first);
		}
		/** Replace one pane with a subtree. */
		function replaceLeaf(tree, key, next) {
			if (tree.type === "leaf") return tree.key === key ? next : tree;
			return splitNode(tree.axis, replaceLeaf(tree.first, key, next), replaceLeaf(tree.second, key, next), tree.ratio);
		}
		/** Drop one pane, collapsing its parent and returning `null` when nothing is left. */
		function removeLeaf(tree, key) {
			if (tree.type === "leaf") return tree.key === key ? null : tree;
			const first = removeLeaf(tree.first, key);
			const second = removeLeaf(tree.second, key);
			if (first === null) return second;
			if (second === null) return first;
			return splitNode(tree.axis, first, second, tree.ratio);
		}
		/** Rewrite one split's ratio, addressed by the render path. */
		function withRatio(tree, path, ratio) {
			if (path.length === 0) return tree.type === "split" ? splitNode(tree.axis, tree.first, tree.second, ratio) : tree;
			if (tree.type !== "split") return tree;
			const [head, ...rest] = path;
			return head === "first"
				? splitNode(tree.axis, withRatio(tree.first, rest, ratio), tree.second, tree.ratio)
				: splitNode(tree.axis, tree.first, withRatio(tree.second, rest, ratio), tree.ratio);
		}
		//#endregion

		//#region state
		/** Every live tiling state, keyed by Session and the tab's content identity. */
		const tabStates = new Map();
		/** Tile keys key the Host binding, so they must be unique per Session and survive reloads. */
		function newTileKey() {
			return "tile-" + Math.random().toString(36).slice(2, 10);
		}
		/** Map key for one terminal tab's tiling state. */
		function stateKeyOf(sessionId, tabContentId) {
			return sessionId + "\u0000" + tabContentId;
		}
		/** Globally unique terminal content identity for one tile. */
		function contentIdFor(sessionId, tileKey) {
			return "dsh-ghostty-splits://" + encodeURIComponent(sessionId) + "/" + tileKey;
		}
		/** localStorage key holding one tab's layout. */
		function storageKeyOf(sessionId, tabContentId) {
			return LAYOUT_PREFIX + sessionId + "." + tabContentId;
		}
		/** The shell the user last picked in the shipped terminal, if any. */
		function preferredShell() {
			try {
				const value = window.localStorage.getItem(SHELL_KEY);
				return value === null || value.length === 0 ? undefined : value;
			} catch (error) {
				return undefined;
			}
		}
		/**
		* Rebuild one stored subtree, filling `out` with the tiles it names.
		* @returns the sanitized tree, or `null` when the stored value is unusable.
		*/
		function restoreTree(sessionId, node, storedTiles, out) {
			if (node === null || typeof node !== "object") return null;
			if (node.type === "leaf") {
				if (typeof node.key !== "string" || node.key.length === 0 || out.has(node.key)) return null;
				const saved = storedTiles !== null && typeof storedTiles === "object" ? storedTiles[node.key] : undefined;
				const contentId = saved !== null && typeof saved === "object" && typeof saved.contentId === "string" && saved.contentId.length > 0
					? saved.contentId
					: contentIdFor(sessionId, node.key);
				const shellPath = saved !== null && typeof saved === "object" && typeof saved.shellPath === "string" ? saved.shellPath : undefined;
				out.set(node.key, { key: node.key, contentId, shellPath });
				return leaf(node.key);
			}
			if (node.type !== "split" || (node.axis !== "row" && node.axis !== "column")) return null;
			const first = restoreTree(sessionId, node.first, storedTiles, out);
			if (first === null) return null;
			const second = restoreTree(sessionId, node.second, storedTiles, out);
			if (second === null) return null;
			const ratio = typeof node.ratio === "number" && node.ratio > 0 && node.ratio < 1 ? node.ratio : 0.5;
			return splitNode(node.axis, first, second, ratio);
		}
		/** Persist one tab's layout, ignoring storage failures. */
		function writeStored(state) {
			try {
				const tiles = {};
				for (const [key, tile] of state.tiles) tiles[key] = { contentId: tile.contentId, shellPath: tile.shellPath === undefined ? null : tile.shellPath };
				window.localStorage.setItem(storageKeyOf(state.sessionId, state.tabContentId), JSON.stringify({
					layout: state.layout,
					focused: state.focused,
					tiles
				}));
			} catch (error) {}
		}
		/** Drop one tab's persisted layout. */
		function clearStored(sessionId, tabContentId) {
			try {
				window.localStorage.removeItem(storageKeyOf(sessionId, tabContentId));
			} catch (error) {}
		}
		//#endregion

		//#region components
		/**
		* One pane: the official terminal body plus this plugin's own close control.
		* @param props - tile identity, the tiling state and the terminal surface.
		* @returns the pane element.
		*/
		function Tile(props) {
			const { state, tileKey, face, TerminalBody, terminalCopy } = props;
			const tile = state.tiles.get(tileKey);
			if (tile === undefined) return null;
			const focused = state.focused === tileKey;
			const view = (key) => face.view(state, key);
			const useTerminal = (key) => face.useTerminal(state, key);
			const useTabInfo = () => ({
				tab: {
					id: tile.key,
					contentId: tile.contentId,
					actions: {
						openTab: () => {
							face.split(state, "row");
						}
					}
				}
			});
			return h("div", {
				style: focused ? styles.tileFocused : styles.tile,
				onMouseDown: () => {
					face.focus(state, tileKey);
				}
			}, [
				h("button", {
					key: "close",
					type: "button",
					style: state.tiles.size > 1 ? styles.tileClose : Object.assign({}, styles.tileClose, { display: "none" }),
					title: terminalCopy("tile.close"),
					"aria-label": terminalCopy("tile.close"),
					onClick: () => {
						face.close(state, tileKey);
					}
				}, "✕"),
				h(TerminalBody, {
					key: "body",
					useTabInfo,
					useTerminal,
					useTheme: face.useTheme,
					view,
					t: terminalCopy
				})
			]);
		}
		/**
		* One split box: two children and the divider between them.
		* @param props - the tree node, its render path and the shared faces.
		* @returns the box element.
		*/
		function SplitBox(props) {
			const { node, path, state, face, TerminalBody, terminalCopy } = props;
			const row = node.axis === "row";
			const ratio = `${node.ratio * 100}%`;
			const rest = `calc(100% - ${ratio})`;
			const first = Object.assign({}, styles.pane, row
				? { left: 0, top: 0, bottom: 0, width: ratio }
				: { left: 0, right: 0, top: 0, height: ratio });
			const second = Object.assign({}, styles.pane, row
				? { right: 0, top: 0, bottom: 0, width: rest }
				: { left: 0, right: 0, bottom: 0, height: rest });
			return h("div", { style: styles.box }, [
				h("div", { key: "first", style: first }, h(SplitNode, { node: node.first, path: path.concat("first"), state, face, TerminalBody, terminalCopy })),
				h(Divider, { key: "divider", axis: node.axis, path, ratio, state, face }),
				h("div", { key: "second", style: second }, h(SplitNode, { node: node.second, path: path.concat("second"), state, face, TerminalBody, terminalCopy }))
			]);
		}
		/**
		* Divider between two children: dragging rewrites the parent split's ratio.
		* @param props - the split axis, its render path and the shared face.
		* @returns the divider element.
		*/
		function Divider(props) {
			const { axis, path, ratio, state, face } = props;
			const ref = react.useRef(null);
			const onPointerDown = (event) => {
				event.preventDefault();
				const box = ref.current === null ? null : ref.current.parentElement;
				if (box === null) return;
				const rect = box.getBoundingClientRect();
				const move = (moveEvent) => {
					const ratio = axis === "row"
						? (moveEvent.clientX - rect.left) / Math.max(1, rect.width)
						: (moveEvent.clientY - rect.top) / Math.max(1, rect.height);
					face.setRatio(state, path, ratio, false);
				};
				const up = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
					face.setRatio(state, path, state.pendingRatio, true);
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", up);
			};
			const placement = axis === "row" ? { left: ratio } : { top: ratio };
			const line = axis === "row"
				? { top: 0, bottom: 0, left: "2px", width: "1px" }
				: { left: 0, right: 0, top: "2px", height: "1px" };
			return h("div", {
				ref,
				role: "separator",
				"aria-orientation": axis === "row" ? "vertical" : "horizontal",
				style: Object.assign({}, axis === "row" ? styles.dividerRow : styles.dividerColumn, placement),
				onPointerDown
			}, h("span", { style: Object.assign({}, styles.dividerLine, line) }));
		}
		/**
		* Recursive renderer: a pane or a split box.
		* @param props - the tree node and the shared faces.
		* @returns the element for that node.
		*/
		function SplitNode(props) {
			const { node } = props;
			return node.type === "leaf"
				? h(Tile, Object.assign({ key: node.key, tileKey: node.key }, props))
				: h(SplitBox, Object.assign({ key: `${node.axis}:${props.path.join(".")}` }, props));
		}
		/**
		* The tab body: one toolbar plus the tiled panes.
		* @param props - composed slot props plus this plugin's faces.
		* @returns the page element tree.
		*/
		function TilesBody(props) {
			const { sessionId, useTabInfo, t, terminalCopy, holder, face } = props;
			const tab = useTabInfo().tab;
			const tabContentId = typeof tab.contentId === "string" ? tab.contentId : tab.navigation !== undefined ? tab.navigation.address : tab.id;
			face.useSnapshot(sessionId, tabContentId);
			const state = face.ensure(sessionId, tabContentId);
			const [shells, setShells] = react.useState(null);
			react.useEffect(() => {
				const controller = new AbortController();
				face.shells(sessionId, controller.signal).then((result) => {
					if (!controller.signal.aborted) setShells(result);
				}).catch(() => {});
				return () => {
					controller.abort();
				};
			}, [sessionId, tabContentId]);
			const atLimit = state.tiles.size >= MAX_TILES;
			const TerminalBody = holder.body;
			const toolbar = h("div", { style: styles.bar }, [
				h("button", {
					key: "right",
					type: "button",
					style: styles.button,
					disabled: atLimit,
					onClick: () => {
						face.split(state, "row");
					}
				}, t("bar.splitRight")),
				h("button", {
					key: "down",
					type: "button",
					style: styles.button,
					disabled: atLimit,
					onClick: () => {
						face.split(state, "column");
					}
				}, t("bar.splitDown")),
				shells !== null && shells.shells.length > 0 ? h("select", {
					key: "shell",
					style: styles.select,
					value: shells.selectedShell === undefined ? "" : shells.selectedShell,
					title: t("bar.shell"),
					onChange: (event) => {
						face.selectShell(event.target.value);
					}
				}, [
					h("option", { key: "label", value: "", disabled: true }, t("bar.shell")),
					...shells.shells.map((shell) => h("option", { key: shell.path, value: shell.path }, shell.name))
				]) : null,
				atLimit
					? h("span", { key: "limit", style: styles.limit }, t("bar.limit", { count: String(MAX_TILES) }))
					: h("span", { key: "hint", style: styles.hint }, t("bar.hint"))
			]);
			const content = TerminalBody === null
				? h("div", { style: styles.notice }, t("state.loading"))
				: h("div", { style: styles.box }, h(SplitNode, { node: state.layout, path: [], state, face, TerminalBody, terminalCopy }));
			return h("div", { style: styles.root }, [toolbar, content]);
		}
		//#endregion

		//#region plugin
		/** Services this browser half needs. */
		const inject = ["slots", "locale", "sidebarRightTabs", "sidebarRight", "webTerminals", "theme", "shortcuts"];

		/**
		* Client plugin body: add a "Multi-window Terminal" page beside the shipped
		* terminal. The shipped `terminal` kind, its Start card and `⌃\`` stay as they
		* are; this page is opened by its own card and by Ctrl+Shift+`.
		*
		* The official `TerminalBody` is driven purely by props (`useTabInfo`, `view`,
		* `useTerminal`, `useTheme`, `t`), so each tile supplies its own occurrence
		* key and content identity; the PTY plumbing stays the shipped controller's.
		* Registration waits until that UI has loaded, so a failed chunk load adds
		* nothing and the shipped terminal is untouched.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const t = ctx.locale.bind(NS);
			const terminalCopy = ctx.locale.bind(TERMINAL_NS);
			const themeSource = {
				getSnapshot: () => ctx.theme.getTheme(),
				subscribe: (listener) => ctx.on("theme/change", listener)
			};
			/** Loaded lazily; the type registers only once the official UI is in hand. */
			const holder = { body: null };

			//#region terminal plumbing
			/** Close one tile's Host terminal and forget its binding. */
			const closeTerminal = (sessionId, key, contentId) => {
				try {
					ctx.webTerminals.close(sessionId, key, contentId, undefined);
				} catch (error) {
					console.error("[terminal-tiles] terminal close failed", error);
				}
			};
			/**
			 * `retainTabs` replaces the whole hold. This package loads after the
			 * shipped terminal, so the write has to keep those tabs as well as ours.
			 */
			const retainAll = () => {
				try {
					const list = [];
					for (const tab of ctx.sidebarRight.openTabs.getSnapshot()) {
						if (tab.kind === SHIPPED_TERMINAL_KIND || tab.kind === KIND) list.push(tab);
					}
					for (const state of tabStates.values()) {
						for (const tile of state.tiles.values()) list.push({ sessionId: state.sessionId, tabId: tile.key, kind: KIND, contentId: tile.contentId });
					}
					ctx.webTerminals.retainTabs(list);
				} catch (error) {
					console.error("[terminal-tiles] retain failed", error);
				}
			};
			/** Notify subscribers, then persist. */
			const bump = (state, persist) => {
				state.version += 1;
				if (persist !== false) writeStored(state);
				for (const listener of [...state.listeners]) {
					try {
						listener();
					} catch (error) {
						console.error("[terminal-tiles] subscriber failed", error);
					}
				}
			};
			/** Create (or restore) one terminal tab's tiling state. */
			const createState = (sessionId, tabContentId) => {
				let tiles = new Map();
				let layout = null;
				let stored = null;
				try {
					const raw = window.localStorage.getItem(storageKeyOf(sessionId, tabContentId));
					stored = raw === null ? null : JSON.parse(raw);
				} catch (error) {
					stored = null;
				}
				if (stored !== null && typeof stored === "object") {
					const filled = new Map();
					const restored = restoreTree(sessionId, stored.layout, stored.tiles, filled);
					if (restored !== null && filled.size > 0) {
						layout = restored;
						tiles = filled;
					}
				}
				if (layout === null) {
					tiles = new Map();
					const key = newTileKey();
					tiles.set(key, { key, contentId: contentIdFor(sessionId, key), shellPath: preferredShell() });
					layout = leaf(key);
				}
				const state = {
					sessionId,
					tabContentId,
					tiles,
					layout,
					focused: stored !== null && typeof stored === "object" && typeof stored.focused === "string" && tiles.has(stored.focused) ? stored.focused : firstKey(layout),
					listeners: new Set(),
					version: 0,
					pendingRatio: 0.5,
					subscribe: null,
					getSnapshot: null
				};
				state.subscribe = (listener) => {
					state.listeners.add(listener);
					return () => {
						state.listeners.delete(listener);
					};
				};
				state.getSnapshot = () => state.version;
				writeStored(state);
				return state;
			};
			/** The face the body and the commands drive. */
			const face = {
				/** Ensure and return the state for one terminal tab. */
				ensure(sessionId, tabContentId) {
					const key = stateKeyOf(sessionId, tabContentId);
					let state = tabStates.get(key);
					if (state === undefined) {
						state = createState(sessionId, tabContentId);
						tabStates.set(key, state);
						retainAll();
					}
					return state;
				},
				/** Subscribe a body to its own state; a hook, called during render. */
				useSnapshot(sessionId, tabContentId) {
					const state = face.ensure(sessionId, tabContentId);
					return react.useSyncExternalStore(state.subscribe, state.getSnapshot);
				},
				/** The shipped terminal model for one tile, created on first use. */
				view(state, key) {
					const tile = state.tiles.get(key);
					if (tile === undefined) throw new Error(`terminal-tiles: unknown tile "${key}"`);
					return ctx.webTerminals.view(state.sessionId, key, tile.contentId, undefined, tile.shellPath);
				},
				/** The shipped keyed terminal state hook for one tile. */
				useTerminal(state, key) {
					const model = face.view(state, key);
					return react.useSyncExternalStore(model.state.subscribe, model.state.getSnapshot);
				},
				/** The shipped theme hook shape: a selector over the theme snapshot. */
				useTheme(selector) {
					return react.useSyncExternalStore(themeSource.subscribe, () => selector(themeSource.getSnapshot()));
				},
				/** Split the focused pane; the new pane lands right or below and takes focus. */
				split(state, axis) {
					if (state.tiles.size >= MAX_TILES) return false;
					const key = state.focused !== null && state.tiles.has(state.focused) ? state.focused : firstKey(state.layout);
					const fresh = newTileKey();
					state.tiles.set(fresh, { key: fresh, contentId: contentIdFor(state.sessionId, fresh), shellPath: preferredShell() });
					state.layout = replaceLeaf(state.layout, key, splitNode(axis, leaf(key), leaf(fresh), 0.5));
					state.focused = fresh;
					bump(state, true);
					retainAll();
					return true;
				},
				/** Close one pane, keeping at least one. */
				close(state, key) {
					if (state.tiles.size <= 1) return false;
					const tile = state.tiles.get(key);
					const layout = removeLeaf(state.layout, key);
					if (tile === undefined || layout === null) return false;
					state.tiles.delete(key);
					state.layout = layout;
					if (state.focused === key) state.focused = firstKey(layout);
					bump(state, true);
					closeTerminal(state.sessionId, key, tile.contentId);
					retainAll();
					return true;
				},
				/** Remember which pane the next split acts on. */
				focus(state, key) {
					if (state.focused === key) return;
					state.focused = key;
					bump(state, false);
				},
				/** Move one divider; the drag persists only on release. */
				setRatio(state, path, ratio, persist) {
					const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
					state.pendingRatio = clamped;
					state.layout = withRatio(state.layout, path, clamped);
					bump(state, persist);
				},
				/** Installed shells for the toolbar's picker; allocates no PTY. */
				shells(sessionId, signal) {
					return ctx.webTerminals.launchShells(sessionId, signal);
				},
				/** Remember the shell new tiles should start in (the shipped preference). */
				selectShell(path) {
					ctx.webTerminals.selectShell(path);
				}
			};
			/** Close every tile of one tab and forget it. */
			const disposeTab = (state, clearLayout) => {
				tabStates.delete(stateKeyOf(state.sessionId, state.tabContentId));
				for (const tile of state.tiles.values()) closeTerminal(state.sessionId, tile.key, tile.contentId);
				if (clearLayout) clearStored(state.sessionId, state.tabContentId);
				retainAll();
			};
			//#endregion

			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "terminal-tiles: dictionaries");

			// Visible for both terminal kinds. Registered immediately, so the mark
			// does not wait for the vendored terminal chunk.
			ctx.effect(() => ctx.slots.inject("sidebar.session.row.leading", () => ctx.slots.register({
				name: "sidebar.session.row.leading",
				id: "terminal",
				order: 20,
				locale: NS,
				inject: { openTabs: ctx.sidebarRight.openTabs }
			}, SessionTerminalMarker)), "terminal-tiles: session marker");

			// The body is registered first and inert until the type below is in force.
			ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
				name: "sidebar.right.pane.tab",
				key: ID,
				locale: NS,
				inject: (sessionId) => ({
					sessionId,
					terminalCopy,
					holder,
					face
				})
			}, TilesBody)), "terminal-tiles: tab body");

			// Retention and tab cleanup ride the sidebar's occurrence inventory. This
			// subscription is registered after the shipped terminal's own, because this
			// package lists it in dsh.client.inject, so the union written here wins.
			ctx.effect(() => {
				const seen = new Map();
				const keyOf = (tab) => `${tab.sessionId}\u0000${tab.tabId}`;
				const snapshot = ctx.sidebarRight.openTabs.getSnapshot();
				for (const tab of snapshot) if (tab.kind === KIND) seen.set(keyOf(tab), tab.contentId);
				const unsubscribe = ctx.sidebarRight.openTabs.subscribe(() => {
					const present = new Set();
					const current = ctx.sidebarRight.openTabs.getSnapshot();
					for (const tab of current) if (tab.kind === KIND) present.add(keyOf(tab));
					for (const [key, contentId] of [...seen]) {
						if (present.has(key)) continue;
						seen.delete(key);
						for (const state of [...tabStates.values()]) {
							if (state.tabContentId === contentId) disposeTab(state, true);
						}
					}
					for (const tab of current) if (tab.kind === KIND && !seen.has(keyOf(tab))) seen.set(keyOf(tab), tab.contentId);
					retainAll();
				});
				return () => {
					unsubscribe();
				};
			}, "terminal-tiles: terminal ownership");

			// Register our own page only once the official terminal UI has loaded.
			ctx.effect(() => {
				/** Register the page and its commands, keeping whatever succeeded. */
				const takeover = () => {
					const disposers = [];
					const keep = (disposer) => {
						if (typeof disposer === "function") disposers.push(disposer);
					};
					const settle = () => {
						for (const disposer of disposers) {
							try {
								disposer();
							} catch (error) {
								console.error("[terminal-tiles] dispose failed", error);
							}
						}
					};
					keep(ctx.sidebarRightTabs.register({
						id: ID,
						kind: KIND,
						multiple: true,
						priority: "extension",
						title: () => t("type.label"),
						guide: [{
							id: "tiles",
							commandId: OPEN_COMMAND_ID,
							order: 21,
							title: () => t("guide.title"),
							description: () => t("guide.description"),
							icon: TilesGlyph
						}]
					}));
					// One rejected profile default refuses the whole command. Desktop
					// accepts Control+Shift+` on macOS and Windows. A macOS browser does
					// not, so that profile uses Command+Shift+`. Linux web has no
					// two-modifier allowance for this key, so it stays unbound.
					const controlShiftBackquote = { code: "Backquote", modifiers: ["control", "shift"] };
					const commandShiftBackquote = { code: "Backquote", modifiers: ["primary", "shift"] };
					try {
						keep(ctx.shortcuts.register({
							id: OPEN_COMMAND_ID,
							label: () => t("shortcut.open"),
							aliases: ["multi-window terminal", "terminal tiles", "split terminal"],
							defaults: {
								"desktop:macos": controlShiftBackquote,
								"desktop:windows": controlShiftBackquote,
								"web:macos": commandShiftBackquote,
								"web:windows": controlShiftBackquote
							},
							regions: ["page", "editable", "terminal"],
							modals: [],
							resolve: ({ target: element }) => {
								const target = ctx.sidebarRight.commandTarget(element);
								if (target === undefined) return { status: "blocked", reason: t("shortcut.noSession") };
								return {
									status: "handled",
									run: () => {
										ctx.sidebarRight.openTabFromTarget(KIND, target);
									}
								};
							}
						}));
					} catch (error) {
						console.error(`[terminal-tiles] shortcut ${OPEN_COMMAND_ID} was refused`, error);
					}
					const resolveSplit = (axis) => ({ target: element }) => {
						const mounted = ctx.sidebarRight.mounted.getSnapshot();
						const active = ctx.sidebarRight.active();
						if (ctx.sidebarRight.commandTarget(element) === undefined || mounted === undefined || active === undefined || active.kind !== KIND) {
							return { status: "blocked", reason: t("shortcut.noTerminal") };
						}
						const state = face.ensure(mounted, typeof active.contentId === "string" ? active.contentId : active.id);
						if (state.tiles.size >= MAX_TILES) return { status: "blocked", reason: t("bar.limit", { count: String(MAX_TILES) }) };
						return {
							status: "handled",
							run: () => {
								face.split(state, axis);
							}
						};
					};
					// Ghostty: macOS is Command+D / Command+Shift+D, and Windows is
					// Ctrl+Shift+Right / Ctrl+Shift+Down. Linux rejects arrow defaults,
					// and one rejected profile refuses the whole command, so Linux has
					// no default and keeps the toolbar.
					const splitDefaults = {
						[SPLIT_RIGHT_ID]: {
							"desktop:macos": { code: "KeyD", modifiers: ["primary"] },
							"desktop:windows": { code: "ArrowRight", modifiers: ["control", "shift"] },
							"web:windows": { code: "ArrowRight", modifiers: ["control", "shift"] }
						},
						[SPLIT_DOWN_ID]: {
							"desktop:macos": { code: "KeyD", modifiers: ["primary", "shift"] },
							"desktop:windows": { code: "ArrowDown", modifiers: ["control", "shift"] },
							"web:windows": { code: "ArrowDown", modifiers: ["control", "shift"] }
						}
					};
					const shortcuts = [
						[SPLIT_RIGHT_ID, "shortcut.right", ["split terminal right", "terminal split right"], "row"],
						[SPLIT_DOWN_ID, "shortcut.down", ["split terminal down"], "column"]
					];
					for (const [id, label, aliases, axis] of shortcuts) {
						try {
							keep(ctx.shortcuts.register({
								id,
								label: () => t(label),
								aliases,
								defaults: splitDefaults[id],
								regions: ["page", "editable", "terminal"],
								modals: [],
								resolve: resolveSplit(axis)
							}));
						} catch (error) {
							console.error(`[terminal-tiles] shortcut ${id} was refused`, error);
						}
					}
					return settle;
				};
				let dispose = null;
				let cancelled = false;
				require.async("./client.terminal.js").then((chunk) => {
					if (cancelled) return;
					if (chunk === null || chunk === undefined || typeof chunk.TerminalBody !== "function") {
						throw new Error("terminal-tiles: the vendored chunk exports no TerminalBody");
					}
					holder.body = chunk.TerminalBody;
					dispose = takeover();
				}).catch((error) => {
					console.error("[terminal-tiles] the vendored terminal chunk did not load; the shipped terminal stays in force", error);
				});
				return () => {
					cancelled = true;
					if (dispose !== null) dispose();
				};
			}, "terminal-tiles: terminal type");
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
