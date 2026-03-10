/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, "..", "..");

const SKIP = new Set([
  "node_modules",
  "package-lock.json",
  "sampah",
  "session",
  "temp",
  "tmp",
  ".git",
]);

const ALLOWED_EXT = new Set([
  ".js", "ttf",".json", ".md", ".txt", ".env", ".yaml", ".yml", ".mp3", ".jpeg", ".jpg", ".png", ".webp"
]);

function shouldSkip(name) {
  return SKIP.has(name) || name.startsWith(".");
}

function getAllFiles(dir, base = dir) {
  let result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (shouldSkip(item.name)) continue;
    const full = path.join(dir, item.name);
    const rel  = path.relative(base, full);
    if (item.isDirectory()) {
      result = result.concat(getAllFiles(full, base));
    } else if (item.isFile()) {
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
      const output = new Writable({
        write(chunk, _, cb) { chunks.push(chunk); cb(); }
      });
      output.on("finish", () => resolve(Buffer.concat(chunks)));

      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.on("error", reject);
      archive.pipe(output);

      for (const { full, rel } of files) {
        archive.file(full, { name: rel });
      }
      archive.finalize();
    });
  } catch {
    const bundle = {};
    for (const { full, rel } of files) {
      try {
        const ext = path.extname(full).toLowerCase();
        if ([".js", ".json", ".md", ".txt", ".env", ".yaml", ".yml"].includes(ext)) {
          bundle[rel] = fs.readFileSync(full, "utf-8");
        } else {
          bundle[rel] = fs.readFileSync(full).toString("base64");
        }
      } catch {}
    }
    return Buffer.from(JSON.stringify(bundle, null, 2), "utf-8");
  }
}

const handler = async (m, { conn }) => {
  await m.react("⏳");

  try {
    const files = getAllFiles(rootDir);

    if (!files.length) {
      await m.react("❌");
      return m.reply("❌ Tidak ada file yang bisa di-backup!");
    }

    const totalSize = files.reduce((acc, { full }) => {
      try { return acc + fs.statSync(full).size; } catch { return acc; }
    }, 0);

    const cats = [...new Set(
      files.map(({ rel }) => rel.split(path.sep)[0]).filter(Boolean)
    )].sort();

    await m.reply(
      `⏳ *Membuat backup...*\n\n` +
      `📄 *File:* ${files.length}\n` +
      `💾 *Total size:* ${formatSize(totalSize)}\n` +
      `📂 *Folder:* ${cats.join(", ")}\n\n` +
      `_Mohon tunggu..._`
    );

    const zipBuffer = await createZip(files);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const isZip     = zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4B;
    const ext       = isZip ? "zip" : "json";
    const fileName  = `NekoBot-Backup-${timestamp}.${ext}`;

    const tmpDir  = path.join(rootDir, "sampah");
    const tmpPath = path.join(tmpDir, fileName);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpPath, zipBuffer);

    const folderList = cats.map(c => `• ${c}/`).join("\n");

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(tmpPath),
      mimetype: isZip ? "application/zip" : "application/json",
      fileName,
      caption:
        `✅ *BACKUP SELESAI*\n\n` +
        `📦 *File:* \`${fileName}\`\n` +
        `📄 *Total file:* ${files.length}\n` +
        `💾 *Size:* ${formatSize(zipBuffer.length)}\n` +
        `🕐 *Waktu:* ${new Date().toLocaleString("id-ID", { timeZone: global.timezone || "Asia/Jakarta" })}\n\n` +
        `*📂 Isi backup:*\n${folderList}\n\n` +
        `_❌ Tidak dibackup: session · node_modules · sampah · tmp_`,
    }, { quoted: m.fakeObj || m });

    fs.unlinkSync(tmpPath);
    await m.react("✅");

  } catch (err) {
    console.error("[Backup] Error:", err);
    await m.react("❌");
    await m.reply(`❌ *Backup gagal!*\n\nError: ${err.message}`);
  }
};

handler.command     = ["backup", "backupsc"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Backup semua file bot kecuali node_modules, session, sampah, tmp";

export default handler;
