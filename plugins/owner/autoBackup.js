import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, "..", "..");

const INTERVAL_MS      = 2 * 60 * 60 * 1000;
const RETRY_MS         = 5 * 60 * 1000;
const MAX_RETRY        = 3;
const STARTUP_DELAY_MS = 15 * 1000;
const SKIP = new Set([
  "node_modules", "package-lock.json", "sampah", "session", "dyy", "temp","tmp", ".git",
]);

const FORCE_INCLUDE = new Set([
  "data", "database", "lib", "plugins", "set",
]);

const ALLOWED_EXT = new Set([
  ".js", ".json", ".md", ".txt", ".env",
  ".yaml", ".yml", ".html", ".css", ".svg",
  ".mp3", ".jpeg", ".jpg", ".png", ".webp",".ttf",
]);

const FORCE_ROOT_FILES = new Set([
  "index.js", "package.json", "README.md", ".env",
]);

function shouldSkip(name, isDir = false) {
  if (FORCE_INCLUDE.has(name)) return false;
  if (SKIP.has(name)) return true;
  if (name.startsWith(".")) return true;
  return false;
}

function getAllFiles(dir, base = dir, depth = 0) {
  let result = [];
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return result; }

  for (const item of items) {
    const full = path.join(dir, item.name);
    const rel  = path.relative(base, full);

    if (item.isDirectory()) {
      if (shouldSkip(item.name, true)) continue;
      result = result.concat(getAllFiles(full, base, depth + 1));
    } else if (item.isFile()) {
      // File di root: paksa include jika masuk FORCE_ROOT_FILES
      if (depth === 0 && FORCE_ROOT_FILES.has(item.name)) {
        result.push({ full, rel });
        continue;
      }
      if (shouldSkip(item.name, false)) continue;
      const ext = path.extname(item.name).toLowerCase();
      if (ALLOWED_EXT.has(ext)) result.push({ full, rel });
    }
  }
  return result;
}

function formatSize(bytes) {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

async function createZip(files) {
  try {
    const { default: archiver } = await import("archiver");
    const { Writable }          = await import("stream");
    return await new Promise((resolve, reject) => {
      const chunks = [];
      const output = new Writable({ write(chunk, _, cb) { chunks.push(chunk); cb(); } });
      output.on("finish", () => resolve(Buffer.concat(chunks)));
      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.on("error", reject);
      archive.pipe(output);
      for (const { full, rel } of files) archive.file(full, { name: rel });
      archive.finalize();
    });
  } catch {
    const bundle = {};
    for (const { full, rel } of files) {
      try {
        const ext = path.extname(full).toLowerCase();
        bundle[rel] = [".js",".json",".md",".txt",".env",".yaml",".yml",".html",".css"].includes(ext)
          ? fs.readFileSync(full, "utf-8")
          : fs.readFileSync(full).toString("base64");
      } catch {}
    }
    return Buffer.from(JSON.stringify(bundle, null, 2), "utf-8");
  }
}

function isConnected(sock) {
  try {
    const ws = sock?.ws;
    if (!ws) return false;
    if (typeof ws.readyState === "number") return ws.readyState === 1;
    return true;
  } catch { return false; }
}

async function waitConnected(sock, timeout = 60000) {
  if (isConnected(sock)) return true;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeout);
    const check = setInterval(() => {
      if (isConnected(sock)) {
        clearInterval(check);
        clearTimeout(timer);
        resolve(true);
      }
    }, 2000);
  });
}

async function sendBackup(sock, attempt = 1) {
  const ownerNum = (global.owner || "").replace(/[^0-9]/g, "");
  if (!ownerNum) {
    console.error("[AutoBackup] global.owner tidak diset, backup dibatalkan.");
    return;
  }
  const ownerJid = ownerNum + "@s.whatsapp.net";

  console.log(`[AutoBackup] Mulai backup${attempt > 1 ? ` (percobaan ke-${attempt})` : ""}...`);

  const connected = await waitConnected(sock, 60000);
  if (!connected) {
    if (attempt < MAX_RETRY) {
      console.warn(`[AutoBackup] Bot belum tersambung, retry dalam ${RETRY_MS / 60000} menit...`);
      setTimeout(() => sendBackup(sock, attempt + 1), RETRY_MS);
    } else {
      console.error("[AutoBackup] ❌ Gagal: bot tidak tersambung setelah 3x percobaan.");
    }
    return;
  }

  let tmpPath = null;
  try {
    const files = getAllFiles(rootDir);
    if (!files.length) {
      console.warn("[AutoBackup] Tidak ada file untuk di-backup.");
      return;
    }

    const totalSize = files.reduce((acc, { full }) => {
      try { return acc + fs.statSync(full).size; } catch { return acc; }
    }, 0);

    const zipBuffer = await createZip(files);
    const isZip     = zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4B;
    const ext       = isZip ? "zip" : "json";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName  = `auto-backup-${timestamp}.${ext}`;

    const tmpDir = path.join(rootDir, "sampah");
    tmpPath      = path.join(tmpDir, fileName);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpPath, zipBuffer);

    const cats  = [...new Set(files.map(({ rel }) => rel.split(path.sep)[0]).filter(Boolean))].sort();
    const waktu = new Date().toLocaleString("id-ID", { timeZone: global.timezone || "Asia/Jakarta" });

    await sock.sendMessage(ownerJid, {
      document: fs.readFileSync(tmpPath),
      mimetype: isZip ? "application/zip" : "application/json",
      fileName,
      caption:
        `🔄 *AUTO BACKUP*\n\n` +
        `📦 *File:* \`${fileName}\`\n` +
        `📄 *Total file:* ${files.length}\n` +
        `💾 *Raw size:* ${formatSize(totalSize)}\n` +
        `📦 *Zip size:* ${formatSize(zipBuffer.length)}\n` +
        `🕐 *Waktu:* ${waktu}\n\n` +
        `*📂 Isi backup:*\n${cats.map(c => `• ${c}/`).join("\n")}\n\n` +
        `_❌ Tidak dibackup: session · node_modules · sampah · tmp_`,
    });

    console.log(`[AutoBackup] ✅ Backup terkirim ke owner — ${fileName} (${formatSize(zipBuffer.length)})`);
  } catch (err) {
    console.error("[AutoBackup] ❌ Gagal:", err.message);
    if (attempt < MAX_RETRY) {
      console.warn(`[AutoBackup] Retry dalam ${RETRY_MS / 60000} menit... (${attempt}/${MAX_RETRY})`);
      setTimeout(() => sendBackup(sock, attempt + 1), RETRY_MS);
    } else {
      try {
        await sock.sendMessage(ownerJid, {
          text: `❌ *AUTO BACKUP GAGAL*\n\nError: ${err.message}\n🕐 ${new Date().toLocaleString("id-ID", { timeZone: global.timezone || "Asia/Jakarta" })}`,
        });
      } catch {}
    }
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
}

export function startAutoBackup(sock) {
  console.log(`[AutoBackup] Scheduler aktif — interval 2 jam, backup pertama dalam ${STARTUP_DELAY_MS / 1000} detik`);
  setTimeout(() => sendBackup(sock), STARTUP_DELAY_MS);
  setInterval(() => sendBackup(sock), INTERVAL_MS);
}
