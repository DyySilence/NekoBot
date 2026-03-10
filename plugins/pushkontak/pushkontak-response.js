/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/pushkontak/pushkontak-response.js

let handler = async (m, { conn, text }) => {
  if (!global.textpushkontak || !global.dataAllGrup)
    return m.reply("❌ Data pushkontak tidak ditemukan.\nSilahkan ulangi dengan *.pushkontak pesan*");

  const groupData = global.dataAllGrup[text];
  if (!groupData) return m.reply("❌ Grup tidak ditemukan.");

  const messageText = global.textpushkontak;
  const members = groupData.participants
    .map((v) => v.id)
    .filter((jid) => jid && jid !== m.botNumber);

  global.statusPushkontak = true;

  await m.reply(
    `🚀 *Memulai Pushkontak*\n\n` +
    `📌 Grup  : *${groupData.subject}*\n` +
    `👥 Total : *${members.length} member*`
  );

  let success = 0;

  for (const jid of members) {
    if (!global.statusPushkontak) break;
    try {
      await conn.sendMessage(jid, { text: messageText }, { quoted: global.qtext });
      success++;
      await sleep(global.jedaPushkontak);
    } catch {
      console.log("Gagal kirim ke:", jid);
    }
  }

  delete global.textpushkontak;
  delete global.dataAllGrup;

  return m.reply(
    `✅ *Pushkontak Selesai*\n\n📤 Berhasil terkirim ke *${success} member*`
  );
};

handler.help = [];
handler.tags = ["pushkontak"];
handler.command = ["pushkontak-response"];
handler.owner = true;

export default handler;
