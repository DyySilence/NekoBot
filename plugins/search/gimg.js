/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from "baileys";

const gimgCache = new Map();

async function sendImageInteractive(conn, m, imgObj, index, total, query) {
  const isLast = index >= total - 1;

  let media = null;
  try {
    media = await prepareWAMessageMedia(
      { image: { url: imgObj.url } },
      { upload: conn.waUploadToServer }
    );
  } catch (err) {
    console.error("[gimg] prepareMedia error:", err.message);
  }

  const buttons = [];

  if (!isLast) {
    buttons.push({
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "next »",
        id: `.gimg next`,
      }),
    });
  }

  buttons.push({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "🔍 Cari lain",
      id: `.gimg `,
    }),
  });

  const dim = imgObj.width && imgObj.height ? ` • ${imgObj.width}×${imgObj.height}` : "";

  const interactiveMsg = generateWAMessageFromContent(
    m.chat,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create({
              hasMediaAttachment: !!media?.imageMessage,
              imageMessage: media?.imageMessage || undefined,
            }),
            body: proto.Message.InteractiveMessage.Body.create({
              text: `🖼️ *${query}*\n${index + 1}/${total}${dim}`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: global.botName || "NekoBot",
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons,
            }),
          }),
        },
      },
    }),
    { quoted: m.fakeObj || m }
  );

  await conn.relayMessage(m.chat, interactiveMsg.message, {
    messageId: interactiveMsg.key.id,
  });
}

const handler = async (m, { conn, text }) => {
  const cacheKey = `${m.chat}_${m.sender}`;

  if (text?.trim() === "next") {
    const cached = gimgCache.get(cacheKey);
    if (!cached?.items?.length) {
      return m.reply(`> ❌ Cache habis. Cari lagi dengan *.gimg <query>*`);
    }

    const idx = (cached.index || 0) + 1;
    if (idx >= cached.items.length) {
      gimgCache.delete(cacheKey);
      return m.reply(`> ✅ Semua gambar sudah ditampilkan.\n> Cari lagi dengan *.gimg <query>*`);
    }

    cached.index = idx;
    gimgCache.set(cacheKey, cached);

    try {
      await sendImageInteractive(conn, m, cached.items[idx], idx, cached.items.length, cached.query);
    } catch {
      await conn.sendMessage(
        m.chat,
        { image: { url: cached.items[idx].url }, caption: `> 🖼️ ${idx + 1}/${cached.items.length}` },
        { quoted: m.fakeObj || m }
      );
    }
    return;
  }

  const query = text?.trim() || "";

  if (!query || query.length < 2) {
    return m.reply(
      `> 🖼️ *GOOGLE IMAGE SEARCH*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> .gimg <query>\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> .gimg kucing lucu\n` +
      `> .gimg pemandangan alam\n` +
      `> .gimg anime wallpaper`
    );
  }

  await m.react("🔎");

  let result;
  try {
    const { data } = await axios.get(`${global.apiUrl}/search/googleimage`, {
      params: { q: query, limit: 30 },
      timeout: 45000,
    });
    if (!data?.status) throw new Error(data?.error || "API error");
    result = data;
  } catch (err) {
    await m.react("❌");
    return m.reply(
      `> ❌ *SEARCH GAGAL*\n>\n` +
      `> 🔍 Query: *${query}*\n` +
      `> 🔧 ${err.message}\n>\n` +
      `> 🔄 Coba lagi!`
    );
  }

  if (!result.images?.length) {
    await m.react("❌");
    return m.reply(`> ❌ Tidak ada gambar untuk: *${query}*\n> Coba kata kunci lain.`);
  }

  gimgCache.set(cacheKey, {
    items:     result.images,
    index:     0,
    query,
    timestamp: Date.now(),
  });
  setTimeout(() => gimgCache.delete(cacheKey), 5 * 60 * 1000);

  try {
    await sendImageInteractive(conn, m, result.images[0], 0, result.images.length, query);
    await m.react("✅");
  } catch (err) {
    console.error("[gimg] Interactive error:", err.message);
    await conn.sendMessage(
      m.chat,
      {
        image:   { url: result.images[0].url },
        caption: `> 🖼️ *Google Image: ${query}*\n> 1/${result.images.length}\n>\n> Ketik *.gimg next* untuk gambar berikutnya`,
      },
      { quoted: m.fakeObj || m }
    );
    await m.react("✅");
  }
};

handler.command     = ["gimg", "gimage"];
handler.category    = "search";
handler.description = "Cari gambar dari Google Images";

export default handler;
