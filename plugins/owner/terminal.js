
/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, "..", "..");
const cwdMap = new Map();

const getCwd = (chat) => {
  const cwd = cwdMap.get(chat);
  if (cwd && fs.existsSync(cwd)) return cwd;
  cwdMap.set(chat, rootDir);
  return rootDir;
};

const setCwd = (chat, newPath) => cwdMap.set(chat, newPath);
const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(2)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
};

const fmtUptime = (sec) => {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
};

const trimOutput = (str, max = 3000) => {
  if (!str) return "(kosong)";
  str = str.trim();
  if (str.length > max) {
    return str.slice(0, max) + `\n\n... [dipotong, total ${str.length} karakter]`;
  }
  return str;
};

const builtins = {
  ping: async (m) => {
    const start = Date.now();
    await m.react("🏓");
    const latency = Date.now() - start;
    const heapUsed = process.memoryUsage().heapUsed;
    return (
      `🏓 *PONG!*\n\n` +
      `⚡ *Latency:* ${latency}ms\n` +
      `🧠 *Heap Used:* ${fmtBytes(heapUsed)}\n` +
      `⏱️ *Runtime:* ${fmtUptime(process.uptime())}`
    );
  },

  runtime: async () => {
    const mem  = process.memoryUsage();
    const cpu  = process.cpuUsage();
    return (
      `⏱️ *RUNTIME INFO*\n\n` +
      `🕐 *Uptime Bot:* ${fmtUptime(process.uptime())}\n` +
      `🖥️ *Uptime Server:* ${fmtUptime(os.uptime())}\n\n` +
      `🧠 *Memory:*\n` +
      `  RSS       : ${fmtBytes(mem.rss)}\n` +
      `  Heap Used : ${fmtBytes(mem.heapUsed)}\n` +
      `  Heap Total: ${fmtBytes(mem.heapTotal)}\n` +
      `  External  : ${fmtBytes(mem.external)}\n\n` +
      `⚙️ *CPU Time:*\n` +
      `  User  : ${(cpu.user / 1000).toFixed(2)}ms\n` +
      `  System: ${(cpu.system / 1000).toFixed(2)}ms\n\n` +
      `📦 *Node.js:* ${process.version}\n` +
      `🏷️ *Platform:* ${process.platform} (${process.arch})\n` +
      `🆔 *PID:* ${process.pid}`
    );
  },

  sysinfo: async () => {
    const mem    = os.freemem();
    const total  = os.totalmem();
    const used   = total - mem;
    const cpus   = os.cpus();
    const cpuModel = cpus[0]?.model ?? "Unknown";
    const cpuCores = cpus.length;
    const loadAvg  = os.loadavg().map((v) => v.toFixed(2)).join(" | ");
    return (
      `🖥️ *SYSTEM INFO*\n\n` +
      `📛 *Hostname:* ${os.hostname()}\n` +
      `🏷️ *OS:* ${os.type()} ${os.release()}\n` +
      `🏗️ *Arch:* ${os.arch()}\n\n` +
      `💾 *RAM:*\n` +
      `  Total : ${fmtBytes(total)}\n` +
      `  Used  : ${fmtBytes(used)}\n` +
      `  Free  : ${fmtBytes(mem)}\n\n` +
      `⚙️ *CPU:* ${cpuModel}\n` +
      `  Cores : ${cpuCores}\n` +
      `  Load  : ${loadAvg} (1/5/15 min)\n\n` +
      `🕐 *Uptime:* ${fmtUptime(os.uptime())}`
    );
  },

  pwd: async (m) => {
    return `📂 *CWD:*\n\`${getCwd(m.chat)}\``;
  },

  help: async () => {
    return (
      `🖥️ *TERMINAL BOT — HELP*\n\n` +
      `*Built-in:*\n` +
      `• \`$ ping\` — latency & memory\n` +
      `• \`$ runtime\` — info proses Node.js\n` +
      `• \`$ sysinfo\` — info OS & CPU\n` +
      `• \`$ pwd\` — direktori saat ini\n` +
      `• \`$ help\` — daftar ini\n\n` +
      `*Shell Commands (via exec):*\n` +
      `• \`$ ls\` / \`$ ls -la\`\n` +
      `• \`$ cd folder\` — pindah direktori\n` +
      `• \`$ cat file.js\` — baca file\n` +
      `• \`$ rm file\` — hapus file\n` +
      `• \`$ mkdir folder\`\n` +
      `• \`$ npm install pkg\`\n` +
      `• \`$ git status\` / \`$ git pull\`\n` +
      `• \`$ ps aux\` — proses berjalan\n` +
      `• \`$ df -h\` — disk usage\n` +
      `• \`$ free -h\` — memory\n` +
      `• Dan semua perintah shell lainnya!\n\n` +
      `*Format:*\n` +
      `  \`$ <perintah>\` — dengan prefix $\n` +
      `  atau no-prefix (khusus owner)\n\n` +
      `⚠️ _Hanya owner yang bisa menggunakan_`
    );
  },
};

const BLACKLIST_PATTERNS = [
  /rm\s+-rf\s+\/(?!\w)/i,     // rm -rf / (root)
  /:\(\)\s*\{.*\}/i,           // fork bomb
  /mkfs/i,                     // format disk
  /dd\s+if=.*of=\/dev\//i,    // overwrite disk
  /shutdown/i,
  /reboot/i,
  /halt/i,
  /poweroff/i,
  />\s*\/dev\/sd/i,            // overwrite disk device
];

const isBlacklisted = (cmd) => BLACKLIST_PATTERNS.some((re) => re.test(cmd));


const handler = async (m, { conn, text, args }) => {
  await m.react("⌨️");

  const rawInput = text?.trim() || args.join(" ").trim();
  if (!rawInput) {
    return m.reply(await builtins.help());
  }

  const cwd = getCwd(m.chat);
  if (builtins[rawInput.split(" ")[0]?.toLowerCase()]) {
    const key = rawInput.split(" ")[0].toLowerCase();
    try {
      const result = await builtins[key](m);
      await m.react("✅");
      return m.reply(result);
    } catch (err) {
      await m.react("❌");
      return m.reply(`❌ Error: ${err.message}`);
    }
  }

  if (rawInput.startsWith("cd")) {
    const target = rawInput.slice(2).trim() || rootDir;
    const newPath = path.resolve(cwd, target);
    if (!fs.existsSync(newPath)) {
      await m.react("❌");
      return m.reply(`❌ Direktori tidak ditemukan:\n\`${newPath}\``);
    }
    if (!fs.statSync(newPath).isDirectory()) {
      await m.react("❌");
      return m.reply(`❌ Bukan direktori:\n\`${newPath}\``);
    }
    setCwd(m.chat, newPath);
    await m.react("✅");
    return m.reply(`📂 Pindah ke:\n\`${newPath}\``);
  }

  if (isBlacklisted(rawInput)) {
    await m.react("🚫");
    return m.reply(`🚫 *Perintah diblokir demi keamanan!*\n\`${rawInput}\``);
  }

  const start = Date.now();
  try {
    const { stdout, stderr } = await execAsync(rawInput, {
      cwd,
      timeout: 30000,      
      maxBuffer: 1024 * 512, 
      env: { ...process.env, TERM: "xterm" },
    });

    const elapsed = Date.now() - start;
    const out     = trimOutput(stdout || stderr || "(tidak ada output)");

    await m.react("✅");
    return m.reply(
      `\`\`\`\n${out}\n\`\`\`\n\n` +
      `📂 *CWD:* \`${cwd}\`\n` +
      `⏱️ *Waktu:* ${elapsed}ms`
    );

  } catch (err) {
    const elapsed = Date.now() - start;
    const errOut  = trimOutput(err.stderr || err.stdout || err.message);
    await m.react("❌");
    return m.reply(
      `❌ *Error (exit ${err.code ?? "?"})*\n\n` +
      `\`\`\`\n${errOut}\n\`\`\`\n\n` +
      `📂 *CWD:* \`${cwd}\`\n` +
      `⏱️ *Waktu:* ${elapsed}ms`
    );
  }
};

handler.command     = ["$","exec"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Terminal shell langsung dari WhatsApp (owner only)";

export default handler;