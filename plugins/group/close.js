/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply(global.mess?.group ?? "❌ Hanya bisa di grup!");
  if (!m.isAdmin && !m.isOwner) return m.reply(global.mess?.admin ?? "❌ Hanya admin!");
  if (!m.isBotAdmin) return m.reply(global.mess?.botadmin ?? "❌ Bot harus admin!");

  try {
    await conn.groupSettingUpdate(m.chat, "announcement");
    await m.reply("🔒 *Grup ditutup!*\nHanya admin yang bisa mengirim pesan.");
  } catch {
    await m.reply("❌ Gagal menutup grup.");
  }
};

handler.command  = ["close", "tutup"];
handler.category = "group";
handler.admin    = true;
handler.botAdmin = true;
handler.group    = true;
handler.description = "Tutup grup (hanya admin bisa chat)";

export default handler;
