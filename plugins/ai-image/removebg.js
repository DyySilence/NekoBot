/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "baileys";

const TERMAI_API_KEY = "AIzaBj7z2z3xBjsk";
const TERMAI_API_URL = "https://c.termai.cc/api/upload";

function unwrapMsg(msg) {
  let m = msg || {};
  for (let i = 0; i < 10; i++) {
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

  if (m.quoted?.mtype === "imageMessage") {
    return { node: m.quoted, type: "image" };
  }

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

async function uploadToTermai(buffer, mimeType, fileName) {
  const form = new FormData();
  form.append("file", buffer, { filename: fileName, contentType: mimeType });

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 45000);

  const response = await axios.post(
    `${TERMAI_API_URL}?key=${TERMAI_API_KEY}`,
    form,
    { headers: form.getHeaders(), signal: controller.signal }
  );

  clearTimeout(timeout);

  if (response.data?.status && response.data?.path) return response.data.path;
  throw new Error("Termai upload failed");
}

const handler = async (m, { conn }) => {
  const mediaObj = pickMediaNode(m);

  if (!mediaObj || mediaObj.type !== "image") {
    return m.reply(
      `> 🖼️ *GAMBAR TIDAK DITEMUKAN*\n>\n` +
      `> Kirim atau reply gambar lalu ketik:\n` +
      `> ${global.prefix}removebg`
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

  const fileName = imageNode.fileName || `removebg-${Date.now()}.jpg`;
  const imageUrl = await uploadToTermai(buffer, imageNode.mimetype || "image/jpeg", fileName);

  const response = await axios.get(`${global.apiUrl}/ai-image/removebg`, {
    params:  { url: imageUrl },
    timeout: 120000,
  });

  const resultUrl = response.data?.result_url;
  if (!resultUrl) throw new Error(response.data?.error || "Gagal mendapatkan hasil");

  await conn.sendMessage(m.chat, { image: { url: resultUrl }, caption: "" }, { quoted: m.fakeObj || m });
  await m.react("✅");
};

handler.command     = ["removebg", "nobg"];
handler.category    = "ai-image";
handler.description = "Hapus background dari gambar menggunakan AI";

export default handler;
