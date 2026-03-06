let handler = async (m, { conn }) => {
  await m.reply("♻️ Restarting bot...\n\nTunggu beberapa detik, bot akan kembali online.");
  setTimeout(() => process.exit(0), 2000);
};

handler.help = ["restart"];
handler.tags = ["owner"];
handler.command = ["restart","r"];
handler.owner = true;

export default handler;
