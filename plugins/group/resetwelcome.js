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
  delete groupData.welcomeText;
  groupData.welcome = false;
  global.db.groups[m.chat] = groupData;

  await m.reply("✅ Welcome message berhasil direset ke default dan *dinonaktifkan*.");
};

handler.command  = ["resetwelcome"];
handler.category = "group";
handler.admin    = true;
handler.group    = true;
handler.description = "Reset welcome message ke default";

export default handler;
