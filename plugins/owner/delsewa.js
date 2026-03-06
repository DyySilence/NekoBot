/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn, args }) => {
  const targetGroup = args[0]?.endsWith("@g.us") ? args[0] : m.isGroup ? m.chat : null;

  if (!targetGroup) {
    return m.reply(
      `> 📋 *CARA PAKAI DELSEWA*\n>\n` +
      `> Di dalam grup:\n` +
      `> \`${global.prefix}delsewa\`\n>\n` +
      `> Dari luar grup:\n` +
      `> \`${global.prefix}delsewa <groupId>\`\n>\n` +
      `> 💡 *Contoh:*\n` +
      `> \`${global.prefix}delsewa 120363xxxxxxxx@g.us\``
    );
  }

  if (!global.db.groups[targetGroup]?.sewa) {
    return m.reply(`> ❌ Grup \`${targetGroup}\` tidak memiliki data sewa.`);
  }

  delete global.db.groups[targetGroup].sewa;

  let groupName = targetGroup.split("@")[0];
  try {
    const meta = global.groupMetadataCache?.get(targetGroup);
    if (meta?.subject) groupName = meta.subject;
  } catch {}

  try {
    const botId = conn.user?.id || conn.user?.lid || "";
    await conn.groupLeave(targetGroup);
  } catch {}

  await m.reply(
    `> ✅ *SEWA DIHAPUS*\n>\n` +
    `> 🏠 Grup: *${groupName}*\n` +
    `> 🆔 \`${targetGroup}\`\n` +
    `> 🚪 Bot sudah keluar dari grup`
  );
};

handler.command     = ["delsewa"];
handler.category    = "owner";
handler.description = "Hapus sewa grup & bot keluar";
handler.owner       = true;

export default handler;
