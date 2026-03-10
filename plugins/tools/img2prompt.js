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
import sharp from "sharp";
import { downloadContentFromMessage } from "baileys";
import { generateWAMessageFromContent, proto } from "baileys";

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
  form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" });

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
  const imageNode = pickImageNode(m);

  if (!imageNode) {
    return m.reply(
      `> 📸 *IMAGE TO PROMPT*\n>\n` +
      `> Convert gambar jadi deskripsi prompt AI!\n>\n` +
      `> 📝 *Cara Pakai:*\n` +
      `> Reply gambar dengan: \`${global.prefix}img2prompt\`\n` +
      `> Atau kirim gambar + caption: \`${global.prefix}img2prompt\``
    );
  }

  await m.react("⏳");

  // Download gambar dari WA
  const stream = await downloadContentFromMessage(imageNode, "image");
  let raw = Buffer.from([]);
  for await (const chunk of stream) raw = Buffer.concat([raw, chunk]);
  if (!raw.length) throw new Error("Gagal download gambar");

  // Resize max 1024px & compress JPEG
  const buffer = await sharp(raw)
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Upload ke Termai → dapat URL publik
  const imageUrl = await uploadToTermai(buffer);

  // Kirim URL ke route API
  const response = await axios.get(`${global.apiUrl}/tools/img2prompt`, {
    params:  { url: imageUrl },
    timeout: 45000,
  });

  if (!response.data?.status || !response.data?.prompt) {
    throw new Error(response.data?.error || "Gagal mendapatkan prompt");
  }

  const prompt = response.data.prompt;

  // Kirim dengan interactive message (copy button)
  try {
    const msg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text:
                  `🎨 *IMAGE TO PROMPT*\n\n` +
                  `📝 *Generated Prompt:*\n${prompt}\n\n` +
                  `━━━━━━━━━━━━━━━━━\n\n` +
                  `💡 *Tips:*\n` +
                  `• Gunakan untuk AI art generators\n` +
                  `• Tambahkan: "photorealistic, 8k, ultra detailed"\n` +
                  `• Atau: "anime style, vibrant colors"`,
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "Powered by ImagePromptGuru",
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "📋 Copy Prompt",
                      copy_code: prompt,
                    }),
                  },
                ],
              }),
            }),
          },
        },
      }),
      { quoted: m.fakeObj || m }
    );
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch {
    await m.reply(
      `🎨 *IMAGE TO PROMPT*\n\n` +
      `📝 *Generated Prompt:*\n\n${prompt}\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `💡 Long press teks di atas untuk copy\n` +
      `🤖 Powered by ImagePromptGuru`
    );
  }

  await m.react("✅");
};

handler.command     = ["img2prompt", "toprompt"];
handler.category    = "tools";
handler.description = "Convert gambar ke deskripsi prompt AI";

export default handler;
