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
    groupData.leave = true;
    global.db.groups[m.chat] = groupData;
    return m.reply("✅ *Goodbye message diaktifkan!*");
  }

  if (sub === "off") {
    groupData.leave = false;
    global.db.groups[m.chat] = groupData;
    return m.reply("✅ *Goodbye message dinonaktifkan!*");
  }

  return m.reply(
    `ℹ️ *Goodbye Message*\nStatus: *${groupData.leave ? "ON ✅" : "OFF ❌"}*\n\n` +
    `Gunakan:\n• \`.goodbye on\`\n• \`.goodbye off\``
  );
};

handler.command     = ["goodbye"];
handler.category    = "group";
handler.admin       = true;
handler.group       = true;
handler.description = "Aktifkan/nonaktifkan goodbye message";

export default handler;
