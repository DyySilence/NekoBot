/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */


import axios from "axios";

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply(
      `> ⚡ *BYPASS GOFILE*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}gofile <url gofile>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}gofile https://gofile.io/d/NTtgY8\``
    );
  }

  if (!text.includes("gofile.io")) {
    return m.reply(`> ❌ URL harus dari gofile.io\n> Contoh: https://gofile.io/d/xxxxx`);
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/bypass-gofile`, {
    params: { url: text.trim() },
    timeout: 30000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal bypass Gofile");

  let result =
    `> ⚡ *GOFILE BYPASS*\n>\n` +
    `> 📁 *Folder:* ${data.folderName}\n` +
    `> 📊 *Jumlah File:* ${data.fileCount}\n>\n` +
    `> 📦 *Daftar File:*\n`;

  data.files.forEach((f, i) => {
    result +=
      `>\n> ${i + 1}. *${f.name}*\n` +
      `>    💾 Ukuran: ${f.size}\n` +
      `>    🔗 ${f.link}\n`;
    if (f.md5) result += `>    🔐 MD5: ${f.md5}\n`;
  });

  await m.reply(result);
  await m.react("✅");
};

handler.command     = ["gofile", "bypassgofile"];
handler.category    = "anime";
handler.description = "Bypass link Gofile untuk mendapatkan direct download";
handler.usage       = `${global.prefix}gofile <url gofile>`;

export default handler;
