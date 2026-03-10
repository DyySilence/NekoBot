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
      `> 📌 *PINTEREST VIDEO DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> .pin <url>\n` +
      `> .pinterest <url>\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> .pin https://pin.it/4yHCSHkyA\n` +
      `> .pin https://pinterest.com/pin/xxx`
    );
  }

  const pinPattern = /pin\.it\/[a-zA-Z0-9]+|pinterest\.[a-z]+\/pin\/[0-9]+/i;
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
    const { data } = await axios.get(`${global.apiUrl}/downloader/pinterestvideo`, {
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
      `> • Pin tidak mengandung video (mungkin hanya gambar)\n` +
      `> • URL tidak valid atau pin dihapus\n` +
      `> • API sedang down\n>\n` +
      `> 🔄 Coba lagi dalam beberapa saat!`
    );
  }

  const { title = "Pinterest Video", username = "Unknown", videos = [], stats = {} } = result;

  if (!videos.length) {
    await m.react("❌");
    return m.reply(
      `> ❌ *TIDAK ADA VIDEO*\n>\n` +
      `> 💡 Pin ini tidak mengandung video.\n` +
      `> Gunakan *.pinimg* untuk download gambar.`
    );
  }

  const best = videos[0];
  const url  = best.url;

  if (!url) {
    await m.react("❌");
    return m.reply(`> ❌ URL video tidak tersedia.`);
  }

  const caption =
    `> 📌 *PINTEREST VIDEO*\n>\n` +
    `> 📝 *Judul:* ${title.slice(0, 100)}\n` +
    `> 👤 *User:* ${username}\n` +
    (best.quality    ? `> 🎞️ *Kualitas:* ${best.quality}\n`    : "") +
    (best.resolution ? `> 📐 *Resolusi:* ${best.resolution}\n` : "") +
    (best.duration   ? `> ⏱️ *Durasi:* ${best.duration}\n`     : "") +
    (best.size       ? `> 💾 *Ukuran:* ${best.size}\n`         : "") +
    (stats.likes     ? `> ❤️ *Likes:* ${stats.likes}\n`        : "") +
    `>\n> ✅ Download berhasil!`;

  try {
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
    await m.react("✅");
  } catch (err) {
    console.error("[Pinterest] Send video error:", err.message);
    await m.react("⚠️");
    await m.reply(
      `> ⚠️ Gagal kirim video: ${err.message}\n` +
      `> 🔗 Download manual: ${url}`
    );
  }
};

handler.command     = ["pinterestvid", "pinvid"];
handler.category    = "downloader";
handler.description = "Download video dari Pinterest (kualitas terbaik otomatis)";

export default handler;