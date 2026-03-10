/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */


import axios from "axios";

const handler = async (m, { conn, args, text }) => {
  const page = parseInt(args[0]) || 1;

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/ongoing`, {
    params: { page },
    timeout: 30000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data");
  if (!data.results?.length) return m.reply(`> ❌ Tidak ada anime ongoing ditemukan di halaman ${page}.`);

  let text2 = `> 📺 *ANIME ONGOING — Halaman ${page}*\n>\n`;
  data.results.forEach((a, i) => {
    text2 += `> ${i + 1}. *${a.title}*\n`;
    text2 += `>    📡 ${a.eps || "-"} | 🏷️ ${a.type || "Anime"}\n`;
    text2 += `>    🔗 ${a.link}\n`;
    if (i < data.results.length - 1) text2 += `>\n`;
  });
  text2 += `>\n> 📊 Total: ${data.total} anime`;

  await m.reply(text2);
  await m.react("✅");
};

handler.command     = ["animeongoing"];
handler.category    = "anime";
handler.description = "Daftar anime yang sedang tayang (ongoing)";
handler.usage       = `${global.prefix}ongoing [halaman]`;

export default handler;