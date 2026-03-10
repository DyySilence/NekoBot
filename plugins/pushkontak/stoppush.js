/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/pushkontak/stoppush.js

let handler = async (m) => {
  if (!global.statusPushkontak)
    return m.reply("Tidak ada pushkontak yang sedang berjalan!");

  global.statusPushkontak = false;
  return m.reply("Berhasil menghentikan pushkontak ✅");
};

handler.help = ["stoppush"];
handler.tags = ["pushkontak"];
handler.command = ["stoppush"];
handler.owner = true;

export default handler;
