/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */

const getBotNum = (conn) => {
  const raw = conn.user?.id || conn.user?.jid || "";
  return raw.replace(/:\d+/, "").split("@")[0].replace(/[^0-9]/g, "");
};

const handler = async (m, { conn, args, metadata, participants }) => {
  let targets = [];

  if (m.quoted?.sender) {
    targets.push(m.quoted.sender);
  } else if (m.mentionedJid?.length) {
    targets = [...m.mentionedJid];
  } else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, "");
    if (num) targets.push(num + "@s.whatsapp.net");
  }

  if (!targets.length) return m.reply("❌ Siapa yang mau di-kick?\nReply pesan / tag / tulis nomor.");

  const allMembers = metadata?.participants ?? participants ?? [];
  const botNum     = getBotNum(conn);
  const groupOwner = allMembers.find((p) => p.admin === "superadmin");

  for (const target of targets) {
    const tNum = target.replace(/[^0-9]/g, "");

    if (botNum && tNum === botNum) {
      await m.reply("❌ Tidak bisa kick diri sendiri!");
      continue;
    }

    if (groupOwner) {
      const ownerNum = [groupOwner.id, groupOwner.jid, groupOwner.lid]
        .filter(Boolean)
        .map((x) => x.replace(/[^0-9]/g, ""))
        .find((n) => n === tNum);
      if (ownerNum) {
        await m.reply("❌ Tidak bisa kick owner grup!");
        continue;
      }
    }

    const matched = allMembers.find((p) =>
      [p.id, p.jid, p.lid].filter(Boolean).some((id) => id.replace(/[^0-9]/g, "") === tNum)
    );
    const targetJid = matched?.id || matched?.jid || matched?.lid || target;

    try {
      await conn.groupParticipantsUpdate(m.chat, [targetJid], "remove");
      await m.reply(`✅ @${tNum} telah di-kick dari grup!`, { mentions: [targetJid] });
    } catch {
      await m.reply(`❌ Gagal kick @${tNum}`, { mentions: [targetJid] });
    }
  }
};

handler.command     = ["kick", "kik"];
handler.category    = "group";
handler.description = "Kick member dari grup";
handler.group       = true;
handler.admin       = true;
handler.botAdmin    = true;

export default handler;
