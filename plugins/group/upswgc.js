/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
import crypto from "crypto";
import {
  generateWAMessageFromContent,
  generateWAMessageContent,
  downloadContentFromMessage,
} from "baileys";

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

const MEDIA_TYPES = ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"];
const TEXT_TYPES  = ["extendedTextMessage", "conversation"];

function pickNode(raw) {
  if (!raw) return null;
  const u = unwrapMsg(raw);
  for (const t of MEDIA_TYPES) {
    if (u?.[t]) return { node: u[t], type: t };
  }
  for (const t of TEXT_TYPES) {
    if (u?.[t]) return { node: u[t], type: t };
  }
  return null;
}

function getQuotedRaw(m) {
  if (m.quoted?.message) return m.quoted.message;
  const raw = m.message;
  if (!raw) return null;
  const u = unwrapMsg(raw);
  const ci =
    u?.extendedTextMessage?.contextInfo ||
    u?.imageMessage?.contextInfo ||
    u?.videoMessage?.contextInfo ||
    u?.audioMessage?.contextInfo ||
    u?.documentMessage?.contextInfo ||
    null;
  return ci?.quotedMessage || null;
}

async function downloadMedia(node, type) {
  const streamType = type.replace("Message", "");
  const stream = await downloadContentFromMessage(node, streamType);
  let buf = Buffer.from([]);
  for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
  return buf;
}

const BG_COLORS = [0xFF8A2BE2, 0xFFFF69B4, 0xFFFFA500, 0xFF00BFFF, 0xFF32CD32, 0xFFFF4500, 0xFF1E90FF];
const randomBg  = () => BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];

function isUrl(str) {
  return /^https?:\/\//i.test(str.trim());
}

function getDomain(url) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

const handler = async (m, { conn, text }) => {
  if (!m.isAdmin && !m.isOwner && !m.fromMe) {
    return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  }

  try {
    let picked    = null;
    let caption   = text || "";

    const quotedRaw = getQuotedRaw(m);
    if (quotedRaw) {
      picked = pickNode(quotedRaw);
    }

    if (!picked && m.message) {
      const selfPicked = pickNode(m.message);
      if (selfPicked && MEDIA_TYPES.includes(selfPicked.type)) {
        picked = selfPicked;
      }
    }

    if (!picked) {
      const statusText =
        caption ||
        (() => {
          const u = unwrapMsg(m.message);
          return u?.extendedTextMessage?.text || u?.conversation || "";
        })();

      if (!statusText) {
        return m.reply(
          `> ❌ *TIDAK ADA KONTEN!*\n` +
          `\n` +
          `> 📋 *Cara Pakai:*\n` +
          `\n` +
          `> 1️⃣ *Gambar/Video:*\n` +
          `>    Kirim/reply media → \`.swgc\`\n` +
          `>    Dengan caption → \`.swgc Caption ini\`\n` +
          `\n` +
          `> 2️⃣ *Teks biasa:*\n` +
          `>    \`.swgc Halo semua! 🎉\`\n` +
          `\n` +
          `> 3️⃣ *Link/Preview:*\n` +
          `>    \`.swgc https://youtu.be/xxx\`\n` +
          `\n` +
          `> 4️⃣ *Voice Note:*\n` +
          `>    Reply audio → \`.swgc\`\n` +
          `\n` +
          `> ✅ *Support:* Gambar • Video • Audio/VN • Teks • Link Preview`
        );
      }

      picked  = { node: statusText, type: "text" };
      caption = "";
    }

    await m.react("⏳");

    let contentPayload = {};
    let typeLabel      = "";

    if (picked.type === "imageMessage") {
      const buf = await downloadMedia(picked.node, "imageMessage");
      contentPayload = { image: buf, caption: caption || picked.node?.caption || "" };
      typeLabel = "📷 Gambar";

    } else if (picked.type === "videoMessage") {
      const buf = await downloadMedia(picked.node, "videoMessage");
      contentPayload = { video: buf, caption: caption || picked.node?.caption || "", gifPlayback: false };
      typeLabel = "🎥 Video";

    } else if (picked.type === "audioMessage") {
      const buf   = await downloadMedia(picked.node, "audioMessage");
      const isPtt = picked.node?.ptt === true;
      contentPayload = {
        audio:    buf,
        mimetype: isPtt ? "audio/ogg; codecs=opus" : "audio/mp4",
        ptt:      isPtt,
      };
      typeLabel = isPtt ? "🎤 Voice Note" : "🎵 Audio";

    } else if (picked.type === "stickerMessage") {
      const buf = await downloadMedia(picked.node, "stickerMessage");
      contentPayload = { image: buf, caption: caption || "" };
      typeLabel = "🖼️ Sticker (as image)";

    } else if (picked.type === "documentMessage") {
      const fname   = picked.node?.fileName || "Dokumen";
      const textDoc = `📄 *${fname}*\n${caption || ""}`;
      contentPayload = { text: textDoc, linkPreview: null };
      typeLabel = "📄 Dokumen (as text)";

    } else {
      const rawText = typeof picked.node === "string" ? picked.node : caption;

      if (isUrl(rawText)) {
        contentPayload = {
          text: rawText,
          linkPreview: {
            url:         rawText,
            title:       getDomain(rawText),
            description: caption || rawText,
            thumbnail:   null,
          },
        };
        typeLabel = `🔗 Link — ${getDomain(rawText)}`;

      } else {
        contentPayload = {
          text:           rawText,
          backgroundArgb: randomBg(),
          textArgb:       0xFFFFFFFF,
          font:           Math.floor(Math.random() * 5) + 1,
        };
        typeLabel = "📝 Teks";
      }
    }

    let waContent;
    try {
      waContent = await generateWAMessageContent(contentPayload, { upload: conn.waUploadToServer });
    } catch (genErr) {
      console.error("[UPSWGC] generateWAMessageContent error:", genErr.message);
      const fallbackText = caption || (typeof picked.node === "string" ? picked.node : "") || typeLabel;
      waContent = await generateWAMessageContent(
        {
          text:           fallbackText || "(status)",
          backgroundArgb: randomBg(),
          textArgb:       0xFFFFFFFF,
          font:           1,
        },
        { upload: conn.waUploadToServer }
      );
      typeLabel += " (fallback text)";
    }

    const messageSecret = crypto.randomBytes(32);

    const finalMsg = generateWAMessageFromContent(
      m.chat,
      {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: {
          message: {
            ...waContent,
            messageContextInfo: { messageSecret },
          },
        },
      },
      { userJid: conn.user.id }
    );

    await conn.relayMessage(m.chat, finalMsg.message, { messageId: finalMsg.key.id });
    await m.react("✅");

    let successMsg =
      `> ✅ *STATUS GROUP BERHASIL!*\n\n` +
      `> 📌 Tipe: ${typeLabel}\n`;
    if (caption && !["🎤 Voice Note", "🎵 Audio"].includes(typeLabel)) {
      successMsg += `> 📝 Caption: ${caption}\n`;
    }
    successMsg += `\n> 💡 Status sudah dipublish ke grup`;

    await m.reply(successMsg);

  } catch (e) {
    console.error("[UPSWGC ERROR]", e);
    await m.react("❌");

    let errorMsg = `> ❌ *UPLOAD STATUS GAGAL*\n\n`;

    if (e.message?.includes("not-authorized")) {
      errorMsg += `> 🔒 Bot tidak punya izin upload status\n> 💡 Pastikan bot sudah terhubung dengan benar`;
    } else if (e.message?.includes("rate-overlimit")) {
      errorMsg += `> ⏱️ Terlalu banyak request\n> 💡 Tunggu beberapa saat lalu coba lagi`;
    } else if (e.message?.includes("Invalid media")) {
      errorMsg += `> ⚠️ Format media tidak didukung\n> 💡 Coba dengan gambar/video lain`;
    } else {
      errorMsg += `> 🔧 Error: ${e.message}`;
    }

    await m.reply(errorMsg);
  }
};

handler.command     = ["upswgc", "swgc"];
handler.category    = "group";
handler.description = "Upload media/text/link ke status group WhatsApp";
handler.group       = true;

export default handler;
