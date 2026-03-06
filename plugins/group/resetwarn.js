import { resolveAnyLidToJid, getParticipantJid, cacheParticipantLids } from "../../lib/serialize.js";

const resolveTarget = (m, args, participants) => {
  if (m.quoted?.sender) return resolveAnyLidToJid(m.quoted.sender, participants);
  if (m.mentionedJid?.[0]) return resolveAnyLidToJid(m.mentionedJid[0], participants);
  if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, "");
    const found = participants.find((p) => getParticipantJid(p).replace(/[^0-9]/g, "") === num);
    return found ? getParticipantJid(found) : num + "@s.whatsapp.net";
  }
  return null;
};

let handler = async (m, { conn, args }) => {
  if (!m.isGroup) return m.reply(global.mess.group);
  if (!m.isAdmin) return m.reply(global.mess.admin);

  const meta = await conn.groupMetadata(m.chat);
  const participants = meta?.participants || [];
  cacheParticipantLids(participants);

  const target = resolveTarget(m, args, participants);
  if (!target) return m.reply("❌ Reply atau tag member yang ingin di-reset warn.");

  const targetNum = target.replace(/[^0-9]/g, "");
  const warns = global.db.groups?.[m.chat]?.warns ?? {};
  const found = Object.keys(warns).find((k) => k.replace(/[^0-9]/g, "") === targetNum);

  if (!found || !warns[found]) return m.reply(`⚠️ @${targetNum} tidak memiliki warn.`);

  global.db.groups[m.chat].warns[found] = 0;
  await m.reply(`✅ Warn @${targetNum} berhasil direset.`);
};

handler.help = ["resetwarn"];
handler.tags = ["group"];
handler.command = ["resetwarn"];

export default handler;
