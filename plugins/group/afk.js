/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 * Developer : DyySilence
 * Copyright © 2026
 */
const handler = async (m, { text }) => {
  const reason = text?.trim() || "Tidak ada alasan";

  const userData = global.db.users[m.sender] ?? {};
  userData.afk = { reason, time: Date.now() };
  global.db.users[m.sender] = userData;

  await m.reply(`💤 *${m.pushName || "Kamu"} sekarang AFK!*\n\n📝 Alasan: ${reason}\n\nBot akan memberitahu orang yang mention kamu.`);
};

handler.command  = ["afk"];
handler.category = "group";
handler.description = "Set status AFK";

export default handler;
