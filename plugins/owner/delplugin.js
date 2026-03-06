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
const pluginDir  = path.resolve(__dirname, "..", "..");

function findPlugin(name) {
  const results = [];
  function scan(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) scan(full);
      else if (item.isFile() && item.name.endsWith(".js")) {
        const rel = path.relative(pluginDir, full);
        if (
          item.name === name ||
          item.name === name + ".js" ||
          rel === name ||
          rel === name + ".js"
        ) results.push({ full, rel });
      }
    }
  }
  scan(pluginDir);
  return results;
}

const handler = async (m, { args, text }) => {
  const target = text?.trim();
  if (!target) return m.reply(
    "❌ Tulis nama plugin yang ingin dihapus!\n\n" +
    "*Cara pakai:*\n" +
    "• `.delplugin kick` → hapus kick.js\n" +
    "• `.delplugin group/kick` → hapus spesifik path\n" +
    "• `.delplugin kick.js` → nama lengkap"
  );

  const found = findPlugin(target.endsWith(".js") ? target : target + ".js");

  if (!found.length) {
    const found2 = findPlugin(target);
    if (!found2.length) return m.reply(`❌ Plugin *${target}* tidak ditemukan!`);
    found.push(...found2);
  }

  if (found.length > 1) {
    const list = found.map((f, i) => `${i + 1}. ${f.rel}`).join("\n");
    return m.reply(
      `⚠️ Ditemukan ${found.length} file dengan nama *${target}*:\n\n${list}\n\n` +
      `Gunakan path lengkap, contoh:\n\`.delplugin group/kick.js\``
    );
  }

  const { full, rel } = found[0];
  fs.unlinkSync(full);

  return m.reply(
    `✅ *Plugin dihapus!*\n\n` +
    `📄 *File:* ${rel}\n\n` +
    `> _Hot reload akan mendeteksi perubahan otomatis._`
  );
};

handler.command     = ["delplugin", "delplugins"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Hapus plugin berdasarkan nama file";

export default handler;
