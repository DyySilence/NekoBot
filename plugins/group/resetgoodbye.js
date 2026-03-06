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
  delete groupData.leaveText;
  groupData.leave = false;
  global.db.groups[m.chat] = groupData;

  await m.reply("✅ Goodbye message berhasil direset ke default dan *dinonaktifkan*.");
};

handler.command  = ["resetgoodbye"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Reset goodbye message ke default";

export default handler;
