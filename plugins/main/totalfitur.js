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

function scanPlugins(dir) {
  let files   = 0;
  let folders = 0;
  const cats  = new Set();

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      folders++;
      cats.add(item.name);
      const sub = fs.readdirSync(full, { withFileTypes: true });
      for (const s of sub) {
        if (s.isFile() && s.name.endsWith(".js")) files++;
      }
    } else if (item.isFile() && item.name.endsWith(".js")) {
      files++;
    }
  }
  return { files, folders, cats: [...cats].sort() };
}

const handler = async (m, { commands }) => {
  const { files, folders, cats } = scanPlugins(pluginDir);
  const catCount = {};
  for (const cmd of commands) {
    const cat = (cmd.category || "main").toLowerCase();
    catCount[cat] = (catCount[cat] || 0) + 1;
  }

  const catLines = Object.entries(catCount)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cat, count]) => `│ • ${cat.padEnd(14)}: ${count} command`)
    .join("\n");

  const msg =
    `╭━━『 *TOTAL FITUR* 』━━╮\n│\n` +
    `├ 📂 *Folder*   : ${folders}\n` +
    `├ ⚙️  *Commands* : ${commands.length}\n│\n` +
    `├─❖ *PER KATEGORI*\n│\n` +
    `${catLines}\n│\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━╯`;

  return m.reply(msg);
};

handler.command     = ["totalfitur"];
handler.category    = "main";
handler.description = "Tampilkan total fitur, folder, dan file plugin";

export default handler;
