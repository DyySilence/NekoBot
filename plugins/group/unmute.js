/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */

import { resolveAnyLidToJid, lidToJid } from "../../lib/serialize.js";

const handler = async (m, { conn, args, participants }) => {
  let rawTarget = null;
  if (m.quoted?.sender)            rawTarget = m.quoted.sender;
  else if (m.mentionedJid?.length) rawTarget = m.mentionedJid[0];
  else if (args[0])                rawTarget = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  if (!rawTarget) return m.reply("❌ Tag / reply / tulis nomor member yang ingin di-unmute.");

  const target    = resolveAnyLidToJid(rawTarget, participants) || lidToJid(rawTarget) || rawTarget;
  const tNum      = target.replace(/[^0-9]/g, "");
  const groupData = global.db.groups[m.chat] ?? {};
  if (!groupData.muted) groupData.muted = {};

  if (!groupData.muted[tNum]) {
    return m.reply(`❌ @${tNum} tidak sedang di-mute!`, { mentions: [target] });
  }

  delete groupData.muted[tNum];
  global.db.groups[m.chat] = groupData;

  await m.reply(`🔊 @${tNum} berhasil di-unmute!`, { mentions: [target] });
};

handler.command     = ["unmute"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Unmute member grup";

export default handler;
