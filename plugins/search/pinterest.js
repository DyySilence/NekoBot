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

const searchCache = new Map();

async function sendCarousel(conn, m, images, query) {
  const maxSlides = Math.min(images.length, 10);
  const cards     = [];

  for (let i = 0; i < maxSlides; i++) {
    const url = images[i];

    let preparedMedia = null;
    try {
      preparedMedia = await prepareWAMessageMedia(
        { image: { url } },
        { upload: conn.waUploadToServer }
      );
    } catch (err) {
      console.error(`[Pinterest] Gagal prepare image ${i + 1}:`, err.message);
    }

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        title:              `📌 Foto ${i + 1}/${maxSlides}`,
        subtitle:           query,
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
              id: `.pindl ${url}`,
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
              text: `📌 *Pinterest Search*\n\n🔍 Keyword: *${query}*\n🖼️ Total: ${maxSlides} gambar`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: `Swipe & pilih gambar • ${global.botName || "NekoBot"}`,
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

const handler = async (m, { conn, text, command, args }) => {
  if (command === "pindl" && text?.startsWith("http")) {
    await m.react("⏳");
    try {
      await conn.sendMessage(
        m.chat,
        {
          image:   { url: text },
          caption: `> 📌 *Pinterest Image*\n>\n> ✅ Download berhasil!`,
        },
        { quoted: m.fakeObj || m }
      );
      await m.react("✅");
    } catch (err) {
      await m.react("❌");
      await m.reply(`> ❌ Gagal download gambar.\n> 🔗 URL: ${text}`);
    }
    return;
  }

  if (!text?.trim()) {
    return m.reply(
      `> 📌 *PINTEREST SEARCH*\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> .pin furina genshin\n` +
      `> .pin aesthetic wallpaper\n>\n` +
      `> ℹ️ Default 10 gambar, tambah angka untuk lebih:\n` +
      `> .pin anime girl 20`
    );
  }

  const parts  = text.trim().split(" ");
  const last   = parts[parts.length - 1];
  let limit    = 10;
  let query    = text.trim();

  if (/^\d+$/.test(last)) {
    limit = Math.min(parseInt(last), 30);
    query = parts.slice(0, -1).join(" ");
  }

  if (query.length < 2) {
    return m.reply(`> ❌ Kata kunci terlalu pendek, minimal 2 karakter.`);
  }

  await m.react("⏳");

  let result;
  try {
    const { data } = await axios.get(`${global.apiUrl}/search/pinterestsearch`, {
      params:  { q: query, limit },
      timeout: 30000,
    });
    if (!data?.status) throw new Error(data?.error || "API returned false status");
    result = data;
  } catch (err) {
    await m.react("❌");
    return m.reply(
      `> ❌ *SEARCH GAGAL*\n>\n` +
      `> 🔧 Error: ${err.message}\n>\n` +
      `> 🔄 Coba lagi dalam beberapa saat!`
    );
  }

  const { images = [], total = 0 } = result;

  if (!images.length) {
    await m.react("❌");
    return m.reply(
      `> ❌ *TIDAK ADA HASIL*\n>\n` +
      `> 🔍 Keyword: *${query}*\n>\n` +
      `> 💡 Coba kata kunci yang berbeda.`
    );
  }

  try {
    await sendCarousel(conn, m, images, query);
    await m.react("✅");
  } catch (err) {
    console.error("[Pinterest Search] Carousel error:", err.message);
    try {
      await m.react("⚠️");
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        await conn.sendMessage(
          m.chat,
          {
            image:   { url: images[i] },
            caption: i === 0
              ? `> 📌 *PINTEREST SEARCH*\n> 🔍 *Keyword:* ${query}\n> 🖼️ Total: ${total}\n>\n> ✅ Berhasil!`
              : `> 📌 Gambar ${i + 1}/${Math.min(images.length, 5)}`,
          },
          { quoted: m.fakeObj || m }
        );
        if (i < 4) await new Promise((r) => setTimeout(r, 1200));
      }
      await m.react("✅");
    } catch (fallbackErr) {
      await m.react("❌");
      await m.reply(`> ❌ Gagal mengirim gambar: ${fallbackErr.message}`);
    }
  }
};

handler.command     = ["pin", "pindl"];
handler.category    = "search";
handler.description = "Cari gambar di Pinterest dengan carousel";

export default handler;