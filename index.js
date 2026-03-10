/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WATCH_DIRS          = ["lib", "set"];
const WATCH_EXTS          = [".js"];
const BOT_FILE            = path.join(__dirname, "bot.js");
const RESTART_COOLDOWN_MS = 2000;

let botProcess   = null;
let restarting   = false;
let restartTimer = null;
let startTime    = null;

const log  = (msg) => console.log(chalk.cyan(`[Launcher] ${msg}`));
const warn = (msg) => console.log(chalk.yellow(`[Launcher] ${msg}`));
const fail = (msg) => console.log(chalk.red(`[Launcher] ${msg}`));
const ok   = (msg) => console.log(chalk.green(`[Launcher] ${msg}`));

function startBot() {
  if (restarting) return;

  startTime  = Date.now();
  botProcess = spawn(process.execPath, [BOT_FILE], {
    stdio: "inherit",
    env:   { ...process.env },
    cwd:   __dirname,
  });

  ok(`Bot dimulai — PID: ${botProcess.pid}`);

  botProcess.on("exit", (code, signal) => {
    botProcess = null;

    if (code === 0) {
      ok("Bot berhenti normal. Tidak di-restart.");
      return;
    }

    if (code === 5) {
      ok("Bot meminta shutdown permanen (exit 5). Launcher berhenti.");
      process.exit(0);
    }

    const uptime = ((Date.now() - startTime) / 1000).toFixed(1);
    warn(`Bot berhenti — code: ${code ?? signal}, uptime: ${uptime}s`);
    scheduleRestart("crash/exit");
  });

  botProcess.on("error", (e) => {
    fail(`Spawn error: ${e.message}`);
    botProcess = null;
    scheduleRestart("spawn error");
  });
}

function scheduleRestart(reason) {
  if (restarting) return;
  restarting = true;
  if (restartTimer) clearTimeout(restartTimer);

  warn(`Restart dalam ${RESTART_COOLDOWN_MS / 1000}s... (${reason})`);

  restartTimer = setTimeout(() => {
    restarting   = false;
    restartTimer = null;
    startBot();
  }, RESTART_COOLDOWN_MS);
}

function killBot(cb) {
  if (!botProcess) { cb?.(); return; }
  const proc = botProcess;
  botProcess  = null;
  proc.removeAllListeners("exit");
  proc.once("exit", () => cb?.());
  try {
    proc.kill("SIGTERM");
    setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 3000);
  } catch {
    cb?.();
  }
}

function scheduleHotReload(changedFile) {
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    warn(`Hot reload: ${path.relative(__dirname, changedFile)}`);
    killBot(() => {
      restarting = false;
      startBot();
    });
  }, RESTART_COOLDOWN_MS);
}

function watchLibFiles() {
  for (const dir of WATCH_DIRS) {
    const fullDir = path.join(__dirname, dir);
    if (!fs.existsSync(fullDir)) continue;

    fs.watch(fullDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (!WATCH_EXTS.includes(path.extname(filename))) return;
      scheduleHotReload(path.join(fullDir, filename));
    });

    log(`Watching: ./${dir}/`);
  }
}

process.on("SIGINT",  () => { warn("SIGINT — mematikan..."); killBot(() => process.exit(0)); });
process.on("SIGTERM", () => { warn("SIGTERM — mematikan..."); killBot(() => process.exit(0)); });

log("Launcher aktif");
watchLibFiles();
startBot();
