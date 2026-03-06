/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn }) => {
  if (!m.quoted) return m.reply("❌ Reply pesan yang ingin dihapus!");
  if (!m.isAdmin && !m.isOwner && !m.fromMe)
    return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  if (!m.isBotAdmin && !m.fromMe)
    return m.reply(global.mess?.botadmin ?? "❌ Bot harus admin untuk menghapus pesan orang lain!");

  try {
    await conn.sendMessage(m.chat, { delete: m.quoted.key });
  } catch {
    await m.reply("❌ Gagal menghapus pesan.");
  }
};

handler.command  = ["delete", "del"];
handler.category = "group";
handler.description = "Hapus pesan (reply pesan target)";

export default handler;
