/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */


import axios from "axios";

const handler = async (m, { conn, args }) => {
  const page = parseInt(args[0]) || 1;

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/completed`, {
    params: { page },
    timeout: 30000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data");
  if (!data.results?.length) return m.reply(`> ❌ Tidak ada anime completed di halaman ${page}.`);

  let text = `> ✅ *ANIME COMPLETED — Halaman ${page}*\n>\n`;
  data.results.forEach((a, i) => {
    text += `> ${i + 1}. *${a.title}*\n`;
    text += `>    🎬 ${a.eps || "-"} | 🏷️ ${a.type || "Anime"}\n`;
    text += `>    🔗 ${a.link}\n`;
    if (i < data.results.length - 1) text += `>\n`;
  });
  text += `>\n> 📊 Total: ${data.total} anime`;

  await m.reply(text);
  await m.react("✅");
};

handler.command     = ["animecompleted"];
handler.category    = "anime";
handler.description = "Daftar anime yang sudah tamat (completed)";
handler.usage       = `${global.prefix}completed [halaman]`;

export default handler;
