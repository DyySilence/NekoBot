/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import { proto, generateWAMessageFromContent } from "baileys";

if (!global.douyinQualityCache) global.douyinQualityCache = new Map();

async function sendQualitySheet(conn, m, { title, thumbnail, downloads }) {
  const buttons = downloads.slice(0, 9).map((dl, i) => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: `${i + 1}. ${dl.quality}`,
      id:           `${global.prefix}douyindl ${i + 1}`,
      has_multiple_buttons: true,
    }),
  }));

  const bodyText =
    `🎬 *DOUYIN / TIKTOK*\n\n` +
    `📝 *Judul:* ${title || "?"}\n\n` +
    `📊 *Pilih kualitas:*\n` +
    downloads.slice(0, 9).map((dl, i) => `~${i + 1}. ${dl.quality}`).join("\n") +
    `\n\n⏳ Pilihan expired dalam *5 menit*`;

  try {
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: thumbnail ? {
                externalAdReply: {
                  title:                 "Douyin / TikTok Downloader",
                  body:                  title || "",
                  thumbnailUrl:          thumbnail,
                  sourceUrl:             "https://www.douyin.com",
                  mediaType:             1,
                  renderLargerThumbnail: false,
                },
              } : undefined,
              body:   proto.Message.InteractiveMessage.Body.create({ text: bodyText }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: "Pilih kualitas untuk download" }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons,
                messageParamsJson: JSON.stringify({
                  bottom_sheet: { list_title: "Kualitas Video", button_title: "Pilih Kualitas" },
                }),
              }),
            }),
          },
        },
      },
      { quoted: m.fakeObj || m }
    );
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch {
    await conn.sendMessage(
      m.chat,
      { text: bodyText + `\n\nKetik: *${global.prefix}douyindl <angka>*` },
      { quoted: m.fakeObj || m }
    );
  }
}

const handler = async (m, { conn, text, command, args }) => {
  if (command === "douyindl") {
    const idx      = parseInt(args[0]);
    const cacheKey = `${m.chat}_${m.sender}`;
    const cached   = global.douyinQualityCache?.get(cacheKey);

    if (!cached) {
      return m.reply(
        `> ❌ Sesi expired.\n> 🔄 Gunakan \`${global.prefix}douyin <url>\` lagi.`
      );
    }

    if (isNaN(idx) || idx < 1 || idx > cached.downloads.length) {
      return m.reply(`> ❌ Nomor tidak valid. Pilih 1–${cached.downloads.length}.`);
    }

    const dl = cached.downloads[idx - 1];
    if (!dl?.url) {
      return m.reply(`> ❌ URL tidak tersedia untuk kualitas *${dl?.quality}*.\n> Pilih kualitas lain.`);
    }

    await m.react("⏳");

    try {
      await conn.sendMessage(
        m.chat,
        {
          video:       { url: dl.url },
          caption:
            `> 🎬 *DOUYIN / TIKTOK*\n>\n` +
            `> 📝 *Judul:* ${cached.title || "?"}\n` +
            `> 🎞️ *Kualitas:* ${dl.quality}\n>\n` +
            `> ✅ Download berhasil!`,
          mimetype:    "video/mp4",
          gifPlayback: false,
        },
        { quoted: m.fakeObj || m }
      );
      await m.react("✅");
      global.douyinQualityCache.delete(cacheKey);
    } catch (err) {
      await m.react("⚠️");
      await m.reply(`> ⚠️ Gagal kirim video.\n> 🔗 Download manual: ${dl.url}`);
    }
    return;
  }

  if (!text?.trim()) {
    return m.reply(
      `> 🎬 *DOUYIN / TIKTOK DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> \`${global.prefix}douyin <url>\`\n>\n` +
      `> 💡 Support: douyin.com • tiktok.com • vt.tiktok.com\n>\n` +
      `> *Contoh:*\n` +
      `> \`${global.prefix}douyin https://www.douyin.com/video/xxx\``
    );
  }

  const valid = /^https?:\/\/(www\.|m\.|v\.)?(douyin\.com|tiktok\.com|vt\.tiktok\.com)\//i.test(text);
  if (!valid) {
    return m.reply(
      `> ❌ *URL TIDAK VALID*\n>\n` +
      `> Gunakan link dari douyin.com atau tiktok.com`
    );
  }

  await m.react("⏳");

  const { data } = await axios.get(`${global.apiUrl}/downloader/douyin`, {
    params:  { url: text.trim() },
    timeout: 60000,
  });

  if (!data?.status || !data.downloads?.length) {
    throw new Error(data?.error || "Tidak ada media ditemukan");
  }

  const cacheKey = `${m.chat}_${m.sender}`;
  global.douyinQualityCache.set(cacheKey, {
    title:     data.title,
    downloads: data.downloads,
  });
  setTimeout(() => global.douyinQualityCache.delete(cacheKey), 5 * 60 * 1000);

  if (data.downloads.length === 1) {
    const dl = data.downloads[0];
    await conn.sendMessage(
      m.chat,
      {
        video:       { url: dl.url },
        caption:
          `> 🎬 *DOUYIN / TIKTOK*\n>\n` +
          `> 📝 *Judul:* ${data.title || "?"}\n` +
          `> 🎞️ *Kualitas:* ${dl.quality}\n>\n` +
          `> ✅ Download berhasil!`,
        mimetype:    "video/mp4",
        gifPlayback: false,
      },
      { quoted: m.fakeObj || m }
    );
    global.douyinQualityCache.delete(cacheKey);
  } else {
    await sendQualitySheet(conn, m, {
      title:     data.title,
      thumbnail: data.thumbnail,
      downloads: data.downloads,
    });
  }

  await m.react("✅");
};

handler.command     = ["douyin", "douyindl"];
handler.category    = "downloader";
handler.description = "Download video Douyin / TikTok dengan pilihan kualitas";

export default handler;