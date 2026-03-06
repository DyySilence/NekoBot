/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");

  const groupData = global.db.groups[m.chat] ?? {};
  groupData.antiforward = !groupData.antiforward;
  global.db.groups[m.chat] = groupData;

  await m.reply(
    `📤 *Antiforward channel ${groupData.antiforward ? "diaktifkan" : "dinonaktifkan"}!*\n\n${
      groupData.antiforward
        ? "Pesan forward dari channel akan otomatis dihapus."
        : "Bot tidak lagi memblokir forward dari channel."
    }`
  );
};

handler.command  = ["antiforward"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Toggle antiforward dari channel";

export default handler;
