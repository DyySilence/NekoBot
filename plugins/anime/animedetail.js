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
      `> 📋 *ANIME DETAIL*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}animedetail <url series>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}animedetail https://oploverz.ch/series/bleach-sennen-kessen-hen/\``
    );
  }

  if (!text.includes("oploverz")) {
    return m.reply(`> ❌ Gunakan URL dari oploverz.ch`);
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/anime/detail`, {
    params: { url: text.trim() },
    timeout: 30000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data");

  const info = Object.entries(data.info || {})
    .map(([k, v]) => `>    • ${k}: ${v}`)
    .join("\n");

  const genres = data.genres?.join(", ") || "-";

  const eps = data.episodes?.slice(0, 10)
    .map((e, i) => `>    ${i + 1}. Ep ${e.num} — ${e.name || "-"} (${e.date || "-"})`)
    .join("\n");

  let text2 =
    `> 📺 *${data.title}*\n>\n` +
    `> 📖 *Sinopsis:*\n> ${(data.synopsis || "-").slice(0, 200)}...\n>\n` +
    `> ℹ️ *Info:*\n${info || ">    -"}\n>\n` +
    `> 🏷️ *Genre:* ${genres}\n>\n` +
    `> 🎬 *Episode (${data.episodeCount} total):*\n${eps || ">    -"}`;

  if (data.episodeCount > 10) text2 += `\n>    ... dan ${data.episodeCount - 10} episode lainnya`;

  if (data.cover) {
    await conn.sendMessage(
      m.chat,
      { image: { url: data.cover }, caption: text2 },
      { quoted: m.fakeObj || m }
    );
  } else {
    await m.reply(text2);
  }

  await m.react("✅");
};

handler.command     = ["animedetail"];
handler.category    = "anime";
handler.description = "Detail lengkap seri anime beserta daftar episode";
handler.usage       = `${global.prefix}animedetail <url series>`;

export default handler;
