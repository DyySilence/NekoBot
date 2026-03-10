/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { conn }) => {
  try {
    await conn.groupSettingUpdate(m.chat, "not_announcement");
    await m.reply("🔓 *Grup dibuka!*\nSemua member sekarang bisa mengirim pesan.");
  } catch {
    await m.reply("❌ Gagal membuka grup.");
  }
};
handler.command  = ["open", "buka"];
handler.category = "group";
handler.admin    = true;
handler.botAdmin = true;
handler.group    = true;
handler.description = "Buka grup (semua bisa chat)";
export default handler;
