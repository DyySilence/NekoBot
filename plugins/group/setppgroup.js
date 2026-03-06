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

  const source = m.quoted?.isImage ? m.quoted : m.isImage ? m : null;
  if (!source) return m.reply("❌ Kirim / reply foto untuk dijadikan foto profil grup!");

  try {
    const buffer = await source.download();
    if (!buffer || !buffer.length) return m.reply("❌ Gagal mengunduh gambar.");

    await conn.updateProfilePicture(m.chat, buffer);
    await m.reply("✅ *Foto profil grup berhasil diubah!*");
  } catch {
    await m.reply("❌ Gagal mengubah foto profil grup.");
  }
};

handler.command  = ["setppgroup"];
handler.category = "group";
handler.admin    = true;
handler.botAdmin = true;
handler.group    = true;
handler.description = "Ganti foto profil grup (kirim/reply foto)";

export default handler;
