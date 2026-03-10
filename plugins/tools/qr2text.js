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

function pickImageNode(m) {
  if (m.quoted?.mtype === "imageMessage") return m.quoted;
  if (m.quoted?.message) {
    const uq = unwrapMsg(m.quoted.message);
    if (uq?.imageMessage) return uq.imageMessage;
  }
  if (m.message) {
    const ur = unwrapMsg(m.message);
    if (ur?.imageMessage) return ur.imageMessage;
  }
  return null;
}

async function uploadToTermai(buffer) {
  const form = new FormData();
  form.append("file", buffer, { filename: "qr.jpg", contentType: "image/jpeg" });
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 45000);
  const response   = await axios.post(
    `${TERMAI_API_URL}?key=${TERMAI_API_KEY}`,
    form,
    { headers: form.getHeaders(), signal: controller.signal }
  );
  clearTimeout(timeout);
  if (response.data?.status && response.data?.path) return response.data.path;
  throw new Error("Termai upload failed");
}

const handler = async (m, { conn, text }) => {
  let imageUrl = null;

  // Mode 1: teks adalah URL gambar langsung
  if (text?.match(/^https?:\/\//i)) {
    imageUrl = text.trim();

  } else {
    // Mode 2: reply/kirim gambar → upload ke Termai
    const imageNode = pickImageNode(m);
    if (!imageNode) {
      return m.reply(
        `> 📸 *QR CODE READER*\n>\n` +
        `> 📝 *Cara Pakai:*\n` +
        `> 1. Reply gambar QR dengan: \`${global.prefix}qr2text\`\n` +
        `> 2. Kirim URL gambar: \`${global.prefix}qr2text <url>\``
      );
    }

    await m.react("⏳");

    const stream = await downloadContentFromMessage(imageNode, "image");
    let buffer   = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    if (!buffer.length) throw new Error("Gagal download gambar");

    imageUrl = await uploadToTermai(buffer);
  }

  await m.react("⏳");

  const response = await axios.get(`${global.apiUrl}/tools/qr2text`, {
    params:  { url: imageUrl },
    timeout: 30000,
  });

  if (!response.data?.status) {
    throw new Error(response.data?.error || "Gagal membaca QR code");
  }

  const { result, formatted, info } = response.data;

  await conn.sendMessage(
    m.chat,
    {
      text:
        `✅ *BERHASIL MEMBACA QR CODE*\n\n` +
        `${info ? info + "\n\n" : ""}` +
        `📄 *Hasil:*\n${formatted || result}`,
    },
    { quoted: m.fakeObj || m }
  );

  await m.react("✅");
};

handler.command     = ["qr2text", "scanqr"];
handler.category    = "tools";
handler.description = "Baca teks dari QR code (reply gambar atau URL)";

export default handler;
