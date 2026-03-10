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
import fetch from "node-fetch";
import { downloadContentFromMessage } from "baileys";

const TERMAI_API_KEY = "AIzaBj7z2z3xBjsk";
const TERMAI_API_URL = "https://c.termai.cc/api/upload";

const PROMPT = "Transform this image into a high-quality anime art style, inspired by Studio Madhouse. Use sharp outlines, vibrant colors, and dramatic lighting. IMPORTANT: Maintain the exact facial features, expression, hairstyle, and pose of the original subject. Do not change the identity. Cel-shaded, 4K resolution, highly detailed anime illustration.";

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
    const uq = unwrapMsg(m.quoted.message);
    const found = types.find((t) => uq?.[t]);
    if (found) return { node: uq[found], type: found.replace("Message", "") };
  }

  if (m.message) {
    const ur = unwrapMsg(m.message);
    const found = types.find((t) => ur?.[t]);
    if (found) return { node: ur[found], type: found.replace("Message", "") };
  }

  return null;
}

async function uploadToTermai(imageBuffer, mimeType, fileName) {
  const form = new FormData();
  form.append("file", imageBuffer, { filename: fileName, contentType: mimeType });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const response = await fetch(`${TERMAI_API_URL}?key=${TERMAI_API_KEY}`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!response.ok) throw new Error(`Termai API Error: ${response.status}`);
  const json = await response.json();
  if (json.status && json.path) return json.path;
  throw new Error("Termai upload failed");
}

function extractResultUrl(data) {
  let url =
    (data.status === true && data.result_url)              ? data.result_url :
    (data.status === true && data.data?.url)               ? data.data.url :
    (data.status === true && data.data?.images?.[0]?.url)  ? data.data.images[0].url :
    data.url || data.data?.url || data.imageUrl || data.result ||
    (typeof data === "string" && data.startsWith("http")        ? data : null) ||
    (typeof data.data === "string" && data.data.startsWith("http") ? data.data : null);
  if (!url) return null;
  if (!url.startsWith("http")) url = `https://${url}`;
  return url;
}

const handler = async (m, { conn }) => {
  const mediaObj = pickMediaNode(m);
  if (!mediaObj || mediaObj.type !== "image") {
    return m.reply(
      `> 🖼️ *GAMBAR TIDAK DITEMUKAN*\n>\n` +
      `> Kirim atau reply gambar lalu ketik:\n` +
      `> ${global.prefix}toanime`
    );
  }

  const imageNode = mediaObj.node;
  if ((imageNode.fileLength || 0) > 20 * 1024 * 1024) {
    return m.reply(`> ❌ Gambar terlalu besar, maksimal 20MB`);
  }

  await m.react("⏳");

  const stream = await downloadContentFromMessage(imageNode, "image");
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

  const fileName = imageNode.fileName || `toanime-${Date.now()}.jpg`;
  const imageUrl = await uploadToTermai(buffer, imageNode.mimetype || "image/jpeg", fileName);

  const response = await axios({
    method: "GET",
    url: `${global.apiUrl}/ai-image/klingai`,
    params: { url: imageUrl, prompt: PROMPT, apikey: "dyy" },
    timeout: 120000,
  });

  const resultUrl = extractResultUrl(response.data);
  if (!resultUrl) throw new Error("Format respons API tidak dikenal");

  await conn.sendMessage(m.chat, { image: { url: resultUrl }, caption: "" }, { quoted: m.fakeObj || m });
  await m.react("✅");
};

handler.command     = ["toanime"];
handler.category    = "ai-image";
handler.description = "Ubah foto jadi zombie menggunakan AI";

export default handler;
