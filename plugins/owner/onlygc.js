
/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

// plugins/owner/onlygc.js

let handler = async (m) => {
  if (global.db.settings.mode === "onlygc") {
    global.db.settings.mode = "public";
    return m.reply("✅ Mode *onlygc* dinonaktifkan.\nBot kembali ke mode *public*.");
  }

  global.db.settings.mode = "onlygc";
  return m.reply(
    "✅ Mode *onlygc* diaktifkan.\n" +
    "Bot hanya merespon pesan dari *grup*.\n\n" +
    "> Ketik lagi untuk menonaktifkan."
  );
};

handler.help = ["onlygc"];
handler.tags = ["owner"];
handler.command = ["onlygc"];
handler.owner = true;

export default handler;
