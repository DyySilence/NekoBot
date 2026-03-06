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
      `> 📌 *PINTEREST IMAGE DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> .pinterestimg <url>\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> .pinterestimg https://pin.it/xxx\n` +
      `> .pinterestimg https://pinterest.com/pin/xxx`
    );
  }

  const pinPattern = /pinterest\.(com|[a-z]{2,3})|pin\.it/i;
  if (!pinPattern.test(text)) {
    return m.reply(
      `> ❌ *URL TIDAK VALID*\n>\n` +
      `> 📝 Format yang benar:\n` +
      `> • https://pin.it/xxx\n` +
      `> • https://pinterest.com/pin/xxx`
    );
  }

  await m.react("⏳");

  let result;
  try {
    const { data } = await axios.get(`${global.apiUrl}/downloader/pinterestimage`, {
      params:  { url: text.trim() },
      timeout: 30000,
    });
    if (!data?.status) throw new Error(data?.error || "API returned false status");
    result = data;
  } catch (err) {
    await m.react("❌");
    return m.reply(
      `> ❌ *DOWNLOAD GAGAL*\n>\n` +
      `> 🔧 Error: ${err.message}\n>\n` +
      `> 💡 Kemungkinan penyebab:\n` +
      `> • Pin private atau dihapus\n` +
      `> • URL tidak valid\n` +
      `> • API sedang down\n>\n` +
      `> 🔄 Coba lagi dalam beberapa saat!`
    );
  }

  const { type = "image", url, title = "Pinterest Media", description = "" } = result;

  if (!url) {
    await m.react("❌");
    return m.reply(`> ❌ URL media tidak tersedia.`);
  }

  const caption =
    `> 📌 *PINTEREST ${type === "video" ? "VIDEO" : "IMAGE"}*\n>\n` +
    `> 📝 *Judul:* ${title.slice(0, 100)}\n` +
    (description ? `> 📄 *Desc:* ${description.slice(0, 80)}\n` : "") +
    `>\n> ✅ Download berhasil!`;

  try {
    if (type === "video") {
      await conn.sendMessage(
        m.chat,
        {
          video:       { url },
          caption,
          mimetype:    "video/mp4",
          gifPlayback: false,
        },
        { quoted: m.fakeObj || m }
      );
    } else {
      await conn.sendMessage(
        m.chat,
        { image: { url }, caption },
        { quoted: m.fakeObj || m }
      );
    }
    await m.react("✅");
  } catch (err) {
    await m.react("⚠️");
    await m.reply(
      `> ⚠️ Gagal kirim media: ${err.message}\n` +
      `> 🔗 Download manual: ${url}`
    );
  }
};

handler.command     = ["pinterestimg"];
handler.category    = "downloader";
handler.description = "Download gambar/video dari URL pin Pinterest";

export default handler;