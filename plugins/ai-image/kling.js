/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
import axios from "axios";
import FormData from "form-data";
import fetch from "node-fetch";
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
    return { node: m.quoted, type: "image", isQuoted: true };
  }

  if (m.quoted?.message) {
    const uq = unwrapMsg(m.quoted.message);
    const found = types.find((t) => uq?.[t]);
    if (found) return { node: uq[found], type: found.replace("Message", ""), isQuoted: true };
  }

  if (m.message) {
    const ur = unwrapMsg(m.message);
    const found = types.find((t) => ur?.[t]);
    if (found) return { node: ur[found], type: found.replace("Message", ""), isQuoted: false };
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
  throw new Error("Invalid Termai response structure");
}

function extractResultUrl(responseData) {
  let url =
    (responseData.status === true && responseData.result_url)       ? responseData.result_url :
    (responseData.status === true && responseData.data?.url)        ? responseData.data.url :
    (responseData.status === true && responseData.data?.images?.[0]?.url) ? responseData.data.images[0].url :
    responseData.url        ||
    responseData.data?.url  ||
    responseData.imageUrl   ||
    responseData.result     ||
    (typeof responseData === "string" && responseData.startsWith("http") ? responseData : null) ||
    (typeof responseData.data === "string" && responseData.data.startsWith("http") ? responseData.data : null);
  if (!url) return null;
  if (!url.startsWith("http")) url = `https://${url}`;
  return url;
}

const handler = async (m, { conn, text }) => {
  if (!text || text.trim() === "") {
    return m.reply(
      `> ❌ *PERINTAH EDIT DIBUTUHKAN*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> Kirim/reply gambar dengan caption:\n` +
      `> ${global.prefix}kling [prompt]\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> ${global.prefix}kling hitamkan rambutnya\n` +
      `> ${global.prefix}kling ubah background jadi putih\n` +
      `> ${global.prefix}kling jadikan anime style\n` +
      `> ${global.prefix}kling tambahkan kacamata\n` +
      `> ${global.prefix}kling ganti bajunya jadi biru`
    );
  }

  const mediaObj = pickMediaNode(m);
  if (!mediaObj || mediaObj.type !== "image") {
    return m.reply(
      `> 🖼️ *GAMBAR TIDAK DITEMUKAN*\n>\n` +
      `> 📤 Kirim gambar dengan caption:\n` +
      `> ${global.prefix}kling [perintah edit]\n>\n` +
      `> 🔁 Atau reply gambar dengan:\n` +
      `> ${global.prefix}kling [perintah edit]`
    );
  }

  const imageNode = mediaObj.node;
  if ((imageNode.fileLength || 0) > 20 * 1024 * 1024) {
    return m.reply(`> ❌ *GAMBAR TERLALU BESAR*\n> 📊 Maksimal: 20MB\n> 💡 Kompres gambar dulu sebelum di-edit`);
  }

  await m.react("⏳");

  const stream = await downloadContentFromMessage(imageNode, "image");
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

  const fileName = imageNode.fileName || `kling-${Date.now()}.jpg`;
  const imageUrl = await uploadToTermai(buffer, imageNode.mimetype || "image/jpeg", fileName);

  const response = await axios({
    method: "GET",
    url: `${global.apiUrl}/ai-image/klingai`,
    params: { url: imageUrl, prompt: text, apikey: "dyy" },
    timeout: 120000,
  });

  const resultUrl = extractResultUrl(response.data);
  if (!resultUrl) throw new Error("Format respons API tidak dikenal");

  const caption =
    `> 🎨 *HASIL EDIT FOTO*\n>\n` +
    `> 📝 *Prompt:* ${text}`;

  await conn.sendMessage(m.chat, { image: { url: resultUrl }, caption }, { quoted: m.fakeObj || m });
  await m.react("✅");
};

handler.command     = ["kling", "klingai"];
handler.category    = "ai-image";
handler.description = "Edit foto menggunakan Kling AI dengan prompt natural language";

export default handler;
