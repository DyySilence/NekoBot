/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { downloadContentFromMessage } from "baileys";
import { resolveAnyLidToJid, cacheParticipantLids, lidToJid } from "../../lib/serialize.js";

async function downloadMedia(mediaNode, type) {
  const streamType = type.replace("Message", "").toLowerCase();
  const stream = await downloadContentFromMessage(mediaNode, streamType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

function deepUnwrap(msg) {
  if (!msg || typeof msg !== "object") return msg;
  let m = msg;
  for (let i = 0; i < 15; i++) {
    if (m?.ephemeralMessage?.message)           { m = m.ephemeralMessage.message; continue; }
    if (m?.viewOnceMessage?.message)            { m = m.viewOnceMessage.message; continue; }
    if (m?.viewOnceMessageV2?.message)          { m = m.viewOnceMessageV2.message; continue; }
    if (m?.viewOnceMessageV2Extension?.message) { m = m.viewOnceMessageV2Extension.message; continue; }
    if (m?.documentWithCaptionMessage?.message) { m = m.documentWithCaptionMessage.message; continue; }
    if (m?.editedMessage?.message)              { m = m.editedMessage.message; continue; }
    break;
  }
  return m;
}

function resolveToPhone(jid, participants = []) {
  if (!jid) return jid;
  const num = jid.replace(/@.*$/, "").replace(/[^0-9]/g, "");
  for (const p of participants) {
    const ids = [p.id, p.jid, p.lid].filter(Boolean);
    if (ids.some(id => id.replace(/[^0-9]/g, "") === num)) {
      const phone = ids.find(id => id.endsWith("@s.whatsapp.net") && !id.includes(":"));
      if (phone) return phone;
    }
  }
  const resolved = resolveAnyLidToJid(jid, participants);
  if (resolved && resolved.endsWith("@s.whatsapp.net")) return resolved;
  if (jid.endsWith("@lid")) return jid.replace("@lid", "@s.whatsapp.net");
  return jid;
}

function findStatusInStore(rawSender, participants = []) {
  if (!global.statusStore || global.statusStore.size === 0) return [];

  const senderNum = rawSender.replace(/[^0-9]/g, "");

  const directHits = [
    rawSender,
    rawSender.replace("@lid", "@s.whatsapp.net"),
    rawSender.replace("@s.whatsapp.net", "@lid"),
    senderNum + "@s.whatsapp.net",
    senderNum + "@lid",
  ];

  for (const key of directHits) {
    const found = global.statusStore.get(key);
    if (found?.length) return found;
  }

  for (const [storeKey, val] of global.statusStore.entries()) {
    if (!val?.length) continue;
    if (storeKey.replace(/[^0-9]/g, "") === senderNum) return val;
  }

  if (participants.length) {
    for (const p of participants) {
      const ids = [p.id, p.jid, p.lid].filter(Boolean);
      if (!ids.some(id => id.replace(/[^0-9]/g, "") === senderNum)) continue;
      for (const id of ids) {
        const found = global.statusStore.get(id);
        if (found?.length) return found;
        const alt = id.endsWith("@lid")
          ? id.replace("@lid", "@s.whatsapp.net")
          : id.replace("@s.whatsapp.net", "@lid");
        const foundAlt = global.statusStore.get(alt);
        if (foundAlt?.length) return foundAlt;
      }
    }
  }

  return [];
}

const handler = async (m, { conn, participants }) => {
  if (!m.quoted) {
    return m.reply(
      `❌ *REPLY PESAN NOTIFIKASI!*\n\n` +
      `📋 *Cara Pakai:*\n` +
      `1. Tunggu ada yang tag grup di status mereka\n` +
      `2. WhatsApp kirim notifikasi ke grup\n` +
      `3. Reply notifikasi itu dengan command ini\n\n` +
      `💡 *Contoh:*\n` +
      `[Notifikasi: "Status i am b0t @ Grup ini disebut"]\n` +
      `└─ Reply: ${global.prefix}getsw`
    );
  }

  await m.react("⏳");

  const rawSender =
    m.quoted?.sender ||
    m.msg?.contextInfo?.participant ||
    m.quoted?.key?.participant ||
    "";

  if (!rawSender) return m.reply("❌ Tidak bisa mendeteksi pengirim status!");

  const statusSender = resolveToPhone(rawSender, participants);
  const senderNum    = statusSender.replace(/[^0-9]/g, "");

  if (!global.statusStore) {
    return m.reply(`❌ *STATUS STORE BELUM AKTIF!*\n\n💡 Pastikan index.js sudah diupdate.`);
  }

  const userStatuses = findStatusInStore(rawSender, participants);

  if (userStatuses.length === 0) {
    const storeKeys = [...global.statusStore.keys()].join(", ") || "kosong";
    return m.reply(
      `❌ *STATUS TIDAK DITEMUKAN DI STORE!*\n\n` +
      `👤 User: @${senderNum}\n` +
      `🔑 Raw sender: \`${rawSender}\`\n` +
      `📦 Store keys: \`${storeKeys.slice(0, 200)}\`\n\n` +
      `💡 Kemungkinan:\n` +
      `• Bot baru restart, status belum masuk store\n` +
      `• Status sudah dihapus user\n` +
      `• Format JID tidak cocok\n\n` +
      `🔄 Minta user upload status baru lagi`,
      { mentions: [statusSender] }
    );
  }

  try {
    const latestMsg     = userStatuses[userStatuses.length - 1];
    const statusContent = deepUnwrap(latestMsg?.message);
    if (!statusContent) return m.reply("❌ Konten status kosong!");

    const supportedTypes = ["imageMessage", "videoMessage", "audioMessage", "extendedTextMessage", "conversation"];
    const type = Object.keys(statusContent).find(k => supportedTypes.includes(k));

    if (!type) {
      return m.reply(
        `❌ *TIPE STATUS TIDAK DIDUKUNG!*\n\n` +
        `📋 Tipe: ${Object.keys(statusContent).join(", ")}\n\n` +
        `💡 Hanya support: gambar, video, audio, teks`
      );
    }

    const node    = statusContent[type];
    const caption =
      node?.caption ||
      statusContent?.extendedTextMessage?.text ||
      (typeof statusContent?.conversation === "string" ? statusContent.conversation : "") ||
      "";

    if (type === "imageMessage") {
      const buffer = await downloadMedia(node, type);
      await conn.sendMessage(m.chat, {
        image:    buffer,
        caption:
          `✅ *STATUS BERHASIL DIAMBIL!*\n\n` +
          `👤 Dari: @${senderNum}\n` +
          `📷 Tipe: Gambar` +
          (caption ? `\n📝 Caption: ${caption}` : ""),
        mentions: [statusSender],
      }, { quoted: m.fakeObj || m });

    } else if (type === "videoMessage") {
      const buffer = await downloadMedia(node, type);
      await conn.sendMessage(m.chat, {
        video:    buffer,
        caption:
          `✅ *STATUS BERHASIL DIAMBIL!*\n\n` +
          `👤 Dari: @${senderNum}\n` +
          `🎥 Tipe: Video` +
          (caption ? `\n📝 Caption: ${caption}` : ""),
        mentions:  [statusSender],
        mimetype: "video/mp4",
      }, { quoted: m.fakeObj || m });

    } else if (type === "audioMessage") {
      const buffer = await downloadMedia(node, type);
      await conn.sendMessage(m.chat, {
        audio:    buffer,
        mimetype: node.mimetype || "audio/mp4",
        ptt:      node.ptt || false,
      }, { quoted: m.fakeObj || m });
      await m.reply(
        `✅ *STATUS BERHASIL DIAMBIL!*\n\n` +
        `👤 Dari: @${senderNum}\n` +
        `🎤 Tipe: ${node.ptt ? "Voice Note" : "Audio"}`,
        { mentions: [statusSender] }
      );

    } else if (type === "extendedTextMessage" || type === "conversation") {
      await m.reply(
        `✅ *STATUS BERHASIL DIAMBIL!*\n\n` +
        `👤 Dari: @${senderNum}\n` +
        `📝 Tipe: Teks\n\n` +
        `💬 Isi Status:\n${caption || "No text"}`,
        { mentions: [statusSender] }
      );
    }

    await m.react("✅");

  } catch (err) {
    console.error("[GETSW ERROR]", err);
    await m.react("❌");
    let errorMsg = "❌ *GAGAL AMBIL STATUS!*\n\n";
    if (err.message?.includes("not-authorized"))      errorMsg += "🔒 Bot tidak punya akses.\n💡 Pastikan bot ada di kontak user.";
    else if (err.message?.includes("rate-overlimit")) errorMsg += "⏱️ Terlalu banyak request.\n💡 Tunggu lalu coba lagi.";
    else errorMsg += `🔧 Error: ${err.message}`;
    await m.reply(errorMsg);
  }
};

handler.command     = ["getsw"];
handler.category    = "group";
handler.description = "Ambil media dari status WA yang mention/tag group";
handler.group       = true;

export default handler;
