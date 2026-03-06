
/**
 * Jangan dijual.
 * Dilarang menghapus credit developer.
 *
 * Developer : DyySilence
 * Copyright © 2026
 * Contact   : https://whatsapp.com/channel/0029Vb7uLYxIHphOIWOY8727
 */

// plugins/owner/onlypc.js

let handler = async (m) => {
  if (global.db.settings.mode === "onlypc") {
    global.db.settings.mode = "public";
    return m.reply("✅ Mode *onlypc* dinonaktifkan.\nBot kembali ke mode *public*.");
  }

  global.db.settings.mode = "onlypc";
  return m.reply(
    "✅ Mode *onlypc* diaktifkan.\n" +
    "Bot hanya merespon pesan dari *private chat*.\n\n" +
    "> Ketik lagi untuk menonaktifkan."
  );
};

handler.help = ["onlypc"];
handler.tags = ["owner"];
handler.command = ["onlypc"];
handler.owner = true;

export default handler;
