/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const handler = async (m, { conn, args, text, cmd, mime }) => {
  const isHide   = args[0] === "-h";
  const realText = isHide ? args.slice(1).join(" ").trim() : text;

  if (!realText && !m.quoted?.isImage && !m.quoted?.isVideo && !m.isImage && !m.isVideo && !/image|video/.test(mime)) {
    return m.reply(
      `> 📢 *JPM — JAWAB PESAN MASSAL*\n>\n` +
      `> 📝 *Cara pakai:*\n` +
      `> • Teks biasa  : \`${cmd} pesan\`\n` +
      `> • Hidetag     : \`${cmd} -h pesan\`\n` +
      `> • Foto/Video  : kirim/reply media + \`${cmd} [caption]\`\n` +
      `> • Foto hidetag: kirim/reply media + \`${cmd} -h [caption]\`\n>\n` +
      `> 🔇 \`-h\` = pesan dikirim sebagai hidetag (mention semua tanpa notif)`
    );
  }

  let mediaBuffer = null;
  let mediaType   = null;

  if (m.quoted?.isImage || m.quoted?.isVideo) {
    mediaBuffer = await m.quoted.download();
    mediaType   = m.quoted.isVideo ? "video" : "image";
  } else if (m.isImage || m.isVideo) {
    mediaBuffer = await m.download();
    mediaType   = m.isVideo ? "video" : "image";
  } else if (/image/.test(mime)) {
    mediaBuffer = m.quoted ? await m.quoted.download() : await m.download();
    mediaType   = "image";
  }

  const allGroups = await conn.groupFetchAllParticipating();
  const groupIds  = Object.keys(allGroups);

  if (!global.db.settings.bljpm) global.db.settings.bljpm = [];

  let successCount = 0;
  let fail         = 0;
  let bl           = 0;

  const typeLabel = mediaBuffer
    ? `Teks & ${mediaType === "video" ? "Video" : "Foto"}${isHide ? " (Hidetag)" : ""}`
    : `Teks${isHide ? " (Hidetag)" : ""}`;

  await m.reply(
    `🚀 *Memproses JPM ${typeLabel}*\n` +
    `📊 Total Grup: ${groupIds.length}`
  );

  for (const id of groupIds) {
    if (global.db.settings.bljpm.includes(id)) { bl++; continue; }

    try {
      if (isHide) {
        const meta         = global.groupMetadataCache?.get(id) ?? await conn.groupMetadata(id).catch(() => null);
        const participants = meta?.participants ?? [];
        const mentions     = participants.map((p) => p.jid || p.id || "").filter(Boolean);

        if (mediaBuffer) {
          await conn.sendMessage(id, {
            [mediaType]: mediaBuffer,
            caption:     realText || " ",
            mentions,
          });
        } else {
          await conn.sendMessage(id, {
            text:     realText || " ",
            mentions,
          }, { quoted: global.qtext });
        }
      } else {
        if (mediaBuffer) {
          await conn.sendMessage(id, {
            [mediaType]: mediaBuffer,
            caption:     realText || "",
          });
        } else {
          await conn.sendMessage(id, { text: realText }, { quoted: global.qtext });
        }
      }
      successCount++;
    } catch (e) {
      fail++;
      console.error(`[jpm] Gagal kirim ke grup ${id}:`, e.message);
    }

    await sleep(global.jedaPushkontak || 3000);
  }

  await conn.sendMessage(m.chat, {
    text:
      `✅ *JPM ${typeLabel} Selesai*\n\n` +
      `✅ Berhasil  : ${successCount}\n` +
      `❌ Gagal     : ${fail}\n` +
      `🚫 Blacklist : ${bl}`,
  }, { quoted: m.fakeObj || m });
};

handler.command     = ["jasher", "jpm"];
handler.category    = "jpm";
handler.description = "Kirim pesan massal ke semua grup, support hidetag & media";
handler.owner       = true;

export default handler;
