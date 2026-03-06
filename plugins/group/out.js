let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply(global.mess.group);
  if (!m.isOwner) return m.reply(global.mess.owner);

  await m.reply("👋 Bot akan keluar dari grup ini. Sampai jumpa!");
  await conn.groupLeave(m.chat);
};

handler.help = ["out","leave"];
handler.tags = ["group"];
handler.command = ["out","leave"];
handler.owner = true;

export default handler;
