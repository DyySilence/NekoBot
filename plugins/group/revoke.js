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
    await conn.groupRevokeInvite(m.chat);
    const newCode = await conn.groupInviteCode(m.chat);
    await m.reply(`✅ *Link grup berhasil direset!*\n\nLink baru:\nhttps://chat.whatsapp.com/${newCode}`);
  } catch {
    await m.reply("❌ Gagal mereset link grup.");
  }
};

handler.command  = ["revoke", "resetlink"];
handler.category = "group";
handler.admin    = true;
handler.botAdmin = true;
handler.group    = true;
handler.description = "Reset / revoke link invite grup";

export default handler;
