

/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
import axios from "axios";
import { downloadContentFromMessage } from "baileys";

function unwrapMsg(msg) {
  let m = msg || {};
  for (let i = 0; i < 8; i++) {
    if (m?.ephemeralMessage?.message)           { m = m.ephemeralMessage.message; continue; }
    if (m?.viewOnceMessage?.message)            { m = m.viewOnceMessage.message; continue; }
    if (m?.viewOnceMessageV2?.message)          { m = m.viewOnceMessageV2.message; continue; }
    if (m?.viewOnceMessageV2Extension?.message) { m = m.viewOnceMessageV2Extension.message; continue; }
    if (m?.documentWithCaptionMessage?.message) { m = m.documentWithCaptionMessage.message; continue; }
    break;
  }
  return m;
}

function pickMediaNode(m) {
  const types = ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"];

  if (m.quoted?.mtype === "imageMessage") return { node: m.quoted, type: "image" };

  if (m.quoted?.message) {
    const uq    = unwrapMsg(m.quoted.message);
    const found = types.find((t) => uq?.[t]);
    if (found) return { node: uq[found], type: found.replace("Message", "") };
  }

  if (m.message) {
    const ur    = unwrapMsg(m.message);
    const found = types.find((t) => ur?.[t]);
    if (found) return { node: ur[found], type: found.replace("Message", "") };
  }

  return null;
}

const handler = async (m, { conn }) => {
  const mediaObj = pickMediaNode(m);

  if (!mediaObj || mediaObj.type !== "image") {
    return m.reply(
      `> 🖼️ *GAMBAR TIDAK DITEMUKAN*\n>\n` +
      `> Kirim atau reply gambar lalu ketik:\n` +
      `> ${global.prefix}removewm`
    );
  }

  const imageNode = mediaObj.node;
  if ((imageNode.fileLength || 0) > 20 * 1024 * 1024) {
    return m.reply(`> ❌ Gambar terlalu besar, maksimal 20MB`);
  }

  await m.react("⏳");

  const stream = await downloadContentFromMessage(imageNode, "image");
  let buffer   = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

  if (!buffer.length) throw new Error("Gagal download gambar");

  const response = await axios.post(
    `${global.apiUrl}/ai-image/removewm`,
    { image: buffer.toString("base64") },
    { timeout: 120000 }
  );

  if (!response.data?.status || !response.data?.image) {
    throw new Error(response.data?.error || "Gagal mendapatkan hasil dari API");
  }

  const resultBuffer = Buffer.from(response.data.image, "base64");

  await conn.sendMessage(m.chat, { image: resultBuffer, caption: "" }, { quoted: m.fakeObj || m });
  await m.react("✅");
};

handler.command     = ["removewm", "nowm"];
handler.category    = "ai-image";
handler.description = "Hapus watermark dari gambar menggunakan AI";

export default handler;
