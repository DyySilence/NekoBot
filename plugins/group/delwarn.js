/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, args, metadata }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  let target = null;
  if (m.quoted?.sender) target = m.quoted.sender;
  else if (m.mentionedJid?.length) target = m.mentionedJid[0];
  else if (args[0]) target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  if (!target) return m.reply("❌ Tag / reply / tulis nomor member yang ingin dihapus warnnya.");

  const tNum = target.replace(/[^0-9]/g, "");
  const groupData = global.db.groups[m.chat] ?? {};
  if (!groupData.warns) groupData.warns = {};

  if (!groupData.warns[tNum]) return m.reply(`❌ @${tNum} tidak memiliki warn!`, { mentions: [target] });

  delete groupData.warns[tNum];
  global.db.groups[m.chat] = groupData;

  await m.reply(`✅ Warn @${tNum} berhasil dihapus!`, { mentions: [target] });
};

handler.command  = ["delwarn", "resetwarn"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Hapus warn member";

export default handler;
