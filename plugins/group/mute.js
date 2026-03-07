/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */

import { resolveAnyLidToJid, lidToJid } from "../../lib/serialize.js";

const handler = async (m, { conn, args, participants }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  let rawTarget = null;
  if (m.quoted?.sender)        rawTarget = m.quoted.sender;
  else if (m.mentionedJid?.length) rawTarget = m.mentionedJid[0];
  else if (args[0])            rawTarget = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  if (!rawTarget) return m.reply("❌ Tag / reply / tulis nomor member yang ingin di-mute.");
  const target = resolveAnyLidToJid(rawTarget, participants) || lidToJid(rawTarget);
  const tNum   = target.replace(/[^0-9]/g, "");
  const muteKey   = tNum;
  const groupData = global.db.groups[m.chat] ?? {};
  if (!groupData.muted) groupData.muted = {};

  if (groupData.muted[muteKey]) {
    return m.reply(`❌ @${tNum} sudah di-mute!`, { mentions: [target] });
  }

  groupData.muted[muteKey] = true;
  global.db.groups[m.chat] = groupData;

  await m.reply(`🔇 @${tNum} berhasil di-mute!\nPesannya akan otomatis dihapus.`, { mentions: [target] });
};

handler.command     = ["mute"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Mute member (pesan dihapus otomatis)";

export default handler;
