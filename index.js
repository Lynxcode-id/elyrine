/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import yargs from 'yargs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { createInterface } from 'readline';
import { setupMaster, fork } from 'cluster';
import { watchFile, unwatchFile } from 'fs';
import { printBootHeader } from './lib/loader.js';
import { suggestedHeapMB } from './lib/perf.js';

const rl = createInterface(process.stdin, process.stdout);
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { name, author } = require(join(__dirname, './package.json'));

var isRunning = false;
var child = null;

function start(file) {
  if (isRunning) return;
  isRunning = true;
  printBootHeader();

  let args = [join(__dirname, file), ...process.argv.slice(2)];

  const heap = `--max-old-space-size=${suggestedHeapMB()}`;
  const execArgv = [...process.execArgv.filter(a => !a.startsWith('--max-old-space-size')), heap, '--expose-gc'];
  setupMaster({ exec: args[0], args: args.slice(1), execArgv });
  const p = child = fork();
  let restarting = false;

  p.on('message', data => {
    if (data !== 'uptime') console.log('[IPC]', data);
    switch (data) {
      case 'reset':
        if (restarting) break;
        restarting = true;
        p.kill();
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
      default:
        console.warn('[⚠️ UNRECOGNIZED MESSAGE]', data);
    }
  });

  p.on('exit', (_, code) => {
    if (child !== p) return;
    child = null;
    isRunning = false;
    console.error('[❗] Exited with code:', code);
    if (restarting || code !== 0) {
      console.log('[🔄] Restarting worker...');
      return setTimeout(() => start(file), 1500);
    }
    watchFile(args[0], () => {
      unwatchFile(args[0]);
      start(file);
    });
  });

  let opts = yargs(process.argv.slice(2)).exitProcess(false).parse();

  if (!opts['test']) {
    if (!rl.listenerCount('line')) {
      rl.on('line', line => {
        (child || p).emit('message', line.trim());
      });
    }
  }
}

start('main.js');
