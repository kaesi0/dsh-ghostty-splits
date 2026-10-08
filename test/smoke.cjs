/**
 * Self-contained smoke test for the dsh-ghostty-splits browser half.
 *
 * It simulates the client module loader (including `require.async`), a minimal
 * React, the sidebar occurrence inventory, the terminal controller face and the
 * vendored chunk, then asserts the parts this plugin owns: a separate
 * multi-window page that does not replace the shipped terminal, the split
 * tree and its persistence, the retention union, the tab-close cleanup, and
 * the open and split commands.
 *
 *   node test/smoke.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const here = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(here, 'lib', 'client.js'), 'utf8');
const chunk = fs.readFileSync(path.join(here, 'lib', 'client.terminal.js'), 'utf8');

//#region the vendored chunk
assert.ok(chunk.startsWith('window.__ModuleLoader__.load({'), 'the chunk is a loader registration');
assert.ok(chunk.includes('\tid: "dsh-ghostty-splits",'), 'the chunk registration is renamed');
assert.ok(chunk.includes('\tchunk: "client.terminal.js",'), 'the chunk names itself');
assert.ok(chunk.includes('\n});'), 'the chunk closes its registration');
assert.ok(chunk.includes('//# sourceMappingURL=client.terminal.js.map (not vendored)'), 'the map trailer is documented');
assert.ok(chunk.includes('\texports.TerminalBody = TerminalBody;'), 'the chunk exports TerminalBody');
assert.ok(!chunk.includes('@deepseek-ai/dsh-client-ui-sidebar-terminal'), 'no shipped identity is left behind');
assert.ok(chunk.includes('"dsh-ghostty-splits/xterm.css"') && chunk.includes('"dsh-ghostty-splits/terminal.module.css"'), 'the CSS tags are retagged');
assert.ok(chunk.includes('@xterm+xterm@'), 'xterm is vendored inside the chunk');
//#endregion

//#region harness
let registration;
const storage = new Map();
const window = {
	__ModuleLoader__: {
		load(reg) {
			registration = reg;
		}
	},
	localStorage: {
		getItem: (key) => (storage.has(key) ? storage.get(key) : null),
		setItem: (key, value) => {
			storage.set(key, String(value));
		},
		removeItem: (key) => {
			storage.delete(key);
		}
	}
};
window.addEventListener = () => {};
window.removeEventListener = () => {};

/** A tiny observable, shaped like `createSnapshotStore`. */
function createStore(initial) {
	const listeners = new Set();
	let value = initial;
	return {
		getSnapshot: () => value,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		set(next) {
			value = next;
			for (const listener of [...listeners]) listener();
		}
	};
}

let hookState = [];
let hookIndex = 0;
let pendingEffects = [];
const react = {
	useState(initial) {
		const index = hookIndex++;
		if (!(index in hookState)) hookState[index] = initial;
		return [hookState[index], (value) => {
			hookState[index] = value;
		}];
	},
	useRef(initial) {
		const index = hookIndex++;
		if (!(index in hookState)) hookState[index] = { current: initial };
		return hookState[index];
	},
	useEffect(fn) {
		pendingEffects.push(fn);
	},
	useSyncExternalStore(_subscribe, getSnapshot) {
		hookIndex++;
		return getSnapshot();
	},
	createElement(type, props, children) {
		return { type, props, children };
	}
};
function render(Component, props) {
	hookIndex = 0;
	pendingEffects = [];
	const tree = Component(props);
	const effects = pendingEffects;
	pendingEffects = [];
	for (const effect of effects) effect();
	return tree;
}
//#endregion

//#region fake client context
const effects = [];
const seen = { locale: [], tabs: [], slots: [], shortcuts: [], retained: [], closed: [], shells: [], selected: [] };
const openTabs = createStore([
	// The shipped terminal stays a different kind from this plugin's page.
	{ sessionId: 's1', tabId: 'tab1', kind: 'terminal', contentId: 'sidebar://terminal/shipped' },
	{ sessionId: 's1', tabId: 'tab9', kind: 'terminalTiles', contentId: 'sidebar://terminalTiles/tiles' },
	{ sessionId: 's1', tabId: 'tab2', kind: 'guide', contentId: 'sidebar://guide' }
]);
const mounted = createStore('s1');
let activeTab = { id: 'tab9', kind: 'terminalTiles', contentId: 'sidebar://terminalTiles/tiles' };
const opened = [];
const viewCalls = [];
function makeModel(id) {
	return {
		id,
		state: createStore({ phase: 'ready', id }),
		mount: () => () => {}
	};
}
const ctx = {
	effect(fn) {
		const dispose = fn();
		effects.push(dispose);
		return dispose;
	},
	on() {
		return () => {};
	},
	logger: { warn() {} },
	locale: {
		bind: (namespace) => (key) => `${namespace}:${key}`,
		register(namespace, dicts) {
			seen.locale.push({ namespace, dicts });
			return () => {};
		}
	},
	theme: {
		getTheme: () => ({ id: 'dark' })
	},
	slots: {
		inject(name, callback) {
			seen.slots.push(name);
			return callback();
		},
		register(options, component) {
			seen.slots.push({ options, component });
			return () => {};
		}
	},
	sidebarRightTabs: {
		register(definition) {
			seen.tabs.push(definition);
			return () => {};
		}
	},
	shortcuts: {
		register(command) {
			seen.shortcuts.push(command);
			return () => {};
		}
	},
	sidebarRight: {
		openTabs,
		mounted,
		active: () => activeTab,
		commandTarget: () => ({ sessionId: 's1', paneId: 'pane1', host: 'dock' }),
		openTabFromTarget(kind, target) {
			opened.push({ kind, target });
		}
	},
	webTerminals: {
		view(sessionId, key, contentId, terminalId, shellPath) {
			viewCalls.push({ sessionId, key, contentId, shellPath });
			return makeModel(key);
		},
		close(sessionId, key, contentId) {
			seen.closed.push({ sessionId, key, contentId });
		},
		retainTabs(tabs) {
			seen.retained.push(tabs);
		},
		launchShells: async () => ({ shells: [{ path: '/bin/zsh', name: 'zsh' }], selectedShell: '/bin/zsh' }),
		selectShell: (shellPath) => seen.selected.push(shellPath)
	}
};

const FakeTerminalBody = function FakeTerminalBody() {
	return null;
};
let asyncChunkCalls = 0;
const requireShim = (spec) => {
	assert.equal(spec, 'react', 'the bundle only requires the platform React seed');
	return react;
};
requireShim.async = async (spec) => {
	asyncChunkCalls += 1;
	assert.equal(spec, './client.terminal.js', 'the vendored chunk is requested by its package-local name');
	return { TerminalBody: FakeTerminalBody };
};
//#endregion

async function main() {
const run = new Function('window', source);
run(window);
assert.ok(registration, 'the bundle registers a module');
assert.equal(registration.id, 'dsh-ghostty-splits', 'module id is the package name');
const loaded = registration.factory(requireShim);
assert.deepEqual(
	loaded.inject,
	['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'webTerminals', 'theme', 'shortcuts'],
	'service inject list'
);
loaded.apply(ctx);

//#region deferred takeover
assert.equal(asyncChunkCalls, 1, 'the chunk is requested once');
assert.equal(seen.tabs.length, 0, 'nothing is registered until the official UI has loaded');
assert.equal(seen.shortcuts.length, 0, 'no command is bound before the page is ready');

await Promise.resolve();
await Promise.resolve();

assert.equal(seen.tabs.length, 1, 'the extra page registers once the chunk resolves');
const definition = seen.tabs[0];
assert.equal(definition.id, 'dsh-ghostty-splits');
assert.equal(definition.kind, 'terminalTiles', 'the shipped terminal kind is not replaced');
assert.notEqual(definition.kind, 'terminal');
assert.equal(definition.priority, 'extension');
assert.equal(definition.multiple, true, 'each open is its own page');
assert.equal(definition.guide.length, 1, 'one guide entry sits beside the shipped card');
assert.equal(definition.guide[0].order, 21, 'it sorts after the shipped terminal card');
assert.equal(definition.guide[0].commandId, 'terminalTiles.new', 'the card shows this plugin\'s shortcut, not ⌃`');
assert.equal(definition.guide[0].title(), 'terminalTiles:guide.title');
assert.equal(typeof definition.guide[0].icon, 'function');
assert.equal(definition.guide[0].icon({ size: 22 }).type, 'svg', 'the guide glyph renders');

const openCommand = seen.shortcuts.find((command) => command.id === 'terminalTiles.new');
assert.ok(openCommand, 'the open command is registered');
assert.equal(openCommand.label(), 'terminalTiles:shortcut.open');
const controlShiftBackquote = { code: 'Backquote', modifiers: ['control', 'shift'] };
const commandShiftBackquote = { code: 'Backquote', modifiers: ['primary', 'shift'] };
assert.deepEqual(openCommand.defaults, {
	'desktop:macos': controlShiftBackquote,
	'desktop:windows': controlShiftBackquote,
	'web:macos': commandShiftBackquote,
	'web:windows': controlShiftBackquote
}, 'Mac and Windows each get a chord the shell accepts; Linux web is unbound');
assert.equal(openCommand.defaults['desktop:linux'], undefined);
assert.equal(openCommand.defaults['web:linux'], undefined);
const openedTab = openCommand.resolve({ target: {} });
assert.equal(openedTab.status, 'handled');
openedTab.run();
assert.deepEqual(opened, [{ kind: 'terminalTiles', target: { sessionId: 's1', paneId: 'pane1', host: 'dock' } }], 'the shortcut opens this page, not a shipped terminal');

const splitCommands = seen.shortcuts.filter((command) => command.id !== 'terminalTiles.new');
assert.deepEqual(splitCommands.map((command) => command.id), ['terminalTiles.splitRight', 'terminalTiles.splitDown']);
for (const command of splitCommands) {
	assert.deepEqual(command.defaults, { 'desktop:macos': { code: 'KeyD', modifiers: command.id.endsWith('Down') ? ['primary', 'shift'] : ['primary'] } });
	assert.deepEqual(command.regions, ['page', 'editable'], 'macOS native bindings ignore regions; no Windows/Linux default swallows Ctrl+D');
}
assert.ok(!seen.shortcuts.some((command) => command.id === 'terminal.new'), 'the shipped new-terminal command is not re-registered');
//#endregion

//#region body + tiling
const body = seen.slots.find((entry) => typeof entry === 'object' && entry.options);
assert.ok(body, 'the tab body is registered');
assert.equal(body.options.name, 'sidebar.right.pane.tab');
assert.equal(body.options.key, 'dsh-ghostty-splits');
assert.equal(body.options.locale, 'terminalTiles');
const injected = body.options.inject('s1');
assert.equal(injected.sessionId, 's1');
assert.equal(typeof injected.terminalCopy, 'function');
assert.equal(injected.holder.body, FakeTerminalBody, 'the loaded surface reaches the body');

function bodyProps() {
	return Object.assign({}, injected, {
		useTabInfo: () => ({ tab: { id: 'tab9', kind: 'terminalTiles', contentId: 'sidebar://terminalTiles/tiles' } }),
		t: (key) => `terminalTiles:${key}`
	});
}
let tree = render(body.component, bodyProps());
assert.equal(tree.type, 'div', 'the page renders');
assert.equal(tree.children.length, 2, 'toolbar plus content');
const contentElement = tree.children[1];
assert.equal(contentElement.type.name, 'SplitNode', 'the content is the tiling root');
// A leaf layout renders one Tile, which renders the shipped terminal body. Neither
// component calls hooks itself, so calling them directly is safe here.
const tileElement = contentElement.type(contentElement.props);
assert.equal(tileElement.type.name, 'Tile', 'a leaf renders one tile');
const tileTree = tileElement.type(tileElement.props);
const terminalElement = tileTree.children.find((child) => child.type === FakeTerminalBody);
assert.ok(terminalElement, 'the tile renders the shipped terminal body');
const firstTileKey = terminalElement.props.useTabInfo().tab.id;
assert.match(firstTileKey, /^tile-/, 'the tile key is generated');
assert.equal(terminalElement.props.t, injected.terminalCopy, 'the terminal body keeps the shipped copy namespace');
assert.equal(typeof terminalElement.props.view, 'function', 'the tile supplies the terminal model reader');
assert.equal(typeof terminalElement.props.useTerminal, 'function', 'and its keyed state hook');
assert.equal(typeof terminalElement.props.useTheme, 'function', 'and the theme hook');

const stateKey = 's1\u0000sidebar://terminalTiles/tiles';
let state = injected.face.ensure('s1', 'sidebar://terminalTiles/tiles');
assert.equal(state.tiles.size, 1, 'a fresh tab starts with one pane');
assert.equal(state.layout.type, 'leaf', 'and a leaf layout');
const model = terminalElement.props.view(firstTileKey);
assert.ok(model !== undefined && model !== null, 'the tile reads a terminal model');
assert.ok(
	viewCalls.some((call) => call.key === firstTileKey && String(call.contentId).startsWith('dsh-ghostty-splits://')),
	'the tile binds its own content identity'
);

assert.equal(injected.face.split(state, 'row'), true, 'split right');
assert.equal(state.tiles.size, 2, 'two panes');
assert.equal(state.layout.type, 'split');
assert.equal(state.layout.axis, 'row', 'a right split');
assert.equal(state.layout.first.key, firstTileKey, 'the split pane keeps its place');
assert.equal(state.focused, state.layout.second.key, 'the new pane takes focus');
assert.equal(injected.face.split(state, 'column'), true, 'split down on the focused pane');
assert.equal(state.layout.second.type, 'split', 'splits nest');
assert.equal(state.layout.second.axis, 'column', 'and keep their own axis');

const stored = JSON.parse(storage.get('dsh-ghostty-splits.v1.s1.sidebar://terminalTiles/tiles'));
assert.equal(Object.keys(stored.tiles).length, 3, 'all three panes are persisted');
assert.equal(stored.tiles[firstTileKey].contentId, viewCalls[0].contentId, 'the binding identity survives a reload');

const second = state.layout.second;
assert.equal(injected.face.close(state, second.second.key), true, 'closing one pane');
assert.equal(state.tiles.size, 2, 'the pane is gone');
assert.equal(state.layout.second.type, 'leaf', 'and its parent collapsed');
assert.deepEqual(seen.closed.map((entry) => entry.key), [second.second.key], 'the Host terminal is closed with the pane');
assert.equal(injected.face.close(state, state.layout.key === undefined ? firstTileKey : firstTileKey), true, 'the last removable pane closes');
assert.equal(injected.face.close(state, firstKeyOf(state.layout)), false, 'the final pane is kept');

function firstKeyOf(node) {
	return node.type === 'leaf' ? node.key : firstKeyOf(node.first);
}
//#endregion

//#region commands
const rightCommand = seen.shortcuts.find((command) => command.id === 'terminalTiles.splitRight');
activeTab = undefined;
assert.equal(rightCommand.resolve({ target: {} }).status, 'blocked', 'a split needs the multi-window page');
activeTab = { id: 'tab1', kind: 'terminal', contentId: 'sidebar://terminal/shipped' };
assert.equal(rightCommand.resolve({ target: {} }).status, 'blocked', 'a shipped terminal tab is not this page');
activeTab = { id: 'tab9', kind: 'terminalTiles', contentId: 'sidebar://terminalTiles/tiles' };
const handled = rightCommand.resolve({ target: {} });
assert.equal(handled.status, 'handled', 'with this page focused the split is handled');
const before = injected.face.ensure('s1', 'sidebar://terminalTiles/tiles').tiles.size;
handled.run();
assert.equal(injected.face.ensure('s1', 'sidebar://terminalTiles/tiles').tiles.size, before + 1, 'running it splits the focused pane');
assert.equal(seen.shortcuts.find((command) => command.id === 'terminalTiles.splitDown').resolve({ target: {} }).status, 'handled', 'the down command resolves the same way');
//#endregion

//#region retention and tab cleanup
const lastRetain = seen.retained[seen.retained.length - 1];
assert.ok(lastRetain.some((entry) => entry.contentId === 'sidebar://terminal/shipped'), 'the shipped terminal tab stays retained');
const tileEntries = lastRetain.filter((entry) => String(entry.contentId).startsWith('dsh-ghostty-splits://'));
assert.equal(tileEntries.length, injected.face.ensure('s1', 'sidebar://terminalTiles/tiles').tiles.size, 'every tile is retained');
assert.ok(tileEntries.every((entry) => entry.kind === 'terminalTiles' && typeof entry.tabId === 'string'), 'tiles are shaped like sidebar occurrences');

seen.closed.length = 0;
openTabs.set([
	{ sessionId: 's1', tabId: 'tab1', kind: 'terminal', contentId: 'sidebar://terminal/shipped' },
	{ sessionId: 's1', tabId: 'tab2', kind: 'guide', contentId: 'sidebar://guide' }
]);
assert.ok(seen.closed.length > 0, 'closing the multi-window tab closes its terminals');
assert.equal(storage.has('dsh-ghostty-splits.v1.s1.sidebar://terminalTiles/tiles'), false, 'and forgets its persisted layout');
//#endregion

//#region shell preference
injected.face.selectShell('/bin/zsh');
assert.deepEqual(seen.selected, ['/bin/zsh'], 'the shipped shell preference is written through');
//#endregion

//#region teardown
for (const dispose of effects) if (typeof dispose === 'function') dispose();
//#endregion

console.log('smoke: all assertions passed');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
