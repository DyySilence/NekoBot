/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { text }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  const groupData = global.db.groups[m.chat] ?? {};
  const sub = text?.trim().toLowerCase();

  if (sub === "on") {
    groupData.welcome = true;
    global.db.groups[m.chat] = groupData;
    return m.reply("✅ *Welcome message diaktifkan!*");
  }

  if (sub === "off") {
    groupData.welcome = false;
    global.db.groups[m.chat] = groupData;
    return m.reply("✅ *Welcome message dinonaktifkan!*");
  }

  return m.reply(
    `ℹ️ *Welcome Message*\nStatus: *${groupData.welcome ? "ON ✅" : "OFF ❌"}*\n\n` +
    `Gunakan:\n• \`.welcome on\`\n• \`.welcome off\``
  );
};

handler.command     = ["welcome"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Aktifkan/nonaktifkan welcome message";

export default handler;
