/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn, args, metadata, participants }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  if (!m.isBotAdmin) return m.reply(global.mess?.botadmin ?? "❌ Bot harus admin!");

  let targets = [];

  if (m.quoted?.sender) {
    targets.push(m.quoted.sender);
  }
  else if (m.mentionedJid?.length) {
    targets = [...m.mentionedJid];
  }
  else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, "");
    targets.push(num + "@s.whatsapp.net");
  }

  if (!targets.length) return m.reply("❌ Siapa yang mau di-kick?\nReply pesan / tag / tulis nomor.");

  const allMembers = metadata?.participants ?? participants ?? [];
  const botNum = (conn.user?.lid || conn.user?.id || "").split(":")[0].split("@")[0];
  const groupOwner = allMembers.find((p) => p.admin === "superadmin");

  for (const target of targets) {
    const tNum = target.replace(/[^0-9]/g, "");
    if (groupOwner && (groupOwner.id || "").replace(/[^0-9]/g, "") === tNum) {
      await m.reply(`❌ Tidak bisa kick owner grup!`); continue;
    }
    if (tNum === botNum) { await m.reply("❌ Tidak bisa kick diri sendiri!"); continue; }

    try {
      await conn.groupParticipantsUpdate(m.chat, [target], "remove");
      await m.reply(`✅ @${tNum} telah di-kick dari grup!`, { mentions: [target] });
    } catch {
      await m.reply(`❌ Gagal kick @${tNum}`, { mentions: [target] });
    }
  }
};

handler.command  = ["kick", "hama"];
handler.category = "group";
handler.admin    = true;
handler.botAdmin = true;
handler.group    = true;
handler.description = "Kick member dari grup";

export default handler;
