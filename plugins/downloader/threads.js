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
      `> 🧵 *THREADS DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}threads <url>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}threads https://www.threads.com/@user/post/xxx\``
    );
  }

  if (!/threads\.(com|net)\/@[^/]+\/post\/[A-Za-z0-9_-]+/i.test(text)) {
    return m.reply(
      `> ❌ *URL TIDAK VALID*\n>\n` +
      `> Format: https://www.threads.com/@user/post/xxx`
    );
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/downloader/threads`, {
    params:  { url: text.trim() },
    timeout: 45000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil media");

  const { author, videos = [], images = [], total } = data;
  const allMedia = [...videos, ...images];

  if (!allMedia.length) {
    await m.react("❌");
    return m.reply(`> ❌ Tidak ada media di postingan ini.`);
  }

  const header =
    `> 🧵 *THREADS*\n>\n` +
    `> 👤 *Author:* @${author || "?"}\n` +
    `> 📦 *Total Media:* ${total}\n`;

  for (let i = 0; i < allMedia.length; i++) {
    const item    = allMedia[i];
    const isLast  = i === allMedia.length - 1;
    const caption = i === 0
      ? `${header}>\n> ✅ Download berhasil!`
      : `> 🧵 Media ${i + 1}/${total}`;

    try {
      if (item.type === "video") {
        await conn.sendMessage(
          m.chat,
          { video: { url: item.url }, caption, mimetype: "video/mp4", gifPlayback: false },
          { quoted: m.fakeObj || m }
        );
      } else {
        await conn.sendMessage(
          m.chat,
          { image: { url: item.url }, caption },
          { quoted: m.fakeObj || m }
        );
      }
    } catch (err) {
      await m.reply(`> ⚠️ Gagal kirim media ${i + 1}: ${err.message}\n> 🔗 ${item.url}`);
    }

    if (!isLast) await new Promise(r => setTimeout(r, 1200));
  }

  await m.react("✅");
};

handler.command     = ["threads"];
handler.category    = "downloader";
handler.description = "Download foto & video dari postingan Threads";

export default handler;
