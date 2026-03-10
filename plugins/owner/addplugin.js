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
const pluginDir  = path.resolve(__dirname, ".."); 

const handler = async (m, { conn, args, text }) => {
  if (!m.quoted) return m.reply(
    "❌ Reply pesan yang berisi kode JS atau file .js!\n\n" +
    "*Cara pakai:*\n" +
    "• Reply file .js → `.addplugin` atau `.addplugin folder/nama.js`\n" +
    "• Reply teks kode → `.addplugin folder/nama.js`\n\n" +
    "*Contoh:*\n" +
    "• `.addplugin group/kick.js`\n" +
    "• `.addplugin main/test.js`\n" +
    "• `.addplugin owner/backup.js`"
  );

  let filename = args[0]?.trim() || "";
  let code     = "";

  if (m.quoted.isDocument) {
    const mime     = m.quoted.msg?.mimetype || "";
    const origName = m.quoted.msg?.fileName || "";

    if (!mime.includes("javascript") && !origName.endsWith(".js"))
      return m.reply("❌ File harus berformat .js!");

    if (!filename) filename = origName || "plugin.js";
    if (!filename.endsWith(".js")) filename += ".js";

    try {
      const buf = await m.quoted.download();
      code = buf.toString("utf-8");
    } catch {
      return m.reply("❌ Gagal download file! Coba lagi.");
    }
  }

  else if (m.quoted.text || m.quoted.body) {
    code = m.quoted.text || m.quoted.body || "";
    if (!filename)
      return m.reply(
        "❌ Tulis nama file setelah command!\n\n" +
        "*Contoh:* `.addplugin group/kick.js`"
      );
    if (!filename.endsWith(".js")) filename += ".js";
  }

  else {
    return m.reply("❌ Reply teks kode JS atau kirim file .js!");
  }

  if (!code.trim()) return m.reply("❌ Kode kosong!");

  let savePath;
  if (filename.includes("/")) {
    savePath = path.join(pluginDir, filename);
  } else {
    savePath = path.join(__dirname, filename);
  }

  const saveDir = path.dirname(savePath);
  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

  const exists  = fs.existsSync(savePath);
  const relPath = path.relative(pluginDir, savePath);

  fs.writeFileSync(savePath, code, "utf-8");

  return m.reply(
    `✅ *Plugin ${exists ? "diupdate" : "ditambahkan"}!*\n\n` +
    `📄 *File* : ${path.basename(filename)}\n` +
    `📂 *Path* : plugins/${relPath}\n` +
    `📝 *Size* : ${code.length} karakter\n\n` +
    `> _Hot reload otomatis aktif_`
  );
};

handler.command     = ["addplugin", "addplugins"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Tambah / update plugin dari reply file .js atau teks kode";

export default handler;
