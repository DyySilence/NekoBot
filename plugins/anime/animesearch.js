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
      `> 🔍 *ANIME SEARCH*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}animesearch <judul>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}animesearch bleach\``
    );
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/search`, {
    params: { q: text.trim() },
    timeout: 30000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data");
  if (!data.results?.length) return m.reply(`> ❌ Tidak ada hasil untuk: *${text}*`);

  let result = `> 🔍 *HASIL PENCARIAN: ${text}*\n>\n`;
  data.results.forEach((a, i) => {
    result += `> ${i + 1}. *${a.title}*\n`;
    result += `>    🎬 ${a.eps || "-"} | 🏷️ ${a.type || "Anime"} | 📡 ${a.status || "-"}\n`;
    result += `>    🔗 ${a.link}\n`;
    if (i < data.results.length - 1) result += `>\n`;
  });
  result += `>\n> 📊 Total: ${data.total} hasil`;

  await m.reply(result);
  await m.react("✅");
};

handler.command     = ["animesearch"];
handler.category    = "anime";
handler.description = "Cari anime di Oploverz berdasarkan judul";
handler.usage       = `${global.prefix}animesearch <judul>`;

export default handler;
