/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import axios from "axios";
import { imageToWebp, videoToWebp } from "../../lib/mediaHelper.js";

const DEFAULT_PP = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const handler = async (m, { conn, text, command }) => {
  const isWM = ["swm", "stickerwm"].includes(command);

 
  if (m.mentionedJid?.length && !m.quoted) {
    await m.react("⏳");
    for (const jid of m.mentionedJid) {
      try {
        const pp  = await conn.profilePictureUrl(jid, "image").catch(() => DEFAULT_PP);
        const res = await axios.get(pp, { responseType: "arraybuffer", timeout: 15000 });
        const buf = Buffer.from(res.data);
        const opt = { packname: global.namaOwner || "DyySilence", author: "© 2026" };
        const webp = await imageToWebp(buf, opt);
        await conn.sendMessage(m.chat, { sticker: webp }, { quoted: m.fakeObj || m });
      } catch (err) {
        console.error(`[sticker] PP ${jid}:`, err.message);
      }
    }
    return m.react("✅");
  }

  const src = m.quoted || m;

  const isImage = src.isImage || /image/.test(src.mimetype || src.msg?.mimetype || "");
  const isVideo = src.isVideo || /video/.test(src.mimetype || src.msg?.mimetype || "");

  if (!isImage && !isVideo)
    return m.reply(
      `> ❌ Reply atau kirim *foto/video* dengan perintah ini.\n\n` +
      `> • \`.swm Pack|Author\` — dengan watermark`
    );

  if (isVideo && (src.seconds || src.msg?.seconds || 0) > 10)
    return m.reply("❌ Video maksimal 10 detik untuk dijadikan stiker.");

  await m.react("⏳");
  let packname, author;
  if (isWM && text) {
    const parts = text.split("|");
    packname = parts[0]?.trim() || global.namaOwner || "DyySilence";
    author   = parts[1]?.trim() || "© 2026";
  } else if (isWM) {
    packname = global.namaOwner || "DyySilence";
    author   = global.botName       || "© 2026";
  } else {
    packname = "";
    author   = "";
  }

  const opt = { packname, author };

  try {
    const buffer = m.quoted ? await m.quoted.download() : await m.download();

    const webp = isVideo
      ? await videoToWebp(buffer, opt)
      : await imageToWebp(buffer, opt);

    await m.replySticker(webp);
    await m.react("✅");
  } catch (err) {
    console.error("[sticker]", err.message);
    await m.react("❌");
    m.reply(`❌ Gagal buat stiker: ${err.message}`);
  }
};

handler.command     = ["spp","wm", "swm"];
handler.category    = "tools";
handler.description = "Buat stiker dari foto/video/mention PP";

export default handler;
