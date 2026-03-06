/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { downloadContentFromMessage } from "baileys";

const handler = async (m, { conn }) => {
  if (!m.quoted) {
    return m.reply(
      `> 👁️ *READ VIEW ONCE*\n>\n` +
      `> Reply pesan ViewOnce lalu ketik:\n` +
      `> \`${global.prefix}rvo\`\n>\n` +
      `> 📷 Support: Foto • Video • Audio`
    );
  }

  const q     = m.quoted;
  const mtype = q.mtype; 

  if (!q.viewOnce) {
    await m.react("❌");
    return m.reply(
      `> ❌ *Bukan ViewOnce message.*\n>\n` +
      `> Pastikan reply pesan dengan ikon "1x"`
    );
  }

  if (!["imageMessage", "videoMessage", "audioMessage"].includes(mtype)) {
    await m.react("❌");
    return m.reply(`> ❌ Tipe media tidak didukung: \`${mtype}\``);
  }

  await m.react("⏳");
  const streamType = mtype.replace("Message", "");
  const stream     = await downloadContentFromMessage(q, streamType);

  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

  if (!buffer.length) throw new Error("Gagal download media ViewOnce");

  const fileSize = (buffer.length / 1024).toFixed(2);
  const caption  = q.caption || "";

  const adReply = {
    title:                 "👁️ ViewOnce Dibuka",
    body:                  `${streamType.toUpperCase()} • ${fileSize} KB`,
    thumbnailUrl:          "https://c.termai.cc/i161/3zewPF.jpg",
    sourceUrl:             "https://www.dyysomnia.shop",
    mediaType:             1,
    renderLargerThumbnail: false,
  };

  if (mtype === "imageMessage") {
    await conn.sendMessage(
      m.chat,
      { image: buffer, caption: caption || " ", contextInfo: { externalAdReply: adReply } },
      { quoted: m.fakeObj || m }
    );

  } else if (mtype === "videoMessage") {
    await conn.sendMessage(
      m.chat,
      { video: buffer, caption: caption || " ", contextInfo: { externalAdReply: adReply } },
      { quoted: m.fakeObj || m }
    );

  } else if (mtype === "audioMessage") {
    await conn.sendMessage(
      m.chat,
      { audio: buffer, mimetype: "audio/mp4", ptt: q.ptt || false },
      { quoted: m.fakeObj || m }
    );
    await m.reply(
      `> 👁️ *VIEWONCE AUDIO TERBUKA*\n>\n` +
      `> 📊 Size: ${fileSize} KB\n` +
      `> 👤 Dari: ${m.quoted.pushName || "Unknown"}`
    );
  }

  await m.react("✅");
};

handler.command     = ["rvo"];
handler.category    = "tools";
handler.description = "Reveal pesan View Once — semua user bisa pakai";

export default handler;
