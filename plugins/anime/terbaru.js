/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */


import axios from "axios";

const handler = async (m, { conn }) => {
  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/terbaru`, {
    timeout: 30000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data");
  if (!data.results?.length) return m.reply(`> ❌ Tidak ada episode terbaru ditemukan.`);

  let text = `> 🆕 *EPISODE ANIME TERBARU*\n>\n`;
  data.results.forEach((a, i) => {
    text += `> ${i + 1}. *${a.title}*\n`;
    text += `>    🎬 ${a.eps || "-"}\n`;
    text += `>    🔗 ${a.link}\n`;
    if (i < data.results.length - 1) text += `>\n`;
  });
  text += `>\n> 📊 Total: ${data.total} episode`;

  await m.reply(text);
  await m.react("✅");
};

handler.command     = ["animeterbaru", "terbaru"];
handler.category    = "anime";
handler.description = "Episode anime terbaru yang baru dirilis";
handler.usage       = `${global.prefix}terbaru`;

export default handler;
