/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

const handler = async (m, { text }) => {
  const keyword = (text || "").trim().toLowerCase();

  if (!keyword) {
    return m.reply(
      `> 🗑️ *DELRESPON*\n>\n` +
      `> Format: \`.delrespon keyword\`\n>\n` +
      `> Contoh: \`.delrespon panel\``
    );
  }

  const chat  = m.chat;
  const store = global.db.groups?.[chat]?.autoRespon;

  if (!store || !store[keyword]) {
    return m.reply(`❌ Keyword \`${keyword}\` tidak ditemukan!\n\nKetik \`.listrespon\` untuk lihat semua keyword.`);
  }

  delete global.db.groups[chat].autoRespon[keyword];
  await m.react("✅");
  return m.reply(`> ✅ Auto respon keyword \`${keyword}\` berhasil dihapus!`);
};

handler.command     = ["delrespon"];
handler.category    = "group";
handler.description = "Hapus auto respon keyword";
handler.admin       = true;

export default handler;