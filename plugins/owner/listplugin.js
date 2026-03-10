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

function scanAll(dir) {
  const structure = {}; 

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      const files = fs.readdirSync(full, { withFileTypes: true })
        .filter(f => f.isFile() && f.name.endsWith(".js"))
        .map(f => f.name);
      if (files.length) structure[item.name] = files.sort();
    } else if (item.isFile() && item.name.endsWith(".js")) {
      if (!structure["."]) structure["."] = [];
      structure["."].push(item.name);
    }
  }

  return structure;
}

const handler = async (m, { args, commands }) => {
  const filter = args[0]?.toLowerCase(); // optional: filter per folder

  const structure = scanAll(pluginDir);

  let totalFiles   = 0;
  let totalFolders = 0;
  const lines      = [];

  const folders = Object.keys(structure).sort();

  for (const folder of folders) {
    if (filter && folder !== filter && folder !== ".") continue;
    const files = structure[folder];
    totalFolders++;
    totalFiles += files.length;

    const folderLabel = folder === "." ? "📄 root" : `📂 ${folder}`;
    lines.push(`${folderLabel} *(${files.length} file)*`);
    for (const f of files) lines.push(`  ├ ${f}`);
    lines.push("");
  }

  if (!lines.length) return m.reply(`❌ Folder *${filter}* tidak ditemukan!`);

  const header =
    `╭━━『 *LIST PLUGIN* 』━━╮\n` +
    `│ 📂 Folder : ${filter ? 1 : totalFolders}\n` +
    `│ 📄 File   : ${totalFiles}\n` +
    `│ ⚙️  Cmd    : ${commands.length}\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

  const body = lines.join("\n").trim();

  const full = header + body;
  if (full.length > 4000) {
    const chunks = [];
    let current  = header;
    for (const line of lines) {
      if ((current + line + "\n").length > 3800) {
        chunks.push(current.trim());
        current = "";
      }
      current += line + "\n";
    }
    if (current.trim()) chunks.push(current.trim());
    for (const chunk of chunks) await m.reply(chunk);
    return;
  }

  return m.reply(full);
};

handler.command     = ["listplugin", "listplugins"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Tampilkan list semua file plugin per folder";

export default handler;
