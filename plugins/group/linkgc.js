let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply(global.mess.group);

  const inv = await conn.groupInviteCode(m.chat);
  await m.reply(`🔗 *Link Grup:*\nhttps://chat.whatsapp.com/${inv}`);
};

handler.help = ["linkgc"];
handler.tags = ["group"];
handler.command = ["linkgc"];

export default handler;
