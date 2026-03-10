/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const MAX_WARN = 3;

const handler = async (m, { conn, args, text, metadata, participants }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  let target = null;
  let reason = "";

  if (m.quoted?.sender) {
    target = m.quoted.sender;
    reason = text || "Tidak ada alasan";
  } else if (m.mentionedJid?.length) {
    target = m.mentionedJid[0];
    const textAfterMention = text.replace(/@\d+/g, "").trim();
    reason = textAfterMention || "Tidak ada alasan";
  } else if (args[0]) {
    target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    reason = args.slice(1).join(" ") || "Tidak ada alasan";
  }

  if (!target) return m.reply("❌ Tag / reply / tulis nomor member yang ingin di-warn.");

  const tNum = target.replace(/[^0-9]/g, "");
  const groupData = global.db.groups[m.chat] ?? {};
  if (!groupData.warns) groupData.warns = {};
  if (!groupData.warns[tNum]) groupData.warns[tNum] = 0;

  groupData.warns[tNum]++;
  global.db.groups[m.chat] = groupData;

  const warnCount = groupData.warns[tNum];

  if (warnCount >= MAX_WARN) {
    try {
      await conn.groupParticipantsUpdate(m.chat, [target], "remove");
      delete groupData.warns[tNum];
      global.db.groups[m.chat] = groupData;
      await m.reply(
        `⚠️ *WARNING ${warnCount}/${MAX_WARN}*\n\n👤 @${tNum}\n📝 Alasan: ${reason}\n\n❌ Sudah mencapai batas maksimal, @${tNum} telah di-kick!`,
        { mentions: [target] }
      );
    } catch {
      await m.reply(`⚠️ @${tNum} sudah ${warnCount} warn tapi gagal di-kick.`, { mentions: [target] });
    }
  } else {
    await m.reply(
      `⚠️ *WARNING ${warnCount}/${MAX_WARN}*\n\n👤 @${tNum}\n📝 Alasan: ${reason}\n\n${MAX_WARN - warnCount} warn lagi akan di-kick!`,
      { mentions: [target] }
    );
  }
};

handler.command  = ["warn"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Beri peringatan ke member";

export default handler;
