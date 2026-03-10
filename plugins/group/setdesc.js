let handler = async (m, { conn, text }) => {
  if (!m.isGroup) return m.reply(global.mess.group);
  if (!m.isAdmin) return m.reply(global.mess.admin);
  if (!m.isBotAdmin) return m.reply(global.mess.botadmin);
  if (!text) return m.reply("❌ Masukkan deskripsi baru.\nContoh: *.setdesc Deskripsi grup baru*");

  await conn.groupUpdateDescription(m.chat, text);
  await m.reply("✅ Deskripsi grup berhasil diperbarui.");
};

handler.help = ["setdesc"];
handler.tags = ["group"];
handler.command = ["setdesc"];

export default handler;
