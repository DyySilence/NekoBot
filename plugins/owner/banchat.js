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
      `> 📋 *CARA PAKAI BANCHAT*\n>\n` +
      `> Di dalam grup:\n` +
      `>    \`${global.prefix}banchat\`\n>\n` +
      `> Pakai link grup:\n` +
      `>    \`${global.prefix}banchat <link>\`\n>\n` +
      `> Pakai group ID:\n` +
      `>    \`${global.prefix}banchat <groupId>\``
    );
  }

  if (!global.db.groups[targetGroup]) global.db.groups[targetGroup] = {};

  if (global.db.groups[targetGroup].banchat) {
    return m.reply(`> ⚠️ Grup \`${targetGroup}\` sudah di-ban sebelumnya.`);
  }

  global.db.groups[targetGroup].banchat = true;

  let groupName = targetGroup.split("@")[0];
  try {
    const meta = global.groupMetadataCache?.get(targetGroup) || await conn.groupMetadata(targetGroup).catch(() => null);
    if (meta?.subject) groupName = meta.subject;
    if (meta) global.groupMetadataCache?.set(targetGroup, meta);
  } catch {}

  await m.reply(
    `> 🚫 *GRUP BERHASIL DI-BAN*\n>\n` +
    `> 🏠 Grup: *${groupName}*\n` +
    `> 🆔 \`${targetGroup}\`\n>\n` +
    `> Bot tidak akan merespon command apapun di grup tersebut.`
  );
};

handler.command     = ["banchat"];
handler.category    = "owner";
handler.description = "Ban grup agar bot tidak merespon command";
handler.owner       = true;

export default handler;