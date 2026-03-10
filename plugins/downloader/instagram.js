/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto,
} from "baileys";

async function sendCarousel(conn, m, images) {
  const maxSlides = Math.min(images.length, 10);
  const cards     = [];

  for (let i = 0; i < maxSlides; i++) {
    const url = images[i].originalUrl || images[i].tokenUrl;

    let preparedMedia = null;
    try {
      preparedMedia = await prepareWAMessageMedia(
        { image: { url } },
        { upload: conn.waUploadToServer }
      );
    } catch (err) {
      console.error(`[IG Carousel] Gagal prepare image ${i + 1}:`, err.message);
    }

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        title:              `📷 Foto ${i + 1}/${maxSlides}`,
        subtitle:           "Instagram Post",
        hasMediaAttachment: !!preparedMedia?.imageMessage,
        imageMessage:       preparedMedia?.imageMessage || undefined,
      }),
      body: proto.Message.InteractiveMessage.Body.create({
        text: preparedMedia?.imageMessage ? "Klik tombol untuk download" : "Gagal load preview",
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: global.botName || "NekoBot",
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: `📥 Download ${i + 1}`,
              id: `.igdl ${url}`,
            }),
          },
        ],
      }),
    });
  }

  const carouselMsg = generateWAMessageFromContent(
    m.chat,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata:        {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: `📸 *Instagram Post*\n\n📷 Total Foto: ${maxSlides}`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: `Swipe & pilih foto • ${global.botName || "NekoBot"}`,
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards }),
          }),
        },
      },
    }),
    { quoted: m.fakeObj || m }
  );

  await conn.relayMessage(m.chat, carouselMsg.message, {
    messageId: carouselMsg.key.id,
  });
}

const handler = async (m, { conn, text, command }) => {
  if (command === "igdl" && text?.startsWith("http")) {
    await m.react("⏳");
    try {
      await conn.sendMessage(
        m.chat,
        {
          image:   { url: text },
          caption: `> 📷 *Instagram Foto*\n>\n> ✅ Download berhasil!`,
        },
        { quoted: m.fakeObj || m }
      );
      await m.react("✅");
    } catch (err) {
      await m.react("❌");
      await m.reply(`> ❌ Gagal download foto.\n> 🔗 URL: ${text}`);
    }
    return;
  }

  if (!text?.trim()) {
    return m.reply(
      `> 📸 *INSTAGRAM DOWNLOADER*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> .ig <url>\n>\n` +
      `> 🎯 *Support:*\n` +
      `> • Post (Foto)\n` +
      `> • Reels (Video)\n` +
      `> • Carousel (Multi Foto)\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> .ig https://www.instagram.com/p/xxx/\n` +
      `> .ig https://www.instagram.com/reel/xxx/`
    );
  }

  const igPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i;
  if (!igPattern.test(text)) {
    return m.reply(
      `> ❌ *URL TIDAK VALID*\n>\n` +
      `> 📝 Format yang benar:\n` +
      `> • https://www.instagram.com/p/xxx\n` +
      `> • https://www.instagram.com/reel/xxx`
    );
  }

  await m.react("⏳");

  let result;
  try {
    const { data } = await axios.get(`${global.apiUrl}/downloader/instagram`, {
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
      `> • Konten dihapus atau private\n` +
      `> • API sedang down\n>\n` +
      `> 🔄 Coba lagi dalam beberapa saat!`
    );
  }

  const { type, videos = [], images = [], videoCount = 0, imageCount = 0 } = result;

  if (type === "video" || videoCount > 0) {
    const list = videos.length > 0 ? videos : images;
    try {
      for (let i = 0; i < list.length; i++) {
        const url = list[i].originalUrl || list[i].tokenUrl;
        await conn.sendMessage(
          m.chat,
          {
            video:       { url },
            caption:     i === 0
              ? `> 🎥 *INSTAGRAM REEL/VIDEO*\n> 📊 Total: ${list.length} video\n>\n> ✅ Download berhasil!`
              : `> 🎥 Video ${i + 1}/${list.length}`,
            mimetype:    "video/mp4",
            gifPlayback: false,
          },
          { quoted: m.fakeObj || m }
        );
        if (i < list.length - 1) await new Promise((r) => setTimeout(r, 1500));
      }
      await m.react("✅");
    } catch (err) {
      await m.react("⚠️");
      const urlList = list.map((v, i) => `\n> 🎥 Video ${i + 1}: ${v.originalUrl}`).join("");
      await m.reply(`> ⚠️ Gagal kirim video, download manual:\n${urlList}`);
    }
    return;
  }

  if (imageCount > 1) {
    try {
      await sendCarousel(conn, m, images);
      await m.react("✅");
    } catch (err) {
      console.error("[IG] Carousel error:", err.message);
      try {
        await m.react("⚠️");
        for (let i = 0; i < images.length; i++) {
          const url = images[i].originalUrl || images[i].tokenUrl;
          await conn.sendMessage(
            m.chat,
            {
              image:   { url },
              caption: i === 0
                ? `> 📷 *INSTAGRAM POST*\n> 📊 Total: ${imageCount} foto\n>\n> ✅ Download berhasil!`
                : `> 📷 Foto ${i + 1}/${imageCount}`,
            },
            { quoted: m.fakeObj || m }
          );
          if (i < images.length - 1) await new Promise((r) => setTimeout(r, 1200));
        }
        await m.react("✅");
      } catch (fallbackErr) {
        await m.react("❌");
        await m.reply(`> ❌ Gagal mengirim foto: ${fallbackErr.message}`);
      }
    }
    return;
  }

  if (imageCount === 1 && images.length > 0) {
    const url = images[0].originalUrl || images[0].tokenUrl;
    try {
      await conn.sendMessage(
        m.chat,
        {
          image:   { url },
          caption: `> 📷 *INSTAGRAM POST*\n>\n> ✅ Download berhasil!`,
        },
        { quoted: m.fakeObj || m }
      );
      await m.react("✅");
    } catch (err) {
      await m.react("❌");
      await m.reply(`> ❌ Gagal mengirim foto: ${err.message}`);
    }
    return;
  }

  await m.react("❌");
  await m.reply(
    `> ❌ *TIDAK ADA MEDIA DITEMUKAN*\n>\n` +
    `> 💡 Pastikan:\n` +
    `> • URL masih aktif\n` +
    `> • Konten bukan private`
  );
};

handler.command     = ["instagram", "ig", "igdl"];
handler.category    = "downloader";
handler.description = "Download Instagram Post, Reels, dan Carousel";

export default handler;