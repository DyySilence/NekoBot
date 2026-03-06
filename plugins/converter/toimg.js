/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { webpToPng, webpToMp4 } from "../../lib/mediaHelper.js";

const handler = async (m, { conn }) => {
  if (!m.quoted?.isSticker)
    return m.reply(
      "❌ Reply stiker dengan .toimg\n\n" +
      "💡 Stiker animasi → Video MP4\n" +
      "💡 Stiker biasa → Foto PNG"
    );

  await m.react("⏳");

  try {
    const buffer     = await m.quoted.download();
    const isAnimated = m.quoted.isAnimated === true;

    if (isAnimated) {
      const mp4Buffer = await webpToMp4(buffer);
      await conn.sendMessage(m.chat, {
        video: mp4Buffer,
        mimetype: "video/mp4",
        caption: "nih",
      }, { quoted: m });
    } else {
      const pngBuffer = await webpToPng(buffer);
      await conn.sendMessage(m.chat, {
        image: pngBuffer,
        caption: "nih",
      }, { quoted: m });
    }

    await m.react("✅");
  } catch (err) {
    console.error("[ToIMG] Error:", err.message);
    await m.react("❌");
    await m.reply(`❌ Gagal konversi: ${err.message}`);
  }
};

handler.command     = ["toimg", "stickertoimg"];
handler.category    = "converter";
handler.description = "Konversi stiker ke foto/video";

export default handler;
