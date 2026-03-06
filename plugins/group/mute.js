/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, args, metadata, participants }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  let target = null;
  if (m.quoted?.sender) target = m.quoted.sender;
  else if (m.mentionedJid?.length) target = m.mentionedJid[0];
  else if (args[0]) target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  if (!target) return m.reply("❌ Tag / reply / tulis nomor member yang ingin di-mute.");

  const tNum = target.replace(/[^0-9]/g, "");
  const groupData = global.db.groups[m.chat] ?? {};
  if (!groupData.muted) groupData.muted = {};

  if (groupData.muted[target]) return m.reply(`❌ @${tNum} sudah di-mute!`, { mentions: [target] });

  groupData.muted[target] = true;
  global.db.groups[m.chat] = groupData;

  await m.reply(`🔇 @${tNum} berhasil di-mute!\nPesannya akan otomatis dihapus.`, { mentions: [target] });
};

handler.command  = ["mute"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Mute member (pesan dihapus otomatis)";

export default handler;
