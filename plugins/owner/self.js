/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */
// plugins/owner/self.js

let handler = async (m) => {
  if (global.db.settings.mode === "self") {
    global.db.settings.mode = "public";
    return m.reply("✅ Mode *self* dinonaktifkan.\nBot kembali ke mode *public*.");
  }

  global.db.settings.mode = "self";
  return m.reply(
    "✅ Mode *self* diaktifkan.\n" +
    "Bot hanya merespon pesan dari *owner*.\n\n" +
    "> Ketik lagi untuk menonaktifkan."
  );
};

handler.help = ["self"];
handler.tags = ["owner"];
handler.command = ["self"];
handler.owner = true;

export default handler;
