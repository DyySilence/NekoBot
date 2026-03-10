/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, args, metadata, participants }) => {
  let target = null;
  if (m.quoted?.sender) target = m.quoted.sender;
  else if (m.mentionedJid?.length) target = m.mentionedJid[0];
  else if (args[0]) target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  if (!target) return m.reply("❌ Tag / reply / tulis nomor member yang ingin di-promote.");

  const tNum = target.replace(/[^0-9]/g, "");
  const allMembers = metadata?.participants ?? participants ?? [];

  const matchParticipant = (p) => {
    const ids = [p.id, p.jid, p.lid].filter(Boolean);
    return ids.some((id) => id.replace(/[^0-9]/g, "") === tNum);
  };

  const targetParticipant = allMembers.find(matchParticipant);

  if (!targetParticipant) {
    return m.reply(`❌ @${tNum} tidak ditemukan di grup!`, { mentions: [target] });
  }

  if (targetParticipant.admin) {
    return m.reply(`❌ @${tNum} sudah jadi admin!`, { mentions: [target] });
  }

  const targetJid = targetParticipant.id || targetParticipant.jid || targetParticipant.lid || target;

  try {
    await conn.groupParticipantsUpdate(m.chat, [targetJid], "promote");
    await m.reply(`✅ @${tNum} berhasil di-promote jadi admin!`, { mentions: [target] });
  } catch (e) {
    await m.reply(`❌ Gagal promote @${tNum}: ${e.message}`, { mentions: [target] });
  }
};

handler.command     = ["promote"];
handler.category    = "group";
handler.description = "Promote member jadi admin";
handler.group       = true;
handler.admin       = true;
handler.botAdmin    = true;

export default handler;
