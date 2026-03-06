/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/jpm/delbl-response.js

let handler = async (m, { text }) => {
  if (!text) return;

  if (text === "all") {
    global.db.settings.bljpm = [];
    return m.reply("✅ Semua data blacklist grup berhasil dihapus.");
  }

  if (text.includes("|")) {
    const [id, grupName] = text.split("|");
    if (!global.db.settings.bljpm.includes(id))
      return m.reply(`Grup *${grupName}* tidak ada dalam blacklist.`);

    global.db.settings.bljpm = global.db.settings.bljpm.filter((g) => g !== id);
    return m.reply(`✅ Grup *${grupName}* berhasil dihapus dari blacklist.`);
  }
};

handler.help = [];
handler.tags = ["jpm"];
handler.command = ["delbl-response"];
handler.owner = true;

export default handler;
