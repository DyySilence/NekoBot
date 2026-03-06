/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

import { downloadContentFromMessage } from "baileys";

async function downloadMedia(mediaInfo, mediaType) {
  try {
    if (!mediaInfo) return null;
    const stream = await downloadContentFromMessage(mediaInfo, mediaType);
    let buffer   = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    if (!buffer || buffer.length === 0) return null;
    return buffer;
  } catch (err) {
    console.error(`[jpmch] downloadMedia(${mediaType}):`, err.message);
    return null;
  }
}

async function sendToChannel(conn, channelJid, payload) {
  try {
    await conn.sendMessage(channelJid, payload);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function resolveNode(q) {
  if (!q) return null;
  if (q.msg && typeof q.msg === "object" && q.msg.url) return q.msg;
  if (q.url || q.mediaKey || q.directPath) return q;
  const mtype = q.mtype || q.type || "";
  if (q[mtype] && typeof q[mtype] === "object") return q[mtype];
  return q.msg || null;
}

const handler = async (m, { conn, text }) => {
  if (!Array.isArray(global.db.settings?.channels)) global.db.settings.channels = [];
  const channels = global.db.settings.channels;

  if (channels.length === 0) {
    return m.reply(
      `> 📭 *Belum ada channel tersimpan!*\n>\n` +
      `> 💡 *Tambahkan dulu:*\n` +
      `> \`${global.prefix}addchannel <nama> <jid/link>\``
    );
  }

  const validChannels = channels.filter(
    (ch) => ch.jid && !ch.jid.startsWith("http") && ch.jid.includes("@newsletter")
  );

  if (validChannels.length === 0) {
    return m.reply(
      `> ❌ *Tidak ada channel dengan JID valid!*\n>\n` +
      `> 💡 Butuh format: \`120363xxxx@newsletter\`\n` +
      `> Hapus & tambah ulang channel dengan JID yang benar.`
    );
  }

  const caption    = text?.trim() || "";
  const hasQuoted  = !!(m.quoted && (m.quoted.mtype || m.quoted.url || m.quoted.mediaKey));
  const hasOwnMedia = m.isImage || m.isVideo || m.isAudio || m.isSticker || m.isDocument;

  if (!caption && !hasQuoted && !hasOwnMedia) {
    let helpText  = `> 📤 *BROADCAST KE SEMUA CHANNEL*\n> ━━━━━━━━━━━━━━━━━━━━━\n>\n`;
    helpText     += `> 📝 *Cara pakai:*\n`;
    helpText     += `> • Teks  : \`${global.prefix}jpmch <pesan>\`\n`;
    helpText     += `> • Media : Reply/kirim media + \`${global.prefix}jpmch [caption]\`\n>\n`;
    helpText     += `> 📊 *Channel terdaftar (${validChannels.length}):*\n`;
    validChannels.forEach((ch, i) => { helpText += `> ${i + 1}. *${ch.name}*\n`; });
    helpText     += `>\n> 📌 *Contoh:*\n> \`${global.prefix}jpmch Breaking news hari ini!\``;
    return m.reply(helpText);
  }

  await m.react("⏳");

  let payload   = null;
  let mediaType = "";

  if (hasQuoted) {
    const q      = m.quoted;
    const qMtype = q.mtype || q.type || "";
    const qNode  = resolveNode(q);

    if (qMtype === "conversation" || qMtype === "extendedTextMessage") {
      const qBody     = q.text || q.body || "";
      const finalText = caption ? `${caption}\n\n${qBody}` : qBody;
      if (!finalText.trim()) { await m.react("❌"); return m.reply("> ❌ *Tidak ada teks untuk dikirim!*"); }
      payload   = { text: finalText };
      mediaType = "teks";

    } else if (qMtype === "imageMessage" || q.isImage) {
      const buf = await downloadMedia(qNode, "image");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh gambar!*"); }
      payload   = { image: buf, caption: caption || qNode?.caption || "", mimetype: qNode?.mimetype || "image/jpeg" };
      mediaType = "foto";

    } else if (qMtype === "ptvMessage") {
      const buf = await downloadMedia(qNode, "ptv");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh video bulat!*"); }
      payload   = { video: buf, ptv: true, mimetype: qNode?.mimetype || "video/mp4" };
      mediaType = "video bulat";

    } else if (qMtype === "videoMessage" || q.isVideo) {
      const buf = await downloadMedia(qNode, "video");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh video!*"); }
      payload   = { video: buf, caption: caption || qNode?.caption || "", mimetype: qNode?.mimetype || "video/mp4", gifPlayback: qNode?.gifPlayback || false };
      mediaType = "video";

    } else if (qMtype === "audioMessage" || q.isAudio) {
      const isPtt = !!(qNode?.ptt) || q.isVoice;
      const buf   = await downloadMedia(qNode, "audio");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh audio!*"); }
      payload   = { audio: buf, ptt: isPtt, mimetype: qNode?.mimetype || (isPtt ? "audio/ogg; codecs=opus" : "audio/mp4") };
      mediaType = isPtt ? "voice note" : "audio";

    } else if (qMtype === "stickerMessage" || q.isSticker) {
      const buf = await downloadMedia(qNode, "sticker");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh sticker!*"); }
      payload   = { sticker: buf, mimetype: qNode?.mimetype || "image/webp" };
      mediaType = "sticker";

    } else if (qMtype === "documentMessage" || q.isDocument) {
      const buf = await downloadMedia(qNode, "document");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh dokumen!*"); }
      payload   = { document: buf, mimetype: qNode?.mimetype || "application/octet-stream", fileName: qNode?.fileName || "file", caption: caption || qNode?.caption || "" };
      mediaType = "dokumen";

    } else {
      await m.react("❌");
      return m.reply(
        `> ❌ *Tipe tidak dikenali: \`${qMtype}\`*\n>\n` +
        `> ✅ *Yang didukung:*\n` +
        `> Teks • Foto • Video • Video Bulat • Audio • VN • Sticker • Dokumen`
      );
    }

  } else if (hasOwnMedia) {
    const info = m.msg;

    if (m.isImage) {
      const buf = await downloadMedia(info, "image");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh gambar!*"); }
      payload   = { image: buf, caption: caption || info?.caption || "", mimetype: info?.mimetype || "image/jpeg" };
      mediaType = "foto";

    } else if (m.isVideo) {
      const isPtv = !!(info?.ptv);
      const buf   = await downloadMedia(info, isPtv ? "ptv" : "video");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh video!*"); }
      payload   = isPtv
        ? { video: buf, ptv: true, mimetype: info?.mimetype || "video/mp4" }
        : { video: buf, caption: caption || info?.caption || "", mimetype: info?.mimetype || "video/mp4" };
      mediaType = isPtv ? "video bulat" : "video";

    } else if (m.isAudio) {
      const isPtt = !!(info?.ptt) || m.isVoice;
      const buf   = await downloadMedia(info, "audio");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh audio!*"); }
      payload   = { audio: buf, ptt: isPtt, mimetype: info?.mimetype || (isPtt ? "audio/ogg; codecs=opus" : "audio/mp4") };
      mediaType = isPtt ? "voice note" : "audio";

    } else if (m.isSticker) {
      const buf = await downloadMedia(info, "sticker");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh sticker!*"); }
      payload   = { sticker: buf, mimetype: info?.mimetype || "image/webp" };
      mediaType = "sticker";

    } else if (m.isDocument) {
      const buf = await downloadMedia(info, "document");
      if (!buf) { await m.react("❌"); return m.reply("> ❌ *Gagal unduh dokumen!*"); }
      payload   = { document: buf, mimetype: info?.mimetype || "application/octet-stream", fileName: info?.fileName || "file", caption: caption || info?.caption || "" };
      mediaType = "dokumen";
    }

  } else if (caption) {
    payload   = { text: caption };
    mediaType = "teks";
  }

  if (!payload) {
    await m.react("❌");
    return m.reply(
      `> ❌ *Tidak ada konten yang dikirim!*\n>\n` +
      `> 💡 *Cara pakai:*\n` +
      `> • Teks  : \`${global.prefix}jpmch <pesan>\`\n` +
      `> • Media : Reply/kirim media + \`${global.prefix}jpmch [caption]\``
    );
  }

  let sukses      = 0;
  let gagal       = 0;
  const gagalList = [];

  for (const ch of validChannels) {
    const result = await sendToChannel(conn, ch.jid, payload);
    if (result.ok) {
      sukses++;
    } else {
      gagal++;
      gagalList.push(`• ${ch.name}: ${result.error}`);
    }
  }

  if (sukses > 0) await m.react("✅");
  else await m.react("❌");

  let report  = `> ${sukses > 0 ? "✅" : "❌"} *BROADCAST SELESAI*\n>\n`;
  report     += `> 📦 Tipe: *${mediaType}*\n`;
  report     += `> ✅ Berhasil: *${sukses}/${validChannels.length} channel*\n`;
  if (gagal > 0) {
    report += `> ❌ Gagal: *${gagal} channel*\n>\n`;
    report += `> *Detail gagal:*\n`;
    gagalList.forEach((g) => { report += `> ${g}\n`; });
  }

  return m.reply(report.trim());
};

handler.command     = ["jpmch", "upch"];
handler.category    = "jpmchannel";
handler.description = "Broadcast pesan/media ke semua channel yang terdaftar";
handler.owner       = true;

export default handler;
