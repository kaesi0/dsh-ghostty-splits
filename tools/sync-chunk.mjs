/**
 * Re-vendor the shipped terminal browser chunk into this plugin.
 *
 * `dsh-ghostty-splits` renders the official terminal UI (xterm + fit + the
 * React body) inside its own tiled layout. That UI lives in the installed
 * app's `@deepseek-ai/dsh-client-ui-sidebar-terminal/lib/client.terminal.js`
 * chunk, which is self-contained: xterm and the addon are inlined and it only
 * asks the module table for platform seeds.
 *
 * This script copies that artifact into `lib/client.terminal.js`, rewrites the
 * three identity strings the browser module system and the CSS injector key on,
 * drops the source-map trailer, and then touches `lib/client.js` so the client
 * module system bumps the owner revision — a chunk is fetched under its owner's
 * revision, so editing only the chunk would never reach an open page.
 *
 * Usage: node tools/sync-chunk.mjs
 */
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Installed Electron app whose asar holds the shipped packages. */
const ASAR = process.env.DSH_ASAR ?? '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar';
/** The shipped terminal chunk inside that asar. */
const SOURCE = '/dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar-terminal/lib/client.terminal.js';
/** This plugin's package name: the browser module id and the CSS tag prefix. */
const PACKAGE = 'dsh-ghostty-splits';
/** Strings rewritten on the way in, with the reason they matter. */
const REWRITES = [
	// The Loader registration id. Chunks key on the owner row, but keeping the
	// shipped id would be a lie the diagnostics would repeat.
	['\tid: "@deepseek-ai/dsh-client-ui-sidebar-terminal",', `\tid: "${PACKAGE}",`],
	// Replacing the default shell's CSS tags wholesale.
	['"@deepseek-ai/dsh-client-ui-sidebar-terminal/xterm.css"', `"${PACKAGE}/xterm.css"`],
	['"@deepseek-ai/dsh-client-ui-sidebar-terminal/terminal.module.css"', `"${PACKAGE}/terminal.module.css"`],
	['tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-sidebar-terminal";', `tag.dataset.plugin = "${PACKAGE}";`],
	// A missing map is noise in devtools; the Host serves chunks, not their maps.
	['//# sourceMappingURL=client.terminal.js.map', '//# sourceMappingURL=client.terminal.js.map (not vendored)']
];

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'lib', 'client.terminal.js');
const TOUCH = join(here, '..', 'lib', 'client.js');

/** Read the asar's header index and absolute data offset. */
function readAsarHeader(asar) {
	const fd = openSync(asar, 'r');
	try {
		const head = Buffer.alloc(16);
		readSync(fd, head, 0, 16, 0);
		const headerSize = head.readUInt32LE(4);
		const raw = Buffer.alloc(headerSize);
		readSync(fd, raw, 0, headerSize, 8);
		const jsonSize = raw.readUInt32LE(4);
		return { index: JSON.parse(raw.toString('utf8', 8, 8 + jsonSize)), base: 8 + headerSize, fd };
	} catch (error) {
		closeSync(fd);
		throw error;
	}
}

/** Locate one file entry in the asar index. */
function entryOf(index, path) {
	let node = index;
	for (const part of path.split('/').filter(Boolean)) {
		node = node.files?.[part];
		if (node === undefined) return undefined;
	}
	return node.files === undefined ? node : undefined;
}

/** Read one file out of the asar, packed or unpacked. */
function readSource() {
	if (!existsSync(ASAR)) throw new Error(`sync-chunk: no asar at ${ASAR}`);
	const { index, base, fd } = readAsarHeader(ASAR);
	try {
		const entry = entryOf(index, SOURCE);
		if (entry === undefined) throw new Error(`sync-chunk: ${SOURCE} is not in ${ASAR}`);
		if (entry.unpacked === true) return readFileSync(`${ASAR}.unpacked${SOURCE}`);
		const buffer = Buffer.alloc(entry.size);
		readSync(fd, buffer, 0, entry.size, base + Number(entry.offset));
		return buffer;
	} finally {
		closeSync(fd);
	}
}

const source = readSource().toString('utf8');
if (!source.startsWith('window.__ModuleLoader__.load(')) {
	throw new Error('sync-chunk: the shipped chunk no longer starts with a module-loader registration');
}
let text = source;
for (const [from, to] of REWRITES) {
	if (!text.includes(from)) throw new Error(`sync-chunk: expected string not found: ${from.slice(0, 60)}`);
	text = text.split(from).join(to);
}
writeFileSync(OUT, text);

// Bump the owner revision so an open page re-fetches the chunk.
const now = new Date();
utimesSync(TOUCH, now, now);

console.log(`sync-chunk: wrote ${OUT} (${text.length} bytes, source ${source.length})`);
console.log(`sync-chunk: touched ${TOUCH} (${statSync(TOUCH).size} bytes) to bump the owner revision`);
