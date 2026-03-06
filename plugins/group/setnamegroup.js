let handler = async (m, { conn, text }) => {
  if (!m.isGroup) return m.reply(global.mess.group);
  if (!m.isAdmin) return m.reply(global.mess.admin);
  if (!m.isBotAdmin) return m.reply(global.mess.botadmin);
  if (!text) return m.reply("❌ Masukkan nama grup baru.\nContoh: *.setname Nama Grup Baru*");

  await conn.groupUpdateSubject(m.chat, text);
  await m.reply(`✅ Nama grup berhasil diubah ke:\n*${text}*`);
};

handler.help = ["setnamegroup"];
handler.tags = ["group"];
handler.command = ["setnamegroup"];

export default handler;
