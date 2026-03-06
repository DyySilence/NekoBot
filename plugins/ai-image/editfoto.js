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

function genserial() {
  let s = "";
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

async function upimage(filename) {
  const form = new FormData();
  form.append("file_name", filename);
  const res = await axios.post(
    "https://api.imgupscaler.ai/api/common/upload/upload-image",
    form,
    { headers: { ...form.getHeaders(), origin: "https://imgupscaler.ai", referer: "https://imgupscaler.ai/" } }
  );
  return res.data.result;
}

async function uploadtoOSS(putUrl, fileBuffer, ext) {
  const type = ext === ".png" ? "image/png" : "image/jpeg";
  const res = await axios.put(putUrl, fileBuffer, {
    headers: { "Content-Type": type, "Content-Length": fileBuffer.length },
    maxBodyLength: Infinity,
  });
  return res.status === 200;
}

async function createJob(imageUrl, prompt) {
  const form = new FormData();
  form.append("model_name", "magiceraser_v4");
  form.append("original_image_url", imageUrl);
  form.append("prompt", prompt);
  form.append("ratio", "match_input_image");
  form.append("output_format", "jpg");
  const res = await axios.post(
    "https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "product-code": "magiceraser",
        "product-serial": genserial(),
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    }
  );
  return res.data.result.job_id;
}

async function cekjob(jobId) {
  const res = await axios.get(
    `https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`,
    { headers: { origin: "https://imgupscaler.ai", referer: "https://imgupscaler.ai/" } }
  );
  return res.data;
}

async function nanobanana(imageBuffer, mimeType, prompt) {
  const ext      = mimeType === "image/png" ? ".png" : ".jpg";
  const filename = `edit-${Date.now()}${ext}`;
  const uploadInfo = await upimage(filename);
  await uploadtoOSS(uploadInfo.url, imageBuffer, ext);
  const cdn   = "https://cdn.imgupscaler.ai/" + uploadInfo.object_name;
  const jobId = await createJob(cdn, prompt);
  let result, attempts = 0;
  do {
    await new Promise((r) => setTimeout(r, 3000));
    result = await cekjob(jobId);
    attempts++;
    if (attempts >= 40) throw new Error("Timeout menunggu hasil edit dari imgupscaler");
  } while (result.code === 300006);
  if (!result.result?.output_url?.[0]) throw new Error("Output URL tidak ditemukan dari imgupscaler");
  return { job_id: jobId, image: result.result.output_url[0] };
}

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

const handler = async (m, { conn, text }) => {
  if (!text || text.trim() === "") {
    return m.reply(
      `> ❌ *PERINTAH EDIT DIBUTUHKAN*\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> Kirim/reply gambar dengan caption:\n` +
      `> ${global.prefix}editfoto [prompt]\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> ${global.prefix}editfoto hitamkan rambutnya\n` +
      `> ${global.prefix}editfoto ubah background jadi putih\n` +
      `> ${global.prefix}editfoto jadikan anime style\n` +
      `> ${global.prefix}editfoto tambahkan kacamata\n` +
      `> ${global.prefix}editfoto ganti bajunya jadi biru`
    );
  }

  const mediaObj = pickMediaNode(m);
  if (!mediaObj || mediaObj.type !== "image") {
    return m.reply(
      `> 🖼️ *GAMBAR TIDAK DITEMUKAN*\n>\n` +
      `> 📤 Kirim gambar dengan caption:\n` +
      `> ${global.prefix}editfoto [perintah edit]\n>\n` +
      `> 🔁 Atau reply gambar dengan:\n` +
      `> ${global.prefix}editfoto [perintah edit]`
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

  const result = await nanobanana(buffer, imageNode.mimetype || "image/jpeg", text);

  const caption = `> 🎨 *HASIL EDIT FOTO*\n>\n> 📝 *Prompt:* ${text}`;

  await conn.sendMessage(m.chat, { image: { url: result.image }, caption }, { quoted: m.fakeObj || m });
  await m.react("✅");
};

handler.command     = ["editfoto"];
handler.category    = "ai-image";
handler.description = "Edit foto menggunakan AI dengan perintah natural language";

export default handler;