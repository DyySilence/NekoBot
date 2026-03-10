
/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { conn }) => {
  const groupId = m.chat;

  if (!global.db.groups[groupId]) global.db.groups[groupId] = {};

  global.db.groups[groupId].stats       = {};
  global.db.groups[groupId].hourlyStats = {};
  global.db.groups[groupId].statsSince  = Date.now();

  await m.reply(
    `✅ *STATS GRUP BERHASIL DIRESET*\n\n` +
    `🗑️ Semua data chat telah dihapus\n` +
    `📊 Tracking dimulai dari sekarang\n\n` +
    `💡 Data topchat akan kosong hingga ada pesan masuk baru.`
  );
};

handler.command     = ["resetgroupstats", "resetstats"];
handler.category    = "group";
handler.description = "Reset statistik chat grup";
handler.group       = true;
handler.admin       = true;

export default handler;
