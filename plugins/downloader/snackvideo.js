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
      `> 🎬 *SNACKVIDEO DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}snack <url>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}snack https://www.snackvideo.com/v/xxx\``
    );
  }

  if (!text.includes("snackvideo.com")) {
    return m.reply(
      `> ❌ *URL TIDAK VALID*\n>\n` +
      `> Gunakan link dari snackvideo.com`
    );
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/downloader/snackvideo`, {
    params:  { url: text.trim() },
    timeout: 60000,
  });

  if (!data?.status) throw new Error(data?.error || "Gagal mengambil data video");
  if (!data.videoUrl) throw new Error("URL video tidak ditemukan");

  const { title, description, thumbnail, duration, uploadDate, stats, creator } = data;

  const caption =
    `> 🎬 *SNACKVIDEO*\n>\n` +
    `> 📝 *Judul:* ${title || "?"}\n` +
    `> 👤 *Creator:* ${creator?.name || "?"}\n` +
    `> ⏱️ *Durasi:* ${duration || "?"}\n` +
    `> 📅 *Upload:* ${uploadDate || "?"}\n` +
    `> 👁️ *Views:* ${stats?.views?.toLocaleString("id-ID") || "0"}\n` +
    `> ❤️ *Likes:* ${stats?.likes?.toLocaleString("id-ID") || "0"}\n>\n` +
    `> ✅ Download berhasil!`;

  await conn.sendMessage(
    m.chat,
    { video: { url: data.videoUrl }, caption, mimetype: "video/mp4", gifPlayback: false },
    { quoted: m.fakeObj || m }
  );

  await m.react("✅");
};

handler.command     = ["snackvideo", "snackvid"];
handler.category    = "downloader";
handler.description = "Download video dari SnackVideo";

export default handler;