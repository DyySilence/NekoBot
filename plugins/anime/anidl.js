/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */


import axios from "axios";

const handler = async (m, { conn, text, args }) => {
  if (!text?.trim()) {
    return m.reply(
      `> 📥 *ANIME DOWNLOAD*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}anidl <url episode>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}anidl https://oploverz.ch/bleach-episode-1-subtitle-indonesia/\`\n>\n` +
      `> ℹ️ Link Gofile akan otomatis di-bypass.`
    );
  }

  if (!text.includes("oploverz")) {
    return m.reply(`> ❌ Gunakan URL episode dari oploverz.ch`);
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/download`, {
    params: { url: text.trim(), bypass: true },
    timeout: 60000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil link download");

  let result = `> 📥 *${data.title}*\n>\n`;

  if (Object.keys(data.table || {}).length) {
    result += `> 🎞️ *Link Download:*\n`;
    for (const [quality, servers] of Object.entries(data.table)) {
      result += `>\n> 📦 *${quality}*\n`;
      for (const [server, link] of Object.entries(servers)) {
        result += `>    • ${server}: ${link}\n`;
      }
    }
  }

  if (Object.keys(data.direct || {}).length) {
    result += `>\n> 🔗 *Direct Link:*\n`;
    for (const [label, link] of Object.entries(data.direct)) {
      result += `>    • ${label}: ${link}\n`;
    }
  }


  if (data.gofile && Object.keys(data.gofile).length) {
    result += `>\n> ⚡ *Gofile Direct (Bypass):*\n`;
    for (const [glink, gdata] of Object.entries(data.gofile)) {
      if (gdata.error) {
        result += `>    ❌ ${glink}: ${gdata.error}\n`;
        continue;
      }
      result += `>    📁 Folder: ${gdata.folderName}\n`;
      (gdata.files || []).forEach((f) => {
        result += `>    • ${f.name} (${f.size})\n`;
        result += `>      🔗 ${f.link}\n`;
      });
    }
  }

  await m.reply(result);
  await m.react("✅");
};

handler.command     = ["anidl", "animedownload"];
handler.category    = "anime";
handler.description = "Ambil link download episode anime dari Oploverz";
handler.usage       = `${global.prefix}anidl <url episode>`;

export default handler;
