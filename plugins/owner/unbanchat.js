/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn, args, text }) => {
  const linkMatch = text?.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i);
  let targetGroup = null;

  if (linkMatch) {
    try {
      const info = await conn.groupGetInviteInfo(linkMatch[1]);
      targetGroup = info.id;
    } catch (e) {
      return m.reply(`> ❌ Gagal ambil info grup dari link!\n> Error: ${e.message}`);
    }
  } else if (args[0]?.endsWith("@g.us")) {
    targetGroup = args[0];
  } else if (m.isGroup) {
    targetGroup = m.chat;
  }

  if (!targetGroup) {
    return m.reply(
      `> 📋 *CARA PAKAI UNBANCHAT*\n>\n` +
      `> Di dalam grup:\n` +
      `>    \`${global.prefix}unbanchat\`\n>\n` +
      `> Pakai link grup:\n` +
      `>    \`${global.prefix}unbanchat <link>\`\n>\n` +
      `> Pakai group ID:\n` +
      `>    \`${global.prefix}unbanchat <groupId>\``
    );
  }

  if (!global.db.groups[targetGroup]?.banchat) {
    return m.reply(`> ⚠️ Grup \`${targetGroup}\` tidak dalam status ban.`);
  }

  global.db.groups[targetGroup].banchat = false;

  let groupName = targetGroup.split("@")[0];
  try {
    const meta = global.groupMetadataCache?.get(targetGroup) || await conn.groupMetadata(targetGroup).catch(() => null);
    if (meta?.subject) groupName = meta.subject;
    if (meta) global.groupMetadataCache?.set(targetGroup, meta);
  } catch {}

  await m.reply(
    `> ✅ *GRUP BERHASIL DI-UNBAN*\n>\n` +
    `> 🏠 Grup: *${groupName}*\n` +
    `> 🆔 \`${targetGroup}\`\n>\n` +
    `> Bot akan merespon command kembali di grup tersebut.`
  );
};

handler.command     = ["unbanchat"];
handler.category    = "owner";
handler.description = "Unban grup agar bot merespon command kembali";
handler.owner       = true;

export default handler;
