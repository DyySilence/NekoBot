/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { imageToWebp, videoToWebp, downloadMsgMedia } from "../../lib/mediaHelper.js";

const handler = async (m, { conn, text }) => {
  const isQuotedImage  = m.quoted?.isImage;
  const isQuotedVideo  = m.quoted?.isVideo;
  const isDirectImage  = m.isImage;
  const isDirectVideo  = m.isVideo;

  const isImage = isQuotedImage || isDirectImage;
  const isVideo = isQuotedVideo || isDirectVideo;

  if (!isImage && !isVideo)
    return m.reply("❌ Reply atau kirim foto/video dengan .sticker");

  await m.react("⏳");

  const parts    = (text || "").split("|");
  const packname = parts[0]?.trim() || global.namaOwner || "DyySilence";
  const author   = parts[1]?.trim() || "© 2026";
  const opt      = { packname, author };

  try {
    const buffer = m.quoted
      ? await m.quoted.download()
      : await m.download();

    let webpBuffer;
    if (isVideo) {
      webpBuffer = await videoToWebp(buffer, opt);
    } else {
      webpBuffer = await imageToWebp(buffer, opt);
    }

    await m.replySticker(webpBuffer);
    await m.react("✅");
  } catch (err) {
    console.error("[Sticker] Error:", err.message);
    await m.react("❌");
    await m.reply(`❌ Gagal buat stiker: ${err.message}`);
  }
};

handler.command     = ["sticker", "stiker", "s"];
handler.category    = "converter";
handler.description = "Buat stiker dari foto/video";

export default handler;
